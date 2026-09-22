import React from 'react';
import {
  TrendingUp,
  CheckCircle,
  Clock,
  Zap,
  Target,
  Users,
  AlertTriangle
} from 'lucide-react';
import { useRealtime } from '../../../RealtimeContext';
import Avatar from '../Common/Avatar';

export default function SprintMetrics() {
  const { tasks, columns, members } = useRealtime();

  // Aggregate metrics
  const totalPoints = tasks.reduce((sum, t) => sum + (Number(t.points) || 0), 0);
  const doneTasks = tasks.filter(t => t.columnId === 'done');
  const donePoints = doneTasks.reduce((sum, t) => sum + (Number(t.points) || 0), 0);
  const inProgressTasks = tasks.filter(t => t.columnId === 'in_progress' || t.columnId === 'in_review');
  const inProgressPoints = inProgressTasks.reduce((sum, t) => sum + (Number(t.points) || 0), 0);

  const completionPercent = totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : 0;

  return (
    <div className="analytics-container">
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
          Sprint 42 Health & Velocity
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Real-time aggregated metrics computed live from active Kanban state.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Sprint Velocity</span>
            <Zap size={16} color="var(--accent-primary)" />
          </div>
          <div className="metric-value">{donePoints} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ {totalPoints} pts</span></div>
          <div className="metric-change" style={{ color: 'var(--accent-emerald)' }}>
            <TrendingUp size={13} />
            <span>{completionPercent}% of commitment delivered</span>
          </div>
        </div>

        <div className="metric-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Completed Tasks</span>
            <CheckCircle size={16} color="var(--accent-emerald)" />
          </div>
          <div className="metric-value">{doneTasks.length} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ {tasks.length}</span></div>
          <div className="metric-change" style={{ color: 'var(--text-secondary)' }}>
            <span>{tasks.length - doneTasks.length} remaining tasks</span>
          </div>
        </div>

        <div className="metric-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Active WIP Load</span>
            <Clock size={16} color="var(--accent-amber)" />
          </div>
          <div className="metric-value">{inProgressPoints} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>pts</span></div>
          <div className="metric-change" style={{ color: inProgressPoints > 15 ? 'var(--accent-rose)' : 'var(--accent-cyan)' }}>
            <span>{inProgressTasks.length} tasks in progress or review</span>
          </div>
        </div>

        <div className="metric-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Cycle Time</span>
            <Target size={16} color="var(--accent-cyan)" />
          </div>
          <div className="metric-value">1.8 <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>days</span></div>
          <div className="metric-change" style={{ color: 'var(--accent-emerald)' }}>
            <TrendingUp size={13} />
            <span>18% faster than Sprint 41</span>
          </div>
        </div>
      </div>

      {/* Progress & Column Distribution */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Sprint Completion Trajectory</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)' }}>{completionPercent}%</span>
        </div>

        {/* Multi-segment Progress Bar */}
        <div style={{ height: '10px', background: 'var(--bg-surface-elevated)', borderRadius: '999px', overflow: 'hidden', display: 'flex' }}>
          {columns.map(col => {
            const colPts = tasks.filter(t => t.columnId === col.id).reduce((sum, t) => sum + (Number(t.points) || 0), 0);
            const width = totalPoints > 0 ? (colPts / totalPoints) * 100 : 0;
            return (
              <div
                key={col.id}
                style={{
                  width: `${width}%`,
                  backgroundColor: col.color,
                  transition: 'width 300ms ease'
                }}
                title={`${col.title}: ${colPts} pts (${Math.round(width)}%)`}
              />
            );
          })}
        </div>

        {/* Column Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem' }}>
          {columns.map(col => {
            const colTasks = tasks.filter(t => t.columnId === col.id);
            const colPts = colTasks.reduce((sum, t) => sum + (Number(t.points) || 0), 0);
            return (
              <div key={col.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: col.color }} />
                <span style={{ color: 'var(--text-secondary)' }}>{col.title}:</span>
                <span style={{ fontWeight: 600 }}>{colTasks.length} ({colPts} pts)</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Team Allocation */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Users size={16} color="var(--accent-primary)" /> Team Workload Distribution
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {members.map(member => {
            const memberTasks = tasks.filter(t => t.assigneeId === member.id);
            const memberPts = memberTasks.reduce((sum, t) => sum + (Number(t.points) || 0), 0);

            return (
              <div key={member.id} style={{ padding: '0.75rem 1rem', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Avatar member={member} size={32} />
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {member.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {memberTasks.length} tasks • {memberPts} pts
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
