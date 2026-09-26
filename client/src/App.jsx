import { Navigate, Route, Routes } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import BoardPage from "./pages/BoardPage";
import WorkspaceSettings from "./pages/WorkspaceSettings";
import Landing from "./pages/Landing";

export default function App() {
  const token = localStorage.getItem("orbit_token");

  return (
    <Routes>
      {/* ORBIT INTRO */}
      <Route
        path="/"
        element={<Landing />}
      />

      {/* AUTH */}
      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      {/* DASHBOARD */}
      <Route
        path="/dashboard"
        element={<Dashboard />}
      />

      {/* WORKSPACE SETTINGS */}
      <Route
        path="/workspaces/:workspaceId/settings"
        element={<WorkspaceSettings />}
      />

      {/* BOARD */}
      <Route
        path="/boards/:boardId"
        element={<BoardPage />}
      />

      {/* FALLBACK */}
      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />
    </Routes>
  );
}