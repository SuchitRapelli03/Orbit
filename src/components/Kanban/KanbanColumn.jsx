import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import TaskCard from './TaskCard';
import { useRealtime } from '../../../RealtimeContext';

export default function KanbanColumn({ column, tasks, onOpenDetail, onQuickAdd }) {
  const { moveTask } = useRealtime();
  const [isDragOver, setIsDragOver] = useState(false);

  const totalPoints = tasks.reduce((sum, t) => sum + (Number(t.points) || 0), 0);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    // Only clear if leaving the column element itself
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      moveTask(taskId, column.id);
    }
  };

  return (
    <div
      className={`kanban-column ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="column-header">
        <div className="column-title-group">
          <span className="column-indicator" style={{ backgroundColor: column.color }} />
          <span className="column-title">{column.title}</span>
          <span className="column-task-count">{tasks.length}</span>
        </div>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {totalPoints} pts
        </span>
      </div>

      <div className="column-card-list">
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} onOpenDetail={onOpenDetail} />
        ))}

        {tasks.length === 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem 1rem',
            color: 'var(--text-muted)',
            fontSize: '0.8rem',
            border: '1px dashed var(--border-subtle)',
            borderRadius: 'var(--radius-sm)'
          }}>
            Drop tasks here
          </div>
        )}
      </div>

      <button
        className="add-card-btn"
        onClick={() => onQuickAdd(column.id)}
        title={`Add a task to ${column.title}`}
      >
        <Plus size={14} />
        <span>Add task</span>
      </button>
    </div>
  );
}
