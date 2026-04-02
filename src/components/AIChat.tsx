import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Bot, User, PlusCircle, Trash2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  streaming?: boolean;
}

const WELCOME_MSG: Message = {
  id: 'welcome',
  role: 'ai',
  content: 'Ready. I have access to your recent window activity, keyboard input, and clipboard history. Ask me anything about what you were doing.',
};

function generateSessionId() {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function AIChat() {
  const [sessionId, setSessionId] = useState<string>(() => generateSessionId());
  const [messages, setMessages] = useState<Message[]>([WELCOME_MSG]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load persisted session on mount
  useEffect(() => {
    const load = async () => {
      try {
        const history = await window.electronAPI.getChatHistory(sessionId);
        if (history.length > 0) {
          setMessages([
            WELCOME_MSG,
            ...history.map(m => ({ id: String(m.id), role: m.role as 'user' | 'ai', content: m.content }))
          ]);
        }
      } catch (e) { console.error(e); }
    };
    void load();
  }, [sessionId]);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const newChat = async () => {
    const id = generateSessionId();
    setSessionId(id);
    setMessages([WELCOME_MSG]);
  };

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Persist user message
    await window.electronAPI.saveChatMessage(sessionId, 'user', userMessage.content);

    // Add streaming placeholder
    const aiMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: aiMsgId, role: 'ai', content: '', streaming: true }]);

    try {
      const settings = await window.electronAPI.getSettings();
      const contextSize = parseInt(settings.contextSize) || 50;
      const logs = await window.electronAPI.getTimeline(contextSize);

      const contextLog = logs
        .map(l => {
          const time = new Date(l.timestamp).toLocaleTimeString();
          const base = `[${time}] ${l.eventType.toUpperCase()}: ${l.appName || ''} - ${l.content}`;
          if (l.eventType === 'website' && l.page_title) {
            return `${base} (Reading: "${l.page_title}")`;
          }
          return base;
        })
        .reverse()
        .join('\n');

      const systemPrompt = `You are a helpful, private local assistant with access to the user's recent computer activity.
Use the activity timeline to answer questions about what they were doing, reading, or copying.
If the answer is not in the context, say so clearly.

=== RECENT ACTIVITY TIMELINE ===
${contextLog}
================================`;

      const promptContext = messages
        .filter(m => m.id !== 'welcome')
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n');

      const fullPrompt = `${systemPrompt}\nConversation History:\n${promptContext}\nUser: ${userMessage.content}\nAssistant:`;

      const response = await fetch(`${settings.ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: settings.modelName, prompt: fullPrompt, stream: true }),
      });

      if (!response.ok || !response.body) throw new Error('Failed to reach local Ollama instance');

      // Stream the response token by token
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n').filter(Boolean)) {
          try {
            const json = JSON.parse(line) as { response?: string; done?: boolean };
            if (json.response) {
              fullResponse += json.response;
              setMessages(prev => prev.map(m =>
                m.id === aiMsgId ? { ...m, content: fullResponse } : m
              ));
            }
          } catch { /* partial JSON */ }
        }
      }

      // Mark streaming done
      setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, streaming: false } : m));

      // Persist AI response
      await window.electronAPI.saveChatMessage(sessionId, 'ai', fullResponse);

    } catch (err: unknown) {
      const msg = (err as Error).message;
      setMessages(prev => prev.map(m =>
        m.id === aiMsgId ? { ...m, content: `⚠ Error: ${msg}`, streaming: false } : m
      ));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <header style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1>Context Chat</h1>
          <p>Ask questions based on your recent activity — answers stream in real time.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
          <button className="nav-item" style={{ padding: '0.5rem 0.9rem', fontSize: '0.8rem' }} onClick={newChat}>
            <PlusCircle size={14} /> New Chat
          </button>
          <button
            className="nav-item"
            style={{ padding: '0.5rem 0.9rem', fontSize: '0.8rem', color: '#ef4444' }}
            onClick={async () => { await window.electronAPI.clearChatSession(sessionId); await newChat(); }}
            title="Clear this conversation"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </header>

      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {messages.map((msg) => (
            <div key={msg.id} style={{
              display: 'flex',
              gap: '1rem',
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '88%',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: msg.role === 'user' ? 'var(--text-main)' : 'rgba(20, 184, 166, 0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                {msg.role === 'user' ? <User size={18} color="#000" /> : <Bot size={18} color="var(--primary)" />}
              </div>

              <div style={{
                background: msg.role === 'user' ? 'rgba(255,255,255,0.1)' : 'var(--bg-card)',
                border: msg.role === 'user' ? 'none' : '1px solid var(--border-subtle)',
                color: 'var(--text-main)',
                padding: '0.85rem 1.1rem',
                borderRadius: '16px',
                borderTopRightRadius: msg.role === 'user' ? '4px' : '16px',
                borderTopLeftRadius: msg.role !== 'user' ? '4px' : '16px',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                minWidth: '40px',
              }}>
                {msg.content || (msg.streaming ? (
                  <span style={{ opacity: 0.5 }}>▌</span>
                ) : '')}
                {msg.streaming && msg.content && <span style={{ opacity: 0.5 }}>▌</span>}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.3)' }}>
          <form onSubmit={handleAsk} style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              type="text"
              className="input-field"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. What was the GitHub link I copied earlier?"
              disabled={loading}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn-primary" disabled={loading || !input.trim()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              Ask
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
