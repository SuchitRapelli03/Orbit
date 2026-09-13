import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useOrbitStore } from "../store/useOrbitStore";

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useOrbitStore((s) => s.user);
  const setWorkspace = useOrbitStore((s) => s.setWorkspace);
  const [workspaces, setWorkspaces] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem("orbit_token")) { navigate("/login"); return; }
    api.get("/workspaces").then((r) => setWorkspaces(r.data.workspaces)).finally(() => setLoading(false));
  }, [navigate]);

  async function createWorkspace(e) {
    e.preventDefault();
    if (!name.trim()) return;
    const { data } = await api.post("/workspaces", { name });
    setWorkspaces((items) => [data.workspace, ...items]);
    setWorkspace(data.workspace);
    setName("");
  }

  function logout() {
    localStorage.removeItem("orbit_token");
    localStorage.removeItem("orbit_user");
    navigate("/login");
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="text-2xl font-black">◉ Orbit</div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">{user?.name}</span>
            <button onClick={logout} className="rounded-lg border px-3 py-2 text-sm">Logout</button>
          </div>
        </div>
      </header>
      <section className="mx-auto max-w-7xl p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Your workspaces</h1>
          <p className="mt-2 text-slate-500">Create a workspace and invite your team.</p>
        </div>
        <form onSubmit={createWorkspace} className="mb-8 flex max-w-xl gap-3">
          <input className="flex-1 rounded-xl border bg-white p-3" placeholder="Workspace name"
            value={name} onChange={(e) => setName(e.target.value)} />
          <button className="rounded-xl bg-slate-900 px-5 font-semibold text-white">Create</button>
        </form>
        {loading ? <p>Loading...</p> : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((workspace) => (
              <WorkspaceCard key={workspace._id} workspace={workspace} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function WorkspaceCard({ workspace }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-soft">
      <h2 className="text-lg font-bold">{workspace.name}</h2>
      <p className="mt-1 text-sm text-slate-500">{workspace.members?.length || 0} member(s)</p>
      <div className="mt-5 space-y-2">
        {workspace.boards?.map((board) => (
          <Link key={board._id} to={`/boards/${board._id}`} className="block rounded-xl bg-slate-100 p-3 hover:bg-slate-200">
            {board.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
