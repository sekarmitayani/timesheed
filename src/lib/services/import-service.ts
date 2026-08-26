import { useAuthStore } from "@/store/useAuthStore";

const API_BASE_URL = "http://localhost:8080/api";

export interface ImportRowError {
    row: number;
    field: string;
    message: string;
    data?: Record<string, string>;
}

export interface ImportSuccessRow {
    row: number;
    identifier: string;
    message: string;
}

export interface ImportSummary {
    total_rows: number;
    success_count: number;
    skipped_count: number;
    error_count: number;
    errors: ImportRowError[];
    success_list: ImportSuccessRow[];
}

export const importService = {
    /**
     * Upload and bulk import users via CSV file
     */
    async importUsers(file: File): Promise<ImportSummary> {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        
        const formData = new FormData();
        formData.append("file", file);

        const headers: Record<string, string> = {};
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}/admin/users/import`, {
            method: "POST",
            headers,
            body: formData,
        });

        if (!response.ok) {
            if (response.status === 401 && typeof window !== "undefined") {
                useAuthStore.getState().setSessionExpired(true);
            }
            const errorData = await response.json().catch(() => ({}));
            const err: any = new Error(errorData.error || errorData.message || response.statusText || "Failed to import users");
            err.data = errorData;
            err.status = response.status;
            throw err;
        }

        return response.json();
    },

    /**
     * Upload and bulk import contracts via CSV file
     */
    async importContracts(file: File): Promise<ImportSummary> {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        
        const formData = new FormData();
        formData.append("file", file);

        const headers: Record<string, string> = {};
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}/admin/contracts/import`, {
            method: "POST",
            headers,
            body: formData,
        });

        if (!response.ok) {
            if (response.status === 401 && typeof window !== "undefined") {
                useAuthStore.getState().setSessionExpired(true);
            }
            const errorData = await response.json().catch(() => ({}));
            const err: any = new Error(errorData.error || errorData.message || response.statusText || "Failed to import contracts");
            err.data = errorData;
            err.status = response.status;
            throw err;
        }

        return response.json();
    }
};
