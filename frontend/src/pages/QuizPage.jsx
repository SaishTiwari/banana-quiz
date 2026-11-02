import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, ChevronRight, LoaderCircle, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import confetti from "canvas-confetti";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { quizService } from "../services/quizService";

const COUNTDOWN_STEPS = ["3", "2", "1", "GO!"];

function QuizPage() {
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("countdown");
  const [countdownStep, setCountdownStep] = useState(0);
  const [countdownComplete, setCountdownComplete] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const requestId = useRef(0);
  const countdownTimeout = useRef(null);
  const nextQuestionPending = useRef(false);
  const pendingQuestionRef = useRef(null);
  const peelFinishedRef = useRef(false);

  const fetchQuestion = useCallback(async (initial = false) => {
    const currentRequest = ++requestId.current;
    if (!initial) setStatus("loading");
    setError("");
    setResult(null);
    setAnswer("");
    setQuestion(null);
    if (!initial) {
      pendingQuestionRef.current = null;
      peelFinishedRef.current = false;
    }

    try {
      const data = await quizService.getQuestion();
      await preloadImage(data.question);

      if (currentRequest !== requestId.current) return;
      if (initial) {
        setQuestion(data);
        setStatus("playing");
      } else {
        pendingQuestionRef.current = data;
        if (peelFinishedRef.current) {
          setQuestion(data);
          pendingQuestionRef.current = null;
          setStatus("playing");
        }
      }
    } catch (err) {
      if (currentRequest !== requestId.current) return;
      console.error("Failed to load question:", err);
      setError("Unable to load a question. Please try again.");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void fetchQuestion(true), 0);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      setCountdownStep(step);
      if (step === COUNTDOWN_STEPS.length - 1) {
        clearInterval(interval);
        countdownTimeout.current = window.setTimeout(() => setCountdownComplete(true), reducedMotion ? 250 : 1000);
      }
    }, reducedMotion ? 500 : 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      if (countdownTimeout.current) clearTimeout(countdownTimeout.current);
      requestId.current += 1;
    };
  }, [fetchQuestion]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!question || submitting || result || status !== "playing") return;

    const numericAnswer = Number(answer);
    if (answer.trim() === "" || !Number.isFinite(numericAnswer) || !Number.isInteger(numericAnswer)) {
      setError("Please enter a valid whole number.");
      return;
    }

    setSubmitting(true);
    setStatus("submitting");
    setError("");

    try {
      const response = await quizService.submitAnswer(question.questionId, numericAnswer);
      setResult(response);
      setStatus(response.correct ? "correct" : "incorrect");
    } catch (err) {
      console.error("Failed to submit answer:", err);
      setError("Unable to submit your answer. Please try again.");
      setStatus("playing");
    } finally {
      setSubmitting(false);
    }
  }

  function handleNextQuestion() {
    if (status === "loading" || submitting || nextQuestionPending.current) return;
    nextQuestionPending.current = true;
    void fetchQuestion();
    window.setTimeout(() => {
      nextQuestionPending.current = false;
    }, 350);
  }

  const handlePeelComplete = useCallback(() => {
    peelFinishedRef.current = true;
    if (pendingQuestionRef.current) {
      setQuestion(pendingQuestionRef.current);
      pendingQuestionRef.current = null;
      setStatus("playing");
    }
  }, []);

  const handlePeelError = useCallback(() => {
    setError("Unable to load the banana transition. Please try again.");
    setStatus("error");
  }, []);

  return (
    <main className="mx-auto max-w-3xl">
      <header className="border-b border-slate-200 pb-5">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-950">
          <ArrowLeft size={15} aria-hidden="true" /> Back to Dashboard
        </Link>
        <h1 className="mt-7 text-3xl font-semibold tracking-tight text-slate-950">Classic Quiz</h1>
        <p className="mt-2 text-sm text-slate-500">Solve the puzzle. Beat your best.</p>
      </header>

      {status === "countdown" && !countdownComplete && <CountdownDisplay step={countdownStep} />}

      {((status === "loading") || (status === "countdown" && countdownComplete && !question)) && (
        <BananaPeelLoader onComplete={handlePeelComplete} onError={handlePeelError} />
      )}

      {status === "error" && (
        <section className="mx-auto mt-10 max-w-md border-y border-slate-200 py-8 text-center">
          <h2 className="text-xl font-semibold text-slate-950">We couldn&apos;t load a puzzle</h2>
          <p className="mt-2 text-sm text-slate-500">{error}</p>
          <button type="button" onClick={() => void fetchQuestion()} className="mt-6 rounded-lg bg-yellow-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-yellow-300">
            Try again
          </button>
        </section>
      )}

      {question && countdownComplete && ["playing", "submitting", "correct", "incorrect"].includes(status) && (
        <section className="mt-8">
          <div className="border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div className={`relative flex min-h-64 items-center justify-center overflow-hidden bg-slate-50 p-4 sm:min-h-80 sm:p-8 ${status === "incorrect" ? "motion-safe:animate-[answer-shake_420ms_ease-in-out]" : ""}`}>
              <img src={question.question} alt="Mathematical puzzle" className="max-h-96 max-w-full object-contain" />
              {result && <ResultOverlay result={result} onNext={handleNextQuestion} />}
            </div>

            <form onSubmit={handleSubmit} className={`mx-auto mt-7 max-w-xl transition-opacity ${result ? "opacity-50" : ""}`}>
              <label htmlFor="answer" className="mb-2 block text-sm font-semibold text-slate-700">Your answer</label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  id="answer"
                  type="number"
                  step="1"
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  disabled={submitting || result !== null}
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 px-4 py-3 text-lg font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:bg-slate-50"
                  placeholder="Enter a whole number"
                  required
                />
                <button type="submit" disabled={submitting || result !== null || answer.trim() === ""} className="inline-flex items-center justify-center gap-2 rounded-lg bg-yellow-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50">
                  {submitting && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}
                  {submitting ? "Checking..." : "Submit Answer"}
                </button>
              </div>
            </form>
          </div>

          {error && <p role="alert" className="mt-4 text-center text-sm font-medium text-red-700">{error}</p>}
        </section>
      )}
    </main>
  );
}

