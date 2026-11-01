
import { useEffect, useState } from "react";
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

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include"
        });

        if (!response.ok) {
          throw new Error("Unable to load profile");
        }

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
    if (!session || gameStatus !== "playing") {
      return;
    }

    function updateTimer() {
      const remaining = Math.max(
        0,
        Math.ceil(
          (new Date(session.expiresAt).getTime() - Date.now()) / 1000
        )
      );

      setTimeLeft(remaining);

      if (remaining === 0) {
        setGameStatus("failed");
        setMessage("Time is up! Try again.");
      }
    }

    updateTimer();

    const timer = setInterval(updateTimer, 250);

    return () => clearInterval(timer);
  }, [session, gameStatus]);

  async function getCsrfToken() {
    const response = await fetch("/api/auth/csrf", {
      credentials: "include"
    });

    if (!response.ok) {
      throw new Error("Unable to initialize security token");
    }

    return response.json();
  }

  async function refreshProfile() {
    const response = await fetch("/api/auth/me", {
      credentials: "include"
    });

    if (!response.ok) {
      throw new Error("Unable to refresh profile");
    }

    setUser(await response.json());
  }

  async function startJourney() {
    if (starting || submitting) {
      return;
    }

    setStarting(true);
    setSession(null);
    setCurrentQuestionIndex(0);
    setAnswer("");
    setTimeLeft(0);
    setMessage("");
    setXpEarned(0);
    setGameStatus("idle");

    try {
      const csrf = await getCsrfToken();

      const response = await fetch("/api/journey/start", {
        method: "POST",
        credentials: "include",
        headers: {
          [csrf.headerName]: csrf.token
        }
      });

      if (!response.ok) {
        throw new Error("Unable to start Journey");
      }

      const data = await response.json();

      setSession(data);
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

    if (
      !session ||
      gameStatus !== "playing" ||
      submitting ||
      answer.trim() === ""
    ) {
      return;
    }

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
        headers: {
          "Content-Type": "application/json",
          [csrf.headerName]: csrf.token
        },
        body: JSON.stringify({
          sessionId: session.sessionId,
          questionId: question.questionId,
          answer: numericAnswer
        })
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

      if (result.completed) {
        setXpEarned(result.xpEarned);
        setGameStatus("completed");
        setMessage("Level completed!");

        try {
          await refreshProfile();
        } catch (err) {
          setMessage(
            "Level completed! Refresh the page to update your profile."
          );
        }

        return;
      }

      setCurrentQuestionIndex((previous) => previous + 1);
      setAnswer("");
      setMessage("Correct answer! Next question.");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p>Loading Journey...</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  const currentQuestion =
    session?.questions[currentQuestionIndex];

  return (
    <main>
      <Link to="/dashboard">Back to Dashboard</Link>

      <h1>Banana Journey</h1>

      <h2>Level {user.journeyLevel}</h2>

      <p>Total XP: {user.totalXp}</p>

      <p>
        Complete all questions before time runs out.
        One incorrect answer ends the attempt.
      </p>

      {(gameStatus === "idle" ||
        gameStatus === "failed" ||
        gameStatus === "completed") && (
        <button
          type="button"
          onClick={startJourney}
          disabled={starting || submitting}
        >
          {starting
            ? "Starting..."
            : gameStatus === "idle"
              ? "Start Journey"
              : "Play Again"}
        </button>
      )}

      {session && gameStatus === "playing" && (
        <section>
          <h2>Level {session.level}</h2>

          <p>
            Question {currentQuestionIndex + 1} of{" "}
            {session.questions.length}
          </p>

          <p>
            <strong>Time remaining: {timeLeft} seconds</strong>
          </p>

          <p>
            Reward: {session.xpReward} XP
          </p>

          {currentQuestion && (
            <>
              <img
                src={currentQuestion.question}
                alt={`Banana question ${currentQuestionIndex + 1}`}
                style={{
                  width: "100%",
                  maxWidth: "400px",
                  height: "auto"
                }}
              />

              <form onSubmit={submitAnswer}>
                <div>
                  <label htmlFor="journey-answer">
                    Your answer:
                  </label>

                  <input
                    id="journey-answer"
                    type="number"
                    step="1"
                    value={answer}
                    onChange={(event) =>
                      setAnswer(event.target.value)
                    }
                    required
                    disabled={submitting}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || answer.trim() === ""}
                >
                  {submitting
                    ? "Submitting..."
                    : "Submit Answer"}
                </button>
              </form>
            </>
          )}
        </section>
      )}

      {gameStatus === "completed" && (
        <section>
          <h2>Level Completed!</h2>

          <p>XP Earned: +{xpEarned}</p>

          <p>Total XP: {user.totalXp}</p>

          <p>
            {user.journeyLevel <= 10
              ? `Level ${user.journeyLevel} unlocked!`
              : "Journey completed!"}
          </p>
        </section>
      )}

      {gameStatus === "failed" && (
        <section>
          <h2>Journey Failed</h2>
          <p>You can retry this level.</p>
        </section>
      )}

      {message && <p role="status">{message}</p>}
    </main>
  );
}
