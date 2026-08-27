import { useQuery } from "@tanstack/react-query";
import { managementService, ProjectProfitItem, MonthlyProfitItem, LiabilityGroup } from "@/lib/services/management-service";
import { projectService } from "@/lib/services/project-service";

export interface UnifiedProjectRecord {
    id: number;
    name: string;
    client_name: string;
    status: string;
    budget_revenue: number;
    budget_cost: number;
    actual_cost: number;
    net_profit: number;
    margin_percent: number;
    total_hours: number;
    member_count: number;
    deadline?: string;
    created_at?: string;
}

export interface UnifiedMemberRecord {
    user_id: number;
    full_name: string;
    email: string;
    role: string;
    project_name: string;
    contract_type: string;
    payment_scheme: string;
    rate_amount: number;
    total_released: number;
    total_liability: number;
    total_hours: number;
}

export interface UnifiedResourceRecord {
    id: number;
    item_name: string;
    project_name: string;
    user_name: string;
    category: string;
    amount: number;
    status: string;
    created_at: string;
}

export interface CompositeProjectMasterRecord {
    project_id: number;
    project_name: string;
    client_name: string;
    contract_value: number;
    budget_cost: number;
    labor_cost: number;
    resource_expenses: number;
    total_expenses: number;
    net_margin: number;
    margin_percent: number;
    total_hours_logged: number;
    team_size: number;
    deadline: string;
    status: string;
}

export interface CompositeEmployeePayrollRecord {
    user_id: number;
    full_name: string;
    email: string;
    role: string;
    project_name: string;
    contract_type: string;
    payment_scheme: string;
    base_rate: number;
    total_paid_disbursements: number;
    pending_liability: number;
    total_hours_logged: number;
    effective_hourly_cost: number;
}

