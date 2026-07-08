import { fetchApi } from "../api";
import { ApiProject, ProjectMember } from "../types";

// ---- Response Types ----
export interface PaginatedProjectsResponse {
    data: ApiProject[];
    pagination: {
        limit: number;
        page: number;
        total: number;
    };
}

export interface CreateProjectPayload {
    name: string;
    client_name: string;
    client_email?: string;
    budget_revenue?: number;
    budget_cost?: number;
    budget_cost_threshold?: number;
    deadline?: string;
}

export interface UpdateProjectPayload {
    name?: string;
    client_name?: string;
    client_email?: string;
    status?: string;
    budget_revenue?: number;
    budget_cost?: number;
    budget_cost_threshold?: number;
    deadline?: string;
}

export interface AssignMemberPayload {
    project_id: number;
    user_id: number;
    role_in_project: string;
    custom_rate?: number | null;
    contract_type?: string;
    payment_scheme?: string;
}

// ---- Service ----
export const projectService = {
    // === GENERAL READ (All Roles) ===

    async getProjects(page: number = 1, limit: number = 10): Promise<PaginatedProjectsResponse> {
        return fetchApi(`/getproject?page=${page}&limit=${limit}`, { method: "GET" });
    },

    async getProjectById(id: number | string): Promise<ApiProject> {
        return fetchApi(`/getproject/${id}`, { method: "GET" });
    },

    async getProjectMembers(projectId: number | string): Promise<ProjectMember[]> {
        return fetchApi(`/getproject/${projectId}/members`, { method: "GET" });
    },

    async getProjectForecast(projectId: number | string): Promise<any> {
        return fetchApi(`/getproject/${projectId}/forecast`, { method: "GET" });
    },

    // === ADMIN ONLY ===

    async createProject(payload: CreateProjectPayload): Promise<ApiProject> {
        const data = { ...payload };
        if (data.deadline) {
            if (data.deadline.length === 10) data.deadline = `${data.deadline}T00:00:00Z`;
        } else {
            delete data.deadline;
        }
        return fetchApi("/project/create", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    async deleteProject(id: number | string): Promise<{ message: string }> {
        return fetchApi(`/project/delete/${id}`, { method: "DELETE" });
    },

    async assignMember(payload: AssignMemberPayload): Promise<{ message: string; data: ProjectMember; custom_contract: boolean }> {
        return fetchApi("/project/assign", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },

    async removeMember(memberId: number | string): Promise<{ message: string }> {
        return fetchApi(`/project/member/${memberId}`, { method: "DELETE" });
    },

    // === OPERATIONAL (Admin / PM) ===

    async updateProject(projectId: number | string, payload: UpdateProjectPayload): Promise<ApiProject> {
        const data = { ...payload };
        if (data.deadline) {
            if (data.deadline.length === 10) data.deadline = `${data.deadline}T00:00:00Z`;
        } else {
            delete data.deadline;
        }
        const res = await fetchApi(`/project/update/${projectId}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
        // Backend now returns { project: {...}, contracts_deactivated: N }
        return res.project || res;
    },
};
