import React from 'react';
import {
  Sliders,
  ShieldCheck,
  Activity,
  HelpCircle,
  AudioWaveform as Waveform,
} from 'lucide-react';
import type { AgentConnectionState, FlowVoiceSettings } from '../types';

interface HeaderProps {
  connectionState: AgentConnectionState;
  currentGenerationId: number;
  settings: FlowVoiceSettings;
  latencyMetrics: {
    pingMs: number;
    sttLatency: number;
    llmLatency: number;
    ttsLatency: number;
  };
  onOpenSettings: () => void;
  onOpenGenInspector: () => void;
  onOpenHelp: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  connectionState,
  currentGenerationId,
  settings,
  latencyMetrics,
  onOpenSettings,
  onOpenGenInspector,
  onOpenHelp,
}) => {
  const isConnected = connectionState === 'connected';

  return (
    <header className="z-30 w-full px-4 lg:px-6 py-3.5 bg-slate-950/70 border-b border-slate-800/80 backdrop-blur-xl flex items-center justify-between">
      {/* Brand Logo & Name */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 p-[1.5px] shadow-lg shadow-cyan-500/20">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-cyan-400">
            <Waveform className="w-5 h-5 animate-pulse" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight bg-gradient-to-r from-cyan-300 via-teal-200 to-purple-300 bg-clip-text text-transparent">
              FlowVoice
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/50 text-cyan-300">
              LiveKit WebRTC
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Local Faster-Whisper • Ollama LLM • Rime TTS
          </p>
        </div>
      </div>

      {/* Center Pipeline Telemetry Badges */}
      <div className="hidden xl:flex items-center gap-2 text-xs">
        {/* Connection Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-slate-300">
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected
                ? 'bg-emerald-400 shadow-sm shadow-emerald-400/80 animate-pulse'
                : connectionState === 'connecting'
                ? 'bg-amber-400 animate-ping'
                : 'bg-slate-600'
            }`}
          />
          <span className="capitalize">{connectionState}</span>
        </div>

        {/* LiveKit Ping Latency */}
        {isConnected && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-slate-400 font-mono text-[11px]">
            <Activity className="w-3 h-3 text-cyan-400" />
            <span>RTT: {latencyMetrics.pingMs}ms</span>
          </div>
        )}

        {/* TTS Model Badge */}
        <div className="px-2.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-purple-300 font-mono text-[11px]">
          TTS: Rime ({settings.rimeSpeaker})
        </div>

        {/* LLM Model Badge */}
        <div className="px-2.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-indigo-300 font-mono text-[11px]">
          LLM: {settings.ollamaModel}
        </div>
      </div>

      {/* Right Action Icons */}
      <div className="flex items-center gap-2">
        {/* Monotonic Generation Safety Badge */}
        <button
          onClick={onOpenGenInspector}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-cyan-300 text-xs font-mono transition-colors shadow-sm"
          title="Open Generation Manager Telemetry"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>GEN #{currentGenerationId}</span>
        </button>

        {/* Help / Architecture Guide */}
        <button
          onClick={onOpenHelp}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          title="About FlowVoice Architecture"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Settings Drawer Button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-400 hover:text-cyan-300 transition-colors"
          title="Configure Settings"
        >
          <Sliders className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
