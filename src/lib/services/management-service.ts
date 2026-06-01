import { fetchApi } from "../api";
import { ResourceListResponse } from "./resource-service";

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

// ---- Cost Breakdown ----
export interface CostMetric {
    value: number;
    trend: number;
}

export interface CostDistributionItem {
    category: string;
    value: number;
    amount: number;
}

export interface CostTrendItem {
    month: string;
    cost: number;
}

export interface CostBreakdownSummaryResponse {
    total_expenses: CostMetric;
    salary_comp: CostMetric;
    resource_requests: CostMetric;
    pending_liability: CostMetric;
    distribution: CostDistributionItem[];
    monthly_trend: CostTrendItem[];
}

export interface ProjectCostItem {
    project_id: number;
    project_name: string;
    status: string;
    total_cost: number;
    salary_percent: number;
    resource_percent: number;
}

export interface ProjectCostResponse {
    items: ProjectCostItem[];
}

export interface CostLogItem {
    id: string;
    expense_name: string;
    category: string;
    project_name: string;
    payment_scheme: string;
    date: string;
    amount: number;
    source: string;
}

export interface CostLogsResponse {
    data: CostLogItem[];
    pagination: {
        page: number;
        limit: number;
        total: number;
    };
}

// ---- Resources ----
export interface ManagementResourceStats {
    total_amount_spent: number;
    total_approved: number;
    total_pending: number;
    total_rejected: number;
}

export const managementService = {
    /**
     * GET /api/management/profitability/monthly
     * Returns 6-month revenue, expenses, and net profit.
     */
    async getMonthlyProfit(months: number = 6): Promise<MonthlyProfitResponse> {
        return fetchApi(`/management/profitability/monthly?months=${months}`, { method: "GET" });
    },

    /**
     * GET /api/management/profitability/projects
     * Returns per-project profitability details.
     */
    async getProjectProfitability(): Promise<ProjectProfitResponse> {
        return fetchApi(`/management/profitability/projects`, { method: "GET" });
    },

    /**
     * GET /api/management/financial
     * Returns P&L data and cost breakdown.
     * Optional project_id filter.
     */
    async getFinancialHealth(projectId?: number | string): Promise<FinancialHealthResponse> {
        const query = projectId ? `?project_id=${projectId}` : "";
        return fetchApi(`/management/financial${query}`, { method: "GET" });
    },

    /**
     * GET /api/management/financial/comparison
     * Returns current month vs previous month financial data with percentage changes.
     * Optional project_id filter.
     */
    async getFinancialComparison(projectId?: number | string): Promise<FinancialComparisonResponse> {
        const query = projectId ? `?project_id=${projectId}` : "";
        return fetchApi(`/management/financial/comparison${query}`, { method: "GET" });
    },

    /**
     * GET /api/management/liability
     * Returns total liability and per-contract breakdown.
     */
    async getLiabilityMonitor(): Promise<LiabilityResponse> {
        return fetchApi("/management/liability", { method: "GET" });
    },

    /**
     * GET /api/management/working-hours
     * Returns aggregated working hours.
     * Optional project_id and user_id filters.
     */
    async getWorkingHoursReport(projectId?: number | string, userId?: number | string): Promise<WorkingHoursResponse> {
        const params = new URLSearchParams();
        if (projectId) params.append("project_id", String(projectId));
        if (userId) params.append("user_id", String(userId));
        const query = params.toString() ? `?${params.toString()}` : "";
        return fetchApi(`/management/working-hours${query}`, { method: "GET" });
    },

    // ---- Cost Breakdown ----
    async getCostBreakdownSummary(days: number | string = 30, category: string = "all"): Promise<CostBreakdownSummaryResponse> {
        return fetchApi(`/management/cost-breakdown/summary?days=${days}&category=${category}`, { method: "GET" });
    },

    async getCostBreakdownProjects(): Promise<ProjectCostResponse> {
        return fetchApi(`/management/cost-breakdown/projects`, { method: "GET" });
    },

    async getCostBreakdownLogs(page: number = 1, limit: number = 10, search: string = "", category: string = "all"): Promise<CostLogsResponse> {
        const params = new URLSearchParams();
        params.append("page", String(page));
        params.append("limit", String(limit));
        if (search) params.append("search", search);
        if (category && category !== "all") params.append("category", category);
        return fetchApi(`/management/cost-breakdown/logs?${params.toString()}`, { method: "GET" });
    },

    // ---- Resources ----
    async getManagementResourceStats(): Promise<ManagementResourceStats> {
        return fetchApi(`/management/resources/stats`, { method: "GET" });
    },

    async getManagementResources(params: {
        page?: number;
        limit?: number;
        project_id?: string;
        status?: string;
        type?: string;
        search?: string;
    } = {}): Promise<ResourceListResponse> {
        const query = new URLSearchParams();
        if (params.page) query.append("page", String(params.page));
        if (params.limit) query.append("limit", String(params.limit));
        if (params.project_id && params.project_id !== "all") query.append("project_id", params.project_id);
        if (params.status && params.status !== "all") query.append("status", params.status);
        if (params.type && params.type !== "all") query.append("type", params.type);
        if (params.search) query.append("search", params.search);

        return fetchApi(`/management/resources?${query.toString()}`, { method: "GET" });
    },
};
