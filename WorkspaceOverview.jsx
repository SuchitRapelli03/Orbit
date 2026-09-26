import React from 'react';
import { ArrowUpRight, CheckCircle2, CircleDashed, FileText, MessageSquare, Plus, Users } from 'lucide-react';
import { useRealtime } from './RealtimeContext';

export default function WorkspaceOverview({ onOpenBoard, onOpenNewTask, onOpenChat }) {
  const { tasks, columns, members, docs, activityFeed } = useRealtime();
  const completedTasks = tasks.filter(task => task.columnId === 'done');
  const points = tasks.reduce((total, task) => total + (Number(task.points) || 0), 0);
  const completedPoints = completedTasks.reduce((total, task) => total + (Number(task.points) || 0), 0);
  const progress = points ? Math.round((completedPoints / points) * 100) : 0;

  return (
    <section className="workspace-overview">
      <div className="workspace-hero">
        <div>
          <div className="panel-eyebrow">Orbit workspace / Sprint 42</div>
          <h1>Build clearly. Ship together.</h1>
          <p>One focused view for the team building Orbit's real-time collaboration layer.</p>
        </div>
        <button className="btn-primary" onClick={onOpenNewTask}>
          <Plus size={16} /> New task
        </button>
      </div>

      <div className="overview-stat-grid">
        <OverviewStat icon={CircleDashed} label="Sprint progress" value={`${progress}%`} detail={`${completedPoints} of ${points} points complete`} />
        <OverviewStat icon={CheckCircle2} label="Completed cards" value={completedTasks.length} detail={`Across ${columns.length} workflow lists`} />
        <OverviewStat icon={Users} label="Active collaborators" value={members.length} detail="Live workspace members" />
        <OverviewStat icon={FileText} label="Shared documents" value={docs.length} detail="Notes and sprint decisions" />
      </div>

      <div className="overview-grid">
        <div className="overview-section">
          <div className="section-heading">
            <div>
              <div className="panel-eyebrow">Jump back in</div>
              <h2>Workspace surfaces</h2>
            </div>
          </div>
          <div className="surface-list">
            <button className="surface-row" onClick={onOpenBoard}>
              <span className="surface-icon surface-icon-indigo"><CircleDashed size={17} /></span>
              <span><strong>Sprint 42 board</strong><small>{tasks.length} cards in flight</small></span>
              <ArrowUpRight size={16} />
            </button>
            <button className="surface-row" onClick={onOpenChat}>
              <span className="surface-icon surface-icon-cyan"><MessageSquare size={17} /></span>
              <span><strong>Team channel</strong><small>Coordinate in #sprint-42-core</small></span>
              <ArrowUpRight size={16} />
            </button>
            <button className="surface-row" onClick={() => document.querySelector('[data-view="docs"]')?.click()}>
              <span className="surface-icon surface-icon-amber"><FileText size={17} /></span>
              <span><strong>Shared docs</strong><small>{docs.length} collaborative documents</small></span>
              <ArrowUpRight size={16} />
            </button>
          </div>
        </div>

        <div className="overview-section">
          <div className="section-heading">
            <div>
              <div className="panel-eyebrow">Live stream</div>
              <h2>Recent activity</h2>
            </div>
          </div>
          <div className="activity-list">
            {activityFeed.slice(0, 5).map(activity => (
              <div className="activity-row" key={activity.id}>
                <span className="activity-dot" />
                <span><strong>{activity.user}</strong> {activity.action} <b>{activity.target}</b><small>{activity.time}</small></span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function OverviewStat({ icon: Icon, label, value, detail }) {
  return (
    <div className="overview-stat">
      <div className="stat-icon"><Icon size={16} /></div>
      <span className="stat-label">{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}
