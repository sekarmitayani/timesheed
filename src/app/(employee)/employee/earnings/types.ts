import { Contract } from "@/lib/services/admin-contracts";

export interface MonthlyBreakdown {
  monthName: string;
  monthIndex: number; // 0-11
  year: number;
  earned: number;
  paid: number;
  liability: number;
  status: "paid" | "unpaid" | "partially_paid";
}

export interface EnrichedContract extends Contract {
  project_name: string;
  total_paid: number;
  approvedMinutes: number;
  pendingMinutes: number;
  approvedDays: number;
  total_earned: number;
  estimated_earning?: number;
  payment_status: "pending" | "paid" | "partially_paid";
  
  // New fields for specific contract types
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
