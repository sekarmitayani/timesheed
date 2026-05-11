import { fetchApi } from "../api";
import { TimesheetLog } from "./timesheet-service";

// ---- Types ----
export interface ReviewTimesheetPayload {
    status: "approved" | "rejected";
    rejection_note?: string;
}

export interface BulkActionPayload {
    timesheet_ids: number[];
    status: "approved" | "rejected";
    rejection_note?: string;
}

// ---- Service ----
export const approvalService = {
    async getInbox(status: string = "pending"): Promise<TimesheetLog[]> {
        return fetchApi(`/approvals/inbox?status=${status}`, {
            method: "GET",
        });
    },

    async reviewTimesheet(timesheetId: number | string, payload: ReviewTimesheetPayload): Promise<{ message: string; data: TimesheetLog }> {
        return fetchApi(`/approvals/timesheet/${timesheetId}`, {
            method: "PUT",
            body: JSON.stringify(payload),
        });
    },

    async bulkAction(payload: BulkActionPayload): Promise<{ message: string; rows_affected: number }> {
        return fetchApi("/approvals/bulk-action", {
            method: "PUT",
            body: JSON.stringify(payload),
        });
    },
};
