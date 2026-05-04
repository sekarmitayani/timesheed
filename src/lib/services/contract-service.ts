import { fetchApi } from "../api";
import { Contract } from "./admin-contracts";

export const contractService = {
    /**
     * Get current user's contracts (Employee/PM/etc)
     * This uses a non-admin endpoint to avoid permission errors
     */
    async getMyContracts(): Promise<Contract[]> {
        return fetchApi("/my-contracts", {
            method: "GET",
        });
    },

    /**
     * Get current user's payment logs across all contracts
     */
    async getMyPayments(): Promise<any[]> {
        return fetchApi("/my-payments", {
            method: "GET",
        });
    },

    /**
     * Alternative endpoint if /my-contracts doesn't exist
     */
    async getUserContracts(userId: string | number): Promise<Contract[]> {
        return fetchApi(`/contracts/user/${userId}`, {
            method: "GET",
        });
    }
};
