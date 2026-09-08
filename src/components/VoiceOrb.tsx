import React from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  Zap,
  Radio,
  Cpu,
  Volume2,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { AudioVisualizer } from './AudioVisualizer';
import type {
  AgentVoiceState,
  UserVoiceState,
  AgentConnectionState,
  FlowVoiceSettings,
} from '../types';

interface VoiceOrbProps {
  connectionState: AgentConnectionState;
  agentVoiceState: AgentVoiceState;
  userVoiceState: UserVoiceState;
  userAudioLevel: number;
  agentAudioLevel: number;
  frequencyDataRef: React.RefObject<Uint8Array>;
  currentGenerationId: number;
  callDuration: number;
  isMuted: boolean;
  settings: FlowVoiceSettings;
  isSlowTaskRunning: boolean;
  slowTaskProgress: number;
  onInterrupt: () => void;
  onStartCall: () => void;
}

export const VoiceOrb: React.FC<VoiceOrbProps> = ({
  connectionState,
  agentVoiceState,
  userVoiceState,
  userAudioLevel,
  agentAudioLevel,
  frequencyDataRef,
  currentGenerationId,
  callDuration,
  isMuted,
  settings,
  isSlowTaskRunning,
  slowTaskProgress,
  onInterrupt,
  onStartCall,
}) => {
  const isConnected = connectionState === 'connected';

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // State badge config
  const getStateBadge = () => {
    if (connectionState === 'connecting') {
      return {
        label: 'Connecting WebRTC...',
        color: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        icon: <Radio className="w-3.5 h-3.5 animate-spin" />,
      };
    }
    if (connectionState === 'error') {
      return {
        label: 'Connection Error',
        color: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        icon: <Radio className="w-3.5 h-3.5" />,
      };
    }
    if (!isConnected) {
      return {
        label: 'Agent Ready (Idle)',
        color: 'bg-slate-700/40 text-slate-400 border-slate-600/30',
        icon: <Radio className="w-3.5 h-3.5" />,
      };
    }

    if (agentVoiceState === 'speaking') {
      return {
        label: `Speaking (Rime TTS • ${settings.rimeSpeaker})`,
        color: 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-lg shadow-purple-500/20',
        icon: <Volume2 className="w-3.5 h-3.5 animate-pulse text-purple-400" />,
      };
    }

    if (agentVoiceState === 'thinking') {
      return {
        label: `Thinking (${settings.ollamaModel})`,
        color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-lg shadow-indigo-500/20',
        icon: <Cpu className="w-3.5 h-3.5 animate-spin text-indigo-400" />,
      };
    }

    if (userVoiceState === 'speaking') {
      return {
        label: `Listening (Whisper STT • ${settings.whisperModel})`,
        color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-lg shadow-emerald-500/20',
        icon: <Mic className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />,
      };
    }

    if (isMuted) {
      return {
        label: 'Microphone Muted',
        color: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        icon: <MicOff className="w-3.5 h-3.5 text-rose-400" />,
      };
    }

    return {
      label: 'Listening for speech...',
      color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      icon: <Sparkles className="w-3.5 h-3.5 text-cyan-400" />,
    };
  };

  const badge = getStateBadge();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-10 relative overflow-hidden">
      {/* Background Ambience Blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Status & Generation Badges */}
      <div className="z-10 flex flex-wrap items-center justify-center gap-2.5 mb-6">
        {/* Dynamic Voice State Badge */}
        <div
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-medium backdrop-blur-md transition-all duration-300 ${badge.color}`}
        >
          {badge.icon}
          <span>{badge.label}</span>
        </div>

        {/* Generation Safety Badge */}
        {isConnected && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs font-mono text-cyan-300 shadow-sm backdrop-blur-md">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>GEN #{currentGenerationId}</span>
          </div>
        )}

        {/* Call Duration Timer */}
        {isConnected && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs font-mono text-slate-300 shadow-sm backdrop-blur-md">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatTime(callDuration)}</span>
          </div>
        )}
      </div>

      {/* Center Interactive Orb */}
      <div className="relative flex items-center justify-center w-full max-w-[380px] aspect-square">
        <AudioVisualizer
          agentVoiceState={agentVoiceState}
          userVoiceState={userVoiceState}
          userAudioLevel={userAudioLevel}
          agentAudioLevel={agentAudioLevel}
          isConnected={isConnected}
          frequencyDataRef={frequencyDataRef}
          className="w-full h-full"
        />

        {/* Overlay start call button if disconnected */}
        {!isConnected && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/40 backdrop-blur-[2px] rounded-full">
            <button
              onClick={onStartCall}
              className="group relative flex flex-col items-center justify-center w-28 h-28 rounded-full bg-gradient-to-tr from-cyan-600 via-cyan-500 to-purple-600 p-[2px] transition-transform duration-300 hover:scale-105 active:scale-95 shadow-xl shadow-cyan-500/25"
            >
              <div className="flex flex-col items-center justify-center w-full h-full rounded-full bg-slate-900/90 group-hover:bg-slate-900/70 transition-colors">
                <Radio className="w-8 h-8 text-cyan-400 mb-1 animate-pulse" />
                <span className="text-xs font-semibold text-white tracking-wide">CONNECT</span>
              </div>
            </button>
            <p className="mt-4 text-xs text-slate-400 font-medium">Click to start LiveKit Voice session</p>
          </div>
        )}

        {/* Live Mic Level Ring while speaking */}
        {isConnected && !isMuted && userAudioLevel > 0.05 && (
          <div
            className="absolute inset-0 rounded-full border border-emerald-400/40 pointer-events-none transition-all duration-75"
            style={{
              transform: `scale(${1 + userAudioLevel * 0.25})`,
              opacity: userAudioLevel * 0.8,
            }}
          />
        )}
      </div>

      {/* Slow Task Running Banner (Matching agent.py slow_task demo tool) */}
      {isSlowTaskRunning && (
        <div className="z-10 mt-6 w-full max-w-md bg-slate-900/90 border border-amber-500/40 rounded-xl p-3 shadow-lg shadow-amber-500/10 backdrop-blur-md animate-fadeIn">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center gap-1.5 font-medium text-amber-300">
              <Zap className="w-3.5 h-3.5 animate-bounce" />
              <span>Executing background 'slow_task' (GEN #{currentGenerationId})</span>
            </div>
            <span className="font-mono text-amber-400">{slowTaskProgress}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-cyan-400 h-full transition-all duration-100 rounded-full"
              style={{ width: `${slowTaskProgress}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 pt-1 text-[11px] text-slate-400">
            <span>Speak or click Interrupt to test safe cancellation</span>
            <button
              onClick={onInterrupt}
              className="px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition-colors"
            >
              Cancel / Interrupt
            </button>
          </div>
        </div>
      )}

      {/* Interruption Prompt while agent is speaking */}
      {isConnected && agentVoiceState === 'speaking' && !isSlowTaskRunning && (
        <div className="z-10 mt-4 flex items-center gap-2 text-xs text-purple-300/90 bg-purple-950/40 border border-purple-500/30 px-3.5 py-1.5 rounded-full backdrop-blur-md animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Agent is speaking — speak into your mic or click below to interrupt safely</span>
          <button
            onClick={onInterrupt}
            className="ml-2 font-semibold underline text-purple-200 hover:text-white"
          >
            Interrupt Now
          </button>
        </div>
      )}
    </div>
  );
};
