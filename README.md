# Orbit — Real-Time Collaborative Workspace

Orbit is a real-time collaborative workspace / Agile management tool inspired by the workflow of Jira and Trello.

## Project requirements covered

- Workspaces, boards, lists, cards, and users
- JWT authentication
- Workspace creation and invitations
- React frontend
- Tailwind CSS
- Zustand state management
- React Beautiful DnD drag-and-drop Kanban
- Node.js + Express REST API
- Socket.IO real-time communication
- Board-specific Socket.IO rooms
- Real-time card creation, updates, movement, and deletion
- Real-time typing indicators
- Card-level comment threads
- In-app notifications
- Task search
- Redis caching for frequently read board data
- Secure WebSocket authentication handshake
- Security middleware
- Production-oriented structure

## Suggested 4-week implementation plan

### Week 1 — Foundation & Workspace Hierarchy
1. Define User, Workspace, Board, List, and Card models.
2. Implement authentication and workspace creation/invitation endpoints.
3. Build frontend layout, sidebar navigation, and workspace settings.

### Week 2 — Kanban Engine & Interactivity
1. Build REST CRUD APIs for Lists and Cards.
2. Add drag-and-drop between lists.
3. Optimize local UI state before server confirmation.

### Week 3 — Real-Time Synchronization
1. Integrate Socket.IO server-side.
2. Handle connection/disconnection safely.
3. Broadcast card creation, updates, and movement to the relevant board room.
4. Add typing indicators and card-level comments.

### Week 4 — Search, Notifications & Polish
1. Add comprehensive task search and in-app notifications.
2. Add Redis caching for high-traffic board reads.
3. Perform security/performance checks and production deployment preparation.

## Stack

Frontend: React.js, Zustand, Tailwind CSS, React Beautiful DnD  
Backend: Node.js, Express.js  
Real-time: Socket.IO  
Database: MongoDB, Mongoose  
Caching: Redis  
Security: JWT, authenticated WebSocket handshake

## Run locally

### Server
```bash
cd server
npm install
copy .env.example .env
npm run dev
```

### Client
```bash
cd client
npm install
npm run dev
```

MongoDB must be running. Redis is recommended; the server can start without Redis and will use the database directly.

Default client URL: http://localhost:5173  
Default API URL: http://localhost:5000/api
