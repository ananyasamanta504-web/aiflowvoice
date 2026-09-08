import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  PhoneCall,
  PhoneOff,
  Settings,
  Volume2,
  ChevronDown,
  ShieldAlert,
  Zap,
  Radio,
  Check,
} from 'lucide-react';
import type {
  AgentConnectionState,
  AgentVoiceState,
  AudioDeviceInfo,
  FlowVoiceSettings,
} from '../types';

interface CallControlsProps {
  connectionState: AgentConnectionState;
  agentVoiceState: AgentVoiceState;
  isMuted: boolean;
  userAudioLevel: number;
  audioInputs: AudioDeviceInfo[];
  audioOutputs: AudioDeviceInfo[];
  settings: FlowVoiceSettings;
  currentGenerationId: number;
  onStartCall: () => void;
  onEndCall: () => void;
  onToggleMute: () => void;
  onInterrupt: () => void;
  onRunSlowTask: () => void;
  onSwitchAudioInput: (deviceId: string) => void;
  onSwitchAudioOutput: (deviceId: string) => void;
  onOpenSettings: () => void;
  onOpenGenInspector: () => void;
}

export const CallControls: React.FC<CallControlsProps> = ({
  connectionState,
  agentVoiceState,
  isMuted,
  userAudioLevel,
  audioInputs,
  audioOutputs,
  settings,
  currentGenerationId,
  onStartCall,
  onEndCall,
  onToggleMute,
  onInterrupt,
  onRunSlowTask,
  onSwitchAudioInput,
  onSwitchAudioOutput,
  onOpenSettings,
  onOpenGenInspector,
}) => {
  const [showMicDropdown, setShowMicDropdown] = useState(false);
  const [showSpeakerDropdown, setShowSpeakerDropdown] = useState(false);

  const micMenuRef = useRef<HTMLDivElement | null>(null);
  const speakerMenuRef = useRef<HTMLDivElement | null>(null);

  const isConnected = connectionState === 'connected';
  const isConnecting = connectionState === 'connecting';

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (micMenuRef.current && !micMenuRef.current.contains(e.target as Node)) {
        setShowMicDropdown(false);
      }
      if (speakerMenuRef.current && !speakerMenuRef.current.contains(e.target as Node)) {
        setShowSpeakerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut (M to mute, Space to interrupt if agent speaking)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        onToggleMute();
      }
      if (e.key === ' ' && agentVoiceState === 'speaking') {
        e.preventDefault();
        onInterrupt();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleMute, onInterrupt, agentVoiceState]);

  const activeMicLabel =
    audioInputs.find((d) => d.deviceId === settings.selectedAudioInputId)?.label ||
    (audioInputs.length > 0 ? audioInputs[0].label : 'Default Microphone');

  const activeSpeakerLabel =
    audioOutputs.find((d) => d.deviceId === settings.selectedAudioOutputId)?.label ||
    (audioOutputs.length > 0 ? audioOutputs[0].label : 'Default Speaker');

  return (
    <div className="z-20 w-full p-4 lg:p-6 bg-slate-950/80 border-t border-slate-800/80 backdrop-blur-2xl flex flex-col items-center">
      <div className="w-full max-w-4xl flex flex-wrap items-center justify-between gap-4">
        {/* Left: Device Selection Pickers */}
        <div className="flex items-center gap-2">
          {/* Mic Selector */}
          <div className="relative" ref={micMenuRef}>
            <button
              onClick={() => setShowMicDropdown((prev) => !prev)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 transition-all"
              title="Select Input Microphone"
            >
              <Mic className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="max-w-[120px] sm:max-w-[150px] truncate">{activeMicLabel}</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {showMicDropdown && (
              <div className="absolute bottom-full left-0 mb-2 w-64 p-1.5 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 animate-fadeIn">
                <div className="px-2.5 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Select Microphone
                </div>
                {audioInputs.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-slate-500">No microphones found</div>
                ) : (
                  audioInputs.map((d) => (
                    <button
                      key={d.deviceId}
                      onClick={() => {
                        onSwitchAudioInput(d.deviceId);
                        setShowMicDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-lg transition-colors text-left ${
                        settings.selectedAudioInputId === d.deviceId
                          ? 'bg-cyan-500/15 text-cyan-300 font-medium'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="truncate">{d.label}</span>
                      {settings.selectedAudioInputId === d.deviceId && (
                        <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Speaker Selector */}
          <div className="relative" ref={speakerMenuRef}>
            <button
              onClick={() => setShowSpeakerDropdown((prev) => !prev)}
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 transition-all"
              title="Select Audio Output Speaker"
            >
              <Volume2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="max-w-[120px] sm:max-w-[150px] truncate">{activeSpeakerLabel}</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {showSpeakerDropdown && (
              <div className="absolute bottom-full left-0 mb-2 w-64 p-1.5 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 animate-fadeIn">
                <div className="px-2.5 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Select Output Speaker
                </div>
                {audioOutputs.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-slate-500">Default System Output</div>
                ) : (
                  audioOutputs.map((d) => (
                    <button
                      key={d.deviceId}
                      onClick={() => {
                        onSwitchAudioOutput(d.deviceId);
                        setShowSpeakerDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-lg transition-colors text-left ${
                        settings.selectedAudioOutputId === d.deviceId
                          ? 'bg-purple-500/15 text-purple-300 font-medium'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="truncate">{d.label}</span>
                      {settings.selectedAudioOutputId === d.deviceId && (
                        <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Center: Main Call Action Button Pill */}
        <div className="flex items-center gap-3">
          {/* Mute / Unmute Button */}
          {isConnected && (
            <div className="relative flex items-center">
              <button
                onClick={onToggleMute}
                className={`p-3.5 rounded-2xl border transition-all duration-200 relative group shadow-lg ${
                  isMuted
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30'
                    : 'bg-slate-900 border-slate-800 text-slate-200 hover:border-cyan-500/40'
                }`}
                title={isMuted ? 'Unmute Microphone (M)' : 'Mute Microphone (M)'}
              >
                {isMuted ? (
                  <MicOff className="w-5 h-5 text-rose-400" />
                ) : (
                  <Mic className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
                )}

                {/* Level indicator dot */}
                {!isMuted && userAudioLevel > 0.1 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                )}
              </button>
            </div>
          )}

          {/* Connect / Disconnect Call Button */}
          {!isConnected ? (
            <button
              onClick={onStartCall}
              disabled={isConnecting}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold text-sm shadow-xl shadow-cyan-500/25 transition-all duration-200 hover:scale-102 active:scale-98 disabled:opacity-50"
            >
              <PhoneCall className="w-5 h-5" />
              <span>{isConnecting ? 'Connecting...' : 'Start Voice Call'}</span>
            </button>
          ) : (
            <button
              onClick={onEndCall}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm shadow-xl shadow-rose-600/30 transition-all duration-200 hover:scale-102 active:scale-98"
            >
              <PhoneOff className="w-5 h-5" />
              <span>End Call</span>
            </button>
          )}

          {/* Interrupt Agent Button */}
          {isConnected && (
            <button
              onClick={onInterrupt}
              className="flex items-center gap-1.5 px-3.5 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-amber-300 text-xs transition-all shadow-md group"
              title="Interrupt Agent (Safely invalidates current turn and increments Generation ID)"
            >
              <ShieldAlert className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
              <span className="hidden md:inline font-medium">Interrupt</span>
            </button>
          )}

          {/* Slow Task Demo Tool */}
          {isConnected && (
            <button
              onClick={onRunSlowTask}
              className="flex items-center gap-1.5 px-3.5 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 text-xs transition-all shadow-md group"
              title="Execute backend demo 'slow_task' tool"
            >
              <Zap className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="hidden md:inline font-medium">Slow Task</span>
            </button>
          )}
        </div>

        {/* Right: Settings & Generation Monitor toggles */}
        <div className="flex items-center gap-2">
          {/* Generation ID Monitor button */}
          <button
            onClick={onOpenGenInspector}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 text-xs text-slate-400 hover:text-cyan-300 font-mono transition-all"
            title="Inspect Generation & Interruption Monitor"
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>GEN #{currentGenerationId}</span>
          </button>

          {/* Settings Drawer Button */}
          <button
            onClick={onOpenSettings}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-100 transition-all hover:rotate-45"
            title="Configure Voice Settings (LiveKit, Rime, Whisper, Ollama)"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
