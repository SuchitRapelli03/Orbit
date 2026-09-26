import React, { useState } from 'react';
import { Filter, SlidersHorizontal, Activity, Layers } from 'lucide-react';
import KanbanColumn from './KanbanColumn';
import { useRealtime } from '../../../RealtimeContext';
import confetti from 'canvas-confetti';

export default function KanbanBoard({ searchQuery, onOpenDetail, onOpenNewTaskModal }) {
  const { tasks, columns, activityFeed } = useRealtime();
  const [filterMode, setFilterMode] = useState('all');

  // Filter tasks based on searchQuery and active filter pill
  const filteredTasks = tasks.filter(task => {
    // Search query match
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchKey = task.key.toLowerCase().includes(q);
      const matchTags = (task.tags || []).some(t => t.toLowerCase().includes(q));
      if (!matchTitle && !matchKey && !matchTags) return false;
    }

    // Filter pill
    if (filterMode === 'my_tasks') {
      return task.assigneeId === 'user-me';
    }
    if (filterMode === 'urgent') {
      return task.priority === 'urgent' || task.priority === 'high';
    }
    if (filterMode === 'core') {
      return (task.tags || []).some(t => ['Architecture', 'Core', 'Real-Time'].includes(t));
    }
    return true;
  });

  const handleQuickAdd = (columnId) => {
    onOpenNewTaskModal(columnId);
  };

  return (
    <div className="kanban-view-container">
      {/* Board Top Filter Toolbar */}
      <div className="board-toolbar">
        <div className="toolbar-filters">
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: '4px' }}>
            <Filter size={14} /> Filters:
          </span>
          <button
            className={`filter-pill ${filterMode === 'all' ? 'active' : ''}`}
            onClick={() => setFilterMode('all')}
          >
            All Tasks ({tasks.length})
          </button>
          <button
            className={`filter-pill ${filterMode === 'my_tasks' ? 'active' : ''}`}
            onClick={() => setFilterMode('my_tasks')}
          >
            My Assigned
          </button>
          <button
            className={`filter-pill ${filterMode === 'urgent' ? 'active' : ''}`}
            onClick={() => setFilterMode('urgent')}
          >
            Urgent / High
          </button>
          <button
            className={`filter-pill ${filterMode === 'core' ? 'active' : ''}`}
            onClick={() => setFilterMode('core')}
          >
            Core & Architecture
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            className="btn-secondary"
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
            onClick={() => {
              confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.7 }
              });
            }}
            title="Celebrate Sprint Milestone"
          >
            🎉 Celebrate Sprint
          </button>
        </div>
      </div>

      {/* Columns Scroll Area */}
      <div className="board-columns-scroll">
        {columns.map(column => {
          const colTasks = filteredTasks.filter(t => t.columnId === column.id);
          return (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={colTasks}
              onOpenDetail={onOpenDetail}
              onQuickAdd={handleQuickAdd}
            />
          );
        })}
      </div>

      {/* Live Synchronized Activity Bar */}
      {activityFeed.length > 0 && (
        <div
          style={{
            marginTop: '0.75rem',
            padding: '0.5rem 1rem',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.78rem',
            color: 'var(--text-secondary)'
          }}
        >
          <Activity size={14} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Live Sync Feed:</span>
          <span style={{ color: 'var(--accent-cyan)' }}>{activityFeed[0].user}</span>
          <span>{activityFeed[0].action}</span>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)', fontWeight: 600 }}>
            {activityFeed[0].target}
          </span>
          <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {activityFeed[0].time}
          </span>
        </div>
      )}
    </div>
  );
}
