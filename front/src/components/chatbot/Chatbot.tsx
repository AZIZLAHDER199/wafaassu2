import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { detectIntent, intents, quickReplyMap } from './chatbot-engine';
import type { Message } from './chatbot-engine';

/* ── helpers ── */
const uid = () => Math.random().toString(36).slice(2);
const fmt = (d: Date) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

function renderText(text: string) {
  return text.split('\n').map((line, i) => {
    const parts = line.split(/\*\*(.*?)\*\*/g);
    return (
      <span key={i}>
        {parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p.replace(/\*(.*?)\*/g, '$1'))}
        {i < text.split('\n').length - 1 && <br />}
      </span>
    );
  });
}

/* ── BOT initial greeting ── */
const GREETING: Message = {
  id: uid(),
  from: 'bot',
  text: "Bonjour ! 👋 Je suis **Wafa**, l'assistante de Tamanar Assistance.\nComment puis-je vous aider ?",
  time: new Date(),
};

const QUICK_START = ['Créer une intervention','Voir les factures','Statistiques','Aide'];

const Chatbot: React.FC = () => {
  const [open, setOpen]           = useState(false);
  const [messages, setMessages]   = useState<Message[]>([GREETING]);
  const [input, setInput]         = useState('');
  const [typing, setTyping]       = useState(false);
  const [quickReplies, setQuickReplies] = useState<string[]>(QUICK_START);
  const [unread, setUnread]       = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const navigate  = useNavigate();

  /* auto-scroll */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  /* focus input when opened */
  useEffect(() => {
    if (open) { setUnread(0); setTimeout(() => inputRef.current?.focus(), 120); }
  }, [open]);

  const addBotMessage = useCallback((text: string, action?: { label: string; payload: string }, replies?: string[]) => {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      const msg: Message = { id: uid(), from: 'bot', text, time: new Date(), action };
      setMessages(prev => [...prev, msg]);
      setQuickReplies(replies || []);
      if (!open) setUnread(n => n + 1);
    }, 650 + Math.random() * 400);
  }, [open]);

  const handleSend = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Add user message
    const userMsg: Message = { id: uid(), from: 'user', text: trimmed, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setQuickReplies([]);

    // Handle special quick replies
    if (trimmed === 'Fermer') { setOpen(false); return; }

    const query = quickReplyMap[trimmed] || trimmed;
    const intent = detectIntent(query);

    const actionBtn = intent.action === 'navigate' && intent.actionPayload
      ? { label: `Aller → ${intent.actionPayload.split('/').pop()?.replace('-', ' ') || 'page'}`, payload: intent.actionPayload }
      : undefined;

    addBotMessage(intent.response, actionBtn, intent.followUp);
  }, [addBotMessage]);

  const handleNavigate = useCallback((path: string) => {
    navigate(path);
    setOpen(false);
  }, [navigate]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend(input);
  };

  /* ── pulse ring animation ── */
  const pulseStyle: React.CSSProperties = {
    position: 'absolute', inset: '-6px', borderRadius: '50%',
    border: '2px solid #a78bfa', animation: 'pulseRing 2s infinite', opacity: .6,
  };

  return (
    <>
      <style>{`
        @keyframes pulseRing{0%{transform:scale(1);opacity:.6}70%{transform:scale(1.25);opacity:0}100%{transform:scale(1.25);opacity:0}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes botTyping{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}
        .wafa-msg{animation:fadeUp .25s ease}
        .wafa-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#a78bfa;margin:0 2px;animation:botTyping 1.2s infinite ease-in-out}
        .wafa-dot:nth-child(2){animation-delay:.2s}
        .wafa-dot:nth-child(3){animation-delay:.4s}
        .wafa-qr{background:rgba(168,85,247,.1);border:1px solid rgba(168,85,247,.3);color:#7c3aed;borderRadius:999px;padding:5px 13px;cursor:pointer;font-size:.75rem;font-weight:700;white-space:nowrap;transition:all .15s;font-family:inherit}
        .wafa-qr:hover{background:rgba(168,85,247,.2);border-color:rgba(168,85,247,.5)}
        .wafa-input:focus{outline:none}
      `}</style>

      {/* ── Floating toggle button ── */}
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999 }}>
        {!open && unread > 0 && (
          <div style={{ position: 'absolute', top: '-6px', right: '-4px', background: '#ef4444', color: '#fff', borderRadius: '999px', minWidth: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.7rem', fontWeight: 800, padding: '0 5px', zIndex: 2, boxShadow: '0 2px 6px rgba(0,0,0,.2)' }}>
            {unread}
          </div>
        )}
        {!open && <div style={pulseStyle} />}
        <button
          onClick={() => setOpen(o => !o)}
          aria-label="Assistant Wafa"
          style={{
            width: '56px', height: '56px', borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: open ? '#6d28d9' : 'linear-gradient(135deg,#7c3aed,#a855f7)',
            boxShadow: '0 6px 24px rgba(124,58,237,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.4rem', transition: 'all .22s', position: 'relative', zIndex: 1,
          }}
        >
          {open ? '✕' : '🤖'}
        </button>
      </div>

      {/* ── Chat window ── */}
      {open && (
        <div style={{
          position: 'fixed', bottom: '90px', right: '24px', zIndex: 9998,
          width: 'min(360px, calc(100vw - 32px))',
          height: 'min(520px, calc(100vh - 130px))',
          background: '#fff', borderRadius: '20px',
          boxShadow: '0 24px 60px rgba(0,0,0,.2), 0 0 0 1px rgba(0,0,0,.06)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          animation: 'fadeUp .25s ease',
          fontFamily: 'Segoe UI,system-ui,sans-serif',
        }}>

          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg,#1a0533,#2d1060,#1e3a5f)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(255,255,255,.15)', border: '2px solid rgba(255,255,255,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
              🤖
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, color: '#fff', fontSize: '.9rem' }}>Wafa</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#4ade80', animation: 'pulseRing 2s infinite' }} />
                <span style={{ fontSize: '.68rem', color: '#94a3b8' }}>Assistant Tamanar • En ligne</span>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'rgba(255,255,255,.1)', border: 'none', color: '#fff', borderRadius: '8px', width: '28px', height: '28px', cursor: 'pointer', fontSize: '.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px', background: '#f8f7ff' }}>
            {messages.map(msg => (
              <div key={msg.id} className="wafa-msg" style={{ display: 'flex', flexDirection: 'column', alignItems: msg.from === 'user' ? 'flex-end' : 'flex-start', gap: '4px' }}>
                {msg.from === 'bot' && (
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.85rem', flexShrink: 0 }}>🤖</div>
                    <div style={{ background: '#fff', borderRadius: '16px 16px 16px 4px', padding: '10px 13px', maxWidth: '260px', fontSize: '.82rem', color: '#0f172a', lineHeight: 1.55, boxShadow: '0 1px 4px rgba(0,0,0,.08)', border: '1px solid #ede9fe' }}>
                      {renderText(msg.text)}
                    </div>
                  </div>
                )}
                {msg.from === 'user' && (
                  <div style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', borderRadius: '16px 16px 4px 16px', padding: '10px 13px', maxWidth: '230px', fontSize: '.82rem', color: '#fff', lineHeight: 1.55 }}>
                    {msg.text}
                  </div>
                )}
                {/* Navigate action button */}
                {msg.from === 'bot' && msg.action && (
                  <button onClick={() => handleNavigate(msg.action!.payload)}
                    style={{ marginLeft: '32px', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', border: 'none', color: '#fff', borderRadius: '10px', padding: '6px 14px', cursor: 'pointer', fontSize: '.75rem', fontWeight: 700, boxShadow: '0 3px 10px rgba(124,58,237,.3)' }}>
                    → Aller sur la page
                  </button>
                )}
                <span style={{ fontSize: '.62rem', color: '#94a3b8', paddingLeft: msg.from === 'bot' ? '32px' : 0 }}>{fmt(msg.time)}</span>
              </div>
            ))}

            {/* Typing indicator */}
            {typing && (
              <div className="wafa-msg" style={{ display: 'flex', alignItems: 'flex-end', gap: '6px' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.85rem' }}>🤖</div>
                <div style={{ background: '#fff', borderRadius: '16px 16px 16px 4px', padding: '12px 16px', border: '1px solid #ede9fe', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
                  <span className="wafa-dot" /><span className="wafa-dot" /><span className="wafa-dot" />
                </div>
              </div>
            )}

            {/* Quick replies */}
            {!typing && quickReplies.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', paddingLeft: '32px' }}>
                {quickReplies.filter(q => q !== 'Fermer').map(q => (
                  <button key={q} className="wafa-qr" onClick={() => handleSend(q)}>{q}</button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid #f1f5f9', background: '#fff', display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
            <input
              ref={inputRef}
              className="wafa-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Posez votre question…"
              disabled={typing}
              style={{ flex: 1, border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '9px 13px', fontSize: '.82rem', color: '#0f172a', background: '#f8f7ff', fontFamily: 'inherit', transition: 'border-color .15s' }}
              onFocus={e => (e.target.style.borderColor = '#7c3aed')}
              onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
            />
            <button
              onClick={() => handleSend(input)}
              disabled={!input.trim() || typing}
              style={{ width: '38px', height: '38px', borderRadius: '12px', border: 'none', background: input.trim() && !typing ? 'linear-gradient(135deg,#7c3aed,#a855f7)' : '#e2e8f0', color: '#fff', cursor: input.trim() && !typing ? 'pointer' : 'default', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .15s' }}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
