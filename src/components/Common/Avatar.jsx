import React from 'react';

export default function Avatar({ member, size = 30, showStatus = true, className = '' }) {
  if (!member) return null;

  return (
    <div
      className={`presence-avatar ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: member.color || '#6366f1'
      }}
      title={`${member.name} (${member.role}) - ${member.status}`}
    >
      <span>{member.avatar}</span>
      {showStatus && member.status === 'online' && <span className="online-dot" />}
    </div>
  );
}