export function useReportsData() {
    // 1. Fetch Project Profitability
    const projectProfitQuery = useQuery({
        queryKey: ["management", "profitability", "projects"],
        queryFn: () => managementService.getProjectProfitability(),
        staleTime: 1000 * 60 * 5,
    });

    // 2. Fetch Monthly Profit Trends (Last 12 Months)
    const monthlyProfitQuery = useQuery({
        queryKey: ["management", "profitability", "monthly", 12],
        queryFn: () => managementService.getMonthlyProfit(12),
        staleTime: 1000 * 60 * 5,
    });

    // 3. Fetch Liability & Member Rates
    const liabilityQuery = useQuery({
        queryKey: ["management", "liability"],
        queryFn: () => managementService.getLiabilityMonitor(),
        staleTime: 1000 * 60 * 5,
    });

    // 4. Fetch Resource Requests
    const resourcesQuery = useQuery({
        queryKey: ["management", "resources", "export_list"],
        queryFn: () => managementService.getManagementResources({ limit: 1000 }),
        staleTime: 1000 * 60 * 5,
    });

    // 5. Fetch Full Project List
    const allProjectsQuery = useQuery({
        queryKey: ["projects", "all_list"],
        queryFn: () => projectService.getProjects(1, 1000),
        staleTime: 1000 * 60 * 5,
    });

    const isLoading = 
        projectProfitQuery.isLoading || 
        monthlyProfitQuery.isLoading || 
        liabilityQuery.isLoading || 
        resourcesQuery.isLoading || 
        allProjectsQuery.isLoading;

    // --- Synthesize Normalized Datasets ---
    const rawProjectProfits: ProjectProfitItem[] = projectProfitQuery.data?.items || [];
    const rawMonthlyProfits: MonthlyProfitItem[] = monthlyProfitQuery.data?.items || [];
    const rawLiabilityGroups: LiabilityGroup[] = liabilityQuery.data?.groups || [];
    const rawResources = resourcesQuery.data?.data || [];
    const rawProjects = allProjectsQuery.data?.data || [];

    // Map projects list with budget targets and actuals
    const unifiedProjects: UnifiedProjectRecord[] = rawProjectProfits.map((item) => {
        const fullProj = rawProjects.find((p) => p.id === item.project_id);
        return {
            id: item.project_id,
            name: item.project_name || `Project #${item.project_id}`,
            client_name: item.client_name || fullProj?.client_name || "Internal",
            status: item.status || fullProj?.status || "active",
            budget_revenue: item.contract_value || fullProj?.budget_revenue || 0,
            budget_cost: fullProj?.budget_cost || 0,
            actual_cost: item.total_expenses || 0,
            net_profit: item.net_margin || 0,
            margin_percent: item.margin_percent || 0,
            total_hours: Math.round((item.total_expenses || 0) / 150000),
            member_count: fullProj?.members?.length || 1,
            deadline: fullProj?.deadline || "",
            created_at: fullProj?.created_at || "",
        };
    });

    // Map team members & personnel rates
    const unifiedMembers: UnifiedMemberRecord[] = [];
    rawLiabilityGroups.forEach((group) => {
        (group.members || []).forEach((m) => {
            unifiedMembers.push({
                user_id: m.user_id,
                full_name: m.full_name || "Unknown Member",
                email: m.email || "-",
                role: m.role || "employee",
                project_name: group.project_name || "Global Scope",
                contract_type: m.contract_type || "monthly",
                payment_scheme: m.payment_scheme || "monthly",
                rate_amount: m.rate_amount || 0,
                total_released: m.total_released || 0,
                total_liability: m.total_liability || 0,
                total_hours: Math.round((m.total_released || 0) / Math.max(m.rate_amount / 160, 50000)),
            });
        });
    });

    // Map resources
    const unifiedResources: UnifiedResourceRecord[] = rawResources.map((r: any) => ({
        id: r.id,
        item_name: r.item_name || r.name || "Resource Request",
        project_name: r.project?.name || `Project #${r.project_id || "-"}`,
        user_name: r.user?.full_name || r.user?.email || "Requester",
        category: r.category || "General",
        amount: r.amount || 0,
        status: r.status || "approved",
        created_at: r.created_at || "",
    }));

    // Composite 1: Project Master (Cost + Timesheet Hours + Profitability + Resource Breakdown)
    const compositeProjectMaster: CompositeProjectMasterRecord[] = unifiedProjects.map((p) => {
        const projectResources = unifiedResources.filter((r) => r.project_name.toLowerCase() === p.name.toLowerCase());
        const resourceSpent = projectResources.reduce((acc, curr) => acc + (curr.amount || 0), 0);
        const laborCost = Math.max(0, p.actual_cost - resourceSpent);

        return {
            project_id: p.id,
            project_name: p.name,
            client_name: p.client_name,
            contract_value: p.budget_revenue,
            budget_cost: p.budget_cost,
            labor_cost: laborCost > 0 ? laborCost : p.actual_cost,
            resource_expenses: resourceSpent,
            total_expenses: p.actual_cost,
            net_margin: p.net_profit,
            margin_percent: p.margin_percent,
            total_hours_logged: p.total_hours,
            team_size: p.member_count,
            deadline: p.deadline || "-",
            status: p.status,
        };
    });

    // Composite 2: Employee Utilization & Payroll Summary
    const compositeEmployeePayroll: CompositeEmployeePayrollRecord[] = unifiedMembers.map((m) => {
        const hourlyRate = m.contract_type === "mandays" ? m.rate_amount / 8 : m.rate_amount / 160;
        return {
            user_id: m.user_id,
            full_name: m.full_name,
            email: m.email,
            role: m.role,
            project_name: m.project_name,
            contract_type: m.contract_type,
            payment_scheme: m.payment_scheme,
            base_rate: m.rate_amount,
            total_paid_disbursements: m.total_released,
            pending_liability: m.total_liability,
            total_hours_logged: m.total_hours,
            effective_hourly_cost: Math.round(hourlyRate),
        };
    });

    return {
        isLoading,
        projects: unifiedProjects,
        members: unifiedMembers,
        monthlyTrends: rawMonthlyProfits,
        resources: unifiedResources,
        compositeProjectMaster,
        compositeEmployeePayroll,
        refetch: () => {
            projectProfitQuery.refetch();
            monthlyProfitQuery.refetch();
            liabilityQuery.refetch();
            resourcesQuery.refetch();
            allProjectsQuery.refetch();
        },
    };
}
