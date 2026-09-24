import React from 'react';
import { Bell, CheckCheck, MessageCircle, MoveRight, Plus, Radio, X } from 'lucide-react';
import { useRealtime } from '../../../RealtimeContext';

const notificationIcons = {
  task: Plus,
  comment: MessageCircle,
  movement: MoveRight,
  chat: Radio
};

export default function NotificationCenter({ isOpen, onClose }) {
  const { notifications, unreadNotifications, markNotificationsRead } = useRealtime();

  if (!isOpen) return null;

  const handleMarkRead = () => {
    markNotificationsRead();
  };

  return (
    <div className="notification-panel" role="dialog" aria-label="Notifications">
      <div className="notification-panel-header">
        <div>
          <div className="panel-eyebrow">Workspace pulse</div>
          <h2>Notifications</h2>
        </div>
        <button className="icon-btn" onClick={onClose} title="Close notifications">
          <X size={16} />
        </button>
      </div>

      <div className="notification-panel-actions">
        <span>{unreadNotifications} unread</span>
        <button className="text-action" onClick={handleMarkRead} disabled={!unreadNotifications}>
          <CheckCheck size={14} /> Mark all read
        </button>
      </div>

      <div className="notification-list">
        {notifications.length === 0 ? (
          <div className="notification-empty">
            <Bell size={22} />
            <span>You are all caught up.</span>
          </div>
        ) : (
          notifications.map(notification => {
            const Icon = notificationIcons[notification.type] || Bell;
            return (
              <div key={notification.id} className={`notification-item ${notification.read ? '' : 'unread'}`}>
                <div className="notification-icon"><Icon size={15} /></div>
                <div className="notification-copy">
                  <strong>{notification.title}</strong>
                  <span>{notification.message}</span>
                  <time>{formatNotificationTime(notification.createdAt)}</time>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function formatNotificationTime(timestamp) {
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}
