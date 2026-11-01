
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function DailyPage() {
  const [daily, setDaily] = useState(null);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [timeRemaining, setTimeRemaining] = useState("");

  function formatStreak(days) {
    return `${days} ${days === 1 ? "day" : "days"}`;
  }

  async function loadDaily() {
    try {
      setError("");

      const response = await fetch("/api/daily/today", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to load Daily Banana.");
      }

      const data = await response.json();

      setDaily(data);
      setResult(null);
      setAnswer("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDaily();
  }, []);

  useEffect(() => {
    function updateCountdown() {
      const now = new Date();

      const nextReset = new Date(now);
      nextReset.setUTCHours(24, 0, 0, 0);

      const difference = nextReset.getTime() - now.getTime();

      const hours = Math.floor(difference / 3600000);
      const minutes = Math.floor((difference % 3600000) / 60000);
      const seconds = Math.floor((difference % 60000) / 1000);

      const pad = (number) => String(number).padStart(2, "0");

      setTimeRemaining(
        `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`
      );
    }

    updateCountdown();

    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!daily) return;

    const interval = setInterval(() => {
      const todayUTC = new Date().toISOString().slice(0, 10);

      if (todayUTC !== daily.date) {
        loadDaily();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [daily]);

  async function submitAnswer(event) {
    event.preventDefault();

    if (submitting || !daily) return;

    const question = daily.questions.find((q) => !q.answered);

    if (!question) return;

    const submittedAnswer = Number(answer);

    if (answer.trim() === "" || !Number.isInteger(submittedAnswer)) {
      setError("Please enter a valid whole number.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const csrfResponse = await fetch("/api/auth/csrf", {
        credentials: "include",
      });

      if (!csrfResponse.ok) {
        throw new Error("Unable to retrieve security token.");
      }

      const csrf = await csrfResponse.json();

      const response = await fetch("/api/daily/answer", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          [csrf.headerName]: csrf.token,
        },
        body: JSON.stringify({
          questionId: question.questionId,
          answer: submittedAnswer,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to submit answer.");
      }

      const data = await response.json();

      setResult(data);

      await loadDaily();

      // Keep the answer result visible after refreshing progress.
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function nextQuestion() {
    setAnswer("");
    setResult(null);
    setError("");
  }

  if (loading) {
    return <p>Loading Daily Banana...</p>;
  }

  if (!daily) {
    return (
      <main>
        <h1>Daily Banana</h1>

        <p>{error || "Unable to load today's challenge."}</p>

        <button
          onClick={() => {
            setLoading(true);
            loadDaily();
          }}
        >
          Retry
        </button>

        <p>
          <Link to="/dashboard">Back to Dashboard</Link>
        </p>
      </main>
    );
  }

  const question = daily.questions.find((q) => !q.answered);

  if (daily.completed && !result) {
    return (
      <main
        style={{
          padding: "24px",
          maxWidth: "650px",
          margin: "auto",
        }}
      >
        <h1>Daily Banana Complete!</h1>

        <p>You have completed all five questions today.</p>

        <p>Current Streak: {formatStreak(daily.currentStreak)}</p>

        <p>Longest Streak: {formatStreak(daily.longestStreak)}</p>

        <h2>Next Daily Banana in</h2>

        <p
          style={{
            fontSize: "28px",
            fontWeight: "bold",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {timeRemaining}
        </p>

        <p>New challenge unlocks at 00:00 UTC.</p>

        <Link to="/dashboard">Back to Dashboard</Link>
      </main>
    );
  }

  return (
    <main
      style={{
        padding: "24px",
        maxWidth: "650px",
        margin: "auto",
      }}
    >
      <h1>Daily Banana</h1>

      <p>Date: {daily.date}</p>

      <p>
        Progress: {daily.answeredQuestions}/{daily.totalQuestions}
      </p>

      <p>Current Streak: {formatStreak(daily.currentStreak)}</p>

      <p>Longest Streak: {formatStreak(daily.longestStreak)}</p>

      {error && <p role="alert">{error}</p>}

      {result ? (
        <section>
          <h2>{result.correct ? "Correct!" : "Incorrect"}</h2>

          <p>Correct answer: {result.correctAnswer}</p>

          {result.completed ? (
            <>
              <h2>Daily Challenge Complete!</h2>

              <p>XP earned: +{result.xpEarned}</p>

              <p>
                Current streak: {formatStreak(result.currentStreak)}
              </p>

              <p>
                Longest streak: {formatStreak(result.longestStreak)}
              </p>

              <h2>Next Daily Banana in</h2>

              <p
                style={{
                  fontSize: "28px",
                  fontWeight: "bold",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {timeRemaining}
              </p>

              <p>New challenge unlocks at 00:00 UTC.</p>

              <Link to="/dashboard">Back to Dashboard</Link>
            </>
          ) : (
            <button onClick={nextQuestion}>Next Question</button>
          )}
        </section>
      ) : question ? (
        <section>
          <h2>
            Question {question.questionNumber} of {daily.totalQuestions}
          </h2>

          <img
            src={question.imageUrl}
            alt={`Daily Banana Question ${question.questionNumber}`}
            style={{
              width: "100%",
              maxWidth: "450px",
            }}
          />

          <form onSubmit={submitAnswer}>
            <label htmlFor="daily-answer">Your Answer</label>

            <input
              id="daily-answer"
              type="number"
              step="1"
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              required
            />

            <button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Answer"}
            </button>
          </form>
        </section>
      ) : (
        <p>No questions available.</p>
      )}

      <p>
        <Link to="/dashboard">Back to Dashboard</Link>
      </p>
    </main>
  );
}

export default DailyPage;
