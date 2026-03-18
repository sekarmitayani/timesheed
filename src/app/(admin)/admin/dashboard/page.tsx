"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/ai/ai-components";
import {
    Users, FolderKanban, Wallet, Package, ArrowRight,
    Loader2, TrendingUp, Clock, CheckCircle2, AlertCircle, XCircle,
    Wrench, DollarSign, BarChart3
} from "lucide-react";
import { adminUserService } from "@/lib/services/admin-users";
import { projectService } from "@/lib/services/project-service";
import { adminContractService, Contract, ContractSummary } from "@/lib/services/admin-contracts";
import { resourceService, ResourceRequest } from "@/lib/services/resource-service";
import { User, ApiProject } from "@/lib/types";
import { useRouter } from "next/navigation";

// ---- Helper ----
const fmtCurrency = (v: number) => `Rp ${v.toLocaleString("id-ID")}`;
const fmtDate = (d?: string) => {
    if (!d) return "-";
    const date = new Date(d);
    if (isNaN(date.getTime())) return "-";
    return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
};

// ---- Types ----
interface DashboardStats {
    totalUsers: number;
    activeUsers: number;
    totalProjects: number;
    activeProjects: number;
    totalContractValue: number;
    totalPaid: number;
    totalRemaining: number;
    pendingResources: number;
    approvedResources: number;
    rejectedResources: number;
    totalResourceCost: number;
    contractsPending: number;
    contractsPartiallyPaid: number;
    contractsPaid: number;
}

interface ProjectFinancial {
    id: number;
    name: string;
    client: string;
    budgetRevenue: number;
    totalContractValue: number;
    totalPaid: number;
    remaining: number;
    progressPercent: number;
}

