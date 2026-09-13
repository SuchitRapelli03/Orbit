import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../lib/api";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/auth/register", form);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create account");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="text-2xl font-black">◉ Orbit</div>
          <h1 className="mt-5 text-3xl font-bold">Create account</h1>
          <p className="mt-2 text-slate-500">Start collaborating with your team.</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          {["name", "email", "password"].map((field) => (
            <input key={field} className="w-full rounded-xl border p-3"
              placeholder={field[0].toUpperCase() + field.slice(1)}
              type={field === "password" ? "password" : field === "email" ? "email" : "text"}
              value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} required />
          ))}
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
          <button className="w-full rounded-xl bg-slate-900 p-3 font-semibold text-white">Create account</button>
          <p className="text-center text-sm text-slate-500">Already registered? <Link className="font-semibold text-slate-900" to="/login">Sign in</Link></p>
        </form>
      </div>
    </main>
  );
}
