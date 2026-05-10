import { useAuthStore } from "@/store/useAuthStore";

const API_BASE_URL = "http://localhost:8080/api";

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string> || {}),
    };

    if (token && !headers["Authorization"]) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        if (response.status === 401 && typeof window !== "undefined" && endpoint !== "/auth/login") {
            useAuthStore.getState().setSessionExpired(true);
        }
        const errorData = await response.json().catch(() => ({}));
        const err: any = new Error(errorData.error || errorData.message || response.statusText || "Something went wrong");
        err.data = errorData;
        err.status = response.status;
        throw err;
    }

    return response.json();
}
