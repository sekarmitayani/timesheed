import { fetchApi } from "../api";

export type TrashTabType = "users" | "projects" | "contracts" | "resources";

export interface TrashSummary {
    users: number;
    contracts: number;
    projects: number;
    resources: number;
    tasks: number;
}

export interface TrashUser {
    id: number;
    email: string;
    full_name: string;
    role: string;
    employee_type?: string;
    phone_number: string;
    skill_level: number;
    created_at: string;
    deleted_at: string;
}

export interface TrashContract {
    id: number;
    user_id: number;
    user_name: string;
    user_email: string;
    project_id?: number;
    project_name?: string;
    contract_type: string;
    payment_scheme: string;
    rate_amount: number;
    start_date: string;
    end_date?: string;
    deleted_at: string;
}

export interface TrashProject {
    id: number;
    name: string;
    client_name: string;
    status: string;
    budget_revenue?: number;
    budget_cost?: number;
    deadline?: string;
    created_at: string;
    deleted_at: string;
}

export interface TrashResource {
    id: number;
    project_id: number;
    project_name: string;
    user_id: number;
    user_name: string;
    type: string;
    details: string;
    amount: number;
    status: string;
    created_at: string;
    deleted_at: string;
}

export interface TrashTask {
    id: number;
    project_id: number;
    project_name: string;
    title: string;
    description: string;
    status: string;
    complexity: number;
    due_date?: string;
    created_at: string;
    deleted_at: string;
}

export interface ImpactDetail {
    key: string;
    label: string;
    count: number;
}

export interface DeleteImpactResponse {
    entity: string;
    id: number;
    name: string;
    total_impacted: number;
    impacts: ImpactDetail[];
}

export interface EntityCheckResponse {
    exists: boolean;
    deleted: boolean;
    name: string;
    type?: string;
}

export const trashService = {
    async getSummary(): Promise<TrashSummary> {
        return (await fetchApi("/admin/trash/summary")) as TrashSummary;
    },
    async getDeletedUsers(): Promise<TrashUser[]> {
        return (await fetchApi("/admin/trash/users")) as TrashUser[];
    },
    async restoreUser(id: number): Promise<{ message: string; id: number }> {
        return (await fetchApi(`/admin/trash/users/${id}/restore`, {
            method: "POST"
        })) as { message: string; id: number };
    },
    async getDeletedContracts(): Promise<TrashContract[]> {
        return (await fetchApi("/admin/trash/contracts")) as TrashContract[];
    },
    async restoreContract(id: number): Promise<{ message: string; id: number }> {
        return (await fetchApi(`/admin/trash/contracts/${id}/restore`, {
            method: "POST"
        })) as { message: string; id: number };
    },
    async getDeletedProjects(): Promise<TrashProject[]> {
        return (await fetchApi("/admin/trash/projects")) as TrashProject[];
    },
    async restoreProject(id: number): Promise<{ message: string; id: number }> {
        return (await fetchApi(`/admin/trash/projects/${id}/restore`, {
            method: "POST"
        })) as { message: string; id: number };
    },
    async getDeletedResources(): Promise<TrashResource[]> {
        return (await fetchApi("/admin/trash/resources")) as TrashResource[];
    },
    async restoreResource(id: number): Promise<{ message: string; id: number }> {
        return (await fetchApi(`/admin/trash/resources/${id}/restore`, {
            method: "POST"
        })) as { message: string; id: number };
    },
    async getDeletedTasks(): Promise<TrashTask[]> {
        return (await fetchApi("/admin/trash/tasks")) as TrashTask[];
    },
    async restoreTask(id: number): Promise<{ message: string; id: number }> {
        return (await fetchApi(`/admin/trash/tasks/${id}/restore`, {
            method: "POST"
        })) as { message: string; id: number };
    },
    async getDeleteImpact(entity: string, id: number | string): Promise<DeleteImpactResponse> {
        return (await fetchApi(`/delete-impact/${entity}/${id}`)) as DeleteImpactResponse;
    },
    async checkEntityStatus(type: string, id: number | string): Promise<EntityCheckResponse> {
        return (await fetchApi(`/entity-check/${type}/${id}`)) as EntityCheckResponse;
    }
};
