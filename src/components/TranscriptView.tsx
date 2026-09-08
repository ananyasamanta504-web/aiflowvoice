import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Bot,
  User,
  Copy,
  Check,
  Download,
  Trash2,
  Search,
  Sparkles,
  Send,
  XCircle,
  Zap,
  Activity,
} from 'lucide-react';
import type { TranscriptMessage, AgentVoiceState, AgentConnectionState } from '../types';

interface TranscriptViewProps {
  transcripts: TranscriptMessage[];
  agentVoiceState: AgentVoiceState;
  connectionState: AgentConnectionState;
  currentGenerationId: number;
  onSendMessage: (text: string) => void;
  onClear: () => void;
  onRunSlowTask: () => void;
}

export const TranscriptView: React.FC<TranscriptViewProps> = ({
  transcripts,
  agentVoiceState,
  connectionState,
  onSendMessage,
  onClear,
  onRunSlowTask,
}) => {
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSender, setFilterSender] = useState<'all' | 'user' | 'agent'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isAutoScroll, setIsAutoScroll] = useState(true);

  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const isConnected = connectionState === 'connected';

  // Auto-scroll to bottom when new transcripts arrive
  useEffect(() => {
    if (isAutoScroll && transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcripts, isAutoScroll]);

  // Handle user scrolling up
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 60;
    setIsAutoScroll(isAtBottom);
  };

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExport = (format: 'txt' | 'json' | 'md') => {
    let content = '';
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `flowvoice-transcript-${dateStr}.${format}`;

    if (format === 'json') {
      content = JSON.stringify(transcripts, null, 2);
    } else if (format === 'md') {
      content = `# FlowVoice Call Transcript\n*Exported on ${new Date().toLocaleString()}*\n\n` +
        transcripts
          .map(
            (t) =>
              `### ${t.sender.toUpperCase()} (GEN #${t.generationId}) - ${t.timestamp}\n${t.text}\n${
                t.isInterrupted ? '*[Turn Interrupted]*\n' : ''
              }`
          )
          .join('\n\n');
    } else {
      content = transcripts
        .map(
          (t) =>
            `[${t.timestamp}] [GEN #${t.generationId}] ${t.sender.toUpperCase()}: ${t.text} ${
              t.isInterrupted ? '(INTERRUPTED)' : ''
            }`
        )
        .join('\n');
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Filtered transcripts
  const filteredTranscripts = transcripts.filter((t) => {
    const matchesFilter = filterSender === 'all' || t.sender === filterSender;
    const matchesSearch =
      !searchQuery ||
      t.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.sender.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const quickPrompts = [
    { label: '⚡ Run Slow Task (3s delay)', action: () => onRunSlowTask() },
    { label: '🎙️ Test Rime Voice Models', action: () => onSendMessage('Tell me about the available Rime TTS speaker voices.') },
    { label: '🛡️ Explain Safe Interruption', action: () => onSendMessage('How does FlowVoice handle safe user interruptions and generation IDs?') },
    { label: '💡 Tell me a tech joke', action: () => onSendMessage('Tell me a quick tech joke!') },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-900/60 border-l border-slate-800/80 backdrop-blur-xl lg:w-[440px] xl:w-[480px] shrink-0">
      {/* Pane Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              Live Transcript
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {transcripts.length} msgs
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">STT & Rime TTS turn-by-turn stream</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <div className="relative group">
            <button
              onClick={() => handleExport('md')}
              disabled={transcripts.length === 0}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors disabled:opacity-30"
              title="Export Markdown"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={onClear}
            disabled={transcripts.length === 0}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-30"
            title="Clear Transcript"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="px-4 py-2.5 bg-slate-950/40 border-b border-slate-800/60 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transcript..."
            className="w-full pl-8 pr-3 py-1 bg-slate-900/80 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
          <button
            onClick={() => setFilterSender('all')}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              filterSender === 'all' ? 'bg-slate-800 text-cyan-300 font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterSender('user')}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              filterSender === 'user' ? 'bg-slate-800 text-emerald-300 font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            User
          </button>
          <button
            onClick={() => setFilterSender('agent')}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              filterSender === 'agent' ? 'bg-slate-800 text-purple-300 font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            AI
          </button>
        </div>
      </div>

      {/* Message List */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {filteredTranscripts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
              <Bot className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-sm font-medium text-slate-300">No transcripts yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Connect to LiveKit or try sending a prompt below to see live STT & AI responses.
            </p>

            {/* Quick Starter Chips */}
            <div className="mt-6 flex flex-col gap-2 w-full max-w-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Quick Test Prompts</span>
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={p.action}
                  className="text-left text-xs px-3 py-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-cyan-500/30 text-slate-300 transition-all flex items-center justify-between group"
                >
                  <span>{p.label}</span>
                  <Sparkles className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          filteredTranscripts.map((msg) => {
            const isAgent = msg.sender === 'agent';
            const isUser = msg.sender === 'user';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 text-xs group ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                    isAgent
                      ? 'bg-purple-950/60 border-purple-500/30 text-purple-300'
                      : 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
                  }`}
                >
                  {isAgent ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                {/* Bubble Container */}
                <div className={`flex flex-col max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                  {/* Sender Meta Bar */}
                  <div className="flex items-center gap-2 mb-1 px-1 text-[10px] text-slate-400">
                    <span className="font-semibold text-slate-300">
                      {isAgent ? 'FlowVoice AI' : 'You (Microphone)'}
                    </span>
                    <span className="font-mono text-cyan-400/80 bg-cyan-950/40 px-1.5 py-0.2 rounded border border-cyan-800/40">
                      GEN #{msg.generationId}
                    </span>
                    <span className="text-slate-500">{msg.timestamp}</span>

                    {msg.isInterrupted && (
                      <span className="flex items-center gap-0.5 text-rose-400 bg-rose-950/60 px-1.5 py-0.2 rounded border border-rose-800/40 font-medium">
                        <XCircle className="w-2.5 h-2.5" /> Interrupted
                      </span>
                    )}
                  </div>

                  {/* Speech Bubble */}
                  <div
                    className={`relative p-3 rounded-2xl text-xs leading-relaxed transition-all shadow-sm ${
                      isUser
                        ? 'bg-gradient-to-br from-emerald-600/20 to-cyan-600/10 border border-emerald-500/30 text-slate-100 rounded-tr-none'
                        : msg.isInterrupted
                        ? 'bg-rose-950/30 border border-rose-500/30 text-rose-200/90 rounded-tl-none line-through decoration-rose-400/60'
                        : 'bg-slate-800/80 border border-slate-700/60 text-slate-200 rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {/* Latency & Model Metrics Tag */}
                    {msg.metrics && (
                      <div className="mt-2 pt-1.5 border-t border-slate-700/40 flex flex-wrap items-center gap-2 text-[10px] text-slate-400 font-mono">
                        {msg.metrics.totalLatencyMs && (
                          <span className="flex items-center gap-1 text-cyan-300">
                            <Activity className="w-2.5 h-2.5" />
                            {msg.metrics.totalLatencyMs}ms
                          </span>
                        )}
                        {msg.metrics.modelUsed && (
                          <span className="text-slate-400">{msg.metrics.modelUsed}</span>
                        )}
                      </div>
                    )}

                    {/* Hover Copy Button */}
                    <button
                      onClick={() => handleCopy(msg.text, msg.id)}
                      className="absolute top-2 right-2 p-1 rounded bg-slate-900/80 text-slate-400 hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Copy text"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Live Typing / Thinking Indicator */}
        {agentVoiceState === 'thinking' && (
          <div className="flex gap-3 text-xs items-center">
            <div className="w-7 h-7 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-800/80 border border-slate-700/60 px-3.5 py-2.5 rounded-2xl rounded-tl-none flex items-center gap-1.5 text-slate-400">
              <span className="text-[11px] text-indigo-300 font-medium">FlowVoice is thinking</span>
              <div className="flex gap-1 ml-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={transcriptEndRef} />
      </div>

      {/* Bottom Text & Prompt Input */}
      <div className="p-3.5 bg-slate-950/70 border-t border-slate-800/80">
        <form onSubmit={handleSend} className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={!isConnected}
            placeholder={
              isConnected
                ? 'Type a message or speak into your mic...'
                : 'Connect call to chat...'
            }
            className="w-full pl-3.5 pr-20 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 disabled:opacity-50"
          />
          <div className="absolute right-1.5 flex items-center gap-1">
            <button
              type="button"
              onClick={() => onRunSlowTask()}
              disabled={!isConnected}
              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-40"
              title="Trigger 3s Slow Task Tool"
            >
              <Zap className="w-3.5 h-3.5" />
            </button>
            <button
              type="submit"
              disabled={!inputText.trim() || !isConnected}
              className="p-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg transition-colors disabled:opacity-40 disabled:hover:bg-cyan-500"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
