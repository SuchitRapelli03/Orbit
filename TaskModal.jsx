import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  Send,
  Plus,
  Clock,
  CheckCircle2,
  Tag,
  Users
} from 'lucide-react';
import { useRealtime } from './RealtimeContext';
import Avatar from './src/components/Common/Avatar';

export default function TaskModal({ task, isNew = false, initialColumn = 'todo', onClose }) {
  const { members, columns, updateTask, createTask, deleteTask, addTaskComment } = useRealtime();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    columnId: initialColumn,
    priority: 'medium',
    points: 3,
    assigneeId: 'user-me',
    tags: ['Frontend'],
    subtasks: []
  });

  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (task && !isNew) {
      setFormData({
        ...task,
        subtasks: task.subtasks || [],
        tags: task.tags || [],
        comments: task.comments || []
      });
    } else if (isNew) {
      setFormData(prev => ({ ...prev, columnId: initialColumn }));
    }
  }, [task, isNew, initialColumn]);

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    if (isNew) {
      createTask(formData);
    } else {
      updateTask(formData);
    }
    onClose();
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete ${task.key}?`)) {
      deleteTask(task.id);
      onClose();
    }
  };

  // Subtask management
  const toggleSubtask = (subtaskId) => {
    const updatedSubtasks = formData.subtasks.map(st =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    const updated = { ...formData, subtasks: updatedSubtasks };
    setFormData(updated);
    if (!isNew) updateTask(updated);
  };

  const addSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const newSt = {
      id: `st-${Date.now()}`,
      title: newSubtaskTitle.trim(),
      completed: false
    };
    const updated = { ...formData, subtasks: [...formData.subtasks, newSt] };
    setFormData(updated);
    setNewSubtaskTitle('');
    if (!isNew) updateTask(updated);
  };

  // Tag management
  const addTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tagToRemove)
    }));
  };

  // Comment management
  const addComment = () => {
    if (!newCommentText.trim() || isNew) return;
    const newComment = {
      id: `c-${Date.now()}`,
      authorId: 'user-me',
      text: newCommentText.trim(),
      createdAt: 'Just now'
    };
    setFormData(prev => ({
      ...prev,
      comments: [...(prev.comments || []), newComment]
    }));
    setNewCommentText('');
    addTaskComment(task.id, newComment);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-primary)', fontSize: '1rem' }}>
              {isNew ? 'Create Agile Task' : task?.key}
            </span>
            {!isNew && (
              <span className={`priority-badge priority-${formData.priority}`}>
                {formData.priority}
              </span>
            )}
          </div>
          <button className="icon-btn" onClick={onClose} title="Close Modal">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Title */}
          <div className="form-group">
            <label className="form-label">Task Title</label>
            <input
              type="text"
              className="form-input"
              style={{ fontSize: '1.05rem', fontWeight: 600 }}
              placeholder="e.g. Implement WebSocket reconnection retry backoff"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              autoFocus={isNew}
            />
          </div>

          {/* Core Properties Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Column / Status</label>
              <select
                className="form-select"
                value={formData.columnId}
                onChange={e => setFormData({ ...formData, columnId: e.target.value })}
              >
                {columns.map(col => (
                  <option key={col.id} value={col.id}>{col.title}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                className="form-select"
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Story Points</label>
              <input
                type="number"
                className="form-input"
                min="1"
                max="21"
                value={formData.points}
                onChange={e => setFormData({ ...formData, points: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Assignee</label>
              <select
                className="form-select"
                value={formData.assigneeId}
                onChange={e => setFormData({ ...formData, assigneeId: e.target.value })}
              >
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Description & Acceptance Criteria</label>
            <textarea
              className="form-textarea"
              rows={4}
              placeholder="Detail technical requirements, expected behavior, and constraints..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Tags */}
          <div className="form-group">
            <label className="form-label">Tags & Labels (Press Enter)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
              {formData.tags.map((tag, idx) => (
                <span key={idx} className="task-tag" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {tag}
                  <X size={10} style={{ cursor: 'pointer' }} onClick={() => removeTag(tag)} />
                </span>
              ))}
            </div>
            <input
              type="text"
              className="form-input"
              placeholder="Type tag and press enter..."
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={addTag}
            />
          </div>

          {/* Subtasks Checklist */}
          <div className="form-group">
            <label className="form-label">Subtasks Checklist ({formData.subtasks.filter(s => s.completed).length}/{formData.subtasks.length})</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
              {formData.subtasks.map(st => (
                <div key={st.id} className={`subtask-item ${st.completed ? 'completed' : ''}`}>
                  <input
                    type="checkbox"
                    className="subtask-checkbox"
                    checked={st.completed}
                    onChange={() => toggleSubtask(st.id)}
                  />
                  <span>{st.title}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Add subtask item..."
                value={newSubtaskTitle}
                onChange={e => setNewSubtaskTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSubtask()}
              />
              <button type="button" className="btn-secondary" onClick={addSubtask}>
                <Plus size={14} /> Add
              </button>
            </div>
          </div>

          {/* Comments Section (only for existing tasks) */}
          {!isNew && (
            <div className="comments-section">
              <label className="form-label">Team Activity & Comments ({formData.comments?.length || 0})</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                {(formData.comments || []).map(comment => {
                  const author = members.find(m => m.id === comment.authorId);
                  return (
                    <div key={comment.id} className="comment-card">
                      <Avatar member={author} size={28} showStatus={false} />
                      <div style={{ flex: 1 }}>
                        <div>
                          <span className="comment-author">{author?.name || 'Teammate'}</span>
                          <span className="comment-time">{comment.createdAt}</span>
                        </div>
                        <div className="comment-text">{comment.text}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Write a comment..."
                  value={newCommentText}
                  onChange={e => setNewCommentText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addComment()}
                />
                <button type="button" className="btn-primary" onClick={addComment}>
                  <Send size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          {!isNew && (
            <button
              type="button"
              className="btn-secondary"
              style={{ marginRight: 'auto', color: 'var(--accent-rose)', borderColor: 'rgba(244, 63, 94, 0.2)' }}
              onClick={handleDelete}
            >
              <Trash2 size={14} /> Delete
            </button>
          )}
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={handleSave}>
            {isNew ? 'Create Task' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
