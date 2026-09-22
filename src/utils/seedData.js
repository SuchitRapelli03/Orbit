// Initial Seed Data for Orbit Real-Time Collaborative Workspace

export const INITIAL_MEMBERS = [
  {
    id: 'user-me',
    name: 'Pravallika (You)',
    role: 'Lead Architect',
    avatar: 'PV',
    color: '#6366f1',
    status: 'online',
    email: 'pravallika@orbit.dev'
  },
  {
    id: 'user-alex',
    name: 'Alex Rivera',
    role: 'Staff Engineer',
    avatar: 'AR',
    color: '#06b6d4',
    status: 'online',
    email: 'alex.r@orbit.dev'
  },
  {
    id: 'user-sarah',
    name: 'Sarah Chen',
    role: 'Frontend Specialist',
    avatar: 'SC',
    color: '#10b981',
    status: 'online',
    email: 'sarah.c@orbit.dev'
  },
  {
    id: 'user-david',
    name: 'David Kim',
    role: 'Distributed Systems',
    avatar: 'DK',
    color: '#f59e0b',
    status: 'idle',
    email: 'david.k@orbit.dev'
  },
  {
    id: 'user-elena',
    name: 'Elena Rostova',
    role: 'Principal Designer',
    avatar: 'ER',
    color: '#a855f7',
    status: 'online',
    email: 'elena.r@orbit.dev'
  }
];

export const KANBAN_COLUMNS = [
  { id: 'backlog', title: 'Backlog', color: '#64748b' },
  { id: 'todo', title: 'To Do', color: '#3b82f6' },
  { id: 'in_progress', title: 'In Progress', color: '#f59e0b' },
  { id: 'in_review', title: 'In Review', color: '#8b5cf6' },
  { id: 'done', title: 'Done', color: '#10b981' }
];

export const INITIAL_TASKS = [
  {
    id: 'task-1',
    key: 'ORB-101',
    title: 'Implement BroadcastChannel real-time multi-tab state sync',
    description: 'Provide seamless zero-latency state synchronization between all connected browser tabs and windows using native BroadcastChannel and localStorage events.',
    columnId: 'done',
    priority: 'urgent',
    points: 5,
    tags: ['Architecture', 'Real-Time', 'Core'],
    assigneeId: 'user-me',
    subtasks: [
      { id: 'st-1', title: 'Establish channel protocol', completed: true },
      { id: 'st-2', title: 'Broadcast task drag-and-drop mutations', completed: true },
      { id: 'st-3', title: 'Add multi-client heartbeat & presence sync', completed: true }
    ],
    comments: [
      {
        id: 'c-1',
        authorId: 'user-alex',
        text: 'State sync latency is looking below 5ms across local tabs. Great work!',
        createdAt: '10 mins ago'
      }
    ],
    viewers: ['user-sarah']
  },
  {
    id: 'task-2',
    key: 'ORB-102',
    title: 'Design Cosmic Obsidian glassmorphism theme and micro-interactions',
    description: 'Craft high-fidelity UI tokens, responsive CSS layouts, luminous glows, and smooth transitions for Kanban cards and navigation.',
    columnId: 'done',
    priority: 'high',
    points: 3,
    tags: ['UI/UX', 'Design System'],
    assigneeId: 'user-elena',
    subtasks: [
      { id: 'st-4', title: 'Define CSS custom property tokens', completed: true },
      { id: 'st-5', title: 'Build card hover & active states', completed: true }
    ],
    comments: [],
    viewers: []
  },
  {
    id: 'task-3',
    key: 'ORB-103',
    title: 'Build collaborative markdown document editor with live cursor',
    description: 'Interactive sprint retro document editor allowing team members to simultaneously edit docs with live presence markers.',
    columnId: 'in_progress',
    priority: 'high',
    points: 8,
    tags: ['Docs', 'Collaboration'],
    assigneeId: 'user-sarah',
    subtasks: [
      { id: 'st-6', title: 'Markdown live preview container', completed: true },
      { id: 'st-7', title: 'Simulated remote collaborator cursors', completed: true },
      { id: 'st-8', title: 'Auto-save with revision rollback', completed: false }
    ],
    comments: [
      {
        id: 'c-2',
        authorId: 'user-elena',
        text: 'Let us make sure the cursor tag shows the collaborator avatar and initials.',
        createdAt: '25 mins ago'
      }
    ],
    viewers: ['user-david', 'user-me']
  },
  {
    id: 'task-4',
    key: 'ORB-104',
    title: 'Optimize Sprint Velocity & Burndown metrics aggregation',
    description: 'Compute cycle time, completed story point velocity, and deliverable health in real-time as tasks transition to Done.',
    columnId: 'in_review',
    priority: 'medium',
    points: 5,
    tags: ['Analytics', 'Agile'],
    assigneeId: 'user-alex',
    subtasks: [
      { id: 'st-9', title: 'Sprint burndown trajectory calculations', completed: true },
      { id: 'st-10', title: 'Velocity points distribution breakdown', completed: true }
    ],
    comments: [],
    viewers: []
  },
  {
    id: 'task-5',
    key: 'ORB-105',
    title: 'Integrate team communication sidecar and live activity stream',
    description: 'Instant agile channel discussions with quick mentions, reaction emojis, and real-time sprint timeline alerts.',
    columnId: 'in_progress',
    priority: 'medium',
    points: 3,
    tags: ['Chat', 'Real-Time'],
    assigneeId: 'user-david',
    subtasks: [
      { id: 'st-11', title: 'Message bubble renderer with timestamp', completed: true },
      { id: 'st-12', title: 'Multi-tab broadcast for chat messages', completed: true }
    ],
    comments: [],
    viewers: []
  },
  {
    id: 'task-6',
    key: 'ORB-106',
    title: 'Support customizable WIP limits per sprint column',
    description: 'Display visual warnings and alerts when WIP (Work In Progress) limits are exceeded in In Progress or In Review.',
    columnId: 'todo',
    priority: 'low',
    points: 2,
    tags: ['Kanban', 'Workflow'],
    assigneeId: 'user-me',
    subtasks: [
      { id: 'st-13', title: 'Add column configuration modal', completed: false }
    ],
    comments: [],
    viewers: []
  },
  {
    id: 'task-7',
    key: 'ORB-107',
    title: 'Add keyboard shortcut command palette (Ctrl+K)',
    description: 'Fast navigation across views, instant task creation, and sprint search.',
    columnId: 'todo',
    priority: 'medium',
    points: 3,
    tags: ['Productivity', 'UX'],
    assigneeId: 'user-sarah',
    subtasks: [],
    comments: [],
    viewers: []
  },
  {
    id: 'task-8',
    key: 'ORB-108',
    title: 'WebSocket bridge adapter for distributed cloud deployments',
    description: 'Provide fallback connector from local BroadcastChannel to external WebSocket/Socket.io backend cluster.',
    columnId: 'backlog',
    priority: 'high',
    points: 8,
    tags: ['Backend', 'Infrastructure'],
    assigneeId: 'user-david',
    subtasks: [],
    comments: [],
    viewers: []
  }
];

