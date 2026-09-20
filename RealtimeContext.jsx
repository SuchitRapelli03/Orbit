import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  INITIAL_MEMBERS,
  KANBAN_COLUMNS,
  INITIAL_TASKS,
  INITIAL_DOCS,
  INITIAL_CHAT
} from './src/utils/seedData';

const RealtimeContext = createContext(null);

const STORAGE_KEYS = {
  TASKS: 'orbit_tasks_v2',
  DOCS: 'orbit_docs_v2',
  CHAT: 'orbit_chat_v2',
  NOTIFICATIONS: 'orbit_notifications_v1'
};

export function RealtimeProvider({ children }) {
  // Session ID for this specific tab/window
  const tabIdRef = useRef(`tab_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`);
  const channelRef = useRef(null);

  // Core State
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
      return saved ? JSON.parse(saved) : INITIAL_TASKS;
    } catch {
      return INITIAL_TASKS;
    }
  });

  const [docs, setDocs] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DOCS);
      return saved ? JSON.parse(saved) : INITIAL_DOCS;
    } catch {
      return INITIAL_DOCS;
    }
  });

  const [chatMessages, setChatMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CHAT);
      return saved ? JSON.parse(saved) : INITIAL_CHAT;
    } catch {
      return INITIAL_CHAT;
    }
  });

  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [members, setMembers] = useState(INITIAL_MEMBERS);
  const [activeClients, setActiveClients] = useState(1);
  const [syncLatency, setSyncLatency] = useState(8);
  const [activityFeed, setActivityFeed] = useState([
    {
      id: 'act-1',
      user: 'Sarah Chen',
      action: 'updated',
      target: 'ORB-103 Collaborative Editor',
      time: '2m ago'
    },
    {
      id: 'act-2',
      user: 'Alex Rivera',
      action: 'completed',
      target: 'ORB-101 BroadcastChannel State Sync',
      time: '6m ago'
    }
  ]);

  // Persist local changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch (e) {
      console.warn('Storage write failed', e);
    }
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DOCS, JSON.stringify(docs));
    } catch (e) {
      console.warn('Storage write failed', e);
    }
  }, [docs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CHAT, JSON.stringify(chatMessages));
    } catch (e) {
      console.warn('Storage write failed', e);
    }
  }, [chatMessages]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    } catch (e) {
      console.warn('Storage write failed', e);
    }
  }, [notifications]);

  const addNotification = useCallback((notification) => {
    setNotifications(prev => [
      {
        id: `notification-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: Date.now(),
        read: false,
        ...notification
      },
      ...prev
    ].slice(0, 30));
  }, []);

  // Broadcast Helper
  const broadcastEvent = useCallback((type, payload) => {
    if (channelRef.current) {
      channelRef.current.postMessage({
        type,
        payload,
        senderTabId: tabIdRef.current,
        timestamp: Date.now()
      });
    }
  }, []);

  // Real-time Event Receiver
  useEffect(() => {
    let channel;
    const clientHeartbeats = new Map();

    try {
      channel = new BroadcastChannel('orbit_realtime_bus');
      channelRef.current = channel;

      channel.onmessage = (event) => {
        const { type, payload, senderTabId, timestamp } = event.data || {};
        if (senderTabId === tabIdRef.current) return; // Skip own messages

        // Compute simulated latency
        if (timestamp) {
          const delta = Math.max(1, Date.now() - timestamp);
          setSyncLatency(delta);
        }

        switch (type) {
          case 'TASK_MOVED': {
            setTasks(prev => {
              return prev.map(t => (t.id === payload.taskId ? { ...t, columnId: payload.toColumn } : t));
            });
            setActivityFeed(prev => [
              {
                id: `act_${Date.now()}`,
                user: payload.userName || 'Teammate',
                action: `moved to ${payload.toColumn.replace('_', ' ')}`,
                target: payload.taskKey,
                time: 'Just now'
              },
              ...prev.slice(0, 15)
            ]);
            addNotification({
              type: 'movement',
              title: `${payload.userName || 'Teammate'} moved a task`,
              message: `${payload.taskKey} moved to ${payload.toColumn.replace('_', ' ')}`
            });
            break;
          }

          case 'TASK_UPDATED': {
            setTasks(prev => prev.map(t => (t.id === payload.id ? payload : t)));
            break;
          }

          case 'TASK_CREATED': {
            setTasks(prev => [payload, ...prev]);
            setActivityFeed(prev => [
              {
                id: `act_${Date.now()}`,
                user: payload.creatorName || 'Teammate',
                action: 'created task',
                target: payload.key,
                time: 'Just now'
              },
              ...prev.slice(0, 15)
            ]);
            addNotification({
              type: 'task',
              title: `${payload.creatorName || 'Teammate'} created a task`,
              message: `${payload.key} · ${payload.title}`
            });
            break;
          }

          case 'TASK_DELETED': {
            setTasks(prev => prev.filter(t => t.id !== payload.taskId));
            break;
          }

          case 'COMMENT_CREATED': {
            setTasks(prev => prev.map(task => {
              if (task.id !== payload.taskId) return task;
              const comments = task.comments || [];
              if (comments.some(comment => comment.id === payload.comment.id)) return task;
              return { ...task, comments: [...comments, payload.comment] };
            }));
            addNotification({
              type: 'comment',
              title: 'New task comment',
              message: `${payload.comment.text.slice(0, 72)}${payload.comment.text.length > 72 ? '...' : ''}`
            });
            break;
          }

          case 'CHAT_MESSAGE': {
            setChatMessages(prev => [...prev, payload]);
            addNotification({
              type: 'chat',
              title: 'New team message',
              message: payload.text
            });
            break;
          }

          case 'DOC_UPDATED': {
            setDocs(prev => prev.map(d => (d.id === payload.id ? payload : d)));
            break;
          }

          case 'HEARTBEAT': {
            clientHeartbeats.set(senderTabId, Date.now());
            // Clean up stale clients (> 8s)
            const now = Date.now();
            let count = 1; // self
            clientHeartbeats.forEach((lastSeen, id) => {
              if (now - lastSeen < 8000) count++;
              else clientHeartbeats.delete(id);
            });
            setActiveClients(count);
            break;
          }

          case 'CLIENT_LEAVE': {
            clientHeartbeats.delete(senderTabId);
            setActiveClients(Math.max(1, clientHeartbeats.size + 1));
            break;
          }

          default:
            break;
        }
      };

      // Announce presence immediately and every 3 seconds
      const pingInterval = setInterval(() => {
        channel.postMessage({
          type: 'HEARTBEAT',
          senderTabId: tabIdRef.current,
          timestamp: Date.now()
        });
      }, 3000);

      channel.postMessage({
        type: 'HEARTBEAT',
        senderTabId: tabIdRef.current,
        timestamp: Date.now()
      });

      const handleBeforeUnload = () => {
        channel.postMessage({
          type: 'CLIENT_LEAVE',
          senderTabId: tabIdRef.current
        });
      };
      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        clearInterval(pingInterval);
        window.removeEventListener('beforeunload', handleBeforeUnload);
        if (channel) {
          channel.close();
        }
      };
    } catch (err) {
      console.warn('BroadcastChannel not supported in this environment', err);
    }
  }, [addNotification]);

  // Action: Move Task across columns
  const moveTask = useCallback((taskId, toColumn) => {
    setTasks(prev => {
      const target = prev.find(t => t.id === taskId);
      if (!target || target.columnId === toColumn) return prev;

      const updated = prev.map(t => (t.id === taskId ? { ...t, columnId: toColumn } : t));

      // Broadcast to other tabs
      broadcastEvent('TASK_MOVED', {
        taskId,
        taskKey: target.key,
        toColumn,
        userName: 'You'
      });

      // Local activity feed
      setActivityFeed(feed => [
        {
          id: `act_${Date.now()}`,
          user: 'You',
          action: `moved to ${toColumn.replace('_', ' ')}`,
          target: target.key,
          time: 'Just now'
        },
        ...feed.slice(0, 15)
      ]);

      return updated;
    });
  }, [broadcastEvent]);

  // Action: Create Task
  const createTask = useCallback((taskData) => {
    const nextIndex = tasks.length + 101;
    const newTask = {
      id: `task-${Date.now()}`,
      key: `ORB-${nextIndex}`,
      title: taskData.title || 'Untitled Task',
      description: taskData.description || '',
      columnId: taskData.columnId || 'todo',
      priority: taskData.priority || 'medium',
      points: Number(taskData.points) || 3,
      tags: taskData.tags || ['Agile'],
      assigneeId: taskData.assigneeId || 'user-me',
      subtasks: taskData.subtasks || [],
      comments: [],
      viewers: [],
      createdAt: new Date().toISOString()
    };

    setTasks(prev => [newTask, ...prev]);
    addNotification({
      type: 'task',
      title: 'Task created',
      message: `${newTask.key} · ${newTask.title}`
    });
    broadcastEvent('TASK_CREATED', newTask);
    return newTask;
  }, [tasks.length, broadcastEvent, addNotification]);

  // Action: Update Task
  const updateTask = useCallback((updatedTask) => {
    setTasks(prev => prev.map(t => (t.id === updatedTask.id ? updatedTask : t)));
    broadcastEvent('TASK_UPDATED', updatedTask);
  }, [broadcastEvent]);

  // Action: Delete Task
  const deleteTask = useCallback((taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    broadcastEvent('TASK_DELETED', { taskId });
  }, [broadcastEvent]);

  // Action: Add a comment to a task
  const addTaskComment = useCallback((taskId, comment) => {
    setTasks(prev => prev.map(task => {
      if (task.id !== taskId) return task;
      return { ...task, comments: [...(task.comments || []), comment] };
    }));
    addNotification({
      type: 'comment',
      title: 'Comment added',
      message: comment.text
    });
    broadcastEvent('COMMENT_CREATED', { taskId, comment });
  }, [broadcastEvent, addNotification]);

  // Action: Update Collaborative Document
  const updateDoc = useCallback((updatedDoc) => {
    const withTimestamp = { ...updatedDoc, updatedAt: 'Just now' };
    setDocs(prev => prev.map(d => (d.id === updatedDoc.id ? withTimestamp : d)));
    broadcastEvent('DOC_UPDATED', withTimestamp);
  }, [broadcastEvent]);

  // Action: Send Team Chat Message
  const sendChatMessage = useCallback((text) => {
    if (!text.trim()) return;
    const newMsg = {
      id: `msg-${Date.now()}`,
      authorId: 'user-me',
      text: text.trim(),
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, newMsg]);
    broadcastEvent('CHAT_MESSAGE', newMsg);
  }, [broadcastEvent]);

  // Action: Simulate remote teammate action
  const simulateRemoteActivity = useCallback(() => {
    const remoteMembers = members.filter(m => m.id !== 'user-me');
    const randomMember = remoteMembers[Math.floor(Math.random() * remoteMembers.length)];
    const columns = ['todo', 'in_progress', 'in_review', 'done'];
    const randomCol = columns[Math.floor(Math.random() * columns.length)];
    const randomTask = tasks[Math.floor(Math.random() * tasks.length)];

    if (!randomTask) return;

    // Simulate moving a card
    setTasks(prev =>
      prev.map(t => (t.id === randomTask.id ? { ...t, columnId: randomCol } : t))
    );

    const eventPayload = {
      taskId: randomTask.id,
      taskKey: randomTask.key,
      toColumn: randomCol,
      userName: randomMember.name
    };

    broadcastEvent('TASK_MOVED', eventPayload);

    setActivityFeed(prev => [
      {
        id: `act_${Date.now()}`,
        user: randomMember.name,
        action: `moved to ${randomCol.replace('_', ' ')}`,
        target: randomTask.key,
        time: 'Just now'
      },
      ...prev.slice(0, 15)
    ]);
  }, [members, tasks, broadcastEvent]);

  // Reset to initial seed
  const resetToSeed = useCallback(() => {
    setTasks(INITIAL_TASKS);
    setDocs(INITIAL_DOCS);
    setChatMessages(INITIAL_CHAT);
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.DOCS);
    localStorage.removeItem(STORAGE_KEYS.CHAT);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    broadcastEvent('TASK_UPDATED', null); // Trigger reload
    window.location.reload();
  }, [broadcastEvent]);

  const value = {
    tasks,
    columns: KANBAN_COLUMNS,
    members,
    docs,
    chatMessages,
    activeClients,
    syncLatency,
    activityFeed,
    notifications,
    unreadNotifications: notifications.filter(notification => !notification.read).length,
    tabId: tabIdRef.current,
    moveTask,
    createTask,
    updateTask,
    deleteTask,
    addTaskComment,
    markNotificationsRead: () => setNotifications(prev => prev.map(notification => ({ ...notification, read: true }))),
    updateDoc,
    sendChatMessage,
    simulateRemoteActivity,
    resetToSeed
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const ctx = useContext(RealtimeContext);
  if (!ctx) {
    throw new Error('useRealtime must be used within RealtimeProvider');
  }
  return ctx;
}
