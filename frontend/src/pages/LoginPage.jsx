import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { ApiError } from "../services/api";
import { loginUser } from "../services/authService";

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  async function submit(event) {
    event.preventDefault(); setError("");
    if (!form.email.trim() || !form.password) { setError("Enter your email and password."); return; }
    setLoading(true);
    try { await loginUser(form.email.trim(), form.password); navigate("/dashboard", { replace: true }); }
    catch (err) { setError(err instanceof ApiError && err.status >= 500 ? "Unable to connect to the server. Please try again." : "Incorrect email or password. Please try again."); }
    finally { setLoading(false); }
  }
  return <main className="grid min-h-screen place-items-center bg-slate-950 px-4 py-10"><div className="w-full max-w-md"><Link to="/" className="mb-8 flex justify-center text-xl font-black text-white">banana<span className="text-yellow-300">quiz</span></Link><section className="rounded-3xl bg-white p-7 shadow-2xl sm:p-10"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-yellow-100 text-yellow-700"><LockKeyhole size={22} /></span><h1 className="mt-6 text-3xl font-black tracking-tight">Welcome back</h1><p className="mt-2 text-sm text-slate-500">Sign in to continue your quiz journey.</p><form onSubmit={submit} className="mt-8 space-y-5"><label className="block text-sm font-bold">Email<input className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-yellow-400" type="email" value={form.email} onChange={update("email")} autoComplete="email" /></label><label className="block text-sm font-bold">Password<div className="relative mt-2"><input className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 outline-none transition focus:border-yellow-400" type={showPassword ? "text" : "password"} value={form.password} onChange={update("password")} autoComplete="current-password" /><button type="button" className="absolute right-3 top-3 text-slate-400" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button></div></label>{error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}<button disabled={loading} className="w-full rounded-xl bg-slate-950 px-4 py-3.5 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-50">{loading ? "Signing in..." : "Sign in"}</button></form><p className="mt-7 text-center text-sm text-slate-500">New to Banana Quiz? <Link className="font-black text-slate-950 underline decoration-yellow-400 decoration-2 underline-offset-4" to="/register">Create an account</Link></p></section></div></main>;
}
