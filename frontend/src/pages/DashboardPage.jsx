
import { Link } from "react-router-dom";

function DashboardPage() {
  return (
    <main className="home">
      <div className="home__content">
        <h1 className="home__title">Banana Quiz</h1>
        <p>Choose your game mode</p>

        <section>
          <h2>Banana Journey</h2>
          <p>Complete timed challenges and unlock new levels.</p>
          <p>Coming soon</p>
        </section>

        <section>
          <h2>Banana Battle</h2>
          <p>Challenge your friends in a live 1v1 quiz.</p>
          <p>Coming soon</p>
        </section>

        <section>
          <h2>Daily Banana</h2>
          <p>Answer five questions every day and build your streak.</p>
          <p>Coming soon</p>
        </section>

        <section>
          <h2>Classic Quiz</h2>
          <p>Practice with unlimited Banana questions.</p>
          <Link to="/quiz">Play Classic Quiz</Link>
        </section>

        <nav aria-label="Account navigation">
          <Link to="/profile">Profile</Link>
          {" | "}
          <Link to="/settings">Settings</Link>
        </nav>
      </div>
    </main>
  );
}

export default DashboardPage;
