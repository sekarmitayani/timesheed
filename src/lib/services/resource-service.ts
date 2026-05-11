import { fetchApi } from "../api";

// ---- Types ----
export interface ResourceRequest {
    id: number;
    project_id: number;
    user_id: number;
    type: string; // "manpower" | "tools" | etc.
    details: string;
    amount: number;
    status: "pending" | "approved" | "rejected";
    created_at: string;
    updated_at: string;
    project?: { id: number; name: string };
    user?: { id: number; full_name: string; email: string };
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total_rows: number;
    total_pages: number;
}

export interface ResourceListResponse {
    data: ResourceRequest[];
    pagination: PaginationMeta;
}

export interface CreateResourcePayload {
    project_id: number;
    type: string;
    details: string;
}

export interface ApprovalActionPayload {
    status: "approved" | "rejected";
    amount?: number;
    confirm_zero?: boolean;
}

export interface EditResourcePayload {
    type?: string;
    details?: string;
    amount?: number;
    status?: string;
    confirm_zero?: boolean;
}

export interface GetResourcesParams {
    page?: number;
    limit?: number;
    project_id?: string | number;
    status?: string;
    type?: string;
}

// ---- Service ----
export const resourceService = {
    async createResourceRequest(payload: CreateResourcePayload): Promise<ResourceRequest> {
        return fetchApi("/resources", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },

    async getResourceRequests(params: GetResourcesParams = {}): Promise<ResourceListResponse> {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append("page", params.page.toString());
        if (params.limit) queryParams.append("limit", params.limit.toString());
        if (params.project_id && params.project_id !== "all") queryParams.append("project_id", params.project_id.toString());
        if (params.status && params.status !== "all") queryParams.append("status", params.status);
        if (params.type && params.type !== "all") queryParams.append("type", params.type);

        const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
        return fetchApi(`/resources${query}`, {
            method: "GET",
        });
    },

    async approvalAction(id: number | string, payload: ApprovalActionPayload): Promise<{ message: string; data: ResourceRequest }> {
        return fetchApi(`/resources/${id}/status`, {
            method: "PUT",
            body: JSON.stringify(payload),
        });
    },

    async editResource(id: number | string, payload: EditResourcePayload): Promise<{ message: string; data: ResourceRequest }> {
        return fetchApi(`/resources/${id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
        });
    },

    async deleteResourceRequest(id: number | string): Promise<{ message: string }> {
        return fetchApi(`/resources/${id}`, {
            method: "DELETE",
        });
    },
};
