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
  PanelLeftClose,
  ArrowUpRight,
  Sparkles,
  CircleDot,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useOrbitStore } from "../store/useOrbitStore";

const boardAccents = [
  {
    icon: "bg-cyan-100 text-cyan-700",
    glow: "group-hover:shadow-cyan-200/70",
    dot: "bg-cyan-400",
  },
  {
    icon: "bg-orange-100 text-orange-700",
    glow: "group-hover:shadow-orange-200/70",
    dot: "bg-orange-400",
  },
  {
    icon: "bg-amber-100 text-amber-700",
    glow: "group-hover:shadow-amber-200/70",
    dot: "bg-amber-400",
  },
  {
    icon: "bg-emerald-100 text-emerald-700",
    glow: "group-hover:shadow-emerald-200/70",
    dot: "bg-emerald-400",
  },
];

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
  const [showCreateWorkspace, setShowCreateWorkspace] =
    useState(false);
  const [showCreateBoard, setShowCreateBoard] =
    useState(false);

  const [workspaceName, setWorkspaceName] = useState("");
  const [boardName, setBoardName] = useState("");

  const [selectedWorkspace, setSelectedWorkspace] =
    useState(null);

  const [processingInvitation, setProcessingInvitation] =
    useState(null);

  /* =========================
     ORBIT NAVIGATION
  ========================= */

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [planetLaunching, setPlanetLaunching] =
    useState(false);
  const [planetLanding, setPlanetLanding] =
    useState(false);

  const openSidebar = () => {
    if (planetLaunching) return;

    setPlanetLaunching(true);

    window.setTimeout(() => {
      setSidebarOpen(true);
      setPlanetLaunching(false);
    }, 720);
  };

  const closeSidebar = () => {
    setShowWorkspaceMenu(false);
    setPlanetLanding(true);

    window.setTimeout(() => {
      setSidebarOpen(false);
    }, 120);

    window.setTimeout(() => {
      setPlanetLanding(false);
    }, 720);
  };

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
            (item) =>
              String(item._id) ===
              String(workspace?._id)
          ) || items[0];

        setSelectedWorkspace(current);
        setWorkspace(current);
      } else {
        setSelectedWorkspace(null);
        setWorkspace(null);
      }
    } catch (error) {
      console.error(
        "Failed to load workspaces:",
        error
      );
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

      const { data } = await api.get(
        "/workspaces/invitations"
      );

      setInvitations(data.invitations || []);
    } catch (error) {
      console.error(
        "Failed to load invitations:",
        error
      );

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

      setWorkspaces((prev) => [
        ...prev,
        newWorkspace,
      ]);

      setSelectedWorkspace(newWorkspace);
      setWorkspace(newWorkspace);

      setWorkspaceName("");
      setShowCreateWorkspace(false);
    } catch (error) {
      console.error(
        "Failed to create workspace:",
        error
      );

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
          String(item._id) ===
          String(updatedWorkspace._id)
            ? updatedWorkspace
            : item
        )
      );

      setBoardName("");
      setShowCreateBoard(false);
    } catch (error) {
      console.error(
        "Failed to create board:",
        error
      );

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
      setProcessingInvitation(
        invitation.workspaceId
      );

      await api.post(
        `/workspaces/${invitation.workspaceId}/join`
      );

      alert(
        `You joined "${invitation.workspaceName}" successfully!`
      );

      await loadWorkspaces();
      await loadInvitations();
    } catch (error) {
      console.error(
        "Failed to accept invitation:",
        error
      );

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
      setProcessingInvitation(
        invitation.workspaceId
      );

      await api.post(
        `/workspaces/${invitation.workspaceId}/invitations/${invitation.invitationId}/decline`
      );

      await loadInvitations();
    } catch (error) {
      console.error(
        "Failed to decline invitation:",
        error
      );

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
      <div className="flex min-h-screen items-center justify-center bg-[#F5F2EA] text-[#17201C]">
        <div className="relative flex flex-col items-center">
          <div className="orbit-loader mb-5">
            <div className="orbit-loader-planet" />
            <div className="orbit-loader-ring" />
          </div>

          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Preparing your orbit...
          </div>
        </div>
      </div>
    );
  }

  const activeWorkspace = selectedWorkspace;

  const boards = activeWorkspace?.boards || [];

  const totalMembers =
    activeWorkspace?.members?.length || 0;

  const userInitial =
    user?.name?.charAt(0)?.toUpperCase() || "U";

  /* =========================
     UI
  ========================= */

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F5F2EA] text-[#17201C]">
      {/* =========================
          ATMOSPHERE
      ========================= */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-cyan-300/10 blur-[120px]" />

        <div className="absolute right-[-160px] top-[20%] h-[480px] w-[480px] rounded-full bg-orange-300/10 blur-[120px]" />

        <div className="absolute bottom-[-220px] left-[35%] h-[500px] w-[500px] rounded-full bg-amber-200/10 blur-[120px]" />

        <div className="absolute left-[14%] top-[18%] h-1.5 w-1.5 rounded-full bg-cyan-400/50" />

        <div className="absolute right-[19%] top-[28%] h-1 w-1 rounded-full bg-orange-400/50" />

        <div className="absolute bottom-[15%] left-[42%] h-1 w-1 rounded-full bg-amber-400/50" />
      </div>

      {/* =========================
          PLANET TRIGGER
      ========================= */}

      {!sidebarOpen && (
        <button
          type="button"
          onClick={openSidebar}
          aria-label="Open Orbit navigation"
          title="Open navigation"
          className={`orbit-planet-trigger group fixed bottom-6 left-4 z-[60] flex h-14 w-14 items-center justify-center rounded-full outline-none ${
            planetLaunching
              ? "planet-launching"
              : planetLanding
                ? "planet-landing"
                : ""
          }`}
        >
          <span className="absolute inset-[-7px] rounded-full border border-[#2F8F83]/20" />

          <span className="orbit-planet-glow absolute inset-0 rounded-full bg-[#2F8F83]/20 blur-xl transition-all duration-500 group-hover:bg-[#2F8F83]/35" />

          <span className="orbit-planet absolute inset-0 overflow-hidden rounded-full border border-white/20 bg-[#203C35] shadow-[0_14px_40px_rgba(23,32,28,0.28)]">
            <span className="absolute -left-3 top-2 h-8 w-8 rounded-full bg-[#79C8BC]/20 blur-md" />

            <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-[#F39A70]/90 shadow-[0_0_12px_rgba(243,154,112,0.75)]" />

            <span className="absolute bottom-2 left-3 h-2 w-6 rounded-full bg-white/10" />

            <span className="relative z-10 flex h-full w-full items-center justify-center">
              <span className="h-3 w-3 rounded-full bg-[#F7EEDC] shadow-[0_0_16px_rgba(247,238,220,0.8)]" />
            </span>
          </span>

          <span className="orbit-satellite absolute -right-1 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[#79C8BC] shadow-[0_0_12px_rgba(121,200,188,0.8)]" />
        </button>
      )}

      {/* =========================
          SIDEBAR BACKDROP
      ========================= */}

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation backdrop"
          onClick={closeSidebar}
          className="fixed inset-0 z-40 bg-[#17201C]/25 backdrop-blur-[2px] lg:hidden"
        />
      )}

      {/* =========================
          SIDEBAR
      ========================= */}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[285px] flex-col overflow-hidden border-r border-[#31534A] bg-[#203C35] text-[#F7EEDC] shadow-[20px_0_60px_rgba(23,32,28,0.18)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-[calc(100%-1px)]"
        }`}
      >
        {/* SIDEBAR ATMOSPHERE */}

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#79C8BC]/10 blur-[70px]" />

          <div className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-[#F39A70]/8 blur-[80px]" />

          <div className="absolute left-8 top-[25%] h-1 w-1 rounded-full bg-[#F7EEDC]/30" />

          <div className="absolute right-10 top-[42%] h-1.5 w-1.5 rounded-full bg-[#79C8BC]/40" />

          <div className="absolute bottom-[28%] left-16 h-1 w-1 rounded-full bg-[#F39A70]/50" />
        </div>

        {/* SIDEBAR HEADER */}

        <div className="relative border-b border-[#41645A] px-5 py-5">
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#52756B] bg-[#294A41] shadow-[0_0_28px_rgba(121,200,188,0.10)]">
                <div className="h-3 w-3 rounded-full bg-[#79C8BC] shadow-[0_0_15px_rgba(121,200,188,0.7)]" />

                <span className="absolute -right-0.5 top-1 h-1.5 w-1.5 rounded-full bg-[#F39A70]" />
              </div>

              <div>
                <h1 className="text-xl font-semibold tracking-[0.16em] text-[#FFF8EA]">
                  ORBIT
                </h1>

                <p className="text-[10px] uppercase tracking-[0.18em] text-[#A9C0B9]">
                  Move work forward
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeSidebar}
              title="Close navigation"
              aria-label="Close navigation"
              className="group flex h-9 w-9 items-center justify-center rounded-xl border border-[#52756B] bg-[#294A41]/70 text-[#A9C0B9] transition hover:border-[#79C8BC]/40 hover:bg-[#31554B] hover:text-[#F7EEDC]"
            >
              <PanelLeftClose
                size={18}
                className="transition-transform duration-300 group-hover:-translate-x-0.5"
              />
            </button>
          </div>
        </div>

        {/* WORKSPACE */}

        <div className="relative px-4 py-4">
          <div className="relative">
            <button
              onClick={() =>
                setShowWorkspaceMenu((prev) => !prev)
              }
              className="w-full rounded-2xl border border-[#41645A] bg-[#294A41]/65 px-3 py-3 text-left transition hover:border-[#6FAEA2] hover:bg-[#31554B]"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#79C8BC]/10 text-[#9EDDD4]">
                    <FolderKanban size={17} />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#FFF8EA]">
                      {activeWorkspace?.name ||
                        "No workspace"}
                    </p>

                    <p className="mt-0.5 text-[11px] text-[#9AB4AC]">
                      {activeWorkspace
                        ? `${totalMembers} ${
                            totalMembers === 1
                              ? "member"
                              : "members"
                          }`
                        : "Create one to begin"}
                    </p>
                  </div>
                </div>

                <ChevronDown
                  size={16}
                  className={`shrink-0 text-[#91AAA2] transition-transform ${
                    showWorkspaceMenu
                      ? "rotate-180"
                      : ""
                  }`}
                />
              </div>
            </button>

            {showWorkspaceMenu && (
              <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-[#52756B] bg-[#294A41] shadow-[0_20px_50px_rgba(0,0,0,0.28)]">
                <div className="max-h-60 overflow-y-auto p-1.5">
                  {workspaces.map((item) => (
                    <button
                      key={item._id}
                      onClick={() =>
                        selectWorkspace(item)
                      }
                      className={`w-full rounded-xl px-3 py-3 text-left transition ${
                        String(
                          selectedWorkspace?._id
                        ) === String(item._id)
                          ? "bg-[#79C8BC]/15 text-[#E5FAF6]"
                          : "text-[#C0D1CC] hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-medium">
                          {item.name}
                        </p>

                        {String(
                          selectedWorkspace?._id
                        ) === String(item._id) && (
                          <span className="text-[10px] uppercase tracking-wider text-[#9EDDD4]">
                            Active
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs text-[#8EA8A0]">
                        {item.members?.length || 0} members
                      </p>
                    </button>
                  ))}
                </div>

                <div className="border-t border-[#41645A] p-1.5">
                  <button
                    onClick={() => {
                      setShowWorkspaceMenu(false);
                      setShowCreateWorkspace(true);
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-[#9EDDD4] transition hover:bg-[#79C8BC]/10"
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

        <nav className="relative px-4">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#78948B]">
            Navigate
          </p>

          <button className="mb-1 flex w-full items-center gap-3 rounded-xl border border-[#6FAEA2]/20 bg-[#79C8BC]/12 px-3 py-3 text-left text-[#DDF7F3]">
            <LayoutDashboard size={18} />

            <span className="text-sm font-medium">
              Dashboard
            </span>

            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#79C8BC] shadow-[0_0_10px_rgba(121,200,188,0.8)]" />
          </button>

          {activeWorkspace && (
            <button
              onClick={() =>
                navigate(
                  `/workspaces/${activeWorkspace._id}/settings`
                )
              }
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[#A8BDB7] transition hover:bg-white/5 hover:text-[#FFF8EA]"
            >
              <Settings size={18} />

              <span className="text-sm font-medium">
                Workspace Settings
              </span>
            </button>
          )}
        </nav>

        {/* BOARDS */}

        <div className="relative mt-7 flex-1 overflow-y-auto px-4 pb-4">
          <div className="mb-2 flex items-center justify-between px-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#78948B]">
              Boards · {boards.length}
            </p>

            {activeWorkspace && (
              <button
                onClick={() => setShowCreateBoard(true)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[#91AAA2] transition hover:bg-[#79C8BC]/10 hover:text-[#9EDDD4]"
                title="Create Board"
              >
                <Plus size={16} />
              </button>
            )}
          </div>

          <div className="space-y-1">
            {boards.map((board, index) => {
              const accent =
                boardAccents[
                  index % boardAccents.length
                ];

              return (
                <button
                  key={board._id}
                  onClick={() => {
                    closeSidebar();
                    navigate(`/boards/${board._id}`);
                  }}
                  className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[#A8BDB7] transition hover:bg-white/5 hover:text-[#FFF8EA]"
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${accent.dot}`}
                  />

                  <span className="truncate text-sm">
                    {board.name}
                  </span>

                  <ArrowUpRight
                    size={13}
                    className="ml-auto shrink-0 opacity-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-60"
                  />
                </button>
              );
            })}

            {boards.length === 0 && (
              <p className="px-3 py-2 text-xs text-[#78948B]">
                No boards yet
              </p>
            )}
          </div>
        </div>

        {/* USER */}

        <div className="relative border-t border-[#41645A] p-4">
          <div className="flex items-center gap-3 rounded-2xl border border-[#41645A] bg-[#294A41]/55 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F39A70] font-semibold text-[#203C35]">
              {userInitial}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[#FFF8EA]">
                {user?.name || "User"}
              </p>

              <p className="truncate text-[11px] text-[#8EA8A0]">
                {user?.email || ""}
              </p>
            </div>

            <button
              onClick={logout}
              title="Logout"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#91AAA2] transition hover:bg-[#F39A70]/10 hover:text-[#F6B294]"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* =========================
          MAIN
      ========================= */}

      <main
        className={`relative min-h-screen transition-[padding] duration-500 ${
          sidebarOpen ? "lg:pl-[285px]" : "pl-0"
        }`}
      >
        <div className="mx-auto max-w-[1440px] px-5 py-6 sm:px-8 lg:px-12 lg:py-10">
          {/* TOP BAR */}

          <header className="mb-10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {!sidebarOpen && (
                <div className="hidden h-10 w-10 items-center justify-center rounded-xl border border-[#DED8CC] bg-white/70 text-slate-400 sm:flex">
                  <CircleDot size={18} />
                </div>
              )}

              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.7)]" />

                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Orbit dashboard
                  </p>
                </div>

                <h1 className="text-2xl font-semibold tracking-tight text-[#101827] sm:text-3xl">
                  Welcome back,{" "}
                  <span className="text-slate-500">
                    {user?.name || "User"}
                  </span>
                </h1>

                <p className="mt-1.5 text-sm text-slate-500">
                  Everything your team is moving lives here.
                </p>
              </div>
            </div>

            <button
              onClick={loadInvitations}
              className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#DED8CC] bg-white/75 text-slate-500 shadow-sm transition hover:border-cyan-300 hover:bg-white hover:text-cyan-700"
              title="Refresh invitations"
            >
              <RefreshCw
                size={17}
                className={`transition-transform ${
                  loadingInvitations
                    ? "animate-spin"
                    : "group-hover:rotate-180"
                }`}
              />
            </button>
          </header>

          {/* INVITATIONS */}

          {(invitations.length > 0 ||
            loadingInvitations) && (
            <section className="mb-10">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                  <Mail size={17} />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-[#101827]">
                      Workspace invitations
                    </h2>

                    {!loadingInvitations &&
                      invitations.length > 0 && (
                        <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">
                          {invitations.length}
                        </span>
                      )}
                  </div>

                  <p className="text-xs text-slate-500">
                    Invitations waiting for your response.
                  </p>
                </div>
              </div>

              {loadingInvitations ? (
                <div className="rounded-2xl border border-[#DED8CC] bg-white/70 p-5 text-sm text-slate-500 shadow-sm">
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
                        className="group rounded-2xl border border-[#DED8CC] bg-white/80 p-4 shadow-[0_8px_30px_rgba(16,24,39,0.04)] transition hover:border-orange-200 hover:shadow-[0_14px_35px_rgba(16,24,39,0.07)] sm:p-5"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex min-w-0 items-center gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                              <Mail size={19} />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-semibold text-[#101827]">
                                {invitation.workspaceName}
                              </p>

                              <p className="mt-0.5 text-sm text-slate-500">
                                You have been invited to join
                                this workspace.
                              </p>

                              {invitation.owner && (
                                <p className="mt-1 text-xs text-slate-400">
                                  Owner:{" "}
                                  {invitation.owner.name ||
                                    invitation.owner.email}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            <button
                              disabled={processing}
                              onClick={() =>
                                acceptInvitation(
                                  invitation
                                )
                              }
                              className="flex items-center gap-2 rounded-xl bg-[#17201C] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#2F8F83] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Check size={15} />
                              Accept
                            </button>

                            <button
                              disabled={processing}
                              onClick={() =>
                                declineInvitation(
                                  invitation
                                )
                              }
                              className="flex items-center gap-2 rounded-xl border border-[#DED8CC] bg-[#F8F6F1] px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <X size={15} />
                              Decline
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* WORKSPACE CONTENT */}

          {activeWorkspace && (
            <>
              {/* STATS */}

              <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="group relative overflow-hidden rounded-2xl border border-[#DED8CC] bg-white/80 p-5 shadow-[0_8px_30px_rgba(16,24,39,0.035)] transition hover:-translate-y-0.5 hover:shadow-[0_15px_40px_rgba(16,24,39,0.07)]">
                  <div className="absolute right-[-35px] top-[-35px] h-24 w-24 rounded-full bg-cyan-300/10 blur-2xl transition group-hover:bg-cyan-300/20" />

                  <div className="relative">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                        <FolderKanban size={19} />
                      </div>

                      <span className="h-2 w-2 rounded-full bg-cyan-400" />
                    </div>

                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                      Boards
                    </p>

                    <p className="mt-1 text-3xl font-semibold tracking-tight text-[#101827]">
                      {boards.length}
                    </p>
                  </div>
                </div>

                <div className="group relative overflow-hidden rounded-2xl border border-[#DED8CC] bg-white/80 p-5 shadow-[0_8px_30px_rgba(16,24,39,0.035)] transition hover:-translate-y-0.5 hover:shadow-[0_15px_40px_rgba(16,24,39,0.07)]">
                  <div className="absolute right-[-35px] top-[-35px] h-24 w-24 rounded-full bg-emerald-300/10 blur-2xl transition group-hover:bg-emerald-300/20" />

                  <div className="relative">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                        <Users size={19} />
                      </div>

                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    </div>

                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                      Members
                    </p>

                    <p className="mt-1 text-3xl font-semibold tracking-tight text-[#101827]">
                      {totalMembers}
                    </p>
                  </div>
                </div>

                <div className="group relative overflow-hidden rounded-2xl border border-[#DED8CC] bg-white/80 p-5 shadow-[0_8px_30px_rgba(16,24,39,0.035)] transition hover:-translate-y-0.5 hover:shadow-[0_15px_40px_rgba(16,24,39,0.07)]">
                  <div className="absolute right-[-35px] top-[-35px] h-24 w-24 rounded-full bg-orange-300/10 blur-2xl transition group-hover:bg-orange-300/20" />

                  <div className="relative">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-700">
                        <LayoutDashboard size={19} />
                      </div>

                      <span className="h-2 w-2 rounded-full bg-orange-400" />
                    </div>

                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                      Workspace
                    </p>

                    <p className="mt-1 truncate text-lg font-semibold text-[#101827]">
                      {activeWorkspace.name}
                    </p>
                  </div>
                </div>
              </div>

              {/* BOARDS HEADER */}

              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Sparkles
                      size={15}
                      className="text-orange-500"
                    />

                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Your workspace
                    </span>
                  </div>

                  <h2 className="text-2xl font-semibold tracking-tight text-[#101827]">
                    Your Boards
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Open a board and get your team moving.
                  </p>
                </div>

                <button
                  onClick={() => setShowCreateBoard(true)}
                  className="group flex items-center justify-center gap-2 rounded-xl bg-[#17201C] px-4 py-2.5 text-sm font-medium text-white shadow-[0_8px_20px_rgba(16,24,39,0.15)] transition hover:-translate-y-0.5 hover:bg-[#2F8F83] hover:shadow-[0_12px_25px_rgba(47,143,131,0.2)]"
                >
                  <Plus
                    size={17}
                    className="transition-transform group-hover:rotate-90"
                  />
                  Create Board
                </button>
              </div>

              {/* BOARDS */}

              {boards.length === 0 ? (
                <div className="relative overflow-hidden rounded-3xl border border-dashed border-[#CEC7BA] bg-white/55 px-6 py-16 text-center">
                  <div className="absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-cyan-300/10 blur-3xl" />

                  <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#17201C] text-cyan-300 shadow-[0_12px_35px_rgba(16,24,39,0.15)]">
                    <FolderKanban size={27} />
                  </div>

                  <h3 className="relative mt-5 text-xl font-semibold text-[#101827]">
                    Your orbit is empty
                  </h3>

                  <p className="relative mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                    Create your first board and give your
                    workspace somewhere to move.
                  </p>

                  <button
                    onClick={() =>
                      setShowCreateBoard(true)
                    }
                    className="relative mt-6 inline-flex items-center gap-2 rounded-xl bg-[#17201C] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#2F8F83]"
                  >
                    <Plus size={16} />
                    Create Board
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {boards.map((board, index) => {
                    const accent =
                      boardAccents[
                        index % boardAccents.length
                      ];

                    return (
                      <button
                        key={board._id}
                        onClick={() =>
                          navigate(
                            `/boards/${board._id}`
                          )
                        }
                        className={`group relative overflow-hidden rounded-3xl border border-[#DED8CC] bg-white/85 p-6 text-left shadow-[0_8px_30px_rgba(16,24,39,0.04)] transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_20px_45px_rgba(16,24,39,0.09)] ${accent.glow}`}
                      >
                        <div className="pointer-events-none absolute right-[-35px] top-[-35px] h-28 w-28 rounded-full border border-slate-100 transition duration-500 group-hover:scale-110" />

                        <div className="pointer-events-none absolute right-[-20px] top-[-20px] h-20 w-20 rounded-full border border-slate-100 transition duration-700 group-hover:rotate-45" />

                        <div className="relative">
                          <div className="mb-7 flex items-center justify-between">
                            <div
                              className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accent.icon} transition duration-300 group-hover:scale-105`}
                            >
                              <FolderKanban size={21} />
                            </div>

                            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400 transition group-hover:text-cyan-700">
                              Open

                              <ArrowUpRight
                                size={14}
                                className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                              />
                            </span>
                          </div>

                          <h3 className="truncate text-lg font-semibold text-[#101827]">
                            {board.name}
                          </h3>

                          <p className="mt-1.5 text-sm text-slate-500">
                            Collaborative Kanban Board
                          </p>

                          <div className="mt-6 flex items-center gap-2">
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${accent.dot}`}
                            />

                            <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">
                              Active workspace
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* NO WORKSPACE */}

          {!activeWorkspace && (
            <div className="relative overflow-hidden rounded-3xl border border-dashed border-[#CEC7BA] bg-white/55 px-6 py-20 text-center">
              <div className="absolute left-1/2 top-[-70px] h-52 w-52 -translate-x-1/2 rounded-full bg-orange-300/10 blur-3xl" />

              <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#17201C] text-orange-300 shadow-[0_12px_35px_rgba(16,24,39,0.15)]">
                <FolderKanban size={28} />
              </div>

              <h3 className="relative mt-5 text-xl font-semibold text-[#101827]">
                No workspace yet
              </h3>

              <p className="relative mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Create a workspace or accept an invitation
                to give your Orbit somewhere to begin.
              </p>

              <button
                onClick={() =>
                  setShowCreateWorkspace(true)
                }
                className="relative mt-6 inline-flex items-center gap-2 rounded-xl bg-[#17201C] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#D8754F]"
              >
                <Plus size={17} />
                Create Workspace
              </button>
            </div>
          )}
        </div>
      </main>

      {/* =========================
          CREATE WORKSPACE MODAL
      ========================= */}

      {showCreateWorkspace && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#17201C]/40 p-4 backdrop-blur-sm">
          <form
            onSubmit={createWorkspace}
            className="modal-enter w-full max-w-md overflow-hidden rounded-3xl border border-[#DED8CC] bg-[#FBFAF6] p-6 shadow-[0_30px_80px_rgba(16,24,39,0.22)]"
          >
            <div className="mb-6 flex items-start justify-between">
              <div>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
                  <FolderKanban size={18} />
                </div>

                <h3 className="text-xl font-semibold text-[#101827]">
                  Create Workspace
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Create a workspace for your team.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCreateWorkspace(false)
                }
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
              Workspace name
            </label>

            <input
              autoFocus
              value={workspaceName}
              onChange={(e) =>
                setWorkspaceName(e.target.value)
              }
              placeholder="e.g. Product Team"
              className="w-full rounded-xl border border-[#D9D3C8] bg-white px-4 py-3 text-sm text-[#101827] outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10"
            />

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setShowCreateWorkspace(false)
                }
                className="rounded-xl border border-[#DED8CC] bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="rounded-xl bg-[#17201C] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#2F8F83]"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================
          CREATE BOARD MODAL
      ========================= */}

      {showCreateBoard && activeWorkspace && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#17201C]/40 p-4 backdrop-blur-sm">
          <form
            onSubmit={createBoard}
            className="modal-enter w-full max-w-md overflow-hidden rounded-3xl border border-[#DED8CC] bg-[#FBFAF6] p-6 shadow-[0_30px_80px_rgba(16,24,39,0.22)]"
          >
            <div className="mb-6 flex items-start justify-between">
              <div>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
                  <FolderKanban size={18} />
                </div>

                <h3 className="text-xl font-semibold text-[#101827]">
                  Create Board
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Add a new board to{" "}
                  <span className="font-medium text-[#101827]">
                    {activeWorkspace.name}
                  </span>
                  .
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCreateBoard(false)
                }
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
              Board name
            </label>

            <input
              autoFocus
              value={boardName}
              onChange={(e) =>
                setBoardName(e.target.value)
              }
              placeholder="e.g. Website Launch"
              className="w-full rounded-xl border border-[#D9D3C8] bg-white px-4 py-3 text-sm text-[#101827] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-400/10"
            />

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setShowCreateBoard(false)
                }
                className="rounded-xl border border-[#DED8CC] bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="rounded-xl bg-[#17201C] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#D8754F]"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================
          ANIMATION
      ========================= */}

      <style>{`
        /*
          The planet normally has a very small idle drift.
          It is NOT vertically translated because its anchor
          is already bottom-left.
        */

        .orbit-planet-trigger {
          animation: planetFloat 3.8s ease-in-out infinite;
          will-change: transform;
        }

        /*
          OPENING:
          The planet launches from the bottom-left,
          travels upward, overshoots slightly, then settles.
          
          The sidebar is not opened until this sequence
          has almost completed.
        */

        .orbit-planet-trigger.planet-launching {
          animation: planetLaunch 0.72s
            cubic-bezier(0.22, 1, 0.36, 1) forwards;
          pointer-events: none;
        }

        /*
          CLOSING:
          The planet appears high up and drops back down,
          giving the feeling that the sidebar has collapsed
          back into the planet.
        */

        .orbit-planet-trigger.planet-landing {
          animation: planetLanding 0.72s
            cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        .orbit-planet {
          transition:
            transform 0.35s cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 0.35s ease;
        }

        .orbit-planet-trigger:hover .orbit-planet {
          transform: scale(1.08);
          box-shadow:
            0 18px 45px rgba(23, 32, 28, 0.32),
            0 0 35px rgba(121, 200, 188, 0.14);
        }

        .orbit-planet-trigger:active .orbit-planet {
          transform: scale(0.94);
        }

        .orbit-satellite {
          animation: satelliteOrbit 2.8s linear infinite;
        }

        .modal-enter {
          animation: modalEnter 0.3s
            cubic-bezier(0.22, 1, 0.36, 1);
        }

        .orbit-loader {
          position: relative;
          width: 74px;
          height: 74px;
        }

        .orbit-loader-planet {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 24px;
          height: 24px;
          transform: translate(-50%, -50%);
          border-radius: 9999px;
          background: #203c35;
          box-shadow:
            0 0 28px rgba(47, 143, 131, 0.28);
        }

        .orbit-loader-planet::after {
          content: "";
          position: absolute;
          width: 7px;
          height: 7px;
          left: 8px;
          top: 8px;
          border-radius: 9999px;
          background: #79c8bc;
          box-shadow:
            0 0 12px rgba(121, 200, 188, 0.8);
        }

        .orbit-loader-ring {
          position: absolute;
          inset: 7px;
          border: 1px solid rgba(32, 60, 53, 0.16);
          border-radius: 9999px;
          transform: rotateX(65deg);
          animation: loaderSpin 1.5s linear infinite;
        }

        @keyframes planetFloat {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }

          50% {
            transform: translateY(-5px) translateX(1px);
          }
        }

        @keyframes planetLaunch {
          0% {
            transform: translateY(0) scale(1);
          }

          18% {
            transform: translateY(-10vh) translateX(3px) scale(1.04);
          }

          48% {
            transform: translateY(-48vh) translateX(7px) scale(1.08);
          }

          72% {
            transform: translateY(-69vh) translateX(4px) scale(1.12);
          }

          84% {
            transform: translateY(-65vh) translateX(2px) scale(1.06);
          }

          92% {
            transform: translateY(-68vh) translateX(1px) scale(1.09);
          }

          100% {
            transform: translateY(-66vh) translateX(0) scale(1.06);
            opacity: 0;
          }
        }

        @keyframes planetLanding {
          0% {
            transform: translateY(-66vh) translateX(0) scale(1.06);
            opacity: 0;
          }

          10% {
            opacity: 1;
          }

          34% {
            transform: translateY(-50vh) translateX(2px) scale(1.1);
          }

          62% {
            transform: translateY(-16vh) translateX(1px) scale(1.04);
          }

          78% {
            transform: translateY(3vh) translateX(0) scale(0.97);
          }

          90% {
            transform: translateY(-1vh) translateX(0) scale(1.02);
          }

          100% {
            transform: translateY(0) translateX(0) scale(1);
            opacity: 1;
          }
        }

        @keyframes satelliteOrbit {
          0% {
            transform: translate(-3px, -50%) rotate(0deg);
          }

          50% {
            transform: translate(3px, -50%) rotate(180deg);
          }

          100% {
            transform: translate(-3px, -50%) rotate(360deg);
          }
        }

        @keyframes modalEnter {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.97);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes loaderSpin {
          from {
            transform: rotateX(65deg) rotateZ(0deg);
          }

          to {
            transform: rotateX(65deg) rotateZ(360deg);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .orbit-planet-trigger,
          .orbit-satellite,
          .orbit-loader-ring {
            animation: none;
          }

          .modal-enter {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}