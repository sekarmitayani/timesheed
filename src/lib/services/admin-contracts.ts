import { fetchApi } from "../api";

export type PaymentScheme = "monthly" | "termin" | "back_to_back" | "transfer"; // Keep transfer for backwards compatibility

export interface Contract {
    id: number;
    user_id: number;
    project_id?: number | null;
    contract_type: "yearly" | "monthly" | "mandays" | "timesheet";
    payment_scheme: PaymentScheme;
    rate_amount: number;
    start_date: string;
    end_date: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    // mock properties for our frontend display join
    project_name?: string;
    total_paid?: number;
    payment_status?: "pending" | "paid" | "partially_paid";
}

export interface CreateContractPayload {
    user_id: number | string;
    project_id?: number | null;
    contract_type: "yearly" | "monthly" | "mandays" | "timesheet";
    payment_scheme: PaymentScheme;
    rate_amount: number;
    start_date: string; // YYYY-MM-DD
    end_date?: string | null; // YYYY-MM-DD
    is_active?: boolean;
}

export interface UpdateContractPayload {
    project_id?: number | null;
    contract_type?: "yearly" | "monthly" | "mandays" | "timesheet";
    payment_scheme?: PaymentScheme;
    rate_amount?: number;
    start_date?: string;
    end_date?: string | null;
    is_active?: boolean;
}

// ---- Payment Types ----
export interface ContractPayment {
    id: number;
    contract_id: number;
    name: string;
    amount: number;
    paid_at: string;
    description: string;
    created_at?: string;
    updated_at?: string;
}

export interface CreatePaymentPayload {
    name: string;
    amount: number;
    paid_at?: string; // YYYY-MM-DD, defaults to today
    description?: string;
}

export interface UpdatePaymentPayload {
    name?: string;
    amount?: number;
    paid_at?: string;
    description?: string;
}

export interface ContractSummary {
    contract_target: number;
    total_paid: number;
    remaining: number;
    status: "Pending" | "PartiallyPaid" | "Paid";
}

export const adminContractService = {
    /**
     * Get all contracts for a specific user
     */
    async getUserContracts(userId: string | number): Promise<Contract[]> {
        return fetchApi(`/admin/users/${userId}/contracts`, {
            method: "GET",
        });
    },

    /**
     * Create a new contract
     */
    async createContract(payload: CreateContractPayload): Promise<Contract> {
        return fetchApi("/admin/contracts", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },

    /**
     * Partially update an existing contract
     */
    async updateContract(contractId: string | number, payload: UpdateContractPayload): Promise<Contract> {
        return fetchApi(`/admin/contracts/${contractId}`, {
            method: "PUT",
            body: JSON.stringify(payload),
        });
    },

    /**
     * Hard delete a contract
     */
    async deleteContract(contractId: string | number): Promise<{ message: string }> {
        return fetchApi(`/admin/contracts/${contractId}`, {
            method: "DELETE",
        });
    },

    // ---- Payment Endpoints ----

    /**
     * Add a payment to a contract
     */
    async addPayment(contractId: number | string, payload: CreatePaymentPayload): Promise<{ message: string; data: ContractPayment; contract_summary: ContractSummary }> {
        return fetchApi(`/contracts/${contractId}/payment`, {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },

    /**
     * Get all payments for a contract
     */
    async getPayments(contractId: number | string): Promise<ContractPayment[]> {
        return fetchApi(`/contracts/${contractId}/payments`, {
            method: "GET",
        });
    },

    /**
     * Edit a specific payment
     */
    async updatePayment(paymentId: number | string, payload: UpdatePaymentPayload): Promise<{ message: string; data: ContractPayment }> {
        return fetchApi(`/contract-payments/${paymentId}`, {
            method: "PUT",
            body: JSON.stringify(payload),
        });
    },

    /**
     * Delete a specific payment
     */
    async deletePayment(paymentId: number | string): Promise<{ message: string }> {
        return fetchApi(`/contract-payments/${paymentId}`, {
            method: "DELETE",
        });
    },
};

