
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { quizService } from "../services/quizService";

function QuizPage() {
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function loadQuestion() {
    setLoading(true);
    setError("");
    setResult(null);
    setAnswer("");
    setQuestion(null);

    try {
      const data = await quizService.getQuestion();
      setQuestion(data);
    } catch (err) {
      console.error("Failed to load question:", err);
      setError("Unable to load question. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQuestion();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!question || submitting || result) {
      return;
    }

    if (answer.trim() === "" || !Number.isInteger(Number(answer))) {
      setError("Please enter a valid whole number.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await quizService.submitAnswer(
        question.questionId,
        Number(answer)
      );

      setResult(response);
    } catch (err) {
      console.error("Failed to submit answer:", err);
      setError("Unable to submit answer. Please try a new question.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="home">
      <div className="home__content">
        <h1 className="home__title">Banana Quiz</h1>

        {loading && <p>Loading question...</p>}

        {error && <p role="alert">{error}</p>}

        {question && !loading && (
          <>
            <img
              src={question.question}
              alt="Mathematical puzzle"
              style={{ maxWidth: "100%", height: "auto" }}
            />

            <form onSubmit={handleSubmit}>
              <label htmlFor="answer">Your answer</label>

              <input
                id="answer"
                type="number"
                step="1"
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                disabled={submitting || result !== null}
                required
              />

              <button
                type="submit"
                disabled={submitting || result !== null}
              >
                {submitting ? "Checking..." : "Submit Answer"}
              </button>
            </form>
          </>
        )}

        {result && (
          <p role="status">
            {result.message}
          </p>
        )}

        <button
          type="button"
          onClick={loadQuestion}
          disabled={loading || submitting}
        >
          Next Question
        </button>

        <p>
          <Link to="/">Back to Home</Link>
        </p>
      </div>
    </main>
  );
}

export default QuizPage;
