import { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { VoiceOrb } from './components/VoiceOrb';
import { TranscriptView } from './components/TranscriptView';
import { CallControls } from './components/CallControls';
import { SettingsDrawer } from './components/SettingsDrawer';
import { GenerationInspectorModal } from './components/GenerationInspectorModal';
import { ArchitectureModal } from './components/ArchitectureModal';
import { useFlowVoiceLiveKit } from './hooks/useFlowVoiceLiveKit';
import { loadSettings, saveSettings } from './utils/storage';
import type { FlowVoiceSettings } from './types';
import { MessageSquare } from 'lucide-react';

export function App() {
  const [settings, setSettings] = useState<FlowVoiceSettings>(() => loadSettings());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGenInspectorOpen, setIsGenInspectorOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isTranscriptVisible, setIsTranscriptVisible] = useState(true);

  // Settings update handler
  const handleSettingsUpdate = useCallback((newSettings: Partial<FlowVoiceSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      saveSettings(updated);
      return updated;
    });
  }, []);

  const handleFullSettingsSave = useCallback((newSettings: FlowVoiceSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    setIsSettingsOpen(false);
  }, []);

  // Initialize LiveKit agent hook
  const {
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
  } = useFlowVoiceLiveKit({
    settings,
    onSettingsUpdate: handleSettingsUpdate,
  });

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#07090e] text-slate-100 font-sans select-none">
      {/* 1. TOP HEADER */}
      <Header
        connectionState={connectionState}
        currentGenerationId={currentGenerationId}
        settings={settings}
        latencyMetrics={latencyMetrics}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenGenInspector={() => setIsGenInspectorOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* 2. MAIN BODY CONTENT */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left / Center: Interactive Voice Agent Orb Area */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          <VoiceOrb
            connectionState={connectionState}
            agentVoiceState={agentVoiceState}
            userVoiceState={userVoiceState}
            userAudioLevel={userAudioLevel}
            agentAudioLevel={agentAudioLevel}
            frequencyDataRef={audioFrequencyDataRef}
            currentGenerationId={currentGenerationId}
            callDuration={callDuration}
            isMuted={isMuted}
            settings={settings}
            isSlowTaskRunning={isSlowTaskRunning}
            slowTaskProgress={slowTaskProgress}
            onInterrupt={handleUserInterruption}
            onStartCall={startCall}
          />

          {/* Toggle Transcript Mobile / Desktop float button */}
          <button
            onClick={() => setIsTranscriptVisible((prev) => !prev)}
            className="absolute top-4 right-4 z-20 p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-cyan-300 transition-all shadow-lg lg:hidden"
            title="Toggle Transcript Drawer"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </main>

        {/* Right: Live STT & AI Transcript Pane */}
        {isTranscriptVisible && (
          <aside className="fixed inset-y-0 right-0 z-30 lg:static lg:z-auto h-full shadow-2xl lg:shadow-none animate-fadeIn">
            <TranscriptView
              transcripts={transcripts}
              agentVoiceState={agentVoiceState}
              connectionState={connectionState}
              currentGenerationId={currentGenerationId}
              onSendMessage={sendUserMessage}
              onClear={clearTranscripts}
              onRunSlowTask={() => runSlowTaskDemo(3)}
            />
          </aside>
        )}
      </div>

      {/* 3. BOTTOM CALL CONTROLS */}
      <footer className="shrink-0">
        <CallControls
          connectionState={connectionState}
          agentVoiceState={agentVoiceState}
          isMuted={isMuted}
          userAudioLevel={userAudioLevel}
          audioInputs={audioInputs}
          audioOutputs={audioOutputs}
          settings={settings}
          currentGenerationId={currentGenerationId}
          onStartCall={startCall}
          onEndCall={endCall}
          onToggleMute={toggleMute}
          onInterrupt={handleUserInterruption}
          onRunSlowTask={() => runSlowTaskDemo(3)}
          onSwitchAudioInput={switchAudioInput}
          onSwitchAudioOutput={switchAudioOutput}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenGenInspector={() => setIsGenInspectorOpen(true)}
        />
      </footer>

      {/* 4. MODALS & DRAWERS */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        settings={settings}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleFullSettingsSave}
      />

      <GenerationInspectorModal
        isOpen={isGenInspectorOpen}
        currentGenerationId={currentGenerationId}
        generationLogs={generationLogs}
        onClose={() => setIsGenInspectorOpen(false)}
      />

      <ArchitectureModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
}

export default App;
