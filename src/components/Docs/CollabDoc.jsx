import React, { useState } from 'react';
import { FileText, Plus, Users, Clock, Check, Sparkles } from 'lucide-react';
import { useRealtime } from '../../../RealtimeContext';
import Avatar from '../Common/Avatar';

export default function CollabDoc() {
  const { docs, updateDoc, members } = useRealtime();
  const [activeDocId, setActiveDocId] = useState(docs[0]?.id || 'doc-1');
  const [isTypingSimulated, setIsTypingSimulated] = useState(true);

  const currentDoc = docs.find(d => d.id === activeDocId) || docs[0];

  const handleTitleChange = (e) => {
    if (!currentDoc) return;
    updateDoc({
      ...currentDoc,
      title: e.target.value
    });
  };

  const handleContentChange = (e) => {
    if (!currentDoc) return;
    updateDoc({
      ...currentDoc,
      content: e.target.value
    });
  };

  const handleCreateNewDoc = () => {
    const newDoc = {
      id: `doc-${Date.now()}`,
      title: 'Untitled Agile Document',
      updatedAt: 'Just now',
      author: 'You',
      content: `# New Agile Spec / Notes\n\nWrite project specifications, architecture notes, and sprint goals here.`
    };
    updateDoc(newDoc);
    setActiveDocId(newDoc.id);
  };

  const wordCount = (currentDoc?.content || '').split(/\s+/).filter(Boolean).length;

  return (
    <div className="docs-view-container">
      {/* Docs Sidebar */}
      <aside className="docs-sidebar">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
            Sprint Docs
          </span>
          <button
            className="icon-btn"
            style={{ width: '26px', height: '26px' }}
            onClick={handleCreateNewDoc}
            title="Create New Document"
          >
            <Plus size={14} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {docs.map(doc => {
            const isActive = doc.id === currentDoc?.id;
            return (
              <button
                key={doc.id}
                onClick={() => setActiveDocId(doc.id)}
                className={`nav-item-btn ${isActive ? 'active' : ''}`}
                style={{ fontSize: '0.82rem', padding: '0.5rem 0.65rem' }}
              >
                <FileText size={16} />
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>
                  {doc.title}
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 'auto', padding: '0.75rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 600, marginBottom: '4px' }}>
            <Sparkles size={13} />
            <span>Multi-User Ready</span>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Edits made in any browser tab synchronize immediately across all connected clients.
          </p>
        </div>
      </aside>

      {/* Main Doc Editor */}
      <main className="docs-editor-area">
        {currentDoc ? (
          <>
            <div className="doc-meta-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="sync-dot" />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Auto-saved {currentDoc.updatedAt}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>• {wordCount} words</span>
              </div>

              {/* Active Collaborators on this Doc */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Editing now:</span>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar member={members[1]} size={24} showStatus={false} />
                  <Avatar member={members[2]} size={24} showStatus={false} />
                </div>
              </div>
            </div>

            {/* Document Title */}
            <input
              type="text"
              className="doc-title-input"
              value={currentDoc.title}
              onChange={handleTitleChange}
              placeholder="Document Title"
            />

            {/* Simulated Live Teammate Typing Badge */}
            {isTypingSimulated && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="simulated-cursor">
                  <span>● Sarah Chen is reviewing line 14</span>
                </span>
              </div>
            )}

            {/* Markdown Document Content */}
            <textarea
              className="doc-textarea"
              value={currentDoc.content}
              onChange={handleContentChange}
              placeholder="Start drafting collaboratively..."
            />
          </>
        ) : (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '4rem' }}>
            No document selected.
          </div>
        )}
      </main>
    </div>
  );
}
