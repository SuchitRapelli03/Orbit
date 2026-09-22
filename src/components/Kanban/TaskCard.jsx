import React from 'react';
import {
  CheckSquare,
  MessageCircle,
  AlertCircle,
  Flame,
  ArrowUp,
  ArrowDown,
  Eye
} from 'lucide-react';
import { useRealtime } from '../../../RealtimeContext';
import Avatar from '../Common/Avatar';

export default function TaskCard({ task, onOpenDetail }) {
  const { members } = useRealtime();
  const assignee = members.find(m => m.id === task.assigneeId);

  const completedSubtasks = (task.subtasks || []).filter(s => s.completed).length;
  const totalSubtasks = (task.subtasks || []).length;
  const commentCount = (task.comments || []).length;

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('dragging');
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('dragging');
  };

  const getPriorityIcon = (p) => {
    switch (p) {
      case 'urgent': return <Flame size={12} />;
      case 'high': return <AlertCircle size={12} />;
      case 'medium': return <ArrowUp size={12} />;
      case 'low': return <ArrowDown size={12} />;
      default: return null;
    }
  };

  return (
    <div
      className="task-card"
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => onOpenDetail(task)}
      title="Click to view details or drag to another column"
    >
      {task.viewers && task.viewers.length > 0 && (
        <div className="live-viewing-tag">
          <Eye size={10} />
          <span>Live viewing</span>
        </div>
      )}

      <div className="task-card-header">
        <span className="task-key">{task.key}</span>
        <span className={`priority-badge priority-${task.priority}`}>
          {getPriorityIcon(task.priority)}
          <span>{task.priority}</span>
        </span>
      </div>

      <div className="task-title">{task.title}</div>

      {task.tags && task.tags.length > 0 && (
        <div className="task-tags">
          {task.tags.map((tag, idx) => (
            <span key={idx} className="task-tag">{tag}</span>
          ))}
        </div>
      )}

      <div className="task-footer">
        <div className="task-meta-left">
          {totalSubtasks > 0 && (
            <div className="subtask-progress" title={`Subtasks: ${completedSubtasks}/${totalSubtasks}`}>
              <CheckSquare size={13} />
              <span>{completedSubtasks}/{totalSubtasks}</span>
            </div>
          )}

          {commentCount > 0 && (
            <div className="subtask-progress" title={`Comments: ${commentCount}`}>
              <MessageCircle size={13} />
              <span>{commentCount}</span>
            </div>
          )}

          {task.points !== undefined && (
            <span className="points-pill" title="Story Points">
              {task.points} pts
            </span>
          )}
        </div>

        <Avatar member={assignee} size={24} showStatus={false} />
      </div>
    </div>
  );
}
