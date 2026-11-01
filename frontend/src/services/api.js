
const API_BASE_URL = "/api";

let csrfToken = null;

export async function refreshCsrfToken() {
    const response = await fetch(`${API_BASE_URL}/auth/csrf`, {
        credentials: "include"
    });

    if (!response.ok) {
        throw new Error("Failed to fetch CSRF token");
    }

    const data = await response.json();
    csrfToken = data.token;

    return csrfToken;
}

export async function apiRequest(endpoint, options = {}) {
    const method = (options.method || "GET").toUpperCase();

    if (!["GET", "HEAD", "OPTIONS"].includes(method) && !csrfToken) {
        await refreshCsrfToken();
    }

    const headers = {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers
    };

    if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
        headers["X-XSRF-TOKEN"] = csrfToken;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        method,
        credentials: "include",
        headers
    });

    if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
    }

    if (response.status === 204) {
        return null;
    }

    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        return response.json();
    }

    return response.text();
}
