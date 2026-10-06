import { useEffect, useState } from "react";

import {
  ArrowLeft,
  Settings,
  Users,
  Mail,
  Trash2,
  Save,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  UserPlus,
  Shield,
  Clock,
  PanelLeftClose,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../lib/api";

import { useOrbitStore } from "../store/useOrbitStore";

export default function WorkspaceSettings() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();

  const user = useOrbitStore(
    (state) => state.user
  );

  const setWorkspaceStore =
    useOrbitStore(
      (state) => state.setWorkspace
    );

  const [workspace, setWorkspace] =
    useState(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [inviting, setInviting] =
    useState(false);

  const [activeSection, setActiveSection] =
    useState("general");

  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState("success");

  /* =========================================================
     ORBIT NAVIGATION
  ========================================================= */

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

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
    setPlanetLanding(true);

    window.setTimeout(() => {
      setSidebarOpen(false);
    }, 120);

    window.setTimeout(() => {
      setPlanetLanding(false);
    }, 720);
  };

  /* =========================================================
     LOAD WORKSPACE
  ========================================================= */

  useEffect(() => {
    if (
      !localStorage.getItem(
        "orbit_token"
      )
    ) {
      navigate("/login");
      return;
    }

    loadWorkspace();
  }, [workspaceId, navigate]);

  async function loadWorkspace() {
    try {
      setLoading(true);

      const { data } = await api.get(
        `/workspaces/${workspaceId}`
      );

      const loadedWorkspace =
        data.workspace;

      setWorkspace(
        loadedWorkspace
      );

      setName(
        loadedWorkspace.name || ""
      );

      setWorkspaceStore(
        loadedWorkspace
      );
    } catch (error) {
      console.error(
        "Failed to load workspace:",
        error
      );

      showMessage(
        error.response?.data?.message ||
          "Failed to load workspace",
        "error"
      );

      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     OWNER CHECK
  ========================================================= */

  const currentUserId =
    user?._id ||
    user?.id ||
    null;

  const ownerId =
    workspace?.owner?._id ||
    workspace?.owner?.id ||
    workspace?.owner ||
    null;

  const isOwner =
    currentUserId &&
    ownerId &&
    String(currentUserId) ===
      String(ownerId);

  /* =========================================================
     MESSAGE
  ========================================================= */

  function showMessage(
    text,
    type = "success"
  ) {
    setMessage(text);
    setMessageType(type);

    setTimeout(() => {
      setMessage("");
    }, 3500);
  }

  /* =========================================================
     SAVE WORKSPACE
  ========================================================= */

  async function saveWorkspace(event) {
    event.preventDefault();

    if (!name.trim()) {
      showMessage(
        "Workspace name is required.",
        "error"
      );
      return;
    }

    if (!isOwner) {
      showMessage(
        "Only the workspace owner can change the workspace name.",
        "error"
      );
      return;
    }

    try {
      setSaving(true);

      const { data } =
        await api.patch(
          `/workspaces/${workspaceId}`,
          {
            name: name.trim(),
          }
        );

      const updatedWorkspace = {
        ...workspace,
        name: data.workspace.name,
      };

      setWorkspace(
        updatedWorkspace
      );

      setWorkspaceStore(
        updatedWorkspace
      );

      setName(
        data.workspace.name
      );

      showMessage(
        "Workspace name updated successfully."
      );
    } catch (error) {
      console.error(
        "Failed to update workspace:",
        error
      );

      showMessage(
        error.response?.data?.message ||
          "Failed to update workspace",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     INVITE MEMBER
  ========================================================= */

  async function inviteMember(event) {
    event.preventDefault();

    if (!email.trim()) {
      showMessage(
        "Please enter an email address.",
        "error"
      );
      return;
    }

    if (!isOwner) {
      showMessage(
        "Only the workspace owner can invite members.",
        "error"
      );
      return;
    }

    try {
      setInviting(true);

      const { data } =
        await api.post(
          `/workspaces/${workspaceId}/invitations`,
          {
            email:
              email
                .trim()
                .toLowerCase(),
          }
        );

      setWorkspace(
        (current) => ({
          ...current,
          invitations: [
            ...(current.invitations ||
              []),
            data.invitation,
          ],
        })
      );

      setEmail("");

      showMessage(
        "Invitation created successfully."
      );
    } catch (error) {
      console.error(
        "Failed to invite member:",
        error
      );

      showMessage(
        error.response?.data?.message ||
          "Failed to invite member",
        "error"
      );
    } finally {
      setInviting(false);
    }
  }

  /* =========================================================
     REMOVE MEMBER
  ========================================================= */

  async function removeMember(
    memberId
  ) {
    if (!isOwner) {
      showMessage(
        "Only the workspace owner can remove members.",
        "error"
      );
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to remove this member from the workspace?"
      );

    if (!confirmed) return;

    try {
      await api.delete(
        `/workspaces/${workspaceId}/members/${memberId}`
      );

      const updatedWorkspace = {
        ...workspace,
        members:
          workspace.members.filter(
            (member) =>
              String(
                member._id
              ) !== String(memberId)
          ),
      };

      setWorkspace(
        updatedWorkspace
      );

      setWorkspaceStore(
        updatedWorkspace
      );

      showMessage(
        "Member removed successfully."
      );
    } catch (error) {
      console.error(
        "Failed to remove member:",
        error
      );

      showMessage(
        error.response?.data?.message ||
          "Failed to remove member",
        "error"
      );
    }
  }

  /* =========================================================
     LOGOUT
  ========================================================= */

  function logout() {
    localStorage.removeItem(
      "orbit_token"
    );

    localStorage.removeItem(
      "orbit_user"
    );

    setWorkspaceStore(null);

    navigate("/login");
  }

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <>
        <div className="flex min-h-screen items-center justify-center bg-[#F5F2EA] text-[#17201C]">
          <div className="flex items-center gap-3 text-sm text-[#78948B]">
            <div className="h-2 w-2 animate-pulse rounded-full bg-[#79C8BC]" />
            Loading workspace settings...
          </div>
        </div>

        <style>{`
          @media (prefers-reduced-motion: reduce) {
            * {
              animation: none !important;
              transition: none !important;
            }
          }
        `}</style>
      </>
    );
  }

  if (!workspace) {
    return null;
  }

  return (
    <>
      <div className="min-h-screen overflow-x-hidden bg-[#F5F2EA] text-[#17201C]">

        {/* ===================================================
            ATMOSPHERE
        =================================================== */}

        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-cyan-300/10 blur-[120px]" />

          <div className="absolute right-[-160px] top-[20%] h-[480px] w-[480px] rounded-full bg-orange-300/10 blur-[120px]" />

          <div className="absolute bottom-[-220px] left-[35%] h-[500px] w-[500px] rounded-full bg-amber-200/10 blur-[120px]" />

          <div className="absolute left-[14%] top-[18%] h-1.5 w-1.5 rounded-full bg-cyan-400/50" />

          <div className="absolute right-[19%] top-[28%] h-1 w-1 rounded-full bg-orange-400/50" />

          <div className="absolute bottom-[15%] left-[42%] h-1 w-1 rounded-full bg-amber-400/50" />
        </div>

        {/* ===================================================
            MOBILE BACKDROP
        =================================================== */}

        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close navigation backdrop"
            onClick={closeSidebar}
            className="fixed inset-0 z-40 bg-[#17201C]/25 backdrop-blur-[2px] lg:hidden"
          />
        )}

        {/* ===================================================
            ORBIT PLANET TRIGGER
        =================================================== */}

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

        {/* ===================================================
            SIDEBAR
        =================================================== */}

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

          {/* BRAND */}

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

              <div className="w-full rounded-2xl border border-[#41645A] bg-[#294A41]/65 px-3 py-3 transition hover:border-[#6FAEA2] hover:bg-[#31554B]">

                <div className="flex items-center gap-3">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#79C8BC]/10 text-[#9EDDD4]">
                    <FolderKanban
                      size={18}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#FFF8EA]">
                      {workspace.name}
                    </p>

                    <p className="text-xs text-[#78948B]">
                      {workspace.members?.length || 0} members
                    </p>
                  </div>

                </div>

              </div>

            </div>
          </div>

          {/* NAVIGATION */}

          <nav className="relative px-4">

            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#78948B]">
              Navigate
            </p>

            <button
              type="button"
              onClick={() => {
                closeSidebar();
                navigate("/dashboard");
              }}
              className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[#A8BDB7] transition hover:bg-white/5 hover:text-[#FFF8EA]"
            >
              <LayoutDashboard
                size={18}
              />

              <span className="text-sm font-medium">
                Dashboard
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                closeSidebar();
                navigate("/dashboard");
              }}
              className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[#A8BDB7] transition hover:bg-white/5 hover:text-[#FFF8EA]"
            >
              <FolderKanban
                size={18}
              />

              <span className="text-sm font-medium">
                Boards
              </span>
            </button>

            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl border border-[#6FAEA2]/20 bg-[#79C8BC]/12 px-3 py-3 text-left text-[#DDF7F3]"
            >
              <Settings
                size={18}
              />

              <span className="text-sm font-medium">
                Workspace Settings
              </span>

              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#79C8BC] shadow-[0_0_10px_rgba(121,200,188,0.7)]" />
            </button>

          </nav>

          {/* USER */}

          <div className="relative mt-auto border-t border-[#41645A] p-4">

            <div className="flex items-center gap-3 rounded-2xl border border-[#41645A] bg-[#294A41]/55 p-3">

              <div className="orbit-user-avatar">
                {user?.name
                  ?.charAt(0)
                  ?.toUpperCase() ||
                  "U"}
              </div>

              <div className="min-w-0 flex-1">

                <p className="truncate text-sm font-medium text-[#FFF8EA]">
                  {user?.name ||
                    "User"}
                </p>

                <p className="truncate text-xs text-[#78948B]">
                  {user?.email || ""}
                </p>

              </div>

              <button
                onClick={logout}
                title="Logout"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#91AAA2] transition hover:bg-[#F39A70]/10 hover:text-[#F6B294]"
              >
                <LogOut
                  size={16}
                />
              </button>

            </div>
          </div>

        </aside>

        {/* ===================================================
            MAIN
        =================================================== */}

        <main
          className={`relative min-h-screen min-w-0 transition-[padding] duration-500 ${
            sidebarOpen
              ? "lg:pl-[285px]"
              : "pl-0"
          }`}
        >

          {/* HEADER */}

          <header className="border-b border-[#DED8CC] bg-[#F5F2EA]/85 backdrop-blur-xl">

            <div className="mx-auto flex max-w-[1440px] items-center gap-4 px-5 py-6 sm:px-8 lg:px-12">

              <button
                onClick={() =>
                  navigate("/dashboard")
                }
                className="rounded-xl border border-[#DED8CC] bg-white/70 p-2.5 text-[#78948B] shadow-[0_5px_20px_rgba(16,24,39,0.03)] transition hover:border-[#BFCBC5] hover:bg-white hover:text-[#17201C]"
                title="Back to Dashboard"
              >
                <ArrowLeft
                  size={18}
                />
              </button>

              <div>

                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#78948B]">
                  Workspace Settings
                </p>

                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#101827] sm:text-3xl">
                  {workspace.name}
                </h1>

              </div>

            </div>
          </header>

          {/* MESSAGE */}

          {message && (
            <div className="fixed right-5 top-5 z-[70]">

              <div
                className={`rounded-2xl border bg-[#FBFAF6] px-4 py-3 text-sm shadow-[0_20px_50px_rgba(16,24,39,0.14)] ${
                  messageType ===
                  "error"
                    ? "border-[#D58C70]/30 text-[#B86F57]"
                    : "border-[#79C8BC]/30 text-[#2F8F83]"
                }`}
              >

                <div className="flex items-center gap-2">

                  <span
                    className={`h-2 w-2 rounded-full ${
                      messageType ===
                      "error"
                        ? "bg-[#D58C70]"
                        : "bg-[#79C8BC]"
                    }`}
                  />

                  {message}

                </div>

              </div>

            </div>
          )}

          {/* CONTENT */}

          <div className="mx-auto max-w-[1200px] px-5 py-7 sm:px-8 lg:px-12 lg:py-10">

            {/* INTRO */}

            <div className="mb-7">

              <p className="text-sm text-[#78948B]">
                Manage your workspace,
                members and invitations.
              </p>

            </div>

            {/* =================================================
                SETTINGS NAV
            ================================================= */}

            <div className="mb-7 flex gap-2 overflow-x-auto rounded-2xl border border-[#DED8CC] bg-white/65 p-1.5 shadow-[0_8px_30px_rgba(16,24,39,0.035)]">

              <button
                onClick={() =>
                  setActiveSection(
                    "general"
                  )
                }
                className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  activeSection ===
                  "general"
                    ? "bg-[#17201C] text-white shadow-[0_8px_20px_rgba(16,24,39,0.12)]"
                    : "text-[#78948B] hover:bg-[#F5F2EA] hover:text-[#17201C]"
                }`}
              >
                <Settings
                  size={16}
                />

                General
              </button>

              <button
                onClick={() =>
                  setActiveSection(
                    "members"
                  )
                }
                className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  activeSection ===
                  "members"
                    ? "bg-[#17201C] text-white shadow-[0_8px_20px_rgba(16,24,39,0.12)]"
                    : "text-[#78948B] hover:bg-[#F5F2EA] hover:text-[#17201C]"
                }`}
              >
                <Users
                  size={16}
                />

                Members
              </button>

              {isOwner && (
                <button
                  onClick={() =>
                    setActiveSection(
                      "invitations"
                    )
                  }
                  className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                    activeSection ===
                    "invitations"
                      ? "bg-[#17201C] text-white shadow-[0_8px_20px_rgba(16,24,39,0.12)]"
                      : "text-[#78948B] hover:bg-[#F5F2EA] hover:text-[#17201C]"
                  }`}
                >
                  <Mail
                    size={16}
                  />

                  Invitations
                </button>
              )}
            </div>

            {/* =================================================
                GENERAL
            ================================================= */}

            {activeSection ===
              "general" && (
              <div className="space-y-5">

                <section className="rounded-3xl border border-[#DED8CC] bg-white/80 p-6 shadow-[0_8px_30px_rgba(16,24,39,0.035)] sm:p-7">

                  <div className="mb-7 flex items-start gap-4">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#79C8BC]/12 text-[#2F8F83]">
                      <Settings
                        size={21}
                      />
                    </div>

                    <div>
                      <h2 className="text-lg font-semibold text-[#101827]">
                        General Settings
                      </h2>

                      <p className="mt-1 text-sm text-[#78948B]">
                        Manage basic workspace
                        information.
                      </p>
                    </div>

                  </div>

                  <form
                    onSubmit={
                      saveWorkspace
                    }
                    className="max-w-2xl"
                  >

                    <label className="mb-2 block text-sm font-semibold text-[#17201C]">
                      Workspace Name
                    </label>

                    <div className="flex flex-col gap-3 sm:flex-row">

                      <input
                        value={name}
                        onChange={(e) =>
                          setName(
                            e.target.value
                          )
                        }
                        disabled={
                          !isOwner
                        }
                        className="min-w-0 flex-1 rounded-xl border border-[#D9D3C8] bg-white px-4 py-3 text-sm text-[#101827] outline-none transition placeholder:text-slate-400 focus:border-[#2F8F83] focus:ring-4 focus:ring-[#79C8BC]/10 disabled:cursor-not-allowed disabled:bg-[#F5F2EA] disabled:opacity-60"
                      />

                      {isOwner && (
                        <button
                          type="submit"
                          disabled={
                            saving
                          }
                          className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#17201C] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(16,24,39,0.15)] transition hover:bg-[#2F8F83] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Save
                            size={17}
                          />

                          {saving
                            ? "Saving..."
                            : "Save"}
                        </button>
                      )}

                    </div>

                    {!isOwner && (
                      <p className="mt-3 text-xs text-[#78948B]">
                        Only the workspace
                        owner can edit
                        workspace settings.
                      </p>
                    )}

                  </form>
                </section>

                {/* WORKSPACE INFO */}

                <section className="grid gap-4 md:grid-cols-3">

                  <div className="orbit-settings-card rounded-2xl border border-[#DED8CC] bg-white/80 p-5 shadow-[0_8px_30px_rgba(16,24,39,0.035)]">

                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
                      <Users
                        size={19}
                      />
                    </div>

                    <p className="text-sm text-[#78948B]">
                      Members
                    </p>

                    <p className="mt-1 text-3xl font-semibold tracking-tight text-[#101827]">
                      {workspace.members
                        ?.length ||
                        0}
                    </p>

                  </div>

                  <div className="orbit-settings-card rounded-2xl border border-[#DED8CC] bg-white/80 p-5 shadow-[0_8px_30px_rgba(16,24,39,0.035)]">

                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                      <FolderKanban
                        size={19}
                      />
                    </div>

                    <p className="text-sm text-[#78948B]">
                      Boards
                    </p>

                    <p className="mt-1 text-3xl font-semibold tracking-tight text-[#101827]">
                      {workspace.boards
                        ?.length ||
                        0}
                    </p>

                  </div>

                  <div className="orbit-settings-card rounded-2xl border border-[#DED8CC] bg-white/80 p-5 shadow-[0_8px_30px_rgba(16,24,39,0.035)]">

                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <Shield
                        size={19}
                      />
                    </div>

                    <p className="text-sm text-[#78948B]">
                      Your role
                    </p>

                    <p className="mt-1 text-xl font-semibold text-[#101827]">
                      {isOwner
                        ? "Owner"
                        : "Member"}
                    </p>

                  </div>

                </section>
              </div>
            )}

            {/* =================================================
                MEMBERS
            ================================================= */}

            {activeSection ===
              "members" && (
              <section className="rounded-3xl border border-[#DED8CC] bg-white/80 p-6 shadow-[0_8px_30px_rgba(16,24,39,0.035)] sm:p-7">

                <div className="mb-6 flex items-start justify-between gap-4">

                  <div className="flex items-start gap-4">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#79C8BC]/12 text-[#2F8F83]">
                      <Users
                        size={21}
                      />
                    </div>

                    <div>
                      <h2 className="text-lg font-semibold text-[#101827]">
                        Team Members
                      </h2>

                      <p className="mt-1 text-sm text-[#78948B]">
                        People who have access
                        to this workspace.
                      </p>
                    </div>

                  </div>

                  <span className="shrink-0 rounded-full border border-[#DED8CC] bg-[#F5F2EA] px-3 py-1.5 text-xs font-semibold text-[#78948B]">
                    {workspace.members
                      ?.length ||
                      0}{" "}
                    members
                  </span>

                </div>

                <div className="space-y-3">

                  {workspace.members?.map(
                    (member) => {
                      const memberId =
                        member._id ||
                        member.id;

                      const memberIsOwner =
                        String(
                          memberId
                        ) ===
                        String(ownerId);

                      return (
                        <div
                          key={
                            memberId
                          }
                          className="orbit-settings-card flex items-center justify-between gap-4 rounded-2xl border border-[#DED8CC] bg-white/75 p-4 transition hover:-translate-y-0.5 hover:border-[#C8D4CF] hover:shadow-[0_12px_30px_rgba(16,24,39,0.05)]"
                        >

                          <div className="flex min-w-0 items-center gap-3">

                            <div className="orbit-user-avatar">
                              {member.name
                                ?.charAt(
                                  0
                                )
                                ?.toUpperCase() ||
                                "U"}
                            </div>

                            <div className="min-w-0">

                              <p className="truncate text-sm font-semibold text-[#17201C]">
                                {member.name ||
                                  "Unknown User"}
                              </p>

                              <p className="truncate text-xs text-[#78948B]">
                                {member.email ||
                                  ""}
                              </p>

                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-3">

                            {memberIsOwner ? (
                              <span className="flex items-center gap-1.5 rounded-full bg-[#79C8BC]/12 px-3 py-1.5 text-xs font-semibold text-[#2F8F83]">
                                <Shield
                                  size={
                                    13
                                  }
                                />

                                Owner
                              </span>
                            ) : isOwner ? (
                              <button
                                type="button"
                                onClick={() =>
                                  removeMember(
                                    memberId
                                  )
                                }
                                className="rounded-xl p-2 text-[#A9AAA1] transition hover:bg-[#D58C70]/10 hover:text-[#B86F57]"
                                title="Remove member"
                              >
                                <Trash2
                                  size={
                                    17
                                  }
                                />
                              </button>
                            ) : (
                              <span className="rounded-full border border-[#DED8CC] bg-[#F5F2EA] px-3 py-1.5 text-xs text-[#78948B]">
                                Member
                              </span>
                            )}

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>
              </section>
            )}

            {/* =================================================
                INVITATIONS
            ================================================= */}

            {activeSection ===
              "invitations" &&
              isOwner && (
                <div className="space-y-5">

                  {/* INVITE */}

                  <section className="rounded-3xl border border-[#DED8CC] bg-white/80 p-6 shadow-[0_8px_30px_rgba(16,24,39,0.035)] sm:p-7">

                    <div className="mb-6 flex items-start gap-4">

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                        <UserPlus
                          size={21}
                        />
                      </div>

                      <div>
                        <h2 className="text-lg font-semibold text-[#101827]">
                          Invite Team Member
                        </h2>

                        <p className="mt-1 text-sm text-[#78948B]">
                          Invite another Orbit
                          user to join this
                          workspace.
                        </p>
                      </div>

                    </div>

                    <form
                      onSubmit={
                        inviteMember
                      }
                      className="flex max-w-2xl flex-col gap-3 sm:flex-row"
                    >

                      <input
                        type="email"
                        placeholder="team-member@example.com"
                        value={email}
                        onChange={(e) =>
                          setEmail(
                            e.target.value
                          )
                        }
                        className="min-w-0 flex-1 rounded-xl border border-[#D9D3C8] bg-white px-4 py-3 text-sm text-[#101827] outline-none transition placeholder:text-slate-400 focus:border-[#2F8F83] focus:ring-4 focus:ring-[#79C8BC]/10"
                      />

                      <button
                        type="submit"
                        disabled={
                          inviting
                        }
                        className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#17201C] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(16,24,39,0.15)] transition hover:bg-[#2F8F83] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Mail
                          size={17}
                        />

                        {inviting
                          ? "Sending..."
                          : "Send Invite"}
                      </button>

                    </form>

                    <p className="mt-3 text-xs text-[#78948B]">
                      The invitation will
                      appear in the recipient's
                      Orbit invitation inbox.
                    </p>

                  </section>

                  {/* SENT INVITATIONS */}

                  <section className="rounded-3xl border border-[#DED8CC] bg-white/80 p-6 shadow-[0_8px_30px_rgba(16,24,39,0.035)] sm:p-7">

                    <div className="mb-6">

                      <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
                          <Clock
                            size={19}
                          />
                        </div>

                        <div>
                          <h2 className="text-lg font-semibold text-[#101827]">
                            Sent Invitations
                          </h2>

                          <p className="mt-1 text-sm text-[#78948B]">
                            Invitations sent from
                            this workspace.
                          </p>
                        </div>

                      </div>

                    </div>

                    {workspace
                      .invitations
                      ?.length ? (
                      <div className="space-y-3">

                        {workspace.invitations.map(
                          (
                            invitation
                          ) => (
                            <div
                              key={
                                invitation._id
                              }
                              className="flex items-center justify-between gap-4 rounded-2xl border border-[#DED8CC] bg-white/75 p-4"
                            >

                              <div className="flex min-w-0 items-center gap-3">

                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F5F2EA] text-[#78948B]">
                                  <Mail
                                    size={
                                      16
                                    }
                                  />
                                </div>

                                <div className="min-w-0">

                                  <p className="truncate text-sm font-medium text-[#17201C]">
                                    {
                                      invitation.email
                                    }
                                  </p>

                                  <p className="mt-1 text-xs text-[#9AA69F]">
                                    {invitation.invitedAt
                                      ? new Date(
                                          invitation.invitedAt
                                        ).toLocaleString()
                                      : ""}
                                  </p>

                                </div>
                              </div>

                              <span
                                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                                  invitation.status ===
                                  "accepted"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : invitation.status ===
                                      "declined"
                                    ? "bg-[#D58C70]/10 text-[#B86F57]"
                                    : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {
                                  invitation.status
                                }
                              </span>

                            </div>
                          )
                        )}

                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-[#CEC7BA] bg-[#F5F2EA]/60 py-12 text-center">

                        <Mail
                          size={28}
                          className="mx-auto mb-3 text-[#B4B0A5]"
                        />

                        <p className="text-sm text-[#78948B]">
                          No invitations sent
                          yet.
                        </p>

                      </div>
                    )}

                  </section>

                </div>
              )}

          </div>
        </main>
      </div>

      {/* =====================================================
          ORBIT STYLES
      ===================================================== */}

      <style>{`

        /* =====================================================
           PLANET TRIGGER
        ===================================================== */

        .orbit-planet-trigger {
          animation: planetFloat 3.8s ease-in-out infinite;
          will-change: transform;
        }

        .orbit-planet-trigger.planet-launching {
          animation:
            planetLaunch
            0.72s
            cubic-bezier(0.22,1,0.36,1)
            forwards;

          pointer-events: none;
        }

        .orbit-planet-trigger.planet-landing {
          animation:
            planetLanding
            0.72s
            cubic-bezier(0.22,1,0.36,1)
            forwards;
        }

        .orbit-planet {
          transition:
            transform 0.35s
              cubic-bezier(0.22,1,0.36,1),
            box-shadow 0.35s ease;
        }

        .orbit-planet-trigger:hover .orbit-planet {
          transform: scale(1.08);

          box-shadow:
            0 18px 45px
              rgba(23,32,28,0.32),
            0 0 35px
              rgba(121,200,188,0.14);
        }

        .orbit-planet-trigger:active .orbit-planet {
          transform: scale(0.94);
        }

        .orbit-satellite {
          animation:
            satelliteOrbit
            2.8s
            linear
            infinite;
        }

        /* =====================================================
           PLANET ANIMATIONS
        ===================================================== */

        @keyframes planetFloat {

          0%,
          100% {
            transform:
              translate3d(
                0,
                0,
                0
              );
          }

          50% {
            transform:
              translate3d(
                1px,
                -5px,
                0
              );
          }
        }

        @keyframes planetLaunch {

          0% {
            transform:
              translate3d(
                0,
                0,
                0
              )
              scale(1);

            opacity: 1;
          }

          20% {
            transform:
              translate3d(
                8px,
                -10vh,
                0
              )
              scale(1.02);

            opacity: 1;
          }

          55% {
            transform:
              translate3d(
                18px,
                -48vh,
                0
              )
              scale(0.92);

            opacity: 0.9;
          }

          80% {
            transform:
              translate3d(
                28px,
                -69vh,
                0
              )
              scale(0.65);

            opacity: 0.45;
          }

          100% {
            transform:
              translate3d(
                30px,
                -66vh,
                0
              )
              scale(0.35);

            opacity: 0;
          }
        }

        @keyframes planetLanding {

          0% {
            transform:
              translate3d(
                30px,
                -66vh,
                0
              )
              scale(0.35);

            opacity: 0;
          }

          20% {
            transform:
              translate3d(
                28px,
                -69vh,
                0
              )
              scale(0.55);

            opacity: 0.45;
          }

          55% {
            transform:
              translate3d(
                18px,
                -48vh,
                0
              )
              scale(0.82);

            opacity: 0.9;
          }

          80% {
            transform:
              translate3d(
                8px,
                -10vh,
                0
              )
              scale(1.02);

            opacity: 1;
          }

          100% {
            transform:
              translate3d(
                0,
                0,
                0
              )
              scale(1);

            opacity: 1;
          }
        }

        @keyframes satelliteOrbit {

          0% {
            transform:
              translateY(-50%)
              rotate(0deg)
              translateX(0);
          }

          25% {
            transform:
              translateY(-50%)
              rotate(90deg)
              translateX(2px);
          }

          50% {
            transform:
              translateY(-50%)
              rotate(180deg)
              translateX(0);
          }

          75% {
            transform:
              translateY(-50%)
              rotate(270deg)
              translateX(-2px);
          }

          100% {
            transform:
              translateY(-50%)
              rotate(360deg)
              translateX(0);
          }
        }

        /* =====================================================
           USER AVATAR
        ===================================================== */

        .orbit-user-avatar {
          display: flex;
          width: 38px;
          height: 38px;
          flex-shrink: 0;
          align-items: center;
          justify-content: center;
          border-radius: 999px;

          background:
            linear-gradient(
              145deg,
              #D58C70,
              #B86F57
            );

          color: #FFF6EA;
          font-size: 12px;
          font-weight: 800;

          box-shadow:
            0 7px 16px
              rgba(20,42,35,0.15);
        }

        /* =====================================================
           SETTINGS CARDS
        ===================================================== */

        .orbit-settings-card {
          transition:
            transform 180ms ease,
            border-color 180ms ease,
            box-shadow 180ms ease,
            background 180ms ease;
        }

        /* =====================================================
           SCROLLBARS
        ===================================================== */

        ::-webkit-scrollbar {
          width: 7px;
          height: 7px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        ::-webkit-scrollbar-thumb {
          border-radius: 999px;
          background: #C8C4B9;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #B4B0A5;
        }

        /* =====================================================
           REDUCED MOTION
        ===================================================== */

        @media (prefers-reduced-motion: reduce) {

          .orbit-planet-trigger,
          .orbit-satellite {
            animation: none !important;
          }

          .orbit-settings-card {
            animation: none !important;
            transition: none !important;
          }

          * {
            scroll-behavior: auto !important;
          }
        }

      `}</style>
    </>
  );
}