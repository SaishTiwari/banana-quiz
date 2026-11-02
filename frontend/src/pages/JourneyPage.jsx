import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, CheckCircle2, Clock3, LockKeyhole, Trophy, XCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function JourneyPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [session, setSession] = useState(null);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [gameStatus, setGameStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [xpEarned, setXpEarned] = useState(0);
  const [completedLevel, setCompletedLevel] = useState(null);
  const [celebrationKey, setCelebrationKey] = useState(0);
  const [correctFeedback, setCorrectFeedback] = useState(false);
  const advanceTimer = useRef(null);
  const currentLevelRef = useRef(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("/api/auth/me", { credentials: "include" });
        if (!response.ok) throw new Error("Unable to load profile");
        setUser(await response.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  useEffect(() => {
    if (!session || gameStatus !== "playing") return undefined;

    function updateTimer() {
      const remaining = Math.max(0, Math.ceil((new Date(session.expiresAt).getTime() - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) {
        setGameStatus("failed");
        setMessage("Time is up. Try the level again.");
      }
    }

    updateTimer();
    const timer = setInterval(updateTimer, 250);
    return () => clearInterval(timer);
  }, [session, gameStatus]);

  useEffect(() => () => {
    if (advanceTimer.current) {
      clearTimeout(advanceTimer.current);
    }
  }, []);

  useEffect(() => {
    if (!correctFeedback) {
      return undefined;
    }

    advanceTimer.current = setTimeout(() => {
      setCurrentQuestionIndex((previous) => previous + 1);
      setAnswer("");
      setCorrectFeedback(false);
      setMessage("");
    }, 750);

    return () => clearTimeout(advanceTimer.current);
  }, [correctFeedback]);

  async function getCsrfToken() {
    const response = await fetch("/api/auth/csrf", { credentials: "include" });
    if (!response.ok) throw new Error("Unable to initialize security token");
    return response.json();
  }

  async function refreshProfile() {
    const response = await fetch("/api/auth/me", { credentials: "include" });
    if (!response.ok) throw new Error("Unable to refresh profile");
    setUser(await response.json());
  }

  async function startJourney() {
    if (starting || submitting) return;
    const startingNextLevel = gameStatus === "completed";
    setStarting(true);
    setSession(null);
    setCurrentQuestionIndex(0);
    setAnswer("");
    setTimeLeft(0);
    setMessage("");
    setXpEarned(0);
    setCompletedLevel(null);
    setCorrectFeedback(false);
    setGameStatus("idle");

    try {
      if (startingNextLevel) {
        await refreshProfile();
      }
      const csrf = await getCsrfToken();
      const response = await fetch("/api/journey/start", {
        method: "POST",
        credentials: "include",
        headers: { [csrf.headerName]: csrf.token },
      });
      if (!response.ok) throw new Error("Unable to start Journey");
      setSession(await response.json());
      setGameStatus("playing");
    } catch (err) {
      setGameStatus("idle");
      setMessage(err.message);
    } finally {
      setStarting(false);
    }
  }

  async function submitAnswer(event) {
    event.preventDefault();
    if (!session || gameStatus !== "playing" || submitting || answer.trim() === "") return;
    const numericAnswer = Number(answer);
    if (!Number.isInteger(numericAnswer)) {
      setMessage("Please enter a valid whole number.");
      return;
    }

    const question = session.questions[currentQuestionIndex];
    setSubmitting(true);
    setMessage("");

    try {
      const csrf = await getCsrfToken();
      const response = await fetch("/api/journey/answer", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", [csrf.headerName]: csrf.token },
        body: JSON.stringify({ sessionId: session.sessionId, questionId: question.questionId, answer: numericAnswer }),
      });
      if (!response.ok) {
        if (response.status === 409) {
          setGameStatus("failed");
          setMessage("Journey session expired or is no longer valid.");
          return;
        }
        throw new Error("Unable to submit answer");
      }

      const result = await response.json();
      if (!result.correct) {
        setGameStatus("failed");
        setMessage("Incorrect answer. Try the level again.");
        return;
      }
      setCelebrationKey((previous) => previous + 1);
      if (result.completed) {
        setCompletedLevel(session.level);
        setXpEarned(result.xpEarned);
        setGameStatus("completed");
        setMessage("Level completed!");
        try {
          await refreshProfile();
        } catch {
          setMessage("Level completed. Refresh the page to update your profile.");
        }
        return;
      }
      setCorrectFeedback(true);
      setMessage("Correct!");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingState label="Loading Journey" />;
  if (error) return <ErrorState message={error} />;

  const currentQuestion = session?.questions[currentQuestionIndex];
  const totalQuestions = session?.questions.length || 0;
  const progress = totalQuestions ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;
  const timerWarning = timeLeft <= 10;
  const isFinalLevel = (user?.journeyLevel || session?.level) >= 10;

  return (
    <main className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 transition hover:text-slate-950">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <div className="flex items-center gap-2 text-sm">
          <span className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-600">Level <strong className="ml-1 text-slate-950">{session?.level || user?.journeyLevel}</strong></span>
          {user?.totalXp !== undefined && <span className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-600">XP <strong className="ml-1 text-slate-950">{user.totalXp}</strong></span>}
        </div>
      </div>
      <header className="mb-5 flex flex-col gap-2 sm:mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Banana Journey</h1>
        <p className="text-base text-slate-500">One level at a time. How far can you go?</p>
      </header>

      {session && gameStatus === "playing" ? (
        <section className="mt-7">
          <div className="flex items-center justify-between text-sm font-medium text-slate-500">
            <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
            <span className={`flex items-center gap-2 font-semibold ${timerWarning ? "text-red-600" : "text-slate-700"}`}><Clock3 size={17} /> 00:{String(timeLeft).padStart(2, "0")}</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-yellow-400 transition-[width] duration-300" style={{ width: `${progress}%` }} />
          </div>
          <div className={`relative mt-7 rounded-2xl border bg-white p-5 shadow-sm transition sm:p-8 ${correctFeedback ? "border-emerald-300 bg-emerald-50/30 motion-safe:animate-pulse" : "border-slate-200"}`}>
            {celebrationKey > 0 && <ConfettiBurst key={celebrationKey} />}
            <div className="flex min-h-64 items-center justify-center rounded-xl bg-slate-50 p-4 sm:min-h-80">
              <img src={currentQuestion?.question} alt={`Banana question ${currentQuestionIndex + 1}`} className="max-h-80 max-w-full object-contain" />
            </div>
            <form onSubmit={submitAnswer} className="mx-auto mt-7 max-w-xl">
              <label htmlFor="journey-answer" className="text-sm font-semibold text-slate-700">Your answer</label>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                <input id="journey-answer" type="number" step="1" value={answer} onChange={(event) => setAnswer(event.target.value)} disabled={submitting || correctFeedback || timeLeft === 0} className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg font-semibold outline-none transition focus:border-yellow-400" placeholder="Enter a whole number" required />
                <button type="submit" disabled={submitting || correctFeedback || answer.trim() === ""} className="rounded-xl bg-[#151515] px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">{submitting ? "Checking..." : "Submit Answer"}</button>
              </div>
            </form>
          </div>
        </section>
      ) : (
        <JourneyMap
          status={gameStatus}
          message={message}
          xpEarned={xpEarned}
          completedLevel={completedLevel}
          user={user}
          starting={starting}
          submitting={submitting}
          isFinalLevel={isFinalLevel}
          onStart={startJourney}
          currentLevelRef={currentLevelRef}
        />
      )}
      {message && gameStatus === "playing" && <Feedback message={message} positive={message.startsWith("Correct")} />}
    </main>
  );
}

function JourneyMap({ status, message, xpEarned, completedLevel, user, starting, submitting, isFinalLevel, onStart, currentLevelRef }) {
  const completed = status === "completed";
  const failed = status === "failed";
  const currentLevel = user?.journeyLevel || 1;
  const levels = Array.from({ length: 10 }, (_, index) => index + 1);
  const completedPathLength = Math.max(0, ((currentLevel - 1) / 9) * 1000);

  useEffect(() => {
    if (!currentLevelRef.current) {
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    currentLevelRef.current.scrollIntoView({
      block: "center",
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }, [currentLevel, currentLevelRef]);

  return (
    <section className="mt-8">
      {(completed || failed) && (
        <div className={`relative mb-7 flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between ${completed ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
          {completed && <ConfettiBurst />}
          <div className="flex items-start gap-3">
            <span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg ${completed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
              {completed ? <Trophy size={18} /> : <XCircle size={18} />}
            </span>
            <div>
              <h2 className={`font-semibold ${completed ? "text-emerald-900" : "text-red-900"}`}>{completed ? `Level ${completedLevel} complete` : "Journey failed"}</h2>
              <p className={`mt-1 text-sm ${completed ? "text-emerald-800" : "text-red-800"}`}>{completed ? `You earned ${xpEarned} XP${user?.totalXp !== undefined ? ` · ${user.totalXp} XP total` : ""}.` : message || "Try the level again to unlock the next stage."}</p>
            </div>
          </div>
          {completed && isFinalLevel ? <span className="text-sm font-semibold text-emerald-800">Journey complete</span> : <button type="button" onClick={onStart} disabled={starting || submitting} className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${completed ? "bg-yellow-300 text-slate-950 hover:bg-yellow-200" : "bg-[#151515] text-white hover:bg-slate-800"}`}>{starting ? "Loading..." : completed ? "Next Level →" : "Try Again"}</button>}
        </div>
      )}
      <div className="relative mx-auto w-full max-w-2xl px-2 sm:px-6">
        <div className="relative mx-auto h-[980px] w-full max-w-[440px]">
          <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 440 980" preserveAspectRatio="none" aria-hidden="true">
            <path pathLength="1000" d="M220 70 C 90 140, 90 190, 220 260 S 350 380, 220 450 S 90 570, 220 640 S 350 760, 220 830 S 120 900, 220 930" fill="none" stroke="#e5e7eb" strokeWidth="7" strokeLinecap="round" />
            <path pathLength="1000" d="M220 70 C 90 140, 90 190, 220 260 S 350 380, 220 450 S 90 570, 220 640 S 350 760, 220 830 S 120 900, 220 930" fill="none" stroke="#facc15" strokeWidth="7" strokeLinecap="round" strokeDasharray={`${completedPathLength} 1000`} />
          </svg>
          {levels.map((level) => {
            const state = level < currentLevel ? "completed" : level === currentLevel ? "current" : "locked";
            const position = levelPositions[level - 1];
            return (
              <div key={level} ref={state === "current" ? currentLevelRef : undefined} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${position.x}%`, top: position.y }}>
                <button type="button" onClick={state === "current" ? onStart : undefined} disabled={state !== "current" || starting || submitting} aria-label={`${state === "current" ? "Play" : state === "completed" ? "Completed" : "Locked"} level ${level}`} className={`group grid h-16 w-16 place-items-center rounded-full border-4 text-lg font-semibold shadow-md transition sm:h-20 sm:w-20 ${state === "completed" ? "border-emerald-500 bg-emerald-500 text-white" : state === "current" ? "border-yellow-500 bg-yellow-300 text-slate-950 ring-8 ring-yellow-100 motion-safe:animate-pulse hover:scale-105" : "border-slate-300 bg-slate-200 text-slate-500"}`}>
                  {state === "completed" ? <Check size={25} /> : state === "locked" ? <LockKeyhole size={21} /> : level}
                </button>
                <p className={`mt-2 text-center text-xs font-semibold ${state === "current" ? "text-slate-950" : "text-slate-500"}`}>{state === "current" ? "Play level" : `Level ${level}`}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const levelPositions = [
  { x: 50, y: "8%" }, { x: 27, y: "18%" }, { x: 50, y: "28%" }, { x: 73, y: "38%" },
  { x: 50, y: "48%" }, { x: 27, y: "58%" }, { x: 50, y: "68%" }, { x: 73, y: "78%" },
  { x: 50, y: "88%" }, { x: 32, y: "95%" },
];

function ConfettiBurst() {
  const pieces = Array.from({ length: 14 }, (_, index) => index);
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-24 overflow-hidden motion-reduce:hidden" aria-hidden="true">
      {pieces.map((piece) => (
        <span
          key={piece}
          className="absolute left-1/2 top-1 h-2 w-1.5 rounded-sm bg-yellow-300 motion-safe:animate-[confetti_1.2s_ease-out_forwards]"
          style={{ transform: `rotate(${piece * 29}deg) translateY(-${12 + (piece % 4) * 5}px)`, animationDelay: `${(piece % 5) * 35}ms` }}
        />
      ))}
    </div>
  );
}

function Feedback({ message, positive }) {
  return <div role="status" className={`mt-4 flex items-center justify-center gap-2 text-sm font-medium ${positive ? "text-emerald-700" : "text-red-700"}`}>{positive ? <CheckCircle2 size={17} /> : <XCircle size={17} />}{message}</div>;
}

function LoadingState({ label }) {
  return <main className="mx-auto max-w-5xl"><div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm font-medium text-slate-500">{label}...</div></main>;
}

function ErrorState({ message }) {
  return <main className="mx-auto max-w-5xl"><div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm font-medium text-red-700">{message}</div></main>;
}
