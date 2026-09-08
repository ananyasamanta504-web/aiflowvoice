import React from 'react';
import {
  X,
  ShieldCheck,
  Info,
} from 'lucide-react';
import type { GenerationEvent } from '../types';

interface GenerationInspectorModalProps {
  isOpen: boolean;
  currentGenerationId: number;
  generationLogs: GenerationEvent[];
  onClose: () => void;
  onClearLogs?: () => void;
}

export const GenerationInspectorModal: React.FC<GenerationInspectorModalProps> = ({
  isOpen,
  currentGenerationId,
  generationLogs,
  onClose,
}) => {
  if (!isOpen) return null;

  const getLogBadge = (type: GenerationEvent['type']) => {
    switch (type) {
      case 'start':
        return {
          color: 'text-cyan-400 bg-cyan-950/60 border-cyan-800/50',
          label: 'GEN START',
        };
      case 'interrupted':
        return {
          color: 'text-rose-400 bg-rose-950/60 border-rose-800/50',
          label: 'USER INTERRUPTED',
        };
      case 'invalidated':
        return {
          color: 'text-amber-400 bg-amber-950/60 border-amber-800/50',
          label: 'INVALIDATED',
        };
      case 'task_scheduled':
        return {
          color: 'text-indigo-400 bg-indigo-950/60 border-indigo-800/50',
          label: 'TASK SCHEDULED',
        };
      case 'task_completed':
        return {
          color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/50',
          label: 'TASK ACCEPTED',
        };
      case 'task_cancelled':
        return {
          color: 'text-rose-400 bg-rose-950/60 border-rose-800/50',
          label: 'TASK CANCELLED',
        };
      case 'speech_started':
        return {
          color: 'text-purple-400 bg-purple-950/60 border-purple-800/50',
          label: 'RIME STREAMING',
        };
      case 'speech_stopped':
        return {
          color: 'text-slate-400 bg-slate-900 border-slate-800',
          label: 'RIME STOP',
        };
      default:
        return {
          color: 'text-slate-400 bg-slate-900 border-slate-800',
          label: 'INFO',
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                Generation Manager Inspector
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300">
                  ACTIVE GEN #{currentGenerationId}
                </span>
              </h2>
              <p className="text-xs text-slate-400">Monotonic generation tracking & stale task filter logs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Architecture Info Banner */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800/80 text-xs text-slate-300 space-y-2">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">How Safe Interruption works in FlowVoice:</span>
              <p className="text-slate-400 mt-0.5 leading-relaxed">
                When a user speaks during agent speech or long-running tasks, <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded">GenerationManager.handle_user_interruption()</code> immediately halts Rime TTS audio output and increments the generation ID. Any in-flight background task bound to an older generation ID is automatically cancelled or discarded upon completion.
              </p>
            </div>
          </div>
        </div>

        {/* Real-time Event Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 font-mono text-xs">
          {generationLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No generation events recorded yet. Start a call to begin tracking.
            </div>
          ) : (
            generationLogs.map((log) => {
              const badge = getLogBadge(log.type);
              return (
                <div
                  key={log.id}
                  className="flex items-start justify-between gap-3 p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/60 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span
                      className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold shrink-0 ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                    <span className="text-slate-300 text-[11px] break-words">{log.details}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 text-[10px] text-slate-500">
                    <span>GEN #{log.generationId}</span>
                    <span>•</span>
                    <span>{log.timestamp}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            Live telemetry stream from <code className="text-cyan-400">generation.py</code>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
