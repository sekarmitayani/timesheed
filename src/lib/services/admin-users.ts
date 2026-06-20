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
     * Get all users with pagination
     */
    async getUsers(page: number = 1, limit: number = 10): Promise<PaginatedUsersResponse> {
        return fetchApi(`/admin/users?page=${page}&limit=${limit}`, {
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
     * Impersonate another user (Proxy Login)
     */
    async proxyLogin(targetUserId: string | number): Promise<{ message: string; token: string; user: any; is_impersonating: boolean }> {
        return fetchApi("/admin/proxy-login", {
            method: "POST",
            body: JSON.stringify({ target_user_id: Number(targetUserId) }),
        });
    }
};
