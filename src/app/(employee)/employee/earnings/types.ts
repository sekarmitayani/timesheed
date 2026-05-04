import { Contract } from "@/lib/services/admin-contracts";

export interface EnrichedContract extends Contract {
  project_name: string;
  total_paid: number;
  approvedMinutes: number;
  pendingMinutes: number;
  approvedDays: number;
  total_earned: number;
  payment_status: "pending" | "paid" | "partially_paid";
  payments: Array<{
    id: string;
    name: string;
    amount: number;
    paid_at: string;
    description: string;
  }>;
}
