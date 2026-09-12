import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  Send,
  X,
  Minimize2,
  Maximize2,
  Trash2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  FileText,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import aiService from '../../services/aiService';

// Quick Prompts Suggested to Manager
const SUGGESTED_PROMPTS = [
  'What did the team work on last week?',
  'What are the main blockers this week?',
  'Summarize this week\'s team activity.',
  'Which projects need attention?',
  'Are there any workload imbalances?',
];

/**
 * Lightweight Markdown-like formatter for structured LLM responses
 */
function FormattedMessage({ content }) {
  if (!content) return null;

  // Split lines
  const lines = content.split('\n');

  return (
    <div className="space-y-2 text-xs sm:text-sm leading-relaxed text-slate-200">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // Heading 3 or 4 (### or ####)
        if (trimmed.startsWith('### ') || trimmed.startsWith('#### ')) {
          const text = trimmed.replace(/^#+\s*/, '');
          return (
            <h4 key={idx} className="text-xs font-bold text-teal-300 pt-2 pb-0.5 tracking-wide uppercase">
              {text}
            </h4>
          );
        }

        // Heading 1 or 2 (## or #)
        if (trimmed.startsWith('# ') || trimmed.startsWith('## ')) {
          const text = trimmed.replace(/^#+\s*/, '');
          return (
            <h3 key={idx} className="text-sm font-bold text-white pt-2.5 pb-1 border-b border-slate-800">
              {text}
            </h3>
          );
        }

        // Bullet point list item
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
          const text = trimmed.replace(/^[*•-]\s*/, '');
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-brand-400 font-bold shrink-0 mt-0.5">•</span>
              <span className="flex-1">{renderInlineFormatting(text)}</span>
            </div>
          );
        }

        // Numbered list item
        const numMatch = trimmed.match(/^(\d+)\.\s*(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-teal-400 font-semibold font-mono text-[11px] shrink-0 mt-0.5">
                {numMatch[1]}.
              </span>
              <span className="flex-1">{renderInlineFormatting(numMatch[2])}</span>
            </div>
          );
        }

        // Standard Paragraph
        return (
          <p key={idx} className="text-slate-300">
            {renderInlineFormatting(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

/**
 * Formats bold (`**text**`), inline code (` `code` `), and italics (`*text*`)
 */
function renderInlineFormatting(text) {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`|\*.*?\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={index} className="px-1 py-0.5 rounded bg-slate-800 text-teal-300 font-mono text-[11px]">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={index} className="italic text-slate-300">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}

export default function AIChatWidget() {
  const { user, isManagerAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Strictly hide widget if user is not MANAGER_ADMIN
  if (!isManagerAdmin) {
    return null;
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [isOpen, messages, isLoading]);

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    setError(null);
    setInputMessage('');

    // Add user message to conversation
    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await aiService.chatWithAssistant(query);
      const assistantText = res?.data?.message || 'No response returned.';

      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg =
        err.message || 'Failed to generate response. Please verify server connection or Gemini API key.';
      setError(errorMsg);

      const fallbackMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ **Unable to process request**:\n\n${errorMsg}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateWeeklySummary = () => {
    handleSendMessage(
      'Generate a concise management summary of the current reporting week. Include completed work, major blockers, notable workload observations, and projects needing attention.'
    );
  };

  const handleClearChat = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {/* ==========================================
          COLLAPSED FLOATING TRIGGER BUTTON
      ========================================== */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-brand-600 text-white font-semibold text-xs shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-slate-950 group"
          aria-label="Open TeamPulse AI Management Assistant"
        >
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          </div>
          <span>AI Assistant</span>
          {/* <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-mono tracking-wider uppercase">
            Gemini
          </span> */}
        </button>
      )}

      {/* ==========================================
          EXPANDED CHAT PANEL
      ========================================== */}
      {isOpen && (
        <div
          className={`flex flex-col bg-slate-900/95 border border-purple-500/30 rounded-2xl shadow-2xl shadow-black/60 backdrop-blur-xl transition-all duration-200 overflow-hidden ${isExpanded
            ? 'w-[90vw] md:w-[700px] h-[80vh]'
            : 'w-[92vw] sm:w-[420px] h-[540px] max-h-[85vh]'
            }`}
        >
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-slate-950 via-slate-900 to-purple-950/60 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-white tracking-tight">
                    TeamPulse AI
                  </h3>
                  {/* <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[9px] font-mono font-semibold border border-purple-500/30">
                    Gemini 1.5
                  </span> */}
                </div>
                <p className="text-[10px] text-slate-400">
                  Management Analytics Assistant
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={handleClearChat}
                  title="Clear conversation"
                  className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800/80 transition-colors"
                  aria-label="Clear chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Restore size' : 'Expand panel'}
                className="hidden sm:block p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
                aria-label={isExpanded ? 'Minimize panel' : 'Expand panel'}
              >
                {isExpanded ? (
                  <Minimize2 className="w-3.5 h-3.5" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5" />
                )}
              </button>

              <button
                onClick={() => setIsOpen(false)}
                title="Close assistant"
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
                aria-label="Close assistant panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Action Header Bar */}
          <div className="px-4 py-2 bg-slate-950/50 border-b border-slate-800/60 flex items-center justify-between gap-2 shrink-0">
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>Real-time team analytics</span>
            </span>

            <button
              onClick={handleGenerateWeeklySummary}
              disabled={isLoading}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-[10px] font-semibold transition-colors disabled:opacity-50"
            >
              <FileText className="w-3 h-3" />
              <span>Generate Weekly Summary</span>
            </button>
          </div>

          {/* Messages Conversation Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-950/40">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-center px-4 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-inner">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    How can I assist your team oversight today?
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Ask about completed weekly tasks, blockers, project progress, or workload balance.
                  </p>
                </div>

                {/* Suggested Questions */}
                <div className="w-full space-y-1.5 pt-2">
                  <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider block text-left">
                    Suggested Questions
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {SUGGESTED_PROMPTS.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(prompt)}
                        disabled={isLoading}
                        className="text-left px-3 py-2 rounded-xl bg-slate-900 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/40 text-slate-300 hover:text-white text-xs transition-all flex items-center justify-between group disabled:opacity-50"
                      >
                        <span className="truncate">{prompt}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-purple-400 shrink-0 ml-2 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'
                    }`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs sm:text-sm shadow-md ${msg.role === 'user'
                      ? 'bg-purple-600 text-white rounded-br-sm'
                      : msg.isError
                        ? 'bg-rose-950/50 border border-rose-500/30 text-rose-200 rounded-bl-sm'
                        : 'bg-slate-900 border border-slate-800/80 text-slate-200 rounded-bl-sm'
                      }`}
                  >
                    {msg.role === 'assistant' ? (
                      <FormattedMessage content={msg.content} />
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1 px-1 flex items-center gap-1 font-mono">
                    <Clock className="w-2.5 h-2.5" />
                    {msg.timestamp}
                  </span>
                </div>
              ))
            )}

            {/* Live Typing / Loading State */}
            {isLoading && (
              <div className="flex items-start gap-2">
                <div className="bg-slate-900 border border-purple-500/30 rounded-2xl rounded-bl-sm px-4 py-3 shadow-md flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-purple-300 font-medium">
                    Analyzing team reports with Gemini...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Form Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-slate-950 border-t border-slate-800 shrink-0"
          >
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about team progress, blockers, or workload..."
                maxLength={1500}
                disabled={isLoading}
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="absolute right-1.5 p-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-30 disabled:hover:bg-purple-600 transition-colors focus:outline-none"
                aria-label="Send message"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 px-1">
              {/* <span>Powered by Gemini 1.5 Flash • Context Sanitized</span> */}
              <span>{inputMessage.length}/1500</span>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
