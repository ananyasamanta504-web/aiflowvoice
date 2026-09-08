import type { FlowVoiceSettings } from '../types';

export const DEFAULT_SETTINGS: FlowVoiceSettings = {
  // LiveKit credentials
  livekitUrl: 'wss://livekit.example.com',
  livekitApiKey: '',
  livekitApiSecret: '',
  roomName: 'flowvoice-room-1',
  participantName: 'Guest User',
  token: '',
  autoConnect: false,
  simulationMode: false,

  // Rime TTS
  rimeApiKey: '',
  rimeModel: 'coda',
  rimeSpeaker: 'astra',
  rimeSpeed: 1.0,

  // LLM (Ollama default)
  llmProvider: 'ollama',
  ollamaModel: 'llama3.2:3b',
  ollamaBaseUrl: 'http://localhost:11434/v1',
  openaiApiKey: '',
  openaiModel: 'gpt-4o-mini',
  systemPrompt:
    'You are FlowVoice, a friendly, concise, and helpful real-time AI voice assistant. Your responses are converted to speech using Rime TTS. Keep your answers natural, conversational, and direct.',
  temperature: 0.7,

  // STT (Whisper default)
  sttProvider: 'whisper',
  whisperModel: 'base.en',
  whisperLanguage: 'en',
  vadSensitivity: 0.5,
  allowInterruption: true,

  // Audio Constraints & Devices
  noiseSuppression: true,
  echoCancellation: true,
  autoGainControl: true,
  selectedAudioInputId: 'default',
  selectedAudioOutputId: 'default',
};

const STORAGE_KEY = 'flowvoice_agent_settings_v1';

export function loadSettings(): FlowVoiceSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.error('Failed to parse settings from localStorage', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: FlowVoiceSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings to localStorage', e);
  }
}
