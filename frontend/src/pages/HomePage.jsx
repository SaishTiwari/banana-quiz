
import { useNavigate } from "react-router-dom";
import Button from "../components/common/Button";
import "./HomePage.css";

function HomePage() {
  const navigate = useNavigate();

  const handleStartQuiz = () => {
    navigate("/quiz");
  };

  return (
    <main className="home">
      <div className="home__content">
        <div className="home__emoji" aria-hidden="true">
          🍌
        </div>

        <h1 className="home__title">Banana Quiz</h1>

        <p className="home__description">
          Put your mathematical skills to the test with fun
          and challenging banana puzzles.
        </p>

        <Button onClick={handleStartQuiz}>
          Start Quiz
        </Button>

        <div className="home__features">
          <span className="home__feature">Fun Puzzles</span>
          <span className="home__feature">Track Scores</span>
          <span className="home__feature">Improve Skills</span>
        </div>
      </div>
    </main>
  );
}

export default HomePage;
