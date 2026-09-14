import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Plus,
  Settings,
  LogOut,
  ChevronDown,
  Users,
  FolderKanban,
} from "lucide-react";

import api from "../lib/api";
import { useOrbitStore } from "../store/useOrbitStore";

export default function Dashboard() {
  const navigate = useNavigate();

  const user = useOrbitStore((s) => s.user);
  const setWorkspace = useOrbitStore((s) => s.setWorkspace);

  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);

  const [workspaceName, setWorkspaceName] = useState("");
  const [boardName, setBoardName] = useState("");

  const [showWorkspaceForm, setShowWorkspaceForm] = useState(false);
  const [showBoardForm, setShowBoardForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [creatingBoard, setCreatingBoard] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("orbit_token")) {
      navigate("/login");
      return;
    }

    loadWorkspaces();
  }, [navigate]);

  async function loadWorkspaces() {
    try {
      const { data } = await api.get("/workspaces");

      const items = data.workspaces || [];

      setWorkspaces(items);

      if (items.length > 0) {
        setSelectedWorkspace(items[0]);
        setWorkspace(items[0]);
      }
    } catch (error) {
      console.error("Failed to load workspaces:", error);

      if (error.response?.status === 401) {
        localStorage.removeItem("orbit_token");
        localStorage.removeItem("orbit_user");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  }

  function selectWorkspace(workspace) {
    setSelectedWorkspace(workspace);
    setWorkspace(workspace);

    setShowBoardForm(false);
    setShowWorkspaceForm(false);
  }

  async function createWorkspace(e) {
    e.preventDefault();

    if (!workspaceName.trim()) return;

    try {
      const { data } = await api.post("/workspaces", {
        name: workspaceName.trim(),
      });

      const newWorkspace = data.workspace;

      setWorkspaces((items) => [
        newWorkspace,
        ...items,
      ]);

      setSelectedWorkspace(newWorkspace);
      setWorkspace(newWorkspace);

      setWorkspaceName("");
      setShowWorkspaceForm(false);
    } catch (error) {
      console.error(
        "Failed to create workspace:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to create workspace"
      );
    }
  }

  async function createBoard(e) {
    e.preventDefault();

    if (
      !boardName.trim() ||
      !selectedWorkspace
    ) {
      return;
    }

    try {
      setCreatingBoard(true);

      const { data } = await api.post("/boards", {
        name: boardName.trim(),
        workspaceId: selectedWorkspace._id,
      });

      const newBoard = data.board;

      const updatedWorkspace = {
        ...selectedWorkspace,
        boards: [
          ...(selectedWorkspace.boards || []),
          newBoard,
        ],
      };

      setSelectedWorkspace(updatedWorkspace);

      setWorkspaces((items) =>
        items.map((workspace) =>
          workspace._id === selectedWorkspace._id
            ? updatedWorkspace
            : workspace
        )
      );

      setBoardName("");
      setShowBoardForm(false);

      navigate(`/boards/${newBoard._id}`);
    } catch (error) {
      console.error(
        "Failed to create board:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to create board"
      );
    } finally {
      setCreatingBoard(false);
    }
  }

  function openWorkspaceSettings() {
    if (!selectedWorkspace) {
      alert("Please select a workspace first.");
      return;
    }

    navigate(
      `/workspaces/${selectedWorkspace._id}/settings`
    );
  }

  function logout() {
    localStorage.removeItem("orbit_token");
    localStorage.removeItem("orbit_user");

    navigate("/login");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500">
          Loading Orbit...
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-100">

      {/* ================================
          SIDEBAR
      ================================= */}

      <aside className="flex w-72 flex-col border-r bg-white">

        {/* LOGO */}
        <div className="border-b px-6 py-5">
          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-lg text-white">
              ◉
            </div>

            <div>
              <h1 className="text-xl font-black">
                Orbit
              </h1>

              <p className="text-xs text-slate-500">
                Collaborative Workspace
              </p>
            </div>

          </div>
        </div>


        {/* WORKSPACE SELECTOR */}
        <div className="border-b p-4">

          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Workspace
          </p>

          <div className="relative">

            <select
              value={
                selectedWorkspace?._id || ""
              }
              onChange={(e) => {

                const workspace =
                  workspaces.find(
                    (item) =>
                      item._id ===
                      e.target.value
                  );

                if (workspace) {
                  selectWorkspace(workspace);
                }
              }}
              className="w-full appearance-none rounded-xl border bg-slate-50 px-4 py-3 pr-10 text-sm font-semibold outline-none focus:border-slate-400"
            >

              {workspaces.map(
                (workspace) => (
                  <option
                    key={workspace._id}
                    value={workspace._id}
                  >
                    {workspace.name}
                  </option>
                )
              )}

            </select>

            <ChevronDown
              size={17}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

          </div>


          {/* CREATE WORKSPACE */}
          <button
            onClick={() =>
              setShowWorkspaceForm(
                (value) => !value
              )
            }
            className="mt-3 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            <Plus size={17} />
            Create Workspace
          </button>


          {showWorkspaceForm && (
            <form
              onSubmit={createWorkspace}
              className="mt-3 space-y-2"
            >

              <input
                autoFocus
                value={workspaceName}
                onChange={(e) =>
                  setWorkspaceName(
                    e.target.value
                  )
                }
                placeholder="Workspace name"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-400"
              />

              <button
                type="submit"
                className="w-full rounded-lg bg-slate-900 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Create
              </button>

            </form>
          )}

        </div>


        {/* NAVIGATION */}
        <div className="flex-1 overflow-y-auto p-4">

          <div className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Navigation
          </div>


          {/* DASHBOARD */}
          <Link
            to="/dashboard"
            className="mb-5 flex items-center gap-3 rounded-xl bg-slate-100 px-3 py-3 text-sm font-semibold text-slate-900"
          >
            <LayoutDashboard size={18} />
            Dashboard
          </Link>


          {/* BOARDS HEADER */}
          <div className="mb-3 flex items-center justify-between px-2">

            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Boards
            </span>

            <button
              onClick={() =>
                setShowBoardForm(
                  (value) => !value
                )
              }
              title="Create Board"
              className="rounded-lg p-1.5 hover:bg-slate-100"
            >
              <Plus size={17} />
            </button>

          </div>


          {/* CREATE BOARD FORM */}
          {showBoardForm &&
            selectedWorkspace && (
              <form
                onSubmit={createBoard}
                className="mb-4 rounded-xl border bg-slate-50 p-3"
              >

                <input
                  autoFocus
                  value={boardName}
                  onChange={(e) =>
                    setBoardName(
                      e.target.value
                    )
                  }
                  placeholder="Board name"
                  className="mb-2 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                />

                <button
                  disabled={creatingBoard}
                  className="w-full rounded-lg bg-slate-900 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {creatingBoard
                    ? "Creating..."
                    : "Create Board"}
                </button>

              </form>
            )}


          {/* BOARD LIST */}
          <div className="space-y-1">

            {selectedWorkspace?.boards
              ?.length ? (

              selectedWorkspace.boards.map(
                (board) => (

                  <Link
                    key={board._id}
                    to={`/boards/${board._id}`}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  >

                    <FolderKanban
                      size={17}
                    />

                    <span className="truncate">
                      {board.name}
                    </span>

                  </Link>

                )
              )

            ) : (

              <p className="px-3 py-3 text-sm text-slate-400">
                No boards yet
              </p>

            )}

          </div>

        </div>


        {/* USER SECTION */}
        <div className="border-t p-4">

          <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
              {user?.name
                ?.charAt(0)
                ?.toUpperCase() || "U"}
            </div>

            <div className="min-w-0">

              <p className="truncate text-sm font-semibold">
                {user?.name || "User"}
              </p>

              <p className="truncate text-xs text-slate-500">
                {user?.email || ""}
              </p>

            </div>

          </div>


          {/* WORKSPACE SETTINGS */}
          <button
            onClick={openWorkspaceSettings}
            className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100"
          >
            <Settings size={17} />
            Workspace Settings
          </button>


          {/* LOGOUT */}
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut size={17} />
            Logout
          </button>

        </div>

      </aside>


      {/* ================================
          MAIN CONTENT
      ================================= */}

      <main className="flex-1 overflow-y-auto">

        {/* TOP HEADER */}
        <header className="border-b bg-white px-8 py-5">

          <div className="mx-auto max-w-6xl">

            <p className="text-sm text-slate-400">
              Workspace
            </p>

            <h1 className="mt-1 text-3xl font-black text-slate-900">
              {selectedWorkspace?.name ||
                "Your Workspace"}
            </h1>

            <p className="mt-2 text-slate-500">
              Manage your projects and
              collaborate with your team.
            </p>

          </div>

        </header>


        {/* CONTENT */}
        <section className="mx-auto max-w-6xl p-8">

          {/* ================================
              STATS
          ================================= */}

          <div className="mb-8 grid gap-4 md:grid-cols-2">

            {/* BOARDS */}
            <div className="rounded-2xl border bg-white p-6 shadow-sm">

              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                <FolderKanban size={21} />
              </div>

              <p className="text-sm text-slate-500">
                Boards
              </p>

              <p className="mt-1 text-3xl font-black">
                {selectedWorkspace
                  ?.boards?.length || 0}
              </p>

            </div>


            {/* MEMBERS */}
            <div className="rounded-2xl border bg-white p-6 shadow-sm">

              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                <Users size={21} />
              </div>

              <p className="text-sm text-slate-500">
                Members
              </p>

              <p className="mt-1 text-3xl font-black">
                {selectedWorkspace
                  ?.members?.length || 0}
              </p>

            </div>

          </div>


          {/* ================================
              BOARDS HEADER
          ================================= */}

          <div className="mb-5 flex items-center justify-between">

            <div>

              <h2 className="text-2xl font-bold">
                Your Boards
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Select a board to start working.
              </p>

            </div>


            <button
              onClick={() =>
                setShowBoardForm(true)
              }
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
            >
              <Plus size={18} />
              Create Board
            </button>

          </div>


          {/* ================================
              BOARD CARDS
          ================================= */}

          {selectedWorkspace?.boards
            ?.length ? (

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

              {selectedWorkspace.boards.map(
                (board) => (

                  <Link
                    key={board._id}
                    to={`/boards/${board._id}`}
                    className="group rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                  >

                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
                      <FolderKanban
                        size={22}
                      />
                    </div>

                    <h3 className="text-lg font-bold text-slate-900">
                      {board.name}
                    </h3>

                    <p className="mt-2 text-sm text-slate-500">
                      Open board and manage
                      tasks.
                    </p>

                    <div className="mt-5 text-sm font-semibold text-slate-900 group-hover:underline">
                      Open Board →
                    </div>

                  </Link>

                )
              )}

            </div>

          ) : (

            /* EMPTY STATE */
            <div className="rounded-2xl border border-dashed bg-white p-12 text-center">

              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <FolderKanban
                  size={25}
                />
              </div>

              <h3 className="text-lg font-bold">
                No boards yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                Create your first board to
                start managing tasks with
                your team.
              </p>

              <button
                onClick={() =>
                  setShowBoardForm(true)
                }
                className="mt-5 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Create Your First Board
              </button>

            </div>

          )}

        </section>

      </main>

    </div>
  );
}