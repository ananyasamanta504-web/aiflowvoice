export type AgentConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

export type AgentVoiceState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'interrupted';

export type UserVoiceState =
  | 'silent'
  | 'speaking'
  | 'muted';

export interface TranscriptMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  text: string;
  timestamp: string;
  generationId: number;
  isFinal: boolean;
  isInterrupted?: boolean;
  durationSeconds?: number;
  metrics?: {
    sttMs?: number;
    llmMs?: number;
    ttsMs?: number;
    totalLatencyMs?: number;
    modelUsed?: string;
  };
}

export interface FlowVoiceSettings {
  // LiveKit WebRTC
  livekitUrl: string;
  livekitApiKey: string;
  livekitApiSecret: string;
  roomName: string;
  participantName: string;
  token: string;
  autoConnect: boolean;
  simulationMode: boolean;

  // Rime TTS Configuration
  rimeApiKey: string;
  rimeModel: string;
  rimeSpeaker: string;
  rimeSpeed: number;

  // Ollama & LLM Configuration
  llmProvider: 'ollama' | 'openai';
  ollamaModel: string;
  ollamaBaseUrl: string;
  openaiApiKey: string;
  openaiModel: string;
  systemPrompt: string;
  temperature: number;

  // STT & VAD Configuration
  sttProvider: 'whisper' | 'openai';
  whisperModel: string;
  whisperLanguage: string;
  vadSensitivity: number; // 0.0 - 1.0 (Silero threshold)
  allowInterruption: boolean;

  // UI / Audio Settings
  noiseSuppression: boolean;
  echoCancellation: boolean;
  autoGainControl: boolean;
  selectedAudioInputId: string;
  selectedAudioOutputId: string;
}

export interface AudioDeviceInfo {
  deviceId: string;
  label: string;
  groupId?: string;
}

export interface GenerationEvent {
  id: string;
  timestamp: string;
  generationId: number;
  type: 'start' | 'invalidated' | 'interrupted' | 'task_scheduled' | 'task_completed' | 'task_cancelled' | 'speech_started' | 'speech_stopped';
  details: string;
}
