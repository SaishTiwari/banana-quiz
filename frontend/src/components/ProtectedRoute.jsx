
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getCurrentUser } from "../services/authService";

function ProtectedRoute() {
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);

    useEffect(() => {
        let active = true;

        async function checkAuthentication() {
            try {
                await getCurrentUser();

                if (active) {
                    setAuthenticated(true);
                }
            } catch {
                if (active) {
                    setAuthenticated(false);
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        checkAuthentication();

        return () => {
            active = false;
        };
    }, []);

    if (loading) {
        return <p>Checking authentication...</p>;
    }

    if (!authenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}

export default ProtectedRoute;
