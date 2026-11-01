
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
