import React from 'react';
import {
  Search,
  Plus,
  Radio,
  MessageSquare,
  Users,
  Activity,
  Bell
} from 'lucide-react';
import { useRealtime } from '../../../RealtimeContext';
import Avatar from '../Common/Avatar';

export default function Topbar({
  searchQuery,
  setSearchQuery,
  onOpenNewTaskModal,
  isChatOpen,
  setIsChatOpen,
  isNotificationsOpen,
  setIsNotificationsOpen
}) {
  const { members, activeClients, syncLatency, unreadNotifications } = useRealtime();

  return (
    <header className="app-topbar">
      <div className="topbar-left">
        <div className="sprint-selector" title="Active Agile Sprint">
          <Activity size={15} color="var(--accent-primary)" />
          <span>Sprint 42 — Core Engine</span>
          <span className="sprint-status-tag">Active</span>
        </div>

        <div className="search-wrapper">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search tasks, keys, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="search-shortcut">⌘K</span>
        </div>
      </div>

      <div className="topbar-right">
        {/* Real-Time Live Sync Status Pill */}
        <div
          className="sync-status-pill"
          title={`State is synchronized live across all tabs. ${activeClients} client(s) connected. Ping: ${syncLatency}ms`}
        >
          <span className="sync-dot" />
          <span>
            {activeClients > 1 ? `${activeClients} Tabs Synced` : 'Real-Time Ready'}
          </span>
          <span style={{ opacity: 0.6, fontSize: '0.7rem' }}>• {syncLatency}ms</span>
        </div>

        {/* Teammate Presence Stack */}
        <div className="presence-stack" title="Active Teammates in Workspace">
          {members.map(member => (
            <Avatar key={member.id} member={member} size={28} />
          ))}
        </div>

        {/* Quick New Task Button */}
        <button
          className="btn-primary"
          onClick={onOpenNewTaskModal}
          id="new-task-btn"
          title="Create a new task in Sprint 42"
        >
          <Plus size={16} />
          <span>New Task</span>
        </button>

        <button
          className={`icon-btn notification-trigger ${isNotificationsOpen ? 'active' : ''}`}
          onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
          title="Open notifications"
        >
          <Bell size={17} />
          {unreadNotifications > 0 && <span className="notification-count">{unreadNotifications > 9 ? '9+' : unreadNotifications}</span>}
        </button>

        {/* Chat Toggle Button */}
        <button
          className="icon-btn"
          onClick={() => setIsChatOpen(!isChatOpen)}
          title="Toggle Team Chat"
          style={isChatOpen ? { background: 'var(--accent-primary)', color: '#fff', borderColor: 'var(--accent-primary)' } : {}}
        >
          <MessageSquare size={17} />
        </button>
      </div>
    </header>
  );
}
