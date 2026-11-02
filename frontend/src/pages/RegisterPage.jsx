import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { ApiError } from "../services/api";
import { registerUser } from "../services/authService";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const strength = useMemo(() => [form.password.length >= 8, /[A-Z]/.test(form.password), /\d/.test(form.password)].filter(Boolean).length, [form.password]);
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  async function submit(event) {
    event.preventDefault(); setError("");
    if (!form.name.trim() || !form.email.trim() || !form.password) { setError("Complete all required fields."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError("Please enter a valid email address."); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    try { await registerUser(form.name.trim(), form.email.trim(), form.password); navigate("/login", { replace: true, state: { registered: true } }); }
    catch (err) { setError(err instanceof ApiError ? err.message : "Unable to connect to the server. Please try again."); }
    finally { setLoading(false); }
  }
  return <main className="grid min-h-screen place-items-center bg-slate-950 px-4 py-10"><div className="w-full max-w-md"><Link to="/login" className="mb-8 flex justify-center text-xl font-black text-white">banana<span className="text-yellow-300">quiz</span></Link><section className="rounded-3xl bg-white p-7 shadow-2xl sm:p-10"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-yellow-100 text-yellow-700"><UserPlus size={22} /></span><h1 className="mt-6 text-3xl font-black tracking-tight">Join the quiz</h1><p className="mt-2 text-sm text-slate-500">Build your profile and start collecting XP.</p><form onSubmit={submit} className="mt-8 space-y-4"><label className="block text-sm font-bold">Name<input className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-yellow-400" value={form.name} onChange={update("name")} autoComplete="name" /></label><label className="block text-sm font-bold">Email<input className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-yellow-400" type="email" value={form.email} onChange={update("email")} autoComplete="email" /></label><label className="block text-sm font-bold">Password<div className="relative mt-2"><input className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 outline-none focus:border-yellow-400" type={show ? "text" : "password"} value={form.password} onChange={update("password")} autoComplete="new-password" /><button type="button" className="absolute right-3 top-3 text-slate-400" onClick={() => setShow((value) => !value)} aria-label={show ? "Hide password" : "Show password"}>{show ? <EyeOff size={19} /> : <Eye size={19} />}</button></div><div className="mt-2 flex gap-1">{[0, 1, 2].map((item) => <span key={item} className={`h-1.5 flex-1 rounded-full ${item < strength ? "bg-yellow-400" : "bg-slate-100"}`} />)}</div><p className="mt-1 text-xs text-slate-400">Use at least 8 characters, including a number and uppercase letter.</p></label><label className="block text-sm font-bold">Confirm password<input className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-yellow-400" type={show ? "text" : "password"} value={form.confirm} onChange={update("confirm")} autoComplete="new-password" /></label>{error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}<button disabled={loading} className="w-full rounded-xl bg-slate-950 px-4 py-3.5 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-50">{loading ? "Creating account..." : "Create account"}</button></form><p className="mt-7 text-center text-sm text-slate-500">Already registered? <Link className="font-black text-slate-950 underline decoration-yellow-400 decoration-2 underline-offset-4" to="/login">Sign in</Link></p></section></div></main>;
}
