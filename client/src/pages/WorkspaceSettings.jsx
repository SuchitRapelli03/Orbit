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
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="h-2 w-2 animate-pulse rounded-full bg-indigo-500" />
          Loading workspace settings...
        </div>
      </div>
    );
  }

  if (!workspace) {
    return null;
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="hidden w-72 shrink-0 flex-col border-r border-slate-800 bg-slate-900 lg:flex">
        {/* BRAND */}

        <div className="border-b border-slate-800 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 font-bold">
              O
            </div>

            <div>
              <h1 className="text-xl font-bold">
                Orbit
              </h1>

              <p className="text-xs text-slate-500">
                Collaborative Workspace
              </p>
            </div>
          </div>
        </div>

        {/* WORKSPACE */}

        <div className="border-b border-slate-800 p-4">
          <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Workspace
          </p>

          <div className="flex items-center gap-3 rounded-xl bg-slate-800 px-3 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-400">
              <FolderKanban size={18} />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {workspace.name}
              </p>

              <p className="text-xs text-slate-500">
                Workspace
              </p>
            </div>
          </div>
        </div>

        {/* NAVIGATION */}

        <nav className="space-y-1 px-4 py-5">
          <button
            onClick={() =>
              navigate("/dashboard")
            }
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>

          <button
            onClick={() =>
              navigate("/dashboard")
            }
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <FolderKanban size={18} />
            Boards
          </button>

          <button
            className="flex w-full items-center gap-3 rounded-lg bg-indigo-600/15 px-3 py-2.5 text-sm font-medium text-indigo-400"
          >
            <Settings size={18} />
            Workspace Settings
          </button>
        </nav>

        {/* USER */}

        <div className="mt-auto border-t border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 font-semibold">
              {user?.name
                ?.charAt(0)
                ?.toUpperCase() ||
                "U"}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {user?.name ||
                  "User"}
              </p>

              <p className="truncate text-xs text-slate-500">
                {user?.email || ""}
              </p>
            </div>

            <button
              onClick={logout}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-red-400"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="min-w-0 flex-1">
        {/* HEADER */}

        <header className="border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-4 px-5 py-5 lg:px-8">
            <button
              onClick={() =>
                navigate("/dashboard")
              }
              className="rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              title="Back to Dashboard"
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Workspace Settings
              </p>

              <h1 className="mt-1 text-2xl font-bold">
                {workspace.name}
              </h1>
            </div>
          </div>
        </header>

        {/* MESSAGE */}

        {message && (
          <div className="fixed right-5 top-5 z-50">
            <div
              className={`rounded-xl border px-4 py-3 text-sm shadow-2xl ${
                messageType ===
                "error"
                  ? "border-red-500/20 bg-red-500/10 text-red-400"
                  : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
              }`}
            >
              {message}
            </div>
          </div>
        )}

        <div className="mx-auto max-w-6xl p-5 lg:p-8">
          {/* INTRO */}

          <div className="mb-8">
            <p className="text-sm text-slate-500">
              Manage your workspace,
              members and invitations.
            </p>
          </div>

          {/* =================================================
              SETTINGS NAV
          ================================================= */}

          <div className="mb-6 flex gap-2 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 p-1.5">
            <button
              onClick={() =>
                setActiveSection(
                  "general"
                )
              }
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                activeSection ===
                "general"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Settings size={16} />
              General
            </button>

            <button
              onClick={() =>
                setActiveSection(
                  "members"
                )
              }
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                activeSection ===
                "members"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Users size={16} />
              Members
            </button>

            {isOwner && (
              <button
                onClick={() =>
                  setActiveSection(
                    "invitations"
                  )
                }
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                  activeSection ===
                  "invitations"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Mail size={16} />
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
              <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                    <Settings
                      size={21}
                    />
                  </div>

                  <div>
                    <h2 className="text-lg font-bold">
                      General Settings
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
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
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Workspace Name
                  </label>

                  <div className="flex gap-3">
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
                      className="min-w-0 flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                    />

                    {isOwner && (
                      <button
                        type="submit"
                        disabled={
                          saving
                        }
                        className="flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold transition hover:bg-indigo-500 disabled:opacity-50"
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
                    <p className="mt-3 text-xs text-slate-600">
                      Only the workspace
                      owner can edit
                      workspace settings.
                    </p>
                  )}
                </form>
              </section>

              {/* WORKSPACE INFO */}

              <section className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                    <Users size={19} />
                  </div>

                  <p className="text-sm text-slate-500">
                    Members
                  </p>

                  <p className="mt-1 text-3xl font-bold">
                    {workspace.members
                      ?.length ||
                      0}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                    <FolderKanban
                      size={19}
                    />
                  </div>

                  <p className="text-sm text-slate-500">
                    Boards
                  </p>

                  <p className="mt-1 text-3xl font-bold">
                    {workspace.boards
                      ?.length ||
                      0}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                    <Shield size={19} />
                  </div>

                  <p className="text-sm text-slate-500">
                    Your role
                  </p>

                  <p className="mt-1 text-xl font-bold">
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
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                    <Users size={21} />
                  </div>

                  <div>
                    <h2 className="text-lg font-bold">
                      Team Members
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      People who have access
                      to this workspace.
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-400">
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
                        className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4 transition hover:border-slate-700"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 font-semibold">
                            {member.name
                              ?.charAt(
                                0
                              )
                              ?.toUpperCase() ||
                              "U"}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-200">
                              {member.name ||
                                "Unknown User"}
                            </p>

                            <p className="truncate text-xs text-slate-500">
                              {member.email ||
                                ""}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-3">
                          {memberIsOwner ? (
                            <span className="flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-400">
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
                              className="rounded-lg p-2 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
                              title="Remove member"
                            >
                              <Trash2
                                size={
                                  17
                                }
                              />
                            </button>
                          ) : (
                            <span className="rounded-full bg-slate-800 px-3 py-1.5 text-xs text-slate-500">
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

                <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                  <div className="mb-6 flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                      <UserPlus
                        size={21}
                      />
                    </div>

                    <div>
                      <h2 className="text-lg font-bold">
                        Invite Team Member
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
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
                    className="flex max-w-2xl gap-3"
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
                      className="min-w-0 flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-indigo-500"
                    />

                    <button
                      type="submit"
                      disabled={
                        inviting
                      }
                      className="flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold transition hover:bg-indigo-500 disabled:opacity-50"
                    >
                      <Mail
                        size={17}
                      />

                      {inviting
                        ? "Sending..."
                        : "Send Invite"}
                    </button>
                  </form>

                  <p className="mt-3 text-xs text-slate-600">
                    The invitation will
                    appear in the recipient's
                    Orbit invitation inbox.
                  </p>
                </section>

                {/* SENT INVITATIONS */}

                <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                  <div className="mb-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-slate-400">
                        <Clock
                          size={19}
                        />
                      </div>

                      <div>
                        <h2 className="text-lg font-bold">
                          Sent Invitations
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
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
                            className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-500">
                                <Mail
                                  size={
                                    16
                                  }
                                />
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-slate-200">
                                  {
                                    invitation.email
                                  }
                                </p>

                                <p className="mt-1 text-xs text-slate-600">
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
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : invitation.status ===
                                    "declined"
                                  ? "bg-red-500/10 text-red-400"
                                  : "bg-amber-500/10 text-amber-400"
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
                    <div className="rounded-xl border border-dashed border-slate-800 py-10 text-center">
                      <Mail
                        size={28}
                        className="mx-auto mb-3 text-slate-700"
                      />

                      <p className="text-sm text-slate-500">
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
  );
}