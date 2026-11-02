import { useEffect, useState } from "react";
import {
  CalendarDays,
  Flame,
  Gamepad2,
  Swords,
  Trophy,
  Waypoints,
} from "lucide-react";
import { Link } from "react-router-dom";
import { apiRequest } from "../services/api";
import { getCurrentUser } from "../services/authService";

const gameModes = [
  {
    title: "Banana Journey",
    description: "Work your way through challenges and unlock the next stage.",
    action: "Continue journey",
    to: "/journey",
    icon: Waypoints,
  },
  {
    title: "Daily Banana",
    description: "Five questions. One new challenge every day.",
    action: "Play today",
    to: "/daily",
    icon: CalendarDays,
  },
  {
    title: "Banana Battle",
    description: "Go head-to-head with a friend.",
    action: "Enter battle",
    to: "/battle",
    icon: Swords,
  },
];

function ModeCard({ mode }) {
  const Icon = mode.icon;

  return (
    <Link
      to={mode.to}
      className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-[#202020] p-6 transition duration-200 hover:-translate-y-1 hover:border-yellow-300/70 hover:bg-[#262626] focus-visible:border-yellow-300"
    >
      <div className="flex items-start justify-between">
        <span className="grid h-12 w-12 place-items-center rounded-xl border border-white/10 bg-[#2c2c2c] text-yellow-300">
          <Icon size={22} strokeWidth={1.8} />
        </span>
      </div>
      <div>
        <h3 className="text-xl font-semibold tracking-tight text-white">{mode.title}</h3>
        <p className="mt-3 max-w-xs text-sm leading-6 text-neutral-400">{mode.description}</p>
        <span className="mt-6 inline-flex rounded-lg bg-yellow-300 px-4 py-2.5 text-sm font-semibold text-[#151515] transition group-hover:bg-yellow-200">
          {mode.action}
        </span>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [daily, setDaily] = useState(null);

  useEffect(() => {
    getCurrentUser().then(setUser).catch(() => setUser(null));
    apiRequest("/daily/today").then(setDaily).catch(() => setDaily(null));
  }, []);

  const firstName = user?.name?.trim().split(/\s+/)[0] || "Player";
  const hasProgress = user !== null || daily !== null;

  return (
    <div className="-mx-4 -my-8 bg-[#151515] px-4 py-8 text-white sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="flex flex-col justify-between gap-5 border-b border-white/10 pb-8 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Welcome back, {firstName}
            </h1>
            <p className="mt-2 text-base text-neutral-400">Ready for another round?</p>
          </div>
          <Link
            to="/profile"
            className="inline-flex items-center gap-2 self-start rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-neutral-300 transition hover:border-yellow-300 hover:text-yellow-300 sm:self-auto"
          >
            View profile
          </Link>
        </section>

        <section className={`mt-8 grid gap-5 ${hasProgress ? "lg:grid-cols-[1.35fr_0.65fr]" : "lg:grid-cols-1"}`}>
          <Link
            to="/quiz"
            className="group relative flex min-h-64 overflow-hidden rounded-2xl border border-yellow-300/40 bg-yellow-300 p-7 text-[#151515] transition duration-200 hover:-translate-y-1 hover:bg-yellow-200 sm:p-8"
          >
            <div className="relative z-10 flex max-w-lg flex-col justify-between">
              <div>
                <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">Classic Quiz</h2>
                <p className="mt-3 max-w-md text-base leading-7 text-[#665500]">
                  Quick questions. See how many you can get right.
                </p>
              </div>
              <span className="mt-8 inline-flex w-fit items-center gap-2 rounded-lg bg-[#151515] px-5 py-3 text-sm font-semibold text-white transition group-hover:gap-3">
                Play Classic
              </span>
            </div>
            <div className="absolute bottom-7 right-8 grid h-20 w-20 place-items-center rounded-2xl border-2 border-[#151515]/15 text-[#151515]/35">
              <Gamepad2 size={38} strokeWidth={1.5} />
            </div>
          </Link>

          {hasProgress && (
            <div className="flex min-h-64 flex-col justify-between rounded-2xl border border-white/10 bg-[#202020] p-7">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-neutral-400">Player overview</p>
                <Trophy size={19} className="text-yellow-300" strokeWidth={1.8} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {user?.journeyLevel !== undefined && (
                  <div>
                    <p className="text-xs text-neutral-500">Level</p>
                    <p className="mt-1 text-2xl font-semibold">{user.journeyLevel}</p>
                  </div>
                )}
                {user?.totalXp !== undefined && (
                  <div>
                    <p className="text-xs text-neutral-500">Total XP</p>
                    <p className="mt-1 text-2xl font-semibold">{user.totalXp}</p>
                  </div>
                )}
                {daily?.currentStreak !== undefined && (
                  <div>
                    <p className="text-xs text-neutral-500">Streak</p>
                    <p className="mt-1 flex items-center gap-1 text-2xl font-semibold">
                      <Flame size={18} className="text-yellow-300" />
                      {daily.currentStreak}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        <section className="mt-10">
          <div className="mb-4">
            <h2 className="text-xl font-semibold tracking-tight">Game modes</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {gameModes.map((mode) => (
              <ModeCard key={mode.title} mode={mode} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
