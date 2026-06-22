import { fetchApi } from "../api";

// ---- Types ----
export interface TimesheetLog {
    id: number;
    user_id: number;
    project_id: number;
    task_id: number | null;
    task_description: string;
    face_similarity_score: number | null;
    clock_in: string;
    clock_out: string | null;
    duration_minutes: number;
    status: "pending" | "approved" | "rejected";
    rejection_note?: string;
    is_anomaly?: boolean;
    anomaly_reason?: string;
    created_at?: string;
    updated_at?: string;
    // Pre-loaded relations (from inbox)
    user?: { id: number; full_name: string; email: string };
    project?: { id: number; name: string };
    task?: { complexity: number; created_at: string; created_by_id: number; title: string; description: string };
}

export interface ClockInPayload {
    project_id: number;
    task_id?: number | null;
    face_similarity_score?: number | null;
}

export interface ClockOutPayload {
    task_description: string;
}

// ---- Service ----
export const timesheetService = {
    async clockIn(payload: ClockInPayload): Promise<{ message: string; data: TimesheetLog }> {
        return fetchApi("/timesheets/clock-in", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },

    async clockOut(payload: ClockOutPayload): Promise<{ message: string; data: TimesheetLog }> {
        return fetchApi("/timesheets/clock-out", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },

    async getMyLogs(): Promise<TimesheetLog[]> {
        return fetchApi("/timesheets/my-logs", {
            method: "GET",
        });
    },

    async getTaskTimesheets(taskId: number | string): Promise<TimesheetLog[]> {
        return fetchApi(`/tasks/${taskId}/timesheets`, {
            method: "GET",
        });
    },
};
