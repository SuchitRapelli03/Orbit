import React from 'react';
import {
  Kanban,
  LayoutDashboard,
  FileText,
  BarChart3,
  MessageSquare,
  Sparkles,
  RotateCcw,
  Orbit as OrbitIcon,
  ChevronLeft,
  ChevronRight,
  Zap
} from 'lucide-react';
import { useRealtime } from '../../../RealtimeContext';
import Avatar from '../Common/Avatar';

export default function Sidebar({
  activeView,
  setActiveView,
  collapsed,
  setCollapsed,
  isChatOpen,
  setIsChatOpen
}) {
  const { members, tasks, simulateRemoteActivity, resetToSeed } = useRealtime();
  const currentUser = members.find(m => m.id === 'user-me') || members[0];

  const navItems = [
    { id: 'workspace', label: 'Workspace Home', icon: LayoutDashboard },
    { id: 'kanban', label: 'Kanban Board', icon: Kanban, count: tasks.length },
    { id: 'docs', label: 'Collaborative Docs', icon: FileText, count: 2 },
    { id: 'analytics', label: 'Sprint Analytics', icon: BarChart3 }
  ];

  return (
    <aside className={`app-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <a href="#orbit" className="brand-logo" title="Orbit Workspace">
          <div className="brand-icon-wrapper">
            <OrbitIcon size={18} />
          </div>
          {!collapsed && <span>Orbit</span>}
        </a>
        <button
          className="sidebar-collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <div className="sidebar-content">
        <div>
          {!collapsed && <div className="sidebar-section-title">Workspaces</div>}
          <ul className="nav-menu">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <li key={item.id}>
                  <button
                    className={`nav-item-btn ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveView(item.id)}
                    data-view={item.id}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon size={18} />
                    {!collapsed && (
                      <>
                        <span>{item.label}</span>
                        {item.count !== undefined && (
                          <span className="badge-count">{item.count}</span>
                        )}
                      </>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          {!collapsed && <div className="sidebar-section-title">Collaboration</div>}
          <ul className="nav-menu">
            <li>
              <button
                className={`nav-item-btn ${isChatOpen ? 'active' : ''}`}
                onClick={() => setIsChatOpen(!isChatOpen)}
                title="Team Chat Channel"
              >
                <MessageSquare size={18} />
                {!collapsed && (
                  <>
                    <span>Team Chat</span>
                    <span className="badge-count" style={{ background: 'var(--accent-primary)', color: '#fff' }}>
                      Live
                    </span>
                  </>
                )}
              </button>
            </li>
          </ul>
        </div>

        {!collapsed && (
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div className="sidebar-section-title">Real-Time Demos</div>
            <button
              className="btn-secondary"
              style={{ width: '100%', fontSize: '0.78rem', justifyContent: 'center' }}
              onClick={simulateRemoteActivity}
              title="Simulate incoming real-time activity from a remote teammate"
            >
              <Zap size={14} color="var(--accent-amber)" />
              <span>Simulate Live Event</span>
            </button>
            <button
              className="btn-secondary"
              style={{ width: '100%', fontSize: '0.75rem', justifyContent: 'center', color: 'var(--text-muted)' }}
              onClick={() => {
                if (confirm('Reset workspace data to initial seed?')) {
                  resetToSeed();
                }
              }}
              title="Reset data"
            >
              <RotateCcw size={12} />
              <span>Reset Mock Data</span>
            </button>
          </div>
        )}
      </div>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Avatar member={currentUser} size={32} />
          {!collapsed && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {currentUser.name}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {currentUser.role}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
