
import Button from "../components/common/Button";

function HomePage() {
  return (
    <main>
      <h1>🍌 Banana Quiz</h1>
      <p>Challenge yourself with fun mathematical puzzles!</p>

      <Button onClick={() => console.log("Start Quiz clicked")}>
        Start Quiz
      </Button>
    </main>
  );
}

export default HomePage;
