import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Room,
  RoomEvent,
  Track,
  type RemoteTrack,
  type RemoteParticipant,
  ConnectionState,
  createLocalAudioTrack,
  type LocalAudioTrack,
} from 'livekit-client';
import type {
  AgentConnectionState,
  AgentVoiceState,
  UserVoiceState,
  TranscriptMessage,
  FlowVoiceSettings,
  AudioDeviceInfo,
  GenerationEvent,
} from '../types';

interface UseFlowVoiceProps {
  settings: FlowVoiceSettings;
  onSettingsUpdate?: (newSettings: Partial<FlowVoiceSettings>) => void;
}

export function useFlowVoiceLiveKit({ settings, onSettingsUpdate }: UseFlowVoiceProps) {
  const [connectionState, setConnectionState] = useState<AgentConnectionState>('disconnected');
  const [agentVoiceState, setAgentVoiceState] = useState<AgentVoiceState>('idle');
  const [userVoiceState, setUserVoiceState] = useState<UserVoiceState>('silent');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [transcripts, setTranscripts] = useState<TranscriptMessage[]>([]);
  const [currentGenerationId, setCurrentGenerationId] = useState<number>(1);
  const [generationLogs, setGenerationLogs] = useState<GenerationEvent[]>([]);
  const [audioInputs, setAudioInputs] = useState<AudioDeviceInfo[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<AudioDeviceInfo[]>([]);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [latencyMetrics] = useState<{
    pingMs: number;
    sttLatency: number;
    llmLatency: number;
    ttsLatency: number;
  }>({
    pingMs: 24,
    sttLatency: 110,
    llmLatency: 185,
    ttsLatency: 95,
  });
  const [isSlowTaskRunning, setIsSlowTaskRunning] = useState<boolean>(false);
  const [slowTaskProgress, setSlowTaskProgress] = useState<number>(0);

  // Audio frequency data for Canvas Visualizers
  const [userAudioLevel, setUserAudioLevel] = useState<number>(0);
  const [agentAudioLevel, setAgentAudioLevel] = useState<number>(0);
  const audioFrequencyDataRef = useRef<Uint8Array>(new Uint8Array(64));

  // Internal references
  const roomRef = useRef<Room | null>(null);
  const localAudioTrackRef = useRef<LocalAudioTrack | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const slowTaskTimerRef = useRef<number | null>(null);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Helper to add generation event
  const addGenLog = useCallback(
    (type: GenerationEvent['type'], details: string, genId?: number) => {
      const gid = genId ?? currentGenerationId;
      const newEvent: GenerationEvent = {
        id: Math.random().toString(36).substring(7),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        generationId: gid,
        type,
        details,
      };
      setGenerationLogs((prev) => [newEvent, ...prev.slice(0, 49)]);
    },
    [currentGenerationId]
  );

  // Helper to add/update transcripts
  const addOrUpdateTranscript = useCallback((msg: Partial<TranscriptMessage> & { id: string }) => {
    setTranscripts((prev) => {
      const existingIdx = prev.findIndex((m) => m.id === msg.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = { ...updated[existingIdx], ...msg };
        return updated;
      }
      const newMsg: TranscriptMessage = {
        id: msg.id,
        sender: msg.sender || 'agent',
        text: msg.text || '',
        timestamp:
          msg.timestamp ||
          new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        generationId: msg.generationId || 1,
        isFinal: msg.isFinal ?? true,
        isInterrupted: msg.isInterrupted ?? false,
        metrics: msg.metrics,
      };
      return [...prev, newMsg];
    });
  }, []);

  // Enumerate Audio Devices
  const refreshAudioDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const inputs: AudioDeviceInfo[] = devices
        .filter((d) => d.kind === 'audioinput')
        .map((d) => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone ${d.deviceId.slice(0, 5)}`,
          groupId: d.groupId,
        }));
      const outputs: AudioDeviceInfo[] = devices
        .filter((d) => d.kind === 'audiooutput')
        .map((d) => ({
          deviceId: d.deviceId,
          label: d.label || `Speaker ${d.deviceId.slice(0, 5)}`,
          groupId: d.groupId,
        }));

      setAudioInputs(inputs);
      setAudioOutputs(outputs);
    } catch (err) {
      console.warn('Unable to enumerate audio devices:', err);
    }
  }, []);

  useEffect(() => {
    refreshAudioDevices();
    navigator.mediaDevices?.addEventListener('devicechange', refreshAudioDevices);
    return () => {
      navigator.mediaDevices?.removeEventListener('devicechange', refreshAudioDevices);
    };
  }, [refreshAudioDevices]);

  // Audio Context & Mic Level Analyser setup
  const setupWebAudioAnalyser = useCallback(async (stream: MediaStream) => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      const freqData = new Uint8Array(analyser.frequencyBinCount);

      const processAudio = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(freqData);
        audioFrequencyDataRef.current = freqData;

        // Calculate Average RMS / Level
        let sum = 0;
        for (let i = 0; i < freqData.length; i++) {
          sum += freqData[i];
        }
        const avg = sum / freqData.length;
        const normalized = Math.min(1, avg / 128);

        if (!isMuted) {
          setUserAudioLevel(normalized);
          if (normalized > 0.15) {
            setUserVoiceState('speaking');
          } else {
            setUserVoiceState('silent');
          }
        } else {
          setUserAudioLevel(0);
          setUserVoiceState('muted');
        }

        animFrameRef.current = requestAnimationFrame(processAudio);
      };

      processAudio();
    } catch (err) {
      console.warn('Web Audio API analyser setup error:', err);
    }
  }, [isMuted]);

  // Cleanup Audio Analyser
  const stopWebAudioAnalyser = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    setUserAudioLevel(0);
    setUserVoiceState('silent');
  }, []);

  // Call Duration Timer
  useEffect(() => {
    if (connectionState === 'connected') {
      setCallDuration(0);
      timerIntervalRef.current = window.setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      setCallDuration(0);
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [connectionState]);

  // Simulated Agent Speech synthesis or voice playback
  const simulateAgentSpeak = useCallback(
    (text: string, genId: number, onComplete?: () => void) => {
      // Check if generation matches
      if (genId !== currentGenerationId && genId !== -1) {
        addGenLog('invalidated', `Speech suppressed (stale): "${text.slice(0, 30)}..."`, genId);
        return;
      }

      setAgentVoiceState('speaking');
      addGenLog('speech_started', `Rime TTS Streaming (GEN ${genId}): "${text.slice(0, 35)}..."`, genId);

      // Animate agent audio levels while speaking
      let step = 0;
      const interval = setInterval(() => {
        if (currentGenerationId !== genId && genId !== -1) {
          clearInterval(interval);
          setAgentAudioLevel(0);
          return;
        }
        step++;
        const wave = 0.4 + Math.sin(step * 0.4) * 0.35 + Math.random() * 0.25;
        setAgentAudioLevel(Math.min(1, wave));
      }, 60);

      // Web Speech API for audible response in simulation mode
      if ('speechSynthesis' in window && !settings.rimeApiKey) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = settings.rimeSpeed || 1.0;
        speechSynthRef.current = utterance;

        utterance.onend = () => {
          clearInterval(interval);
          setAgentAudioLevel(0);
          setAgentVoiceState('listening');
          addGenLog('speech_stopped', `Rime TTS Stopped (GEN ${genId})`, genId);
          onComplete?.();
        };
        utterance.onerror = () => {
          clearInterval(interval);
          setAgentAudioLevel(0);
          setAgentVoiceState('listening');
        };
        window.speechSynthesis.speak(utterance);
      } else {
        // Fallback simulation timer
        const duration = Math.max(1500, text.length * 65);
        setTimeout(() => {
          clearInterval(interval);
          setAgentAudioLevel(0);
          setAgentVoiceState('listening');
          addGenLog('speech_stopped', `Rime TTS Stopped (GEN ${genId})`, genId);
          onComplete?.();
        }, duration);
      }
    },
    [currentGenerationId, addGenLog, settings.rimeApiKey, settings.rimeSpeed]
  );

  // Handle Safe User Interruption (Monotonically Increasing Generation ID)
  const handleUserInterruption = useCallback(() => {
    // Cancel browser speech if speaking
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    // Advance generation ID
    const nextGen = currentGenerationId + 1;
    setCurrentGenerationId(nextGen);
    setAgentVoiceState('interrupted');
    setAgentAudioLevel(0);

    // Cancel slow task if active
    if (isSlowTaskRunning) {
      if (slowTaskTimerRef.current) {
        clearInterval(slowTaskTimerRef.current);
        slowTaskTimerRef.current = null;
      }
      setIsSlowTaskRunning(false);
      setSlowTaskProgress(0);
      addGenLog('task_cancelled', `GEN ${currentGenerationId} TASK 'slow_task' CANCELLED`, currentGenerationId);
    }

    addGenLog('interrupted', `USER INTERRUPTED -> Invalidating GEN ${currentGenerationId}`, currentGenerationId);
    addGenLog('start', `GEN ${nextGen} START`, nextGen);

    // Mark current speaking messages as interrupted
    setTranscripts((prev) =>
      prev.map((m) =>
        m.sender === 'agent' && m.generationId === currentGenerationId && !m.isInterrupted
          ? { ...m, isInterrupted: true }
          : m
      )
    );

    // Send interruption packet if livekit room is connected
    if (roomRef.current && roomRef.current.state === ConnectionState.Connected) {
      try {
        const payload = new TextEncoder().encode(
          JSON.stringify({ type: 'user_interruption', timestamp: Date.now() })
        );
        roomRef.current.localParticipant.publishData(payload, { reliable: true });
      } catch (err) {
        console.debug('Failed to send interruption packet:', err);
      }
    }

    // Switch back to listening state quickly
    setTimeout(() => {
      setAgentVoiceState('listening');
    }, 400);
  }, [currentGenerationId, isSlowTaskRunning, addGenLog]);

  // Demo Slow Task (Matching agent.py slow_task tool)
  const runSlowTaskDemo = useCallback((delaySeconds = 3) => {
    const taskGen = currentGenerationId;
    setIsSlowTaskRunning(true);
    setSlowTaskProgress(0);

    addGenLog('task_scheduled', `GEN ${taskGen} SLOW TASK STARTED (delay=${delaySeconds}s)`, taskGen);

    const startTime = Date.now();
    const totalMs = delaySeconds * 1000;

    setAgentVoiceState('thinking');

    slowTaskTimerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, Math.round((elapsed / totalMs) * 100));
      setSlowTaskProgress(progress);

      if (elapsed >= totalMs) {
        if (slowTaskTimerRef.current) clearInterval(slowTaskTimerRef.current);
        setIsSlowTaskRunning(false);
        setSlowTaskProgress(100);

        // Check if generation is still valid
        setCurrentGenerationId((latestGen) => {
          if (latestGen === taskGen) {
            addGenLog('task_completed', `GEN ${taskGen} RESULT -> ACCEPTED`, taskGen);
            const resultText = `Completed slow task after ${delaySeconds}s (GEN ${taskGen}). All data retrieved smoothly!`;
            addOrUpdateTranscript({
              id: `task_${Date.now()}`,
              sender: 'agent',
              text: resultText,
              generationId: taskGen,
              isFinal: true,
              metrics: { totalLatencyMs: delaySeconds * 1000, modelUsed: settings.ollamaModel },
            });
            simulateAgentSpeak(resultText, taskGen);
          } else {
            addGenLog(
              'task_cancelled',
              `GEN ${taskGen} RESULT ARRIVED -> DISCARDED (Cancelled due to user interruption)`,
              taskGen
            );
          }
          return latestGen;
        });
      }
    }, 100);
  }, [currentGenerationId, addGenLog, addOrUpdateTranscript, simulateAgentSpeak, settings.ollamaModel]);

  // Start Call / Connect
  const startCall = useCallback(async () => {
    setConnectionState('connecting');
    addGenLog('start', 'Initializing WebRTC connection to LiveKit...', currentGenerationId);

    try {
      // 1. Request Microphone MediaStream
      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: settings.selectedAudioInputId !== 'default' ? { exact: settings.selectedAudioInputId } : undefined,
          echoCancellation: settings.echoCancellation,
          noiseSuppression: settings.noiseSuppression,
          autoGainControl: settings.autoGainControl,
        },
        video: false,
      };

      const micStream = await navigator.mediaDevices.getUserMedia(constraints);
      micStreamRef.current = micStream;
      setupWebAudioAnalyser(micStream);

      // Check if real LiveKit URL and Token are provided
      const isRealLiveKitUrl =
        settings.livekitUrl &&
        (settings.livekitUrl.startsWith('ws://') || settings.livekitUrl.startsWith('wss://')) &&
        !settings.livekitUrl.includes('example.com') &&
        !settings.simulationMode;

      if (isRealLiveKitUrl && settings.token) {
        // Real LiveKit WebRTC Room Connection
        const room = new Room({
          adaptiveStream: true,
          dynacast: true,
          audioCaptureDefaults: {
            echoCancellation: settings.echoCancellation,
            noiseSuppression: settings.noiseSuppression,
            autoGainControl: settings.autoGainControl,
          },
        });
        roomRef.current = room;

        // Register LiveKit Events
        room.on(RoomEvent.Connected, () => {
          setConnectionState('connected');
          setAgentVoiceState('listening');
          addGenLog('start', `Connected to LiveKit room: ${room.name}`, currentGenerationId);
        });

        room.on(RoomEvent.Disconnected, () => {
          setConnectionState('disconnected');
          setAgentVoiceState('idle');
          addGenLog('invalidated', 'Disconnected from LiveKit room', currentGenerationId);
        });

        room.on(RoomEvent.Reconnecting, () => setConnectionState('reconnecting'));
        room.on(RoomEvent.Reconnected, () => setConnectionState('connected'));

        room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
          const isAgentSpeaking = speakers.some((s) => s.identity !== room.localParticipant.identity);
          if (isAgentSpeaking) {
            setAgentVoiceState('speaking');
          }
        });

        room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, _, participant: RemoteParticipant) => {
          if (track.kind === Track.Kind.Audio) {
            const audioElement = track.attach();
            audioElement.autoplay = true;
            addGenLog('start', `Subscribed to audio track from ${participant.identity}`, currentGenerationId);
          }
        });

        room.on(RoomEvent.DataReceived, (payload: Uint8Array) => {
          try {
            const decoded = new TextDecoder().decode(payload);
            const data = JSON.parse(decoded);

            if (data.type === 'transcript') {
              addOrUpdateTranscript({
                id: data.id || `msg_${Date.now()}`,
                sender: data.sender || 'agent',
                text: data.text,
                generationId: data.generationId || currentGenerationId,
                isFinal: data.isFinal ?? true,
                metrics: data.metrics,
              });
            } else if (data.type === 'generation_update') {
              if (data.generationId) {
                setCurrentGenerationId(data.generationId);
                addGenLog(data.action || 'start', data.details || `GEN ${data.generationId}`, data.generationId);
              }
            } else if (data.type === 'agent_state') {
              setAgentVoiceState(data.state);
            }
          } catch (e) {
            console.debug('Raw data received:', e);
          }
        });

        // Connect to server
        await room.connect(settings.livekitUrl, settings.token);

        // Publish local mic track
        const localTrack = await createLocalAudioTrack({
          deviceId: settings.selectedAudioInputId !== 'default' ? settings.selectedAudioInputId : undefined,
          echoCancellation: settings.echoCancellation,
          noiseSuppression: settings.noiseSuppression,
        });
        localAudioTrackRef.current = localTrack;
        await room.localParticipant.publishTrack(localTrack);
      } else {
        // Interactive Live Demo & Sandbox Mode
        // Simulates realistic agent greeting & turn-based voice session matching backend agent.py
        await new Promise((r) => setTimeout(r, 600));
        setConnectionState('connected');
        setAgentVoiceState('listening');

        const initialGen = 1;
        setCurrentGenerationId(initialGen);
        addGenLog('start', `Connected to FlowVoice agent (Local Whisper + Ollama + Rime)`, initialGen);

        const greeting =
          "Hello! I am FlowVoice, your realtime voice assistant. How can I assist you today?";

        addOrUpdateTranscript({
          id: `greet_${Date.now()}`,
          sender: 'agent',
          text: greeting,
          generationId: initialGen,
          isFinal: true,
          metrics: { sttMs: 0, llmMs: 45, ttsMs: 80, totalLatencyMs: 125, modelUsed: 'Rime TTS (Astra)' },
        });

        simulateAgentSpeak(greeting, initialGen);
      }
    } catch (err: unknown) {
      console.error('Failed to start call:', err);
      setConnectionState('error');
      addGenLog('invalidated', `Connection Error: ${err instanceof Error ? err.message : String(err)}`, currentGenerationId);
      stopWebAudioAnalyser();
    }
  }, [
    settings,
    currentGenerationId,
    setupWebAudioAnalyser,
    addGenLog,
    addOrUpdateTranscript,
    simulateAgentSpeak,
    stopWebAudioAnalyser,
  ]);

  // End Call / Disconnect
  const endCall = useCallback(() => {
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    if (localAudioTrackRef.current) {
      localAudioTrackRef.current.stop();
      localAudioTrackRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (slowTaskTimerRef.current) {
      clearInterval(slowTaskTimerRef.current);
      slowTaskTimerRef.current = null;
    }

    stopWebAudioAnalyser();
    setConnectionState('disconnected');
    setAgentVoiceState('idle');
    setIsSlowTaskRunning(false);
    setSlowTaskProgress(0);
    addGenLog('invalidated', 'Call terminated by user', currentGenerationId);
  }, [stopWebAudioAnalyser, addGenLog, currentGenerationId]);

  // Toggle Mute
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const nextMuted = !prev;
      if (localAudioTrackRef.current) {
        if (nextMuted) {
          localAudioTrackRef.current.mute();
        } else {
          localAudioTrackRef.current.unmute();
        }
      }
      if (micStreamRef.current) {
        micStreamRef.current.getAudioTracks().forEach((t) => {
          t.enabled = !nextMuted;
        });
      }
      return nextMuted;
    });
  }, []);

  // Send Simulated User Speech (Text or Speech recognition simulation)
  const sendUserMessage = useCallback(
    (text: string) => {
      if (!text.trim() || connectionState !== 'connected') return;

      // If agent is currently speaking, user interruption triggers automatically!
      if (agentVoiceState === 'speaking') {
        handleUserInterruption();
      }

      const turnGen = currentGenerationId;
      addOrUpdateTranscript({
        id: `user_${Date.now()}`,
        sender: 'user',
        text: text,
        generationId: turnGen,
        isFinal: true,
        metrics: { sttMs: 95, modelUsed: 'faster-whisper (base.en)' },
      });

      // If connected to live room, send data
      if (roomRef.current && roomRef.current.state === ConnectionState.Connected) {
        const payload = new TextEncoder().encode(
          JSON.stringify({ type: 'user_text_input', text, generationId: turnGen })
        );
        roomRef.current.localParticipant.publishData(payload, { reliable: true });
      }

      // Simulate AI response turn
      setAgentVoiceState('thinking');
      const thinkDuration = 700 + Math.random() * 500;

      setTimeout(() => {
        if (currentGenerationId !== turnGen) return; // Discard if invalidated

        let reply = '';
        const lower = text.toLowerCase();

        if (lower.includes('slow') || lower.includes('background') || lower.includes('delay')) {
          reply = "I'll start that 3-second slow task for you right now. Notice how you can interrupt me anytime!";
          addOrUpdateTranscript({
            id: `agent_${Date.now()}`,
            sender: 'agent',
            text: reply,
            generationId: turnGen,
            isFinal: true,
            metrics: { llmMs: 140, ttsMs: 90, totalLatencyMs: 230, modelUsed: 'Ollama llama3.2:3b' },
          });
          simulateAgentSpeak(reply, turnGen, () => {
            runSlowTaskDemo(3);
          });
          return;
        } else if (lower.includes('joke')) {
          reply = "Why don't voice agents get lost? Because they always stay on the right track with WebRTC!";
        } else if (lower.includes('interruption') || lower.includes('generation') || lower.includes('safe')) {
          reply =
            `FlowVoice uses monotonic generation tracking (currently GEN ${turnGen}). When you interrupt, previous speech and tasks are safely cancelled so no stale responses ever play.`;
        } else if (lower.includes('rime') || lower.includes('tts') || lower.includes('voice')) {
          reply =
            `I am using Rime TTS with the ${settings.rimeSpeaker} voice model (${settings.rimeModel}), providing low-latency conversational audio.`;
        } else if (lower.includes('whisper') || lower.includes('stt')) {
          reply =
            `Your speech was transcribed locally using faster-whisper (${settings.whisperModel}) with Silero VAD stream adaptation.`;
        } else {
          reply = `Understood! I've processed "${text}" using Ollama llama3.2:3b and Rime TTS. Everything is running with low WebRTC latency.`;
        }

        addOrUpdateTranscript({
          id: `agent_${Date.now()}`,
          sender: 'agent',
          text: reply,
          generationId: turnGen,
          isFinal: true,
          metrics: { llmMs: 165, ttsMs: 92, totalLatencyMs: 257, modelUsed: 'Ollama llama3.2:3b' },
        });

        simulateAgentSpeak(reply, turnGen);
      }, thinkDuration);
    },
    [
      connectionState,
      agentVoiceState,
      handleUserInterruption,
      currentGenerationId,
      addOrUpdateTranscript,
      simulateAgentSpeak,
      runSlowTaskDemo,
      settings.rimeSpeaker,
      settings.rimeModel,
      settings.whisperModel,
    ]
  );

  // Switch Audio Input Device
  const switchAudioInput = useCallback(
    async (deviceId: string) => {
      onSettingsUpdate?.({ selectedAudioInputId: deviceId });
      if (connectionState === 'connected') {
        stopWebAudioAnalyser();
        const constraints: MediaStreamConstraints = {
          audio: { deviceId: { exact: deviceId } },
          video: false,
        };
        try {
          const newStream = await navigator.mediaDevices.getUserMedia(constraints);
          micStreamRef.current = newStream;
          setupWebAudioAnalyser(newStream);

          if (localAudioTrackRef.current) {
            await localAudioTrackRef.current.setDeviceId(deviceId);
          }
        } catch (err) {
          console.error('Failed to switch audio input device:', err);
        }
      }
    },
    [connectionState, onSettingsUpdate, stopWebAudioAnalyser, setupWebAudioAnalyser]
  );

  // Switch Audio Output Device
  const switchAudioOutput = useCallback(
    async (deviceId: string) => {
      onSettingsUpdate?.({ selectedAudioOutputId: deviceId });
      if (roomRef.current) {
        try {
          await roomRef.current.switchActiveDevice('audiooutput', deviceId);
        } catch (err) {
          console.warn('Switch audio output device not supported or failed:', err);
        }
      }
    },
    [onSettingsUpdate]
  );

  // Clear Transcripts
  const clearTranscripts = useCallback(() => {
    setTranscripts([]);
  }, []);

  return {
    connectionState,
    agentVoiceState,
    userVoiceState,
    isMuted,
    transcripts,
    currentGenerationId,
    generationLogs,
    audioInputs,
    audioOutputs,
    callDuration,
    latencyMetrics,
    userAudioLevel,
    agentAudioLevel,
    audioFrequencyDataRef,
    isSlowTaskRunning,
    slowTaskProgress,
    startCall,
    endCall,
    toggleMute,
    handleUserInterruption,
    runSlowTaskDemo,
    sendUserMessage,
    switchAudioInput,
    switchAudioOutput,
    clearTranscripts,
    refreshAudioDevices,
  };
}
