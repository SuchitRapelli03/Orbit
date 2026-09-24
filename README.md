# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

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

Default client URL: http://localhost:5174
Default API URL: http://localhost:5001/api
