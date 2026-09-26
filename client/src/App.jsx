import { Navigate, Route, Routes } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import BoardPage from "./pages/BoardPage";
import WorkspaceSettings from "./pages/WorkspaceSettings";
import ScreenshotBoard from "./pages/ScreenshotBoard";

export default function App() {
  return (
    <Routes>

      {/* HOME */}
      <Route
        path="/"
        element={
          <ScreenshotBoard />
        }
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