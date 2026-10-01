import React, { useState } from 'react';
import { sendChatMessage } from '../../services/api';
import { Bot, Send, Sparkles, MapPin, X, Maximize2, Minimize2 } from 'lucide-react';
import { marked } from 'marked';

// Configure marked options for clean table parsing
marked.setOptions({
  gfm: true,
  breaks: true,
});

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  target_location?: { lat: number; lon: number; zoom: number; name: string } | null;
}

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (query: string) => void;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({ isOpen, onClose, onSelectLocation }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'bot',
      text: "Hello! I am your **Urban Heat Mitigation AI Assistant**. Ask me anything about local heat risks (e.g., *'Why is Andheri hot?'*), municipal ₹83 Cr budget allocations, or recommended cooling solutions.",
    },
  ]);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const res = await sendChatMessage(userMsg);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: res.reply,
          target_location: res.target_location,
        },
      ]);

      if (res.target_location) {
        onSelectLocation(res.target_location.name);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'Sorry, I encountered an error querying spatial thermal database.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (promptText: string) => {
    setInput(promptText);
  };

  return (
    <div
      className="gov-card"
      role="dialog"
      aria-label="Geospatial AI Assistant Chat Drawer"
      style={{
        position: 'fixed',
        top: isExpanded ? '64px' : '72px',
        right: '20px',
        width: isExpanded ? 'min(820px, 94vw)' : 'min(540px, 92vw)',
        height: isExpanded ? 'calc(100vh - 80px)' : 'calc(100vh - 92px)',
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 8px 30px rgba(0,0,0,0.7)',
        border: '1px solid #334155',
        background: '#0f172a',
        transition: 'all 0.25s ease'
      }}
    >
      {/* Drawer Header */}
      <div style={{
        padding: '12px 18px',
        borderBottom: '1px solid #1e293b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#0b1320'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '4px',
            background: '#1d4ed8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Bot size={18} color="#ffffff" />
          </div>
          <div>
            <h3 style={{ fontSize: '0.95rem', color: '#ffffff', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>Geospatial AI Assistant</h3>
            <span style={{ fontSize: '0.7rem', color: '#6ee7b7', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              ● Grounded RAG Data Engine Online
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? "Minimize panel size" : "Maximize panel size"}
            title={isExpanded ? "Minimize panel" : "Expand panel width"}
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '4px',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#334155';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#1e293b';
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>

          <button
            onClick={onClose}
            aria-label="Close AI Assistant drawer"
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '4px',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#334155';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#1e293b';
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {messages.map((m, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              gap: '10px',
              alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: m.sender === 'user' ? '85%' : '98%',
            }}
          >
            {m.sender === 'bot' && (
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '4px',
                background: '#1d4ed8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Bot size={14} color="#ffffff" />
              </div>
            )}

            <div style={{
              background: m.sender === 'user' ? '#1d4ed8' : '#141e30',
              border: m.sender === 'user' ? '1px solid #2563eb' : '1px solid #27354a',
              color: '#ffffff',
              borderRadius: '4px',
              padding: '10px 14px',
              fontSize: '0.85rem',
              lineHeight: 1.5,
              width: '100%'
            }}>
              {m.sender === 'bot' ? (
                <div
                  className="chat-markdown"
                  dangerouslySetInnerHTML={{ __html: marked.parse(m.text) as string }}
                />
              ) : (
                <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
              )}

              {m.target_location && (
                <button
                  onClick={() => onSelectLocation(m.target_location!.name)}
                  className="btn btn-secondary"
                  aria-label={`Focus ${m.target_location.name} on map`}
                  style={{ marginTop: '10px', width: '100%', fontSize: '0.75rem', padding: '6px 10px', fontWeight: 600 }}
                >
                  <MapPin size={12} color="#60a5fa" /> Focus {m.target_location.name} on Map
                </button>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60a5fa', fontSize: '0.8rem', fontWeight: 500 }}>
            <Sparkles size={15} className="animate-spin" /> Querying spatial heat dataset & PINN model...
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div style={{ padding: '8px 12px', display: 'flex', gap: '6px', overflowX: 'auto', borderTop: '1px solid #1e293b', background: '#0b1320' }}>
        {['Why is Andheri so hot?', 'What is the risk in Powai?', 'How is ₹83 Cr budget spent?'].map((p, i) => (
          <button
            key={i}
            onClick={() => handleQuickPrompt(p)}
            aria-label={`Ask quick prompt: ${p}`}
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '4px',
              padding: '4px 10px',
              fontSize: '0.725rem',
              fontWeight: 500,
              color: '#94a3b8',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#60a5fa';
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.background = '#2563eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#334155';
              e.currentTarget.style.color = '#94a3b8';
              e.currentTarget.style.background = '#1e293b';
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form onSubmit={handleSend} style={{ padding: '12px', borderTop: '1px solid #1e293b', display: 'flex', gap: '8px', background: '#0f172a' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask AI Assistant about local heat..."
          aria-label="Ask AI Assistant input prompt"
          style={{
            flex: 1,
            background: '#0b1320',
            border: '1px solid #334155',
            borderRadius: '4px',
            padding: '8px 12px',
            color: '#ffffff',
            fontSize: '0.85rem',
            minHeight: '38px',
            outline: 'none',
            transition: 'border-color 0.15s ease'
          }}
          onFocusCapture={(e) => (e.currentTarget.style.borderColor = '#2563eb')}
          onBlurCapture={(e) => (e.currentTarget.style.borderColor = '#334155')}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary"
          aria-label="Send message"
          style={{ minWidth: '42px', minHeight: '38px', padding: '0 14px' }}
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
};
