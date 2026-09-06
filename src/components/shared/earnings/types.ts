import { Contract } from "@/lib/services/admin-contracts";

export interface MonthlyBreakdown {
  period_name: string;
  month: number; // 1-12
  year: number;
  earned: number;
  paid: number;
  status: "paid" | "unpaid" | "partially_paid" | "pending";
}

export interface EnrichedContract extends Contract {
  project_name: string;
  total_paid: number;
  total_earned: number; // Mapping from CalculatedTarget or summary target
  remaining: number;
  payment_status: "paid" | "partially_paid" | "pending";
  
  // From Backend ContractSummary
  contract_target: number;
  calculated_target: number;
  
  // Specific stats returned from backend
  all_time_duration?: number;
  month_duration?: number;
  all_time_days?: number;
  month_days?: number;
  
  estimated_earning?: number; // Assumed addition to backend for pending items
  
  this_month_liability?: number;
  total_liability: number;
  monthly_breakdown?: MonthlyBreakdown[];
  
  // Stats for timesheet/mandays
  submitted_count?: number; 
  approved_count?: number;
  
  // For yearly
  current_year_index?: number;

  payments: Array<{
    id: string;
    name: string;
    amount: number;
    paid_at: string;
    description: string;
  }>;
}
