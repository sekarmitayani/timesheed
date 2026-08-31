import { fetchApi } from "../api";
import { User, Role } from "../types";

export interface PaginationMeta {
    limit: number;
    page: number;
    total: number;
}

export interface PaginatedUsersResponse {
    data: User[];
    pagination: PaginationMeta;
}

export interface CreateUserPayload {
    email: string;
    password?: string;
    full_name: string;
    phone_number: string;
    role: Role;
    employee_type: "fulltime" | "parttime" | "freelance" | null;
    skill_level?: number;
}

export interface UpdateUserPayload {
    email?: string;
    password?: string;
    full_name?: string;
    phone_number?: string;
    role?: Role;
    employee_type?: "fulltime" | "parttime" | "freelance" | null;
    is_active?: boolean;
    skill_level?: number;
}

export const adminUserService = {
    /**
     * Get all users with pagination and optional filters
     */
    async getUsers(
        page: number = 1, 
        limit: number = 10,
        filters?: { search?: string; status?: string; role?: string; type?: string }
    ): Promise<PaginatedUsersResponse> {
        const params = new URLSearchParams();
        params.append("page", String(page));
        params.append("limit", String(limit));
        if (filters?.search) params.append("search", filters.search);
        if (filters?.status && filters.status !== "all") params.append("status", filters.status);
        if (filters?.role && filters.role !== "all") params.append("role", filters.role);
        if (filters?.type && filters.type !== "all") params.append("employee_type", filters.type);

        return fetchApi(`/admin/users?${params.toString()}`, {
            method: "GET",
        });
    },

    /**
     * Get a specific user by ID
     */
    async getUserById(id: string | number): Promise<User> {
        return fetchApi(`/admin/users/${id}`, {
            method: "GET",
        });
    },

    /**
     * Create a new user account
     */
    async createUser(payload: CreateUserPayload): Promise<User> {
        return fetchApi("/admin/users", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },

    /**
     * Partially update an existing user account
     */
    async updateUser(id: string | number, payload: UpdateUserPayload): Promise<User> {
        return fetchApi(`/admin/users/${id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
        });
    },

    /**
     * Permanently delete a user account
     */
    async deleteUser(id: string | number): Promise<{ message: string }> {
        return fetchApi(`/admin/users/${id}`, {
            method: "DELETE",
        });
    },

    /**
     * Deactivate a user account (safe deletion alternative)
     */
    async deactivateUser(id: string | number): Promise<{ message: string; deactivated: boolean }> {
        return fetchApi(`/admin/users/${id}?action=deactivate`, {
            method: "DELETE",
        });
    },

    /**
     * Impersonate another user (Proxy Login)
     */
    async proxyLogin(targetUserId: string | number): Promise<{ message: string; token: string; user: any; is_impersonating: boolean }> {
        return fetchApi("/admin/proxy-login", {
            method: "POST",
            body: JSON.stringify({ target_user_id: Number(targetUserId) }),
        });
    }
};
