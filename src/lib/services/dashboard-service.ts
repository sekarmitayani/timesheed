import { fetchApi } from "../api";

// ---- Response Types ----

export interface CostBreakdownItem {
    label: string;
    value: number;
}

export interface FinancialHealthResponse {
    total_revenue: number;
    total_expenses: number;
    total_cost_sdm: number;
    margin: number;
    cost_breakdown: CostBreakdownItem[];
}

export interface LiabilityDetail {
    user_id: number;
    full_name: string;
    contract_id: number;
    expected_pay: number;
    paid_amount: number;
    unpaid_amount: number;
    payment_scheme: string;
    status: string;
}

export interface LiabilityResponse {
    total_liability: number;
    items: LiabilityDetail[];
}

export interface WorkingHoursResponse {
    total_minutes: number;
    total_hours: number;
    total_days: number;
    total_months: number;
    total_years: number;
}

// ---- Service ----

export interface PeriodFinancial {
    year: number;
    month: number;
    total_revenue: number;
    total_expenses: number;
    total_cost_sdm: number;
    margin: number;
}

export interface ChangeMetrics {
    revenue_change: number;
    expenses_change: number;
    margin_change: number;
}

export interface FinancialComparisonResponse {
    current_month: PeriodFinancial;
    previous_month: PeriodFinancial;
    changes: ChangeMetrics;
}

export interface MonthlyProfitItem {
    month: string;
    year: number;
    month_num: number;
    revenue: number;
    expenses: number;
    net_profit: number;
}

export interface MonthlyProfitResponse {
    items: MonthlyProfitItem[];
}

export interface ProjectProfitItem {
    project_id: number;
    project_name: string;
    client_name: string;
    status: string;
    pm_name: string;
    contract_value: number;
    total_expenses: number;
    net_margin: number;
    margin_percent: number;
}

export interface ProjectProfitResponse {
    items: ProjectProfitItem[];
}

export const dashboardService = {
    /**
     * GET /api/dashboard/profitability/monthly
     * Returns 6-month revenue, expenses, and net profit.
     */
    async getMonthlyProfit(months: number = 6): Promise<MonthlyProfitResponse> {
        return fetchApi(`/dashboard/profitability/monthly?months=${months}`, { method: "GET" });
    },

    /**
     * GET /api/dashboard/profitability/projects
     * Returns per-project profitability details.
     */
    async getProjectProfitability(): Promise<ProjectProfitResponse> {
        return fetchApi(`/dashboard/profitability/projects`, { method: "GET" });
    },

    /**
     * GET /api/dashboard/financial
     * Returns P&L data and cost breakdown.
     * Optional project_id filter.
     */
    async getFinancialHealth(projectId?: number | string): Promise<FinancialHealthResponse> {
        const query = projectId ? `?project_id=${projectId}` : "";
        return fetchApi(`/dashboard/financial${query}`, { method: "GET" });
    },

    /**
     * GET /api/dashboard/financial/comparison
     * Returns current month vs previous month financial data with percentage changes.
     * Optional project_id filter.
     */
    async getFinancialComparison(projectId?: number | string): Promise<FinancialComparisonResponse> {
        const query = projectId ? `?project_id=${projectId}` : "";
        return fetchApi(`/dashboard/financial/comparison${query}`, { method: "GET" });
    },

    /**
     * GET /api/dashboard/liability
     * Returns total liability and per-contract breakdown.
     */
    async getLiabilityMonitor(): Promise<LiabilityResponse> {
        return fetchApi("/dashboard/liability", { method: "GET" });
    },

    /**
     * GET /api/dashboard/working-hours
     * Returns aggregated working hours.
     * Optional project_id and user_id filters.
     */
    async getWorkingHoursReport(projectId?: number | string, userId?: number | string): Promise<WorkingHoursResponse> {
        const params = new URLSearchParams();
        if (projectId) params.append("project_id", String(projectId));
        if (userId) params.append("user_id", String(userId));
        const query = params.toString() ? `?${params.toString()}` : "";
        return fetchApi(`/dashboard/working-hours${query}`, { method: "GET" });
    },
};
