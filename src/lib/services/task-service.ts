import { fetchApi } from "../api";

// ---- Types ----
export interface ApiTask {
    id: number;
    project_id: number;
    created_by_id: number;
    assigned_to_id: number;
    title: string;
    description: string;
    complexity: number;
    status: "todo" | "in_progress" | "done";
    due_date?: string;
    comment_count?: number;
    created_at: string;
    updated_at: string;
}

export interface CreateTaskPayload {
    project_id: number;
    assigned_to_id?: number; // Ignored if Employee
    title: string;
    description?: string;
    complexity?: number;
    due_date?: string;
}

export interface UpdateTaskStatusPayload {
    status: "todo" | "in_progress" | "done";
}

export interface UpdateTaskPayload {
    project_id?: number;
    title?: string;
    description?: string;
    complexity?: number;
    assigned_to_id?: number;
    status?: "todo" | "in_progress" | "done";
    due_date?: string;
}

export interface TaskComment {
    id: number;
    task_id: number;
    user_id: number;
    user?: {
        id: number;
        full_name: string;
        email: string;
    };
    comment: string;
    created_at: string;
    updated_at?: string;
}

export interface TaskAuditLog {
    id: number;
    user_id: number;
    action: string;
    target_table: string;
    record_id: number;
    old_value: string;
    new_value: string;
    created_at: string;
    user?: {
        full_name: string;
    };
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
        return fetchApi(`/getproject/${projectId}/tasks${query}`, {
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

    async getTaskComments(taskId: number | string): Promise<TaskComment[]> {
        return fetchApi(`/tasks/${taskId}/comments`, {
            method: "GET",
        });
    },

    async addTaskComment(taskId: number | string, comment: string): Promise<TaskComment> {
        return fetchApi(`/tasks/${taskId}/comments`, {
            method: "POST",
            body: JSON.stringify({ comment }),
        });
    },

    async getTaskLogs(taskId: number | string): Promise<TaskAuditLog[]> {
        return fetchApi(`/tasks/${taskId}/logs`, {
            method: "GET",
        });
    },
};
