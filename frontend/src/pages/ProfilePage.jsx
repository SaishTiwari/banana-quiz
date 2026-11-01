
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to load profile");
        }

        const data = await response.json();
        setProfile(data);
      } catch (err) {
        console.error(err);
        setError("Unable to load your profile.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  return (
    <main className="home">
      <div className="home__content">
        <h1 className="home__title">My Profile</h1>

        {loading && <p>Loading profile...</p>}

        {error && <p role="alert">{error}</p>}

        {profile && (
          <section>
            <h2>{profile.name}</h2>
            <p>Email: {profile.email}</p>
            <p>Total XP: {profile.totalXp}</p>
            <p>Journey Level: {profile.journeyLevel}</p>
          </section>
        )}

        <Link to="/dashboard">Back to Dashboard</Link>
      </div>
    </main>
  );
}

export default ProfilePage;
