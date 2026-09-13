# Orbit — Project 2: Real-Time Collaborative Workspace (Agile Management Tool)

## Project Information

A robust project management tool analogous to Jira or Trello. It facilitates agile team workflows through Kanban boards, real-time task updates, collaborative document editing, and team communication. The core engineering challenge revolves around maintaining synchronized states across multiple connected clients with minimal latency.

## Tech Stack

### Frontend
- React.js
- Context API / Zustand
- Tailwind CSS
- React Beautiful DnD (Drag and Drop)

### Backend
- Node.js
- Express.js

### Real-time Engine
- Socket.IO

### Database
- MongoDB
- Mongoose
- Redis (for caching frequent queries and managing active socket connections)

### Security
- JWT
- Secure WebSocket handshakes

## Expected Impact

Enhances organizational productivity by providing a centralized hub for asynchronous and synchronous collaboration. Reduces communication bottlenecks by ensuring all team members have immediate, real-time visibility into project progression, blocker identification, and task ownership.

## 4-Week Development Timeline

### Week 1: Foundation & Workspace Hierarchy
- Day 1–2: Define data models (Workspaces, Boards, Lists, Cards, Users).
- Day 3–5: Implement user authentication and workspace creation/invitation endpoints.
- Day 6–7: Build frontend layout, sidebar navigation, and workspace settings UI.

### Week 2: Kanban Engine & Interactivity
- Day 1–3: Develop REST APIs for Lists and Cards CRUD operations.
- Day 4–6: Implement React Beautiful DnD for dynamic drag-and-drop functionality across lists.
- Day 7: State optimization to handle complex UI state updates locally before server confirmation.

### Week 3: Real-Time Synchronization
- Day 1–2: Integrate Socket.IO server-side; handle connection and disconnection events safely.
- Day 3–5: Broadcast card movements, updates, and creation events to all users connected to the specific board room.
- Day 6–7: Implement real-time typing indicators and card-level comment threads.

### Week 4: Search, Notifications & Polish
- Day 1–2: Build a comprehensive search engine for tasks and implement an in-app notification system.
- Day 3–4: Implement Redis caching to optimize database read operations for high-traffic boards.
- Day 5–7: Security audits, performance profiling, and final production deployment.
