import React from 'react';
import {
  X,
  Radio,
  Cpu,
  Volume2,
  Mic,
  ShieldCheck,
  Code2,
} from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">FlowVoice System Architecture</h2>
              <p className="text-xs text-slate-400">Full-duplex WebRTC Voice Agent Pipeline</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300">
          {/* Pipeline Flowchart */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-emerald-500/30 flex flex-col items-center text-center">
              <Mic className="w-6 h-6 text-emerald-400 mb-2" />
              <div className="font-semibold text-white">Local Whisper STT</div>
              <div className="text-[11px] text-slate-400 mt-1">faster-whisper + Silero VAD</div>
              <span className="mt-2 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300">~110ms</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-indigo-500/30 flex flex-col items-center text-center">
              <Cpu className="w-6 h-6 text-indigo-400 mb-2" />
              <div className="font-semibold text-white">Ollama LLM</div>
              <div className="text-[11px] text-slate-400 mt-1">llama3.2:3b / localhost</div>
              <span className="mt-2 text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300">~180ms</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-purple-500/30 flex flex-col items-center text-center">
              <Volume2 className="w-6 h-6 text-purple-400 mb-2" />
              <div className="font-semibold text-white">Rime TTS</div>
              <div className="text-[11px] text-slate-400 mt-1">Astra / Coda model</div>
              <span className="mt-2 text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300">~95ms</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-cyan-500/30 flex flex-col items-center text-center">
              <Radio className="w-6 h-6 text-cyan-400 mb-2" />
              <div className="font-semibold text-white">LiveKit WebRTC</div>
              <div className="text-[11px] text-slate-400 mt-1">Audio-only subscription</div>
              <span className="mt-2 text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300">&lt;30ms RTT</span>
            </div>
          </div>

          {/* Key Features Breakdown */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Key Backend & Frontend Integrations
            </h3>

            <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
              <div className="font-semibold text-cyan-300">1. Safe Interruption & Generation Manager</div>
              <p className="text-slate-400 leading-relaxed">
                Matches <code className="text-slate-200">generation.py</code>. Monotonically increasing generation IDs ensure that when a user interrupts the agent or cancels a turn, all active speech streaming and background tasks are cleanly halted and discarded without ghost playback.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
              <div className="font-semibold text-purple-300">2. Rime Text-to-Speech & Local Whisper</div>
              <p className="text-slate-400 leading-relaxed">
                Configured via <code className="text-slate-200">config.py</code>. Supports multi-speaker selection (Astra, Marsh, Creek, Spruce, Echo) and local faster-whisper on CPU/MPS adapted with Silero VAD for low-latency voice capture.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
              <div className="font-semibold text-amber-300">3. Demo Tool: Slow Task Execution</div>
              <p className="text-slate-400 leading-relaxed">
                Demonstrates the <code className="text-slate-200">slow_task</code> tool from <code className="text-slate-200">agent.py</code>. You can trigger this 3-second task from the UI or by voice, and test interrupting it mid-flight to observe safe cancellation in action.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