function CountdownDisplay({ step }) {
  return (
    <section className="mt-12 flex min-h-72 flex-col items-center justify-center text-center" aria-live="polite">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Get ready</p>
      <p key={COUNTDOWN_STEPS[step]} className="mt-5 text-7xl font-semibold tracking-tight text-yellow-500 motion-safe:animate-[countdown_0.7s_ease-out] sm:text-8xl">
        {COUNTDOWN_STEPS[step]}
      </p>
    </section>
  );
}

function BananaPeelLoader({ onComplete, onError }) {
  const completedRef = useRef(false);
  const playerRef = useRef(null);
  const listenersRef = useRef(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const completionTimer = window.setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete();
      }
    }, reducedMotion ? 100 : 8000);

    return () => window.clearTimeout(completionTimer);
  }, [onComplete]);

  function handlePlayer(player) {
    if (playerRef.current && listenersRef.current) {
      playerRef.current.removeEventListener("complete", listenersRef.current.handleComplete);
      playerRef.current.removeEventListener("loadError", listenersRef.current.handleError);
    }

    playerRef.current = player;
    listenersRef.current = null;
    if (!player) return;

    const handleComplete = () => {
      if (completedRef.current) return;
      completedRef.current = true;
      onComplete();
    };
    const handleError = () => onError();

    player.addEventListener("complete", handleComplete);
    player.addEventListener("loadError", handleError);
    listenersRef.current = { handleComplete, handleError };
  }

  return (
    <section className="mt-8" aria-live="polite">
      <div className="relative mx-auto flex h-72 max-w-2xl flex-col items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:h-80">
        <p className="absolute top-6 z-10 text-sm font-medium text-slate-500">Preparing your next puzzle...</p>
        <DotLottieReact
          src="/assets/goofy-banana.lottie"
          autoplay={!window.matchMedia("(prefers-reduced-motion: reduce)").matches}
          loop={false}
          dotLottieRefCallback={handlePlayer}
          className="h-56 w-72 sm:h-64 sm:w-80"
          aria-label="Banana transition animation"
        />
        <p className="absolute bottom-5 z-10 text-xs text-slate-400">Almost ready</p>
      </div>
    </section>
  );
}

function ResultOverlay({ result, onNext }) {
  const correct = Boolean(result.correct);
  return (
    <section className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/65 p-5 text-center backdrop-blur-[2px]" role="status">
      {correct && <ConfettiRain />}
      <div className="relative z-10 flex max-w-sm flex-col items-center">
      <div className={`mx-auto grid h-16 w-16 place-items-center rounded-full ${correct ? "bg-emerald-100 text-emerald-700 motion-safe:animate-[result-pop_420ms_ease-out]" : "bg-red-50 text-red-600"}`}>
        {correct ? <CheckCircle2 size={38} strokeWidth={2.2} aria-hidden="true" /> : <XCircle size={34} strokeWidth={2.2} aria-hidden="true" />}
      </div>
      <h2 className={`mt-4 text-3xl font-semibold tracking-tight text-white ${correct ? "motion-safe:animate-[result-pop_420ms_ease-out]" : ""}`}>{correct ? "BRILLIANT!" : "NOT QUITE!"}</h2>
      <p className="mt-2 text-sm text-white/80">{correct ? "You got it right." : "That wasn't the right answer."}</p>
      <button type="button" onClick={onNext} className={`mt-7 inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition ${correct ? "bg-yellow-400 text-slate-950 hover:bg-yellow-300" : "bg-white text-slate-950 hover:bg-slate-100"}`}>
        {correct ? "NEXT QUESTION" : "NEXT QUESTION"} <ChevronRight size={17} aria-hidden="true" />
      </button>
      </div>
    </section>
  );
}

function ConfettiRain() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const fire = confetti.create(canvas, { resize: true, useWorker: true });
    const colors = ["#facc15", "#eab308", "#ffffff", "#22c55e", "#f59e0b", "#84cc16"];
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      if (Date.now() - startedAt >= 2800) {
        window.clearInterval(timer);
        return;
      }

      fire({
        particleCount: 8,
        angle: 270 + (Math.random() * 24 - 12),
        spread: 18 + Math.random() * 18,
        startVelocity: 8 + Math.random() * 10,
        gravity: 0.28 + Math.random() * 0.12,
        drift: Math.random() * 1.2 - 0.6,
        ticks: 720,
        origin: { x: Math.random(), y: -0.08 },
        colors,
        scalar: 0.8 + Math.random() * 0.45,
      });
    }, 120);

    return () => {
      window.clearInterval(timer);
      fire.reset();
    };
  }, []);

  return createPortal(
    <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[60] h-full w-full" aria-hidden="true" />,
    document.body
  );
}

function preloadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = resolve;
    image.onerror = reject;
    image.src = source;
  });
}

export default QuizPage;