export const INITIAL_DOCS = [
  {
    id: 'doc-1',
    title: 'Sprint 42 Retrospective & Goals',
    updatedAt: 'Just now',
    author: 'Elena Rostova',
    content: `# Sprint 42 Retrospective — Orbit Platform

## 🎯 What Went Exceptionally Well
- **Zero-Latency Sync**: Multi-tab synchronization via BroadcastChannel operates seamlessly under 10ms.
- **Visual Polish**: Cosmic Obsidian UI theme received rave team feedback during demo.
- **Kanban Board Fluidity**: Drag-and-drop response feels instantaneous and predictable.

## ⚡ Key Focus Areas for Next Sprint
1. Complete Collaborative Document multi-cursor typing indicators.
2. Hook WebSocket clustering adapter for distributed multi-user testing.
3. Configure Slack and GitHub agile webhooks for automated sprint progress tracking.

---
*Collaborators actively viewing*: Alex Rivera, Sarah Chen, Pravallika`
  },
  {
    id: 'doc-2',
    title: 'RFC-108: Real-Time Synchronization Protocol',
    updatedAt: '2 hours ago',
    author: 'Alex Rivera',
    content: `# RFC-108: Real-Time State Synchronization Architecture

## Overview
This document outlines our state replication strategy across clients:
- **Transport**: BroadcastChannel for intra-browser coordination; WebSocket / WebRTC for inter-client mesh.
- **Conflict Resolution**: Last-Write-Wins with monotonic Lamport timestamps.
- **Payload Structure**:
\`\`\`json
{
  "type": "TASK_MOVED",
  "payload": { "taskId": "ORB-103", "toColumn": "in_review" },
  "senderId": "user-alex",
  "timestamp": 1726415000000
}
\`\`\`
`
  }
];

export const INITIAL_CHAT = [
  {
    id: 'msg-1',
    authorId: 'user-alex',
    text: 'Hey team! Just pushed the latest Kanban drag & drop sync optimizations. Try opening two browser tabs side-by-side!',
    createdAt: '14:20'
  },
  {
    id: 'msg-2',
    authorId: 'user-sarah',
    text: 'Tested it! Cards snap cleanly and the sync pill shows 0 dropped frames. Amazing!',
    createdAt: '14:23'
  },
  {
    id: 'msg-3',
    authorId: 'user-me',
    text: 'Awesome. I am finalizing the task detail modal and checklist state broadcasts.',
    createdAt: '14:25'
  }
];
