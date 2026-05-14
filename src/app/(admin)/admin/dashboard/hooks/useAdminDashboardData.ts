import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminUserService } from "@/lib/services/admin-users";
import { projectService } from "@/lib/services/project-service";
import { adminContractService } from "@/lib/services/admin-contracts";
import { resourceService } from "@/lib/services/resource-service";
import { User, ApiProject } from "@/lib/types";

export interface DashboardStats {
    totalUsers: number;
    activeUsers: number;
    totalProjects: number;
    activeProjects: number;
    totalTarget: number;
    totalPaid: number;
    totalUnpaid: number;
    pendingResources: number;
    approvedResources: number;
    rejectedResources: number;
    totalResourceCost: number;
    contractsPending: number;
    contractsPartiallyPaid: number;
    contractsPaid: number;
    paymentProgress: number;
}

export interface ProjectFinancial {
    id: number;
    name: string;
    client: string;
    budgetRevenue: number;
    totalContractValue: number;
    totalPaid: number;
    remaining: number;
    progressPercent: number;
}

export function useAdminDashboardData() {
    // 1. Fetch Users
    const { data: usersData, isLoading: isLoadingUsers } = useQuery({
        queryKey: ["admin", "users", "list"],
        queryFn: () => adminUserService.getUsers(1, 200),
        staleTime: 5 * 60 * 1000,
    });
    const users = usersData?.data || [];

    // 2. Fetch Projects
    const { data: projectsData, isLoading: isLoadingProjects } = useQuery({
        queryKey: ["admin", "projects", "list"],
        queryFn: () => projectService.getProjects(1, 200),
        staleTime: 5 * 60 * 1000,
    });
    const projects = projectsData?.data || [];

    // 3. Fetch Resource Requests
    const { data: resources, isLoading: isLoadingResources } = useQuery({
        queryKey: ["admin", "resources", "list"],
        queryFn: () => resourceService.getResourceRequests(),
        staleTime: 5 * 60 * 1000,
    });
    const allResources = resources?.data || [];

    // 4. Fetch Payroll Summary
    const { data: payrollData, isLoading: isLoadingPayroll } = useQuery({
        queryKey: ["admin", "payroll", "summary"],
        queryFn: () => adminContractService.getPayrollSummary(),
        staleTime: 5 * 60 * 1000,
    });
    const payrollItems = payrollData?.data || [];

    const isLoading = isLoadingUsers || isLoadingProjects || isLoadingResources || isLoadingPayroll;

    const stats = useMemo(() => {
        // User stats
        const activeUsersCount = users.filter(u => u.is_active !== false && u.status !== "inactive").length;

        // Project stats
        const activeProjectsCount = projects.filter(p => p.status === "active").length;

        // Resource stats
        const pendingRes = allResources.filter(r => r.status === "pending");
        const approvedRes = allResources.filter(r => r.status === "approved");
        const rejectedRes = allResources.filter(r => r.status === "rejected");
        const totalResourceCost = approvedRes.reduce((sum, r) => sum + (r.amount || 0), 0);

        // Payroll/Contract stats
        const totalTarget = payrollItems.reduce((acc, curr) => acc + curr.calculated_target, 0);
        const totalPaid = payrollItems.reduce((acc, curr) => acc + curr.total_paid, 0);
        const totalUnpaid = totalTarget - totalPaid;
        
        const contractsPending = payrollItems.filter(c => c.payment_status === "pending").length;
        const contractsPartiallyPaid = payrollItems.filter(c => c.payment_status === "partially_paid").length;
        const contractsPaid = payrollItems.filter(c => c.payment_status === "paid").length;

        const paymentProgress = totalTarget > 0 ? Math.round((totalPaid / totalTarget) * 100) : 0;

        return {
            totalUsers: users.length,
            activeUsers: activeUsersCount,
            totalProjects: projects.length,
            activeProjects: activeProjectsCount,
            totalTarget,
            totalPaid,
            totalUnpaid,
            pendingResources: pendingRes.length,
            approvedResources: approvedRes.length,
            rejectedResources: rejectedRes.length,
            totalResourceCost,
            contractsPending,
            contractsPartiallyPaid,
            contractsPaid,
            paymentProgress
        };
    }, [users, projects, allResources, payrollItems]);

    const projectFinancials = useMemo(() => {
        const projectFinMap = new Map<number, ProjectFinancial>();

        // We use payrollItems to aggregate by project
        // Note: payrollItems has project_name, but we might want project_id if it's there.
        // Looking at PayrollSummaryItem type in admin-contracts.ts, it doesn't have project_id.
        // Let's assume projects are identified by name for distribution if project_id is missing,
        // or we check if projects data can help.
        
        // Wait, PayrollSummaryItem might have id which is contract_id.
        // Let's see if we can improve this. The original code was fetching contracts per user.
        // The new service getPayrollSummary might need project_id to be useful for charts.
        
        // Actually, the original code fetched contracts for each user and aggregated by contract.project_id.
        // If PayrollSummaryItem doesn't have project_id, we might have a problem for exact mapping.
        // BUT, the original code had:
        // if (contract.project_id) { ... }
        // Let's check PayrollSummaryItem again.
        
        /*
        export interface PayrollSummaryItem {
            id: number;
            user_id: number;
            full_name: string;
            contract_type: "yearly" | "monthly" | "mandays" | "timesheet" | "hourly";
            payment_scheme: PaymentScheme;
            base_rate: number;
            calculated_target: number;
            total_paid: number;
            payment_status: "pending" | "paid" | "partially_paid";
            project_name: string;
        }
        */
        
        // It has project_name. Let's aggregate by project_name.
        
        for (const item of payrollItems) {
            const pName = item.project_name || "Unassigned";
            const existing = projectFinMap.get(pName as any);
            
            if (existing) {
                existing.totalContractValue += item.calculated_target;
                existing.totalPaid += item.total_paid;
                existing.remaining += (item.calculated_target - item.total_paid);
                existing.progressPercent = existing.totalContractValue > 0
                    ? Math.round((existing.totalPaid / existing.totalContractValue) * 100)
                    : 0;
            } else {
                const project = projects.find(p => p.name === pName);
                projectFinMap.set(pName as any, {
                    id: project?.id || 0,
                    name: pName,
                    client: project?.client_name || "Multiple Clients",
                    budgetRevenue: project?.budget_revenue || 0,
                    totalContractValue: item.calculated_target,
                    totalPaid: item.total_paid,
                    remaining: item.calculated_target - item.total_paid,
                    progressPercent: item.calculated_target > 0
                        ? Math.round((item.total_paid / item.calculated_target) * 100)
                        : 0,
                } as any);
            }
        }

        return Array.from(projectFinMap.values())
            .sort((a, b) => b.totalContractValue - a.totalContractValue);
    }, [payrollItems, projects]);

    const pendingResourceList = useMemo(() => {
        return allResources.filter(r => r.status === "pending").slice(0, 5);
    }, [allResources]);

    const recentResources = useMemo(() => {
        return allResources.slice(0, 5);
    }, [allResources]);

    return {
        isLoading,
        stats,
        projectFinancials,
        pendingResourceList,
        recentResources
    };
}
