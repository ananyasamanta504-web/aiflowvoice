import React, { useState } from 'react';
import {
  X,
  Sliders,
  Radio,
  Volume2,
  Cpu,
  Mic,
  Key,
  RotateCcw,
  Check,
} from 'lucide-react';
import type { FlowVoiceSettings } from '../types';
import { DEFAULT_SETTINGS } from '../utils/storage';
import { generateMockToken } from '../utils/tokenHelper';

interface SettingsDrawerProps {
  isOpen: boolean;
  settings: FlowVoiceSettings;
  onClose: () => void;
  onSave: (newSettings: FlowVoiceSettings) => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isOpen,
  settings,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState<FlowVoiceSettings>({ ...settings });
  const [activeTab, setActiveTab] = useState<'livekit' | 'rime' | 'llm' | 'whisper' | 'audio'>('livekit');
  const [savedToast, setSavedToast] = useState(false);

  if (!isOpen) return null;

  const handleChange = <K extends keyof FlowVoiceSettings>(key: K, value: FlowVoiceSettings[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onSave(form);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  const handleResetDefaults = () => {
    setForm({ ...DEFAULT_SETTINGS });
  };

  const handleGenerateToken = () => {
    const token = generateMockToken(form.roomName, form.participantName);
    handleChange('token', token);
  };

  const tabs = [
    { id: 'livekit', label: 'LiveKit WebRTC', icon: Radio },
    { id: 'rime', label: 'Rime TTS', icon: Volume2 },
    { id: 'llm', label: 'Ollama / LLM', icon: Cpu },
    { id: 'whisper', label: 'Whisper STT & VAD', icon: Mic },
    { id: 'audio', label: 'Audio Engine', icon: Sliders },
  ];

  const rimeSpeakers = [
    { id: 'astra', name: 'Astra (Natural, Warm)', gender: 'Female' },
    { id: 'marsh', name: 'Marsh (Calm, Grounded)', gender: 'Male' },
    { id: 'creek', name: 'Creek (Crisp, Professional)', gender: 'Male' },
    { id: 'spruce', name: 'Spruce (Friendly, Expressive)', gender: 'Female' },
    { id: 'echo', name: 'Echo (Modern Conversational)', gender: 'Neutral' },
  ];

  const whisperModels = [
    { id: 'tiny.en', name: 'tiny.en (Fastest, ~75MB)' },
    { id: 'base.en', name: 'base.en (Default, ~140MB)' },
    { id: 'small.en', name: 'small.en (Higher Accuracy, ~460MB)' },
    { id: 'medium.en', name: 'medium.en (High Precision, ~1.5GB)' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      {/* Drawer Container */}
      <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">FlowVoice Settings</h2>
              <p className="text-xs text-slate-400">Config matching agent.py and config.py</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 px-4 bg-slate-950/60 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-3 py-3 text-xs font-medium border-b-2 transition-all shrink-0 ${
                  isActive
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* TAB 1: LIVEKIT WEBRTC */}
          {activeTab === 'livekit' && (
            <div className="space-y-4">
              <div className="p-3 bg-cyan-950/30 border border-cyan-500/30 rounded-xl text-xs text-cyan-200 flex items-start gap-2.5">
                <Radio className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold">LiveKit Cloud / Local Server:</span> Connect with your
                  LiveKit WebRTC endpoint (AUDIO_ONLY auto-subscription) as configured in agent.py.
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  LiveKit Server WebSocket URL (LIVEKIT_URL)
                </label>
                <input
                  type="text"
                  value={form.livekitUrl}
                  onChange={(e) => handleChange('livekitUrl', e.target.value)}
                  placeholder="wss://your-project.livekit.cloud or ws://localhost:7880"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Room Name
                  </label>
                  <input
                    type="text"
                    value={form.roomName}
                    onChange={(e) => handleChange('roomName', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Participant Identity
                  </label>
                  <input
                    type="text"
                    value={form.participantName}
                    onChange={(e) => handleChange('participantName', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-300">
                    Participant Token (JWT)
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateToken}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
                  >
                    <Key className="w-3 h-3" /> Generate Sandbox Token
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={form.token}
                  onChange={(e) => handleChange('token', e.target.value)}
                  placeholder="Enter LiveKit participant token or leave empty for simulation mode"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-800">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.simulationMode}
                    onChange={(e) => handleChange('simulationMode', e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500"
                  />
                  <div>
                    <span className="text-xs font-medium text-slate-200">Force Interactive Playground Mode</span>
                    <p className="text-[11px] text-slate-500">
                      Enables full voice synthesis, visualizer reactions, and safe interruption testing without requiring a live cloud token.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* TAB 2: RIME TTS */}
          {activeTab === 'rime' && (
            <div className="space-y-4">
              <div className="p-3 bg-purple-950/30 border border-purple-500/30 rounded-xl text-xs text-purple-200 flex items-start gap-2.5">
                <Volume2 className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold">Rime Text-to-Speech:</span> Ultra low-latency expressive neural voice generation.
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Rime Model (RIME_MODEL)
                </label>
                <select
                  value={form.rimeModel}
                  onChange={(e) => handleChange('rimeModel', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                >
                  <option value="coda">coda (Default, Conversational)</option>
                  <option value="mist">mist (Fast, Low Latency)</option>
                  <option value="arc">arc (Expressive Audio)</option>
                  <option value="vibe">vibe (Natural Warmth)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Speaker Voice (RIME_SPEAKER)
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {rimeSpeakers.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleChange('rimeSpeaker', s.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                        form.rimeSpeaker === s.id
                          ? 'bg-purple-500/15 border-purple-500/50 text-purple-200'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-xs text-slate-100">{s.name}</div>
                        <div className="text-[11px] text-slate-500">{s.gender} voice</div>
                      </div>
                      {form.rimeSpeaker === s.id && (
                        <Check className="w-4 h-4 text-purple-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-medium text-slate-300 mb-1">
                  <span>Speech Rate Multiplier</span>
                  <span className="font-mono text-purple-400">{form.rimeSpeed}x</span>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="1.5"
                  step="0.05"
                  value={form.rimeSpeed}
                  onChange={(e) => handleChange('rimeSpeed', parseFloat(e.target.value))}
                  className="w-full accent-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Rime API Key (RIME_API_KEY)
                </label>
                <input
                  type="password"
                  value={form.rimeApiKey}
                  onChange={(e) => handleChange('rimeApiKey', e.target.value)}
                  placeholder="Optional for local browser simulation"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          )}

          {/* TAB 3: OLLAMA & LLM */}
          {activeTab === 'llm' && (
            <div className="space-y-4">
              <div className="p-3 bg-indigo-950/30 border border-indigo-500/30 rounded-xl text-xs text-indigo-200 flex items-start gap-2.5">
                <Cpu className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold">Local Ollama LLM:</span> FlowVoice runs local fast inference via OpenAI-compatible endpoints.
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Ollama Model
                </label>
                <input
                  type="text"
                  value={form.ollamaModel}
                  onChange={(e) => handleChange('ollamaModel', e.target.value)}
                  placeholder="llama3.2:3b"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Ollama Base URL
                </label>
                <input
                  type="text"
                  value={form.ollamaBaseUrl}
                  onChange={(e) => handleChange('ollamaBaseUrl', e.target.value)}
                  placeholder="http://localhost:11434/v1"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  System Prompt Instructions
                </label>
                <textarea
                  rows={4}
                  value={form.systemPrompt}
                  onChange={(e) => handleChange('systemPrompt', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-medium text-slate-300 mb-1">
                  <span>Temperature</span>
                  <span className="font-mono text-indigo-400">{form.temperature}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.2"
                  step="0.1"
                  value={form.temperature}
                  onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>
            </div>
          )}

          {/* TAB 4: FASTER-WHISPER & SILERO VAD */}
          {activeTab === 'whisper' && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-xs text-emerald-200 flex items-start gap-2.5">
                <Mic className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold">Local Faster-Whisper & Silero VAD:</span> Stream-adapted speech-to-text without external APIs.
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Whisper Model Size
                </label>
                <select
                  value={form.whisperModel}
                  onChange={(e) => handleChange('whisperModel', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  {whisperModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Language
                </label>
                <select
                  value={form.whisperLanguage}
                  onChange={(e) => handleChange('whisperLanguage', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="en">English (en)</option>
                  <option value="auto">Auto Detect</option>
                  <option value="es">Spanish (es)</option>
                  <option value="fr">French (fr)</option>
                  <option value="de">German (de)</option>
                  <option value="ja">Japanese (ja)</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-medium text-slate-300 mb-1">
                  <span>Silero VAD Sensitivity Threshold</span>
                  <span className="font-mono text-emerald-400">{form.vadSensitivity}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={form.vadSensitivity}
                  onChange={(e) => handleChange('vadSensitivity', parseFloat(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-800">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.allowInterruption}
                    onChange={(e) => handleChange('allowInterruption', e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500"
                  />
                  <div>
                    <span className="text-xs font-medium text-slate-200">Enable Safe Interruption (Generation Tracking)</span>
                    <p className="text-[11px] text-slate-500">
                      When active, speaking while the agent talks immediately halts speech and cancels in-flight tasks.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* TAB 5: AUDIO CONSTRAINTS */}
          {activeTab === 'audio' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-800/40 border border-slate-700/60 rounded-xl text-xs text-slate-300 flex items-start gap-2.5">
                <Sliders className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold">WebRTC MediaStream Audio Processing:</span> Hardware and browser-level audio filters.
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer">
                  <div>
                    <div className="text-xs font-semibold text-slate-200">Echo Cancellation</div>
                    <div className="text-[11px] text-slate-500">Prevents agent voice playback from looping into microphone</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.echoCancellation}
                    onChange={(e) => handleChange('echoCancellation', e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500 w-4 h-4"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer">
                  <div>
                    <div className="text-xs font-semibold text-slate-200">Noise Suppression</div>
                    <div className="text-[11px] text-slate-500">Filters background air conditioning and keyboard clicks</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.noiseSuppression}
                    onChange={(e) => handleChange('noiseSuppression', e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500 w-4 h-4"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer">
                  <div>
                    <div className="text-xs font-semibold text-slate-200">Auto Gain Control</div>
                    <div className="text-[11px] text-slate-500">Automatically balances input microphone volume</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.autoGainControl}
                    onChange={(e) => handleChange('autoGainControl', e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500 w-4 h-4"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            {savedToast && (
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium animate-fadeIn">
                <Check className="w-3.5 h-3.5" /> Saved!
              </span>
            )}
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs shadow-lg shadow-cyan-500/20 transition-all"
            >
              Apply Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
