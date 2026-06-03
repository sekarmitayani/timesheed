import { fetchApi } from "../api";
import { User } from "../types";

export interface UpdateProfilePayload {
    full_name?: string;
    email?: string;
    phone_number?: string;
}

export interface ChangePasswordPayload {
    current_password?: string;
    new_password?: string;
}

export const profileService = {
    /**
     * Get the current user's profile
     */
    async getProfile(): Promise<User> {
        return fetchApi("/profile", {
            method: "GET",
        });
    },

    /**
     * Update the current user's profile
     */
    async updateProfile(payload: UpdateProfilePayload): Promise<User> {
        return fetchApi("/profile", {
            method: "PUT",
            body: JSON.stringify(payload),
        });
    },

    /**
     * Change the current user's password
     */
    async changePassword(payload: ChangePasswordPayload): Promise<{ message: string }> {
        return fetchApi("/profile/password", {
            method: "PUT",
            body: JSON.stringify(payload),
        });
    }
};
