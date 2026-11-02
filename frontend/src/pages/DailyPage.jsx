import { useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, ChevronRight, Flame, XCircle } from "lucide-react";
import { Link } from "react-router-dom";

function formatStreak(days) {
  return `${days} ${days === 1 ? "day" : "days"}`;
}

export default function DailyPage() {
  const [daily, setDaily] = useState(null);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [timeRemaining, setTimeRemaining] = useState("00:00:00");
  const [celebrationKey, setCelebrationKey] = useState(0);
  const refreshingAtReset = useRef(false);

  async function loadDaily() {
    try {
      setError("");
      const response = await fetch("/api/daily/today", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to load Daily Banana.");
      setDaily(await response.json());
      setResult(null);
      setAnswer("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => void loadDaily(), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!daily?.date) return undefined;

    function updateCountdown() {
      const resetAt = new Date(`${daily.date}T00:00:00Z`);
      resetAt.setUTCDate(resetAt.getUTCDate() + 1);
      const difference = Math.max(0, resetAt.getTime() - Date.now());
      const hours = Math.floor(difference / 3600000);
      const minutes = Math.floor((difference % 3600000) / 60000);
      const seconds = Math.floor((difference % 60000) / 1000);
      const pad = (number) => String(number).padStart(2, "0");

      setTimeRemaining(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
      if (difference === 0 && !refreshingAtReset.current) {
        refreshingAtReset.current = true;
        void loadDaily().finally(() => {
          refreshingAtReset.current = false;
        });
      }
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [daily?.date]);

  async function submitAnswer(event) {
    event.preventDefault();
    if (submitting || !daily) return;

    const question = daily.questions.find((item) => !item.answered);
    if (!question) return;

    const submittedAnswer = Number(answer);
    if (answer.trim() === "" || !Number.isInteger(submittedAnswer)) {
      setError("Please enter a valid whole number.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      const csrfResponse = await fetch("/api/auth/csrf", { credentials: "include" });
      if (!csrfResponse.ok) throw new Error("Unable to retrieve security token.");
      const csrf = await csrfResponse.json();
      const response = await fetch("/api/daily/answer", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", [csrf.headerName]: csrf.token },
        body: JSON.stringify({ questionId: question.questionId, answer: submittedAnswer }),
      });

      if (!response.ok) {
        throw new Error(response.status === 409 ? "You have already answered this question." : "Unable to submit answer.");
      }

      const data = await response.json();
      if (data.completed) setCelebrationKey((previous) => previous + 1);
      await loadDaily();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <DailyMessage title="Loading Daily Banana..." />;
  if (!daily) {
    return (
      <DailyMessage
        title="Daily Banana is unavailable"
        message={error || "Unable to load today's challenge."}
        retry
        onRetry={() => {
          setLoading(true);
          void loadDaily();
        }}
      />
    );
  }

  const question = daily.questions.find((item) => !item.answered);
  const completed = daily.completed || result?.completed;
  const questionNumber = Math.min(daily.answeredQuestions + 1, daily.totalQuestions);

  return (
    <main className="mx-auto max-w-3xl">
      <header className="flex items-start justify-between gap-6 border-b border-slate-200 pb-5">
        <div>
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-950">
            <ArrowLeft size={15} aria-hidden="true" /> Back to Dashboard
          </Link>
          <h1 className="mt-7 text-3xl font-semibold tracking-tight text-slate-950">Daily Banana</h1>
          <p className="mt-2 text-sm text-slate-500">Five questions. One challenge every day.</p>
        </div>
        {!completed && (
          <p className="mt-1 inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-slate-500" aria-label={`Current streak: ${formatStreak(daily.currentStreak)}`}>
            <Flame size={15} className="text-yellow-600" aria-hidden="true" />
            {formatStreak(daily.currentStreak)}
          </p>
        )}
      </header>

      {completed ? (
        <CompletionSection daily={daily} timeRemaining={timeRemaining} celebrationKey={celebrationKey} />
      ) : result ? (
        <ResultSection result={result} onNext={() => { setAnswer(""); setResult(null); setError(""); }} />
      ) : question ? (
        <ChallengeSection
          daily={daily}
          question={question}
          questionNumber={questionNumber}
          answer={answer}
          setAnswer={setAnswer}
          submitting={submitting}
          submitAnswer={submitAnswer}
        />
      ) : (
        <DailyMessage title="No questions available" />
      )}
      {error && <p role="alert" className="mt-4 text-center text-sm font-medium text-red-700">{error}</p>}
    </main>
  );
}

function ProgressSteps({ total, current, completed = false }) {
  return (
    <div className="flex items-center gap-2" aria-label={`${completed ? total : current - 1} of ${total} questions complete`}>
      {Array.from({ length: total }, (_, index) => {
        const isDone = completed || index < current - 1;
        const isCurrent = !completed && index === current - 1;
        return (
          <span
            key={index}
            className={`h-1.5 flex-1 rounded-full ${isDone ? "bg-yellow-400" : isCurrent ? "bg-slate-950" : "bg-slate-200"}`}
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
}

function ChallengeSection({ daily, question, questionNumber, answer, setAnswer, submitting, submitAnswer }) {
  return (
    <section className="mt-8">
      <div className="flex items-center justify-between gap-4 text-sm">
        <p className="font-medium text-slate-950">Question {questionNumber} of {daily.totalQuestions}</p>
        <p className="text-slate-500">{daily.answeredQuestions} complete</p>
      </div>
      <div className="mt-3">
        <ProgressSteps total={daily.totalQuestions} current={questionNumber} />
      </div>

      <div className="mt-8 flex min-h-72 items-center justify-center bg-slate-50 p-5 sm:min-h-96 sm:p-8">
        <img src={question.imageUrl} alt={`Daily Banana question ${question.questionNumber}`} className="max-h-96 max-w-full object-contain" />
      </div>

      <form onSubmit={submitAnswer} className="mx-auto mt-7 max-w-xl">
        <label htmlFor="daily-answer" className="sr-only">Numeric answer</label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="daily-answer"
            type="number"
            step="1"
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            disabled={submitting}
            className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-lg font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-yellow-400"
            placeholder="Your answer"
            required
          />
          <button type="submit" disabled={submitting || answer.trim() === ""} className="rounded-lg bg-[#151515] px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
            {submitting ? "Checking..." : "Submit Answer"}
          </button>
        </div>
      </form>
    </section>
  );
}

function ResultSection({ result, onNext }) {
  return (
    <section className="mx-auto mt-10 max-w-xl border-y border-slate-200 py-8 text-center">
      <div className={`mx-auto grid h-10 w-10 place-items-center rounded-full ${result.correct ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
        {result.correct ? <CheckCircle2 size={21} aria-hidden="true" /> : <XCircle size={21} aria-hidden="true" />}
      </div>
      <h2 className="mt-4 text-xl font-semibold text-slate-950">{result.correct ? "Correct" : "Not quite"}</h2>
      <p className="mt-2 text-sm text-slate-500">The correct answer was <strong className="text-slate-950">{result.correctAnswer}</strong>.</p>
      <button type="button" onClick={onNext} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#151515] px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
        Next question <ChevronRight size={16} aria-hidden="true" />
      </button>
    </section>
  );
}

function CompletionSection({ daily, timeRemaining, celebrationKey }) {
  return (
    <section className="relative mx-auto mt-10 max-w-xl border-y border-slate-200 py-8 text-center">
      {celebrationKey > 0 && <ConfettiBurst key={celebrationKey} />}
      <h2 className="text-2xl font-semibold tracking-tight text-slate-950">That&apos;s a wrap for today.</h2>
      <p className="mt-2 text-sm text-slate-500">Five questions done. See you tomorrow.</p>

      <div className="mx-auto mt-7 grid max-w-xs grid-cols-5 gap-2" aria-label="Completed questions">
        {Array.from({ length: daily.totalQuestions }, (_, index) => (
          <span key={index} className="grid aspect-square place-items-center rounded-md border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700">
            {index + 1}
          </span>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm">
        <p><span className="text-slate-500">Current streak</span> <strong className="text-slate-950">{formatStreak(daily.currentStreak)}</strong></p>
        <p><span className="text-slate-500">Next challenge in</span> <strong className="font-mono text-slate-950">{timeRemaining}</strong></p>
      </div>
      <Link to="/dashboard" className="mt-7 inline-flex items-center gap-2 rounded-lg bg-[#151515] px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
        Back to Dashboard <ChevronRight size={16} aria-hidden="true" />
      </Link>
    </section>
  );
}

function ConfettiBurst() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-20 overflow-hidden motion-reduce:hidden" aria-hidden="true">
      {Array.from({ length: 10 }, (_, index) => (
        <span key={index} className="absolute left-1/2 top-1 h-2 w-1 rounded-sm bg-yellow-300 motion-safe:animate-[confetti_1.2s_ease-out_forwards]" style={{ transform: `rotate(${index * 36}deg) translateY(-${12 + (index % 3) * 5}px)`, animationDelay: `${(index % 4) * 35}ms` }} />
      ))}
    </div>
  );
}

function DailyMessage({ title, message, retry, onRetry }) {
  return (
    <main className="mx-auto max-w-3xl">
      <div className="border-y border-slate-200 py-10 text-center">
        <h1 className="text-xl font-semibold text-slate-950">{title}</h1>
        {message && <p className="mt-2 text-sm text-slate-500">{message}</p>}
        {retry && <button type="button" onClick={onRetry} className="mt-6 rounded-lg bg-[#151515] px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">Retry</button>}
      </div>
    </main>
  );
}
