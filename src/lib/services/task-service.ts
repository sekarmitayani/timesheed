import { fetchApi } from "../api";

// ---- Types ----
export interface ApiTask {
    id: number;
    project_id: number;
    created_by_id: number;
    assigned_to_id: number;
    title: string;
    description: string;
    status: "todo" | "in_progress" | "done";
    created_at: string;
    updated_at: string;
}

export interface CreateTaskPayload {
    project_id: number;
    assigned_to_id?: number; // Ignored if Employee
    title: string;
    description?: string;
}

export interface UpdateTaskStatusPayload {
    status: "todo" | "in_progress" | "done";
}

export interface UpdateTaskPayload {
    project_id?: number;
    title?: string;
    description?: string;
    assigned_to_id?: number;
    status?: "todo" | "in_progress" | "done";
}

// ---- Service ----
export const taskService = {
    async createTask(payload: CreateTaskPayload): Promise<ApiTask> {
        return fetchApi("/tasks", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },

    async getProjectTasks(projectId: number | string, myTasks?: boolean): Promise<ApiTask[]> {
        const query = myTasks ? "?my_tasks=true" : "";
        return fetchApi(`/project/${projectId}/tasks${query}`, {
            method: "GET",
        });
    },

    async updateTaskStatus(taskId: number | string, payload: UpdateTaskStatusPayload): Promise<ApiTask> {
        return fetchApi(`/tasks/${taskId}/status`, {
            method: "PUT",
            body: JSON.stringify(payload),
        });
    },

    async updateTask(taskId: number | string, payload: UpdateTaskPayload): Promise<ApiTask> {
        return fetchApi(`/tasks/${taskId}`, {
            method: "PUT",
            body: JSON.stringify(payload),
        });
    },

    async deleteTask(taskId: number | string): Promise<{ message: string }> {
        return fetchApi(`/tasks/${taskId}`, {
            method: "DELETE",
        });
    },
};
