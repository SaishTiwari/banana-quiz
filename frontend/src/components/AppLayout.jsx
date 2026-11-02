import { Link, Outlet, useNavigate } from "react-router-dom";
import { LogOut, UserCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { getCurrentUser } from "../services/authService";

export default function AppLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    getCurrentUser().then(setUser).catch(() => setUser(null));
  }, []);

  function signOut() {
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/dashboard" className="flex items-center gap-3 font-black tracking-tight text-slate-950">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-yellow-300 text-xl shadow-sm">B</span>
            <span>banana<span className="text-yellow-500">quiz</span></span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/profile" className="flex items-center gap-2 rounded-xl px-2 py-1 text-right hover:bg-slate-100" aria-label="Open profile">
              <span className="hidden text-xs font-black text-slate-700 sm:block">{user?.name || "Player"}</span>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-yellow-300 text-slate-950"><UserCircle size={20} /></span>
            </Link>
            <button type="button" onClick={signOut} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900" aria-label="Sign out"><LogOut size={20} /></button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><Outlet /></main>
    </div>
  );
}
