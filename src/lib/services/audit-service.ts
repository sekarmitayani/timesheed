import { fetchApi } from "../api";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "LOGIN_AS_PROXY" | "PROXY_LOGOUT";

export interface AuditLog {
    id: number;
    user_id: number;
    performer?: {
        full_name: string;
        email: string;
        role: string;
    };
    action: AuditAction;
    target_table: string;
    record_id: number;
    entity_context?: string;
    old_value?: string;
    new_value?: string;
    old_value_parsed?: Record<string, any>;
    new_value_parsed?: Record<string, any>;
    created_at: string;
}

export interface AuditLogResponse {
    message: string;
    data: AuditLog[];
    meta: {
        page: number;
        limit: number;
        total_data: number;
        total_pages: number;
    };
}

export const auditService = {
    /**
     * Get global audit logs (Admin only)
     */
    async getGlobalAuditLogs(
        page: number = 1,
        limit: number = 10,
        filters: {
            action?: string;
            module?: string;
            search?: string;
            start_date?: string;
            end_date?: string;
        } = {}
    ): Promise<AuditLogResponse> {
        let query = `?page=${page}&limit=${limit}`;
        if (filters.action && filters.action !== "all") query += `&action=${filters.action}`;
        if (filters.module && filters.module !== "all") query += `&target_table=${filters.module}`;
        if (filters.search) query += `&user_id=${encodeURIComponent(filters.search)}`;
        if (filters.start_date) query += `&start_date=${filters.start_date}`;
        if (filters.end_date) query += `&end_date=${filters.end_date}`;

        return fetchApi(`/admin/audit-logs${query}`, {
            method: "GET",
        });
    },

    /**
     * Get logs for a specific user
     */
    async getUserLogs(userId: number | string): Promise<AuditLog[]> {
        return fetchApi(`/admin/users/${userId}/logs`, {
            method: "GET",
        });
    },

    /**
     * Get logs for a specific contract
     */
    async getContractLogs(contractId: number | string): Promise<AuditLog[]> {
        return fetchApi(`/admin/contracts/${contractId}/logs`, {
            method: "GET",
        });
    },

    /**
     * Get logs for a specific project
     */
    async getProjectLogs(projectId: number | string): Promise<AuditLog[]> {
        return fetchApi(`/getproject/${projectId}/logs`, {
            method: "GET",
        });
    }
};
