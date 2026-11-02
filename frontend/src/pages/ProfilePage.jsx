import { useEffect, useState } from "react";
import { ArrowLeft, Award, Mail, UserCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { ApiError } from "../services/api";
import { getCurrentUser } from "../services/authService";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    getCurrentUser()
      .then((data) => {
        if (active) setProfile(data);
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof ApiError && err.status === 401
              ? "Your session has expired. Please sign in again."
              : "Unable to load your profile. Please try again."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm font-medium text-slate-500 shadow-sm">
          Loading your profile...
        </div>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="mx-auto max-w-3xl">
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm font-medium text-red-700">
          {error || "Profile information is unavailable."}
        </div>
        <Link to="/dashboard" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-950">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </main>
    );
  }

  const initial = profile.name?.trim().charAt(0).toUpperCase() || "?";

  return (
    <main className="mx-auto max-w-3xl">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-950">
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-yellow-300 text-3xl font-semibold text-slate-950">
            {initial}
          </div>
          <div>
            <p className="text-sm font-medium text-yellow-600">Banana Quiz player</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">{profile.name}</h1>
            <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
              <Mail size={15} /> {profile.email}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-4 sm:grid-cols-2" aria-label="Player statistics">
        <StatCard icon={Award} label="Total XP" value={profile.totalXp} />
        <StatCard icon={UserCircle} label="Journey level" value={`Level ${profile.journeyLevel}`} />
      </section>

      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">Account information</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <ReadOnlyField label="Username" value={profile.name} />
          <ReadOnlyField label="Email address" value={profile.email} />
        </div>
      </section>
    </main>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-yellow-100 text-yellow-700">
          <Icon size={20} strokeWidth={1.8} />
        </span>
      </div>
      <p className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}

function ReadOnlyField({ label, value }) {
  return (
    <div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800">
        {value}
      </div>
    </div>
  );
}
