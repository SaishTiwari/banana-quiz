
import { apiRequest, refreshCsrfToken } from "./api";

export async function registerUser(name, email, password) {
    return apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({
            name,
            email,
            password
        })
    });
}

export async function loginUser(email, password) {
    const response = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({
            email,
            password
        })
    });

    await refreshCsrfToken();

    return response;
}

export async function getCurrentUser() {
    return apiRequest("/auth/me");
}

export async function logoutUser() {
    // The backend currently exposes no logout route. Clearing local UI state
    // is still useful, while the session cookie expires server-side.
    return null;
}
