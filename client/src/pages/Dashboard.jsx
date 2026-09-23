import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Plus,
  Settings,
  LogOut,
  ChevronDown,
  Users,
  FolderKanban,
  Mail,
  Check,
  X,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useOrbitStore } from "../store/useOrbitStore";

export default function Dashboard() {
  const navigate = useNavigate();

  const {
    user,
    workspace,
    setWorkspace,
  } = useOrbitStore();

  const [workspaces, setWorkspaces] = useState([]);
  const [invitations, setInvitations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingInvitations, setLoadingInvitations] = useState(true);

  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [showCreateBoard, setShowCreateBoard] = useState(false);

  const [workspaceName, setWorkspaceName] = useState("");
  const [boardName, setBoardName] = useState("");

  const [selectedWorkspace, setSelectedWorkspace] = useState(null);

  const [processingInvitation, setProcessingInvitation] = useState(null);

  /* =========================
     LOAD WORKSPACES
  ========================= */

  const loadWorkspaces = async () => {
    try {
      const { data } = await api.get("/workspaces");

      const items = data.workspaces || [];
      setWorkspaces(items);

      if (items.length > 0) {
        const current =
          items.find(
            (item) => String(item._id) === String(workspace?._id)
          ) || items[0];

        setSelectedWorkspace(current);
        setWorkspace(current);
      } else {
        setSelectedWorkspace(null);
        setWorkspace(null);
      }
    } catch (error) {
      console.error("Failed to load workspaces:", error);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     LOAD INVITATIONS
  ========================= */

  const loadInvitations = async () => {
    try {
      setLoadingInvitations(true);

      const { data } = await api.get("/workspaces/invitations");

      setInvitations(data.invitations || []);
    } catch (error) {
      console.error("Failed to load invitations:", error);
      setInvitations([]);
    } finally {
      setLoadingInvitations(false);
    }
  };

  useEffect(() => {
    loadWorkspaces();
    loadInvitations();
  }, []);

  /* =========================
     CREATE WORKSPACE
  ========================= */

  const createWorkspace = async (e) => {
    e.preventDefault();

    const name = workspaceName.trim();

    if (!name) return;

    try {
      const { data } = await api.post("/workspaces", {
        name,
      });

      const newWorkspace = data.workspace;

      setWorkspaces((prev) => [...prev, newWorkspace]);
      setSelectedWorkspace(newWorkspace);
      setWorkspace(newWorkspace);

      setWorkspaceName("");
      setShowCreateWorkspace(false);
    } catch (error) {
      console.error("Failed to create workspace:", error);

      alert(
        error?.response?.data?.message ||
          "Failed to create workspace"
      );
    }
  };

  /* =========================
     CREATE BOARD
  ========================= */

  const createBoard = async (e) => {
    e.preventDefault();

    const name = boardName.trim();

    if (!name || !selectedWorkspace) return;

    try {
      const { data } = await api.post("/boards", {
        workspaceId: selectedWorkspace._id,
        name,
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
      setWorkspace(updatedWorkspace);

      setWorkspaces((prev) =>
        prev.map((item) =>
          String(item._id) === String(updatedWorkspace._id)
            ? updatedWorkspace
            : item
        )
      );

      setBoardName("");
      setShowCreateBoard(false);
    } catch (error) {
      console.error("Failed to create board:", error);

      alert(
        error?.response?.data?.message ||
          "Failed to create board"
      );
    }
  };

  /* =========================
     SELECT WORKSPACE
  ========================= */

  const selectWorkspace = (item) => {
    setSelectedWorkspace(item);
    setWorkspace(item);
    setShowWorkspaceMenu(false);
  };

  /* =========================
     ACCEPT INVITATION
  ========================= */

  const acceptInvitation = async (invitation) => {
    try {
      setProcessingInvitation(invitation.workspaceId);

      await api.post(
        `/workspaces/${invitation.workspaceId}/join`
      );

      alert(
        `You joined "${invitation.workspaceName}" successfully!`
      );

      await loadWorkspaces();
      await loadInvitations();
    } catch (error) {
      console.error("Failed to accept invitation:", error);

      alert(
        error?.response?.data?.message ||
          "Failed to accept invitation"
      );
    } finally {
      setProcessingInvitation(null);
    }
  };

  /* =========================
     DECLINE INVITATION
  ========================= */

  const declineInvitation = async (invitation) => {
    try {
      setProcessingInvitation(invitation.workspaceId);

      await api.post(
        `/workspaces/${invitation.workspaceId}/invitations/${invitation.invitationId}/decline`
      );

      await loadInvitations();
    } catch (error) {
      console.error("Failed to decline invitation:", error);

      alert(
        error?.response?.data?.message ||
          "Failed to decline invitation"
      );
    } finally {
      setProcessingInvitation(null);
    }
  };

  /* =========================
     LOGOUT
  ========================= */

  const logout = () => {
    localStorage.removeItem("orbit_token");
    localStorage.removeItem("orbit_user");

    setWorkspace(null);

    navigate("/login");
  };

  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-300">
          <RefreshCw className="w-5 h-5 animate-spin" />
          Loading Orbit...
        </div>
      </div>
    );
  }

  const activeWorkspace = selectedWorkspace;

  const boards = activeWorkspace?.boards || [];

  const totalMembers =
    activeWorkspace?.members?.length || 0;

  /* =========================
     UI
  ========================= */

  return (
    <div className="min-h-screen bg-[#020c1b] text-white flex">
      {/* ================= SIDEBAR ================= */}

      <aside className="w-[360px] border-r border-[#1b2b45] bg-[#0c1628] flex flex-col">
        {/* LOGO */}

        <div className="px-6 py-5 border-b border-[#1b2b45]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#6d5ef6] flex items-center justify-center shadow-[0_0_0_1px_rgba(109,94,246,0.4)]">
              <span className="font-bold text-2xl leading-none">O</span>
            </div>

            <div>
              <h1 className="font-bold text-[24px] leading-none text-white">Orbit</h1>
              <p className="text-[14px] text-[#9aa7bd] mt-2">
                Collaborative Workspace
              </p>
            </div>
          </div>
        </div>

        {/* WORKSPACE SELECTOR */}

        <div className="px-4 py-4">
          <div className="relative">
            <button
              onClick={() =>
                setShowWorkspaceMenu((prev) => !prev)
              }
              className="w-full flex items-center justify-between gap-2 px-3 py-3 rounded-xl bg-[#2a3654] hover:bg-[#2f3d5f] transition shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-[#4b5be1]/15 text-[#b7c0ff] flex items-center justify-center">
                  <FolderKanban size={18} />
                </div>

                <div className="text-left min-w-0">
                  <p className="text-[17px] font-semibold truncate text-white">
                    {activeWorkspace?.name ||
                      "No workspace"}
                  </p>

                  <p className="text-[12px] text-[#9aa7bd]">
                    Workspace
                  </p>
                </div>
              </div>

              <ChevronDown size={17} />
            </button>

            {showWorkspaceMenu && (
              <div className="absolute z-30 top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden">
                <div className="max-h-60 overflow-y-auto">
                  {workspaces.map((item) => (
                    <button
                      key={item._id}
                      onClick={() =>
                        selectWorkspace(item)
                      }
                      className="w-full text-left px-4 py-3 hover:bg-slate-700 transition"
                    >
                      <p className="text-sm font-medium">
                        {item.name}
                      </p>

                      <p className="text-xs text-slate-400">
                        {item.members?.length || 0} members
                      </p>
                    </button>
                  ))}
                </div>

                <div className="border-t border-slate-700">
                  <button
                    onClick={() => {
                      setShowWorkspaceMenu(false);
                      setShowCreateWorkspace(true);
                    }}
                    className="w-full px-4 py-3 flex items-center gap-2 text-sm text-indigo-400 hover:bg-slate-700"
                  >
                    <Plus size={16} />
                    Create Workspace
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* NAVIGATION */}

        <nav className="px-4 mt-4 space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-[#4d5cff]/15 text-[#c6d0ff] shadow-[inset_0_0_0_1px_rgba(109,94,246,0.12)] text-[18px] font-medium">
            <LayoutDashboard size={18} />
            Dashboard
          </button>

          {activeWorkspace && (
            <button
              onClick={() =>
                navigate(
                  `/workspaces/${activeWorkspace._id}/settings`
                )
              }
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 transition"
            >
              <Settings size={18} />
              Workspace Settings
            </button>
          )}
        </nav>

        {/* BOARDS */}

        <div className="px-4 mt-8">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[12px] uppercase tracking-[0.12em] text-[#8f9abc]">
              Boards
            </p>

            {activeWorkspace && (
              <button
                onClick={() => setShowCreateBoard(true)}
                className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white"
                title="Create Board"
              >
                <Plus size={16} />
              </button>
            )}
          </div>

          <div className="space-y-1">
            {boards.map((board) => (
              <button
                key={board._id}
                onClick={() =>
                  navigate(`/boards/${board._id}`)
                }
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 transition text-left"
              >
                <FolderKanban size={17} />
                <span className="truncate">
                  {board.name}
                </span>
              </button>
            ))}

            {boards.length === 0 && (
              <p className="text-[15px] text-[#8f9abc] px-3 py-2">
                No boards yet
              </p>
            )}
          </div>
        </div>

        {/* USER */}

        <div className="mt-auto border-t border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center font-semibold">
              {user?.name?.charAt(0)?.toUpperCase() ||
                "U"}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.name || "User"}
              </p>

              <p className="text-xs text-slate-500 truncate">
                {user?.email || ""}
              </p>
            </div>

            <button
              onClick={logout}
              title="Logout"
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      {/* ================= MAIN ================= */}

      <main className="flex-1 overflow-y-auto bg-[#020c1b]">
        <div className="max-w-[1200px] mx-auto px-8 py-8">
          {/* HEADER */}

          <div className="flex items-center justify-between gap-6 mb-8 pt-5">
            <div>
              <p className="text-[20px] text-[#b8c1d9] mb-1 font-medium">
                Welcome back,
              </p>

              <h2 className="text-[56px] font-bold leading-[1.05] tracking-[-0.04em] text-white">
                {user?.name || "User"}
              </h2>

              <p className="text-[24px] text-[#b7c0d9] mt-3 font-medium">
                Manage your collaborative workspace
                from one place.
              </p>
            </div>

            <button
              onClick={loadInvitations}
              className="mt-3 mr-2 h-16 w-16 rounded-2xl bg-[#1d2a3c] hover:bg-[#24314c] text-[#dfe8ff] shadow-[inset_0_0_0_1px_rgba(148,163,184,0.12)] flex items-center justify-center"
              title="Refresh invitations"
            >
              <RefreshCw
                size={30}
                className={
                  loadingInvitations
                    ? "animate-spin"
                    : ""
                }
              />
            </button>
          </div>

          {/* ================= INVITATIONS ================= */}

          {(invitations.length > 0 ||
            loadingInvitations) && (
            <section className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Mail
                  size={20}
                  className="text-indigo-400"
                />

                <h3 className="text-lg font-semibold">
                  Workspace Invitations
                </h3>

                {!loadingInvitations &&
                  invitations.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-xs">
                      {invitations.length}
                    </span>
                  )}
              </div>

              {loadingInvitations ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-400">
                  Checking for invitations...
                </div>
              ) : (
                <div className="space-y-3">
                  {invitations.map((invitation) => {
                    const processing =
                      processingInvitation ===
                      String(invitation.workspaceId);

                    return (
                      <div
                        key={`${invitation.workspaceId}-${invitation.invitationId}`}
                        className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between gap-5"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-11 h-11 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
                            <Mail size={20} />
                          </div>

                          <div className="min-w-0">
                            <p className="font-semibold">
                              {invitation.workspaceName}
                            </p>

                            <p className="text-sm text-slate-400">
                              You have been invited to join
                              this workspace.
                            </p>

                            {invitation.owner && (
                              <p className="text-xs text-slate-500 mt-1">
                                Owner:{" "}
                                {invitation.owner.name ||
                                  invitation.owner.email}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            disabled={processing}
                            onClick={() =>
                              acceptInvitation(
                                invitation
                              )
                            }
                            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
                          >
                            <Check size={16} />
                            Accept
                          </button>

                          <button
                            disabled={processing}
                            onClick={() =>
                              declineInvitation(
                                invitation
                              )
                            }
                            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-red-600/20 hover:text-red-400 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
                          >
                            <X size={16} />
                            Decline
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* ================= STATS ================= */}

          {activeWorkspace && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <FolderKanban
                      size={20}
                      className="text-indigo-400"
                    />
                    <p className="text-sm text-slate-400">
                      Boards
                    </p>
                  </div>

                  <p className="text-3xl font-bold">
                    {boards.length}
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <Users
                      size={20}
                      className="text-indigo-400"
                    />
                    <p className="text-sm text-slate-400">
                      Members
                    </p>
                  </div>

                  <p className="text-3xl font-bold">
                    {totalMembers}
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <LayoutDashboard
                      size={20}
                      className="text-indigo-400"
                    />
                    <p className="text-sm text-slate-400">
                      Workspace
                    </p>
                  </div>

                  <p className="text-lg font-semibold truncate">
                    {activeWorkspace.name}
                  </p>
                </div>
              </div>

              {/* ================= BOARDS ================= */}

              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold">
                    Your Boards
                  </h3>

                  <p className="text-sm text-slate-400 mt-1">
                    Open a board to start collaborating.
                  </p>
                </div>

                <button
                  onClick={() => setShowCreateBoard(true)}
                  className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 flex items-center gap-2 text-sm font-medium"
                >
                  <Plus size={17} />
                  Create Board
                </button>
              </div>

              {boards.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center">
                  <FolderKanban
                    size={36}
                    className="mx-auto text-slate-600 mb-4"
                  />

                  <h4 className="font-semibold text-lg">
                    No boards yet
                  </h4>

                  <p className="text-sm text-slate-500 mt-1 mb-5">
                    Create your first board to get
                    started.
                  </p>

                  <button
                    onClick={() =>
                      setShowCreateBoard(true)
                    }
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm"
                  >
                    Create Board
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {boards.map((board) => (
                    <button
                      key={board._id}
                      onClick={() =>
                        navigate(
                          `/boards/${board._id}`
                        )
                      }
                      className="text-left bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-indigo-500/50 hover:bg-slate-900/80 transition group"
                    >
                      <div className="flex items-center justify-between mb-5">
                        <div className="w-11 h-11 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
                          <FolderKanban size={22} />
                        </div>

                        <span className="text-xs text-slate-500 group-hover:text-indigo-400">
                          Open →
                        </span>
                      </div>

                      <h4 className="text-lg font-semibold truncate">
                        {board.name}
                      </h4>

                      <p className="text-sm text-slate-500 mt-1">
                        Collaborative Kanban Board
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ================= NO WORKSPACE ================= */}

          {!activeWorkspace && (
            <div className="bg-[#0d1a2a] border border-[#1b2b45] rounded-[22px] p-12 text-center min-h-[520px] flex flex-col items-center justify-center">
              <div className="w-24 h-24 rounded-2xl border border-[#68789a] bg-transparent flex items-center justify-center mb-8 opacity-80">
                <FolderKanban
                  size={52}
                  className="text-[#dfe8ff] opacity-80"
                />
              </div>

              <h3 className="text-[36px] font-semibold tracking-[-0.03em] text-white">
                No workspace yet
              </h3>

              <p className="text-[22px] text-[#b7c0d9] mt-6 leading-relaxed max-w-[760px]">
                Create a workspace or accept an invitation to get started.
              </p>

              <button
                onClick={() =>
                  setShowCreateWorkspace(true)
                }
                className="mt-8 px-7 py-4 rounded-2xl bg-[#5a5ff8] hover:bg-[#4f54f0] flex items-center gap-3 mx-auto text-[22px] font-semibold shadow-[0_8px_20px_rgba(90,95,248,0.38)]"
              >
                <Plus size={24} />
                Create Workspace
              </button>
            </div>
          )}
        </div>
      </main>

      {/* ================= CREATE WORKSPACE MODAL ================= */}

      {showCreateWorkspace && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <form
            onSubmit={createWorkspace}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6"
          >
            <h3 className="text-xl font-semibold">
              Create Workspace
            </h3>

            <p className="text-sm text-slate-400 mt-1 mb-5">
              Create a workspace for your team.
            </p>

            <input
              autoFocus
              value={workspaceName}
              onChange={(e) =>
                setWorkspaceName(e.target.value)
              }
              placeholder="Workspace name"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 outline-none focus:border-indigo-500"
            />

            <div className="flex justify-end gap-3 mt-5">
              <button
                type="button"
                onClick={() =>
                  setShowCreateWorkspace(false)
                }
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= CREATE BOARD MODAL ================= */}

      {showCreateBoard && activeWorkspace && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <form
            onSubmit={createBoard}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6"
          >
            <h3 className="text-xl font-semibold">
              Create Board
            </h3>

            <p className="text-sm text-slate-400 mt-1 mb-5">
              Add a new board to{" "}
              <span className="text-white">
                {activeWorkspace.name}
              </span>
              .
            </p>

            <input
              autoFocus
              value={boardName}
              onChange={(e) =>
                setBoardName(e.target.value)
              }
              placeholder="Board name"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 outline-none focus:border-indigo-500"
            />

            <div className="flex justify-end gap-3 mt-5">
              <button
                type="button"
                onClick={() =>
                  setShowCreateBoard(false)
                }
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}