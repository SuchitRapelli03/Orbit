import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Settings,
  Users,
  Mail,
  Trash2,
  Save,
  FolderKanban,
  RefreshCw,
} from "lucide-react";

import api from "../lib/api";
import { useOrbitStore } from "../store/useOrbitStore";

export default function WorkspaceSettings() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();

  const user = useOrbitStore((s) => s.user);
  const setWorkspace = useOrbitStore(
    (s) => s.setWorkspace
  );

  const [workspace, setLocalWorkspace] =
    useState(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [refreshing, setRefreshing] =
    useState(false);


  /*
    Current logged-in user ID.
  */
  const currentUserId =
    user?._id ||
    user?.id ||
    null;


  /*
    Load workspace.
  */
  useEffect(() => {
    if (!localStorage.getItem("orbit_token")) {
      navigate("/login");
      return;
    }

    loadWorkspace();
  }, [workspaceId, navigate]);


  async function loadWorkspace(
    showRefresh = false
  ) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const { data } = await api.get(
        `/workspaces/${workspaceId}`
      );

      const loadedWorkspace =
        data.workspace;

      setLocalWorkspace(
        loadedWorkspace
      );

      setName(
        loadedWorkspace.name || ""
      );

      /*
        Keep global Zustand workspace
        synchronized with the latest data.
      */
      setWorkspace(
        loadedWorkspace
      );
    } catch (error) {
      console.error(
        "Failed to load workspace:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to load workspace"
      );

      navigate("/dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }


  /*
    Workspace owner ID.
  */
  const ownerId =
    workspace?.owner?._id ||
    workspace?.owner?.id ||
    workspace?.owner ||
    null;


  /*
    Owner check.
  */
  const isOwner =
    currentUserId &&
    ownerId &&
    String(currentUserId) ===
      String(ownerId);


  /*
    SAVE WORKSPACE NAME
  */
  async function saveWorkspace(e) {
    e.preventDefault();

    const trimmedName =
      name.trim();

    if (!trimmedName) {
      alert(
        "Workspace name is required."
      );
      return;
    }

    if (!isOwner) {
      alert(
        "Only the workspace owner can change the workspace name."
      );
      return;
    }

    try {
      setSaving(true);

      const { data } =
        await api.patch(
          `/workspaces/${workspaceId}`,
          {
            name: trimmedName,
          }
        );

      const updatedWorkspace =
        data.workspace;

      /*
        Update this page.
      */
      setLocalWorkspace(
        updatedWorkspace
      );

      setName(
        updatedWorkspace.name
      );

      /*
        Update global workspace.
      */
      setWorkspace(
        updatedWorkspace
      );

      alert(
        "Workspace name updated successfully."
      );
    } catch (error) {
      console.error(
        "Failed to update workspace:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to update workspace"
      );
    } finally {
      setSaving(false);
    }
  }


  /*
    INVITE MEMBER
  */
  async function inviteMember(e) {
    e.preventDefault();

    const trimmedEmail =
      email.trim().toLowerCase();

    if (!trimmedEmail) {
      alert(
        "Please enter an email address."
      );
      return;
    }

    if (!isOwner) {
      alert(
        "Only the workspace owner can invite members."
      );
      return;
    }

    try {
      setInviting(true);

      await api.post(
        `/workspaces/${workspaceId}/invitations`,
        {
          email: trimmedEmail,
        }
      );

      setEmail("");

      /*
        Reload from MongoDB instead of
        relying only on local state.
      */
      await loadWorkspace(true);

      alert(
        "Invitation created successfully."
      );
    } catch (error) {
      console.error(
        "Failed to invite member:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to invite member"
      );
    } finally {
      setInviting(false);
    }
  }


  /*
    REMOVE MEMBER
  */
  async function removeMember(
    memberId
  ) {
    if (!isOwner) {
      alert(
        "Only the workspace owner can remove members."
      );
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to remove this member from the workspace?"
      );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(
        `/workspaces/${workspaceId}/members/${memberId}`
      );

      await loadWorkspace(true);

      alert(
        "Member removed successfully."
      );
    } catch (error) {
      console.error(
        "Failed to remove member:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to remove member"
      );
    }
  }


  /*
    Loading screen.
  */
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-500">
          Loading workspace settings...
        </p>
      </div>
    );
  }


  if (!workspace) {
    return null;
  }


  return (
    <div className="min-h-screen bg-slate-100">

      {/* HEADER */}

      <header className="border-b bg-white">

        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">

          <div className="flex items-center gap-4">

            <Link
              to="/dashboard"
              className="rounded-xl p-2 transition hover:bg-slate-100"
              title="Back to Dashboard"
            >
              <ArrowLeft size={20} />
            </Link>

            <div>

              <p className="text-sm text-slate-400">
                Workspace Settings
              </p>

              <h1 className="text-2xl font-black">
                {workspace.name}
              </h1>

            </div>

          </div>


          <button
            type="button"
            onClick={() =>
              loadWorkspace(true)
            }
            disabled={refreshing}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white transition hover:bg-slate-800 disabled:opacity-50"
            title="Refresh workspace"
          >
            <RefreshCw
              size={19}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />
          </button>

        </div>

      </header>


      {/* MAIN */}

      <main className="mx-auto max-w-5xl space-y-6 p-6">


        {/* GENERAL SETTINGS */}

        <section className="rounded-2xl border bg-white p-6 shadow-sm">

          <div className="mb-6 flex items-start gap-4">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100">
              <Settings size={21} />
            </div>

            <div>

              <h2 className="text-xl font-bold">
                General Settings
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Manage basic workspace information.
              </p>

            </div>

          </div>


          <form
            onSubmit={saveWorkspace}
            className="max-w-xl"
          >

            <label className="mb-2 block text-sm font-semibold">
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
                disabled={!isOwner}
                className="flex-1 rounded-xl border px-4 py-3 outline-none transition focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
              />


              {isOwner && (
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  <Save size={17} />

                  {saving
                    ? "Saving..."
                    : "Save"}

                </button>
              )}

            </div>


            {!isOwner && (
              <p className="mt-2 text-xs text-slate-400">
                Only the workspace owner can edit
                workspace settings.
              </p>
            )}

          </form>

        </section>


        {/* MEMBERS */}

        <section className="rounded-2xl border bg-white p-6 shadow-sm">

          <div className="mb-6 flex items-start gap-4">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100">
              <Users size={21} />
            </div>

            <div>

              <h2 className="text-xl font-bold">
                Members
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                People who have access to this workspace.
              </p>

            </div>

          </div>


          {workspace.members?.length ? (

            <div className="space-y-3">

              {workspace.members.map(
                (member) => {

                  const memberId =
                    member._id ||
                    member.id;

                  const memberIsOwner =
                    String(memberId) ===
                    String(ownerId);

                  return (
                    <div
                      key={memberId}
                      className="flex items-center justify-between rounded-xl border p-4"
                    >

                      <div className="flex min-w-0 items-center gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 font-bold text-white">
                          {member.name
                            ?.charAt(0)
                            ?.toUpperCase() ||
                            "U"}
                        </div>

                        <div className="min-w-0">

                          <p className="truncate font-semibold">
                            {member.name ||
                              "Unknown User"}
                          </p>

                          <p className="truncate text-sm text-slate-500">
                            {member.email ||
                              ""}
                          </p>

                        </div>

                      </div>


                      <div className="ml-4 flex shrink-0 items-center gap-3">

                        {memberIsOwner ? (

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
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
                            className="rounded-lg p-2 text-red-500 transition hover:bg-red-50"
                            title="Remove member"
                          >
                            <Trash2
                              size={17}
                            />
                          </button>

                        ) : null}

                      </div>

                    </div>
                  );
                }
              )}

            </div>

          ) : (

            <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
              No members found.
            </p>

          )}

        </section>


        {/* INVITE */}

        {isOwner && (
          <section className="rounded-2xl border bg-white p-6 shadow-sm">

            <div className="mb-6 flex items-start gap-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                <Mail size={21} />
              </div>

              <div>

                <h2 className="text-xl font-bold">
                  Invite Team Member
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Create an invitation for another
                  Orbit user.
                </p>

              </div>

            </div>


            <form
              onSubmit={inviteMember}
              className="flex max-w-xl gap-3"
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
                className="flex-1 rounded-xl border px-4 py-3 outline-none focus:border-slate-400"
              />


              <button
                type="submit"
                disabled={inviting}
                className="rounded-xl bg-slate-900 px-5 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {inviting
                  ? "Inviting..."
                  : "Invite"}
              </button>

            </form>


            <p className="mt-3 text-xs text-slate-400">
              The invitation is stored in Orbit.
              Email delivery will be added later.
            </p>

          </section>
        )}


        {/* INVITATIONS */}

        {isOwner &&
          workspace.invitations?.length >
            0 && (

            <section className="rounded-2xl border bg-white p-6 shadow-sm">

              <div className="mb-5">

                <h2 className="text-xl font-bold">
                  Invitations
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Invitations sent from this workspace.
                </p>

              </div>


              <div className="space-y-3">

                {workspace.invitations.map(
                  (invitation) => (

                    <div
                      key={
                        invitation._id
                      }
                      className="flex items-center justify-between rounded-xl border p-4"
                    >

                      <div>

                        <p className="font-medium">
                          {
                            invitation.email
                          }
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {invitation.invitedAt
                            ? new Date(
                                invitation.invitedAt
                              ).toLocaleString()
                            : ""}
                        </p>

                      </div>


                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          invitation.status ===
                          "accepted"
                            ? "bg-green-100 text-green-700"
                            : invitation.status ===
                              "declined"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
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

            </section>
          )}


        {/* WORKSPACE INFORMATION */}

        <section className="rounded-2xl border bg-white p-6 shadow-sm">

          <h2 className="mb-5 text-xl font-bold">
            Workspace Information
          </h2>


          <div className="grid gap-4 md:grid-cols-2">

            <div className="rounded-xl bg-slate-50 p-4">

              <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
                <Users size={17} />
                Members
              </div>

              <p className="text-2xl font-black">
                {workspace.members
                  ?.length || 0}
              </p>

            </div>


            <div className="rounded-xl bg-slate-50 p-4">

              <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
                <FolderKanban
                  size={17}
                />
                Boards
              </div>

              <p className="text-2xl font-black">
                {workspace.boards
                  ?.length || 0}
              </p>

            </div>

          </div>

        </section>

      </main>

    </div>
  );
}