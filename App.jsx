import React, { useState, useEffect } from 'react';
import { RealtimeProvider } from './RealtimeContext';
import Sidebar from './src/components/Navigation/Sidebar';
import Topbar from './src/components/Navigation/Topbar';
import KanbanBoard from './src/components/Kanban/KanbanBoard';
import CollabDoc from './src/components/Docs/CollabDoc';
import TeamChat from './src/components/Communication/TeamChat';
import SprintMetrics from './src/components/Analytics/SprintMetrics';
import TaskModal from './TaskModal';
import WorkspaceOverview from './WorkspaceOverview';
import NotificationCenter from './src/components/Notifications/NotificationCenter';

function OrbitWorkspace() {
  const [activeView, setActiveView] = useState('workspace'); // 'workspace' | 'kanban' | 'docs' | 'analytics'
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Modal State
  const [selectedTask, setSelectedTask] = useState(null);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTaskInitialColumn, setNewTaskInitialColumn] = useState('todo');

  // Open modal to view/edit existing task
  const handleOpenDetail = (task) => {
    setSelectedTask(task);
  };

  // Open modal to create new task
  const handleOpenNewTaskModal = (colId = 'todo') => {
    setNewTaskInitialColumn(colId);
    setIsNewTaskModalOpen(true);
  };

  // Keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('.search-input');
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="app-container">
      {/* Cosmic Nebulae Glow Orbs */}
      <div className="cosmic-atmosphere">
        <div className="cosmic-orb-1" />
        <div className="cosmic-orb-2" />
      </div>

      {/* Main Sidebar */}
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        isChatOpen={isChatOpen}
        setIsChatOpen={setIsChatOpen}
      />

      {/* Main Application Area */}
      <div className="app-main">
        <Topbar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenNewTaskModal={() => handleOpenNewTaskModal('todo')}
          isChatOpen={isChatOpen}
          setIsChatOpen={setIsChatOpen}
          isNotificationsOpen={isNotificationsOpen}
          setIsNotificationsOpen={setIsNotificationsOpen}
        />

        <div className="view-content">
            {activeView === 'workspace' && (
              <WorkspaceOverview
                onOpenBoard={() => setActiveView('kanban')}
                onOpenNewTask={() => handleOpenNewTaskModal('todo')}
                onOpenChat={() => setIsChatOpen(true)}
              />
            )}
          {activeView === 'kanban' && (
            <KanbanBoard
              searchQuery={searchQuery}
              onOpenDetail={handleOpenDetail}
              onOpenNewTaskModal={handleOpenNewTaskModal}
            />
          )}

          {activeView === 'docs' && (
            <CollabDoc />
          )}

          {activeView === 'analytics' && (
            <SprintMetrics />
          )}
        </div>
      </div>

      <NotificationCenter
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      {/* Right Team Chat Drawer */}
      <TeamChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />

      {/* Task Detail Modal (Viewing & Editing) */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          isNew={false}
          onClose={() => setSelectedTask(null)}
        />
      )}

      {/* New Task Creation Modal */}
      {isNewTaskModalOpen && (
        <TaskModal
          isNew={true}
          initialColumn={newTaskInitialColumn}
          onClose={() => setIsNewTaskModalOpen(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <RealtimeProvider>
      <OrbitWorkspace />
    </RealtimeProvider>
  );
}