export default function AdminDashboard() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 0, activeUsers: 0,
        totalProjects: 0, activeProjects: 0,
        totalContractValue: 0, totalPaid: 0, totalRemaining: 0,
        pendingResources: 0, approvedResources: 0, rejectedResources: 0, totalResourceCost: 0,
        contractsPending: 0, contractsPartiallyPaid: 0, contractsPaid: 0,
    });
    const [projectFinancials, setProjectFinancials] = useState<ProjectFinancial[]>([]);
    const [pendingResourceList, setPendingResourceList] = useState<ResourceRequest[]>([]);
    const [recentResources, setRecentResources] = useState<ResourceRequest[]>([]);

    const fetchDashboardData = useCallback(async () => {
        setIsLoading(true);
        try {
            // 1. Fetch Users
            const usersRes = await adminUserService.getUsers(1, 200);
            const users: User[] = usersRes.data || [];
            const activeUsers = users.filter(u => u.is_active !== false && u.status !== "inactive");

            // 2. Fetch Projects
            const projectsRes = await projectService.getProjects(1, 200);
            const projects: ApiProject[] = projectsRes.data || [];
            const activeProjects = projects.filter(p => p.status === "active");

            // 3. Fetch Resource Requests
            let resources: ResourceRequest[] = [];
            try {
                resources = await resourceService.getResourceRequests();
                if (!Array.isArray(resources)) resources = [];
            } catch { /* skip */ }

            const pendingRes = resources.filter(r => r.status === "pending");
            const approvedRes = resources.filter(r => r.status === "approved");
            const rejectedRes = resources.filter(r => r.status === "rejected");
            const totalResourceCost = approvedRes.reduce((sum, r) => sum + (r.amount || 0), 0);

            // 4. Fetch Contracts & Payments per user
            let allContracts: Contract[] = [];
            const contractSummaries: Map<number, ContractSummary> = new Map();

            for (const user of users) {
                try {
                    const userContracts = await adminContractService.getUserContracts(user.id);
                    allContracts.push(...userContracts);
                } catch { /* skip */ }
            }

            // Get payment summaries for each contract
            let totalContractValue = 0;
            let totalPaid = 0;
            let contractsPending = 0;
            let contractsPartiallyPaid = 0;
            let contractsPaid = 0;

            // Build project financial map for Employee Distribution
            const projectFinMap = new Map<number, ProjectFinancial>();

            for (const contract of allContracts) {
                // Include all contract schemes for financial tracking

                totalContractValue += contract.rate_amount || 0;

                try {
                    const payments = await adminContractService.getPayments(contract.id);
                    const paidAmount = (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
                    totalPaid += paidAmount;

                    const remaining = (contract.rate_amount || 0) - paidAmount;
                    if (paidAmount <= 0) contractsPending++;
                    else if (remaining > 0) contractsPartiallyPaid++;
                    else contractsPaid++;

                    // Aggregate by project
                    if (contract.project_id) {
                        const existing = projectFinMap.get(contract.project_id);
                        const project = projects.find(p => p.id === contract.project_id);
                        if (existing) {
                            existing.totalContractValue += contract.rate_amount || 0;
                            existing.totalPaid += paidAmount;
                            existing.remaining += remaining;
                            existing.progressPercent = existing.totalContractValue > 0
                                ? Math.round((existing.totalPaid / existing.totalContractValue) * 100)
                                : 0;
                        } else if (project) {
                            projectFinMap.set(contract.project_id, {
                                id: project.id,
                                name: project.name,
                                client: project.client_name,
                                budgetRevenue: project.budget_revenue || 0,
                                totalContractValue: contract.rate_amount || 0,
                                totalPaid: paidAmount,
                                remaining: remaining,
                                progressPercent: contract.rate_amount > 0
                                    ? Math.round((paidAmount / contract.rate_amount) * 100)
                                    : 0,
                            });
                        }
                    }
                } catch { /* skip */ }
            }

            const totalRemaining = totalContractValue - totalPaid;

            setStats({
                totalUsers: users.length,
                activeUsers: activeUsers.length,
                totalProjects: projects.length,
                activeProjects: activeProjects.length,
                totalContractValue,
                totalPaid,
                totalRemaining,
                pendingResources: pendingRes.length,
                approvedResources: approvedRes.length,
                rejectedResources: rejectedRes.length,
                totalResourceCost,
                contractsPending,
                contractsPartiallyPaid,
                contractsPaid,
            });

            // Sort by highest contract value for chart
            setProjectFinancials(
                Array.from(projectFinMap.values()).sort((a, b) => b.totalContractValue - a.totalContractValue).slice(0, 6)
            );
            setPendingResourceList(pendingRes.slice(0, 5));
            setRecentResources(resources.slice(0, 5));
        } catch (e) {
            console.error("Dashboard fetch error:", e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <PageHeader title="Dashboard" description="Loading overview data..." />
                <div className="flex items-center justify-center py-32">
                    <div className="text-center space-y-4">
                        <Loader2 className="h-10 w-10 animate-spin text-[#2568C1] mx-auto" />
                        <p className="text-sm text-slate-500">Aggregating data...</p>
                    </div>
                </div>
            </div>
        );
    }

    const paymentProgress = stats.totalContractValue > 0
        ? Math.round((stats.totalPaid / stats.totalContractValue) * 100)
        : 0;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <PageHeader title="Dashboard" description="Business overview and operations" />

            {/* ── Row 1: KPI Stats ───────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Users */}
                <Card className="border-[#e2e8f0] hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push("/admin/users")}>
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                            <div className="space-y-2">
                                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Users</p>
                                <p className="text-3xl font-bold text-[#0f172a]">{stats.totalUsers}</p>
                                <p className="text-xs text-slate-500">{stats.activeUsers} active</p>
                            </div>
                            <div className="h-11 w-11 rounded-xl bg-blue-50 flex items-center justify-center">
                                <Users className="h-5 w-5 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Projects */}
                <Card className="border-[#e2e8f0] hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push("/admin/projects")}>
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                            <div className="space-y-2">
                                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Projects</p>
                                <p className="text-3xl font-bold text-[#0f172a]">{stats.activeProjects}</p>
                                <p className="text-xs text-slate-500">{stats.totalProjects} total</p>
                            </div>
                            <div className="h-11 w-11 rounded-xl bg-violet-50 flex items-center justify-center">
                                <FolderKanban className="h-5 w-5 text-violet-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Contract Value */}
                <Card className="border-[#e2e8f0] hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push("/admin/contracts")}>
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                            <div className="space-y-2">
                                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Employee Contracts</p>
                                <p className="text-2xl font-bold text-[#0f172a]">{fmtCurrency(stats.totalContractValue)}</p>
                                <p className="text-[10px] text-slate-500">All contract schemes</p>
                            </div>
                            <div className="h-11 w-11 rounded-xl bg-emerald-50 flex items-center justify-center">
                                <DollarSign className="h-5 w-5 text-emerald-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Pending Resources */}
                <Card className="border-[#e2e8f0] hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push("/admin/resources")}>
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                            <div className="space-y-2">
                                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Pending Requests</p>
                                <p className="text-3xl font-bold text-[#0f172a]">{stats.pendingResources}</p>
                                <p className="text-xs text-slate-500">resource requests waiting</p>
                            </div>
                            <div className="h-11 w-11 rounded-xl bg-amber-50 flex items-center justify-center">
                                <Package className="h-5 w-5 text-amber-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── Row 2: Financial Overview + Outstanding ─────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Employee Payment Distribution */}
                <Card className="lg:col-span-2 border-[#e2e8f0]">
                    <CardHeader className="pb-1">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-sm font-semibold text-[#0f172a] flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4 text-[#2568C1]" /> Employee Distribution by Project
                                </CardTitle>
                                <p className="text-[10px] text-slate-500 font-normal ml-6 mt-1">All contract schemes</p>
                            </div>
                            <Button variant="ghost" size="sm" className="text-xs text-[#2568C1] gap-1" onClick={() => router.push("/admin/payments")}>
                                View Distributions <ArrowRight className="h-3 w-3" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {projectFinancials.length === 0 ? (
                            <div className="py-8 text-center text-sm text-slate-400">No project financial data available yet.</div>
                        ) : (
                            projectFinancials.map(pf => (
                                <div key={pf.id} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-[#0f172a] truncate">{pf.name}</p>
                                            <p className="text-[10px] text-slate-400">{pf.client}</p>
                                        </div>
                                        <div className="text-right shrink-0 ml-4">
                                            <p className="text-xs font-medium text-[#0f172a]">{fmtCurrency(pf.totalPaid)}</p>
                                            <p className="text-[10px] text-slate-400">of {fmtCurrency(pf.totalContractValue)}</p>
                                        </div>
                                    </div>
                                    <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#2568C1] to-[#4a8be0] transition-all duration-700"
                                            style={{ width: `${Math.min(pf.progressPercent, 100)}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[10px] text-slate-400">
                                        <span>{pf.progressPercent}% distributed</span>
                                        <span>{fmtCurrency(pf.remaining)} unpaid</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Sub-Ledger Payment Status Summary */}
                <Card className="border-[#e2e8f0]">
                    <CardHeader className="pb-1">
                        <div>
                            <CardTitle className="text-sm font-semibold text-[#0f172a] flex items-center gap-2">
                                <Wallet className="h-4 w-4 text-[#2568C1]" /> Sub-Ledger Payment Status
                            </CardTitle>
                            <p className="text-[10px] text-slate-500 font-normal ml-6 mt-1">All contract schemes</p>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {/* Overall Progress */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Overall Distribution</span>
                                <span className="font-bold text-[#0f172a]">{paymentProgress}%</span>
                            </div>
                            <Progress value={paymentProgress} className="h-2.5" />
                            <div className="flex justify-between text-[10px] text-slate-400">
                                <span>Distributed: {fmtCurrency(stats.totalPaid)}</span>
                                <span>Unpaid: {fmtCurrency(stats.totalRemaining)}</span>
                            </div>
                        </div>

                        {/* Status Breakdown */}
                        <div className="space-y-3 pt-2 border-t border-slate-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                                    <span className="text-xs text-slate-600">Pending</span>
                                </div>
                                <span className="text-sm font-bold text-[#0f172a]">{stats.contractsPending}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                                    <span className="text-xs text-slate-600">Partially Paid</span>
                                </div>
                                <span className="text-sm font-bold text-[#0f172a]">{stats.contractsPartiallyPaid}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                    <span className="text-xs text-slate-600">Paid</span>
                                </div>
                                <span className="text-sm font-bold text-[#0f172a]">{stats.contractsPaid}</span>
                            </div>
                        </div>

                        {/* Resource Cost */}
                        <div className="pt-3 border-t border-slate-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Wrench className="h-3.5 w-3.5 text-slate-400" />
                                    <span className="text-xs text-slate-600">Approved Resource Cost</span>
                                </div>
                                <span className="text-sm font-bold text-[#0f172a]">{fmtCurrency(stats.totalResourceCost)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── Row 3: Needs Attention + Recent Resources ──── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Needs Attention */}
                <Card className="border-[#e2e8f0]">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-semibold text-[#0f172a] flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-amber-500" /> Pending Approvals
                            </CardTitle>
                            <Button variant="ghost" size="sm" className="text-xs text-[#2568C1] gap-1" onClick={() => router.push("/admin/resources")}>
                                View All <ArrowRight className="h-3 w-3" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {pendingResourceList.length === 0 ? (
                            <div className="py-6 text-center">
                                <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                                <p className="text-sm text-slate-500">All caught up! No pending approvals.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {pendingResourceList.map(r => (
                                    <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50/80 hover:bg-slate-100/80 transition-colors cursor-pointer" onClick={() => router.push("/admin/resources")}>
                                        <div className="h-8 w-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                                            {r.type === "manpower" ? <Users className="h-3.5 w-3.5 text-amber-600" /> : <Wrench className="h-3.5 w-3.5 text-amber-600" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-[#0f172a] truncate">{r.details}</p>
                                            <p className="text-[10px] text-slate-400">{r.User?.full_name || `User #${r.user_id}`} · {r.Project?.name || `Project #${r.project_id}`}</p>
                                        </div>
                                        <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-600 border-amber-200 shrink-0">Pending</Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Resource Activity */}
                <Card className="border-[#e2e8f0]">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold text-[#0f172a] flex items-center gap-2">
                            <Clock className="h-4 w-4 text-slate-400" /> Recent Resource Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recentResources.length === 0 ? (
                            <div className="py-6 text-center text-sm text-slate-400">No recent activity.</div>
                        ) : (
                            <div className="space-y-2">
                                {recentResources.map(r => (
                                    <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50/80">
                                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                                            r.status === "approved" ? "bg-emerald-50 border border-emerald-200" :
                                            r.status === "rejected" ? "bg-red-50 border border-red-200" :
                                            "bg-slate-100 border border-slate-200"
                                        }`}>
                                            {r.status === "approved" ? (
                                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                            ) : r.status === "rejected" ? (
                                                <XCircle className="h-3.5 w-3.5 text-red-500" />
                                            ) : (
                                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-[#0f172a] truncate">{r.details}</p>
                                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                                <span>{r.User?.full_name || `User #${r.user_id}`}</span>
                                                <span>·</span>
                                                <span className="capitalize">{r.type}</span>
                                                {r.amount > 0 && <><span>·</span><span className="text-emerald-600 font-medium">{fmtCurrency(r.amount)}</span></>}
                                            </div>
                                        </div>
                                        <Badge variant="outline" className={`text-[9px] font-bold capitalize shrink-0 ${
                                            r.status === "approved" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                                            r.status === "rejected" ? "bg-red-50 text-red-500 border-red-200" :
                                            "bg-amber-50 text-amber-600 border-amber-200"
                                        }`}>{r.status}</Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
