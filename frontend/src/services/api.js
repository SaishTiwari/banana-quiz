
const API_BASE_URL = "/api";

let csrfToken = null;
let csrfHeaderName = "X-XSRF-TOKEN";

export class ApiError extends Error {
    constructor(message, status, details) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.details = details;
    }
}

export async function refreshCsrfToken() {
    const response = await fetch(`${API_BASE_URL}/auth/csrf`, {
        credentials: "include"
    });

    if (!response.ok) {
        throw new ApiError("Unable to initialize security token.", response.status);
    }

    const data = await response.json();
    csrfToken = data.token;
    csrfHeaderName = data.headerName || csrfHeaderName;

    return data;
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
        headers[csrfHeaderName] = csrfToken;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        method,
        credentials: "include",
        headers
    });

    if (response.status === 204) {
        return null;
    }

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
        ? await response.json()
        : await response.text();

    if (!response.ok) {
        const message = typeof data === "object" && data?.message
            ? data.message
            : response.status === 401
                ? "Your session has expired. Please sign in again."
                : response.status === 409
                    ? "This action has already been completed."
                    : "Unable to connect to the server. Please try again.";
        throw new ApiError(message, response.status, data);
    }

    return data;
}
