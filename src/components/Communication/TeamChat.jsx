import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Smile, Users, Radio, MessageSquare } from 'lucide-react';
import { useRealtime } from '../../../RealtimeContext';
import Avatar from '../Common/Avatar';

export default function TeamChat({ isOpen, onClose }) {
  const { chatMessages, sendChatMessage, members } = useRealtime();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isOpen]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendChatMessage(inputText);
    setInputText('');
  };

  const addQuickEmoji = (emoji) => {
    setInputText(prev => prev + emoji);
  };

  return (
    <aside className={`chat-drawer ${isOpen ? 'open' : ''}`}>
      <div className="chat-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <MessageSquare size={17} color="var(--accent-primary)" />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>#sprint-42-core</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className="sync-dot" style={{ width: '6px', height: '6px' }} />
              Live Team Channel
            </div>
          </div>
        </div>
        <button className="icon-btn" onClick={onClose} title="Close Chat Drawer">
          <X size={16} />
        </button>
      </div>

      <div className="chat-messages-container">
        {chatMessages.map(msg => {
          const author = members.find(m => m.id === msg.authorId);
          const isMine = msg.authorId === 'user-me';

          return (
            <div key={msg.id} className={`chat-bubble ${isMine ? 'chat-bubble-mine' : ''}`} style={{ alignSelf: isMine ? 'flex-end' : 'flex-start' }}>
              {!isMine && <Avatar member={author} size={28} showStatus={false} />}
              <div className="chat-bubble-content">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '2px' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.78rem', color: isMine ? '#c7d2fe' : 'var(--text-main)' }}>
                    {author?.name || 'Teammate'}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{msg.createdAt}</span>
                </div>
                <div style={{ fontSize: '0.82rem', lineHeight: '1.4', color: 'var(--text-main)' }}>
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Emojis */}
      <div style={{ padding: '0.35rem 1rem', display: 'flex', gap: '0.4rem', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
        {['🚀', '🔥', '✅', '👀', '💯'].map(emoji => (
          <button
            key={emoji}
            type="button"
            onClick={() => addQuickEmoji(emoji)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.9rem', padding: '2px 4px', borderRadius: '4px' }}
            title={`Add ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      <form onSubmit={handleSend} className="chat-input-area">
        <input
          type="text"
          className="form-input"
          placeholder="Message #sprint-42-core..."
          value={inputText}
          onChange={e => setInputText(e.target.value)}
        />
        <button type="submit" className="btn-primary" style={{ padding: '0.5rem 0.8rem' }} title="Send message">
          <Send size={15} />
        </button>
      </form>
    </aside>
  );
}
