import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useOrbitStore } from "../store/useOrbitStore";

export default function Login() {
  const navigate = useNavigate();
  const setUser = useOrbitStore((s) => s.setUser);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/auth/login", form);
      localStorage.setItem("orbit_token", data.token);
      localStorage.setItem("orbit_user", JSON.stringify(data.user));
      setUser(data.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to sign in");
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your Orbit workspace.">
      <form onSubmit={submit} className="space-y-4">
        <input className="w-full rounded-xl border p-3" placeholder="Email" type="email"
          value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input className="w-full rounded-xl border p-3" placeholder="Password" type="password"
          value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
        <button className="w-full rounded-xl bg-slate-900 p-3 font-semibold text-white hover:bg-slate-800">Sign in</button>
        <p className="text-center text-sm text-slate-500">New to Orbit? <Link className="font-semibold text-slate-900" to="/register">Create an account</Link></p>
      </form>
    </AuthShell>
  );
}

function AuthShell({ title, subtitle, children }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-2">
        <div className="hidden bg-slate-900 p-10 text-white md:block">
          <div className="mb-16 text-2xl font-black tracking-tight">◉ Orbit</div>
          <h2 className="text-4xl font-bold leading-tight">Work together.<br />Move faster.</h2>
          <p className="mt-5 text-slate-300">A real-time collaborative workspace for modern Agile teams.</p>
        </div>
        <div className="p-8 md:p-10">
          <div className="mb-8">
            <div className="mb-3 text-xl font-black md:hidden">◉ Orbit</div>
            <h1 className="text-3xl font-bold">{title}</h1>
            <p className="mt-2 text-slate-500">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}
