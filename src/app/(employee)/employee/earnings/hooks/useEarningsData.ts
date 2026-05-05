import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Contract } from "@/lib/services/admin-contracts";
import { contractService } from "@/lib/services/contract-service";
import { timesheetService } from "@/lib/services/timesheet-service";
import { projectService } from "@/lib/services/project-service";
import { mockPayments, mockContracts, mockProjects } from "@/lib/mock-data";
import { EnrichedContract } from "../types";
import { User } from "@/lib/types";

export function useEarningsData(userId: string | undefined) {
    // 1. Single Primary Query for all Raw Data
    const { data: rawData, isLoading } = useQuery({
        queryKey: ['employee', 'earnings', 'raw', userId],
        queryFn: async () => {
            if (!userId) return null;
            try {
                const [contracts, timesheets, projectsRes, payments] = await Promise.all([
                    contractService.getMyContracts(),
                    timesheetService.getMyLogs(),
                    projectService.getProjects(1, 100),
                    contractService.getMyPayments()
                ]);

                return {
                    contracts,
                    timesheets,
                    projects: projectsRes.data || [],
                    payments
                };
            } catch (error: any) {
                console.warn("Failed to load real data, using local fallback:", error.message);
                // Structured Fallback
                return {
                    contracts: mockContracts.filter((c: any) => String(c.userId) === String(userId)) as any[],
                    timesheets: [], // Timesheets are harder to mock accurately here
                    projects: mockProjects as any[],
                    payments: mockPayments.filter(p => String(p.userId) === String(userId)) as any[]
                };
            }
        },
        enabled: !!userId,
    });

    // 2. Heavy Data Enrichment & Computation (Memoized)
    const enrichedContracts = useMemo(() => {
        if (!rawData || !rawData.contracts) return [];

        const { contracts, timesheets, projects, payments: paymentsData } = rawData;

        return contracts.map((c: Contract) => {
            const project = projects.find((p: any) => p.id === c.project_id) ||
                mockProjects.find((p: any) => p.id === `p${c.project_id}`);

            const projectTimesheets = timesheets.filter(ts => ts.project_id === c.project_id);

            let total_earned = 0;
            let estimated_earning = 0;
            let approved_count = 0;
            let submitted_count = 0;
            let current_year_index = 0;
            let monthly_breakdown: any[] = [];
            let this_month_liability = 0;
            let total_liability = 0;

            const totalPaid = c.total_paid ?? 0;

            // --- Calculation by Type ---
            if (c.contract_type === 'timesheet' || c.contract_type === 'hourly') {
                const approvedMinutes = projectTimesheets
                    .filter(ts => ts.status === 'approved')
                    .reduce((sum, ts) => sum + ts.duration_minutes, 0);
                const pendingMinutes = projectTimesheets
                    .filter(ts => ts.status === 'pending')
                    .reduce((sum, ts) => sum + ts.duration_minutes, 0);

                total_earned = (approvedMinutes / 60) * c.rate_amount;
                estimated_earning = (pendingMinutes / 60) * c.rate_amount;
                approved_count = projectTimesheets.filter(ts => ts.status === 'approved').length;
                submitted_count = projectTimesheets.filter(ts => ts.status !== 'rejected').length;

            } else if (c.contract_type === 'mandays') {
                const approvedDays = new Set(
                    projectTimesheets
                        .filter(ts => ts.status === 'approved')
                        .map(ts => new Date(ts.clock_in).toDateString())
                ).size;
                const pendingDays = new Set(
                    projectTimesheets
                        .filter(ts => ts.status === 'pending')
                        .map(ts => new Date(ts.clock_in).toDateString())
                ).size;

                total_earned = approvedDays * c.rate_amount;
                estimated_earning = pendingDays * c.rate_amount;
                approved_count = approvedDays;
                submitted_count = approvedDays + pendingDays;

            } else if (c.contract_type === 'yearly') {
                const startDate = new Date(c.start_date);
                const now = new Date();
                const diffTime = Math.abs(now.getTime() - startDate.getTime());
                current_year_index = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365)) + 1;
                total_earned = c.rate_amount * current_year_index;
                estimated_earning = total_earned;

            } else if (c.contract_type === 'monthly') {
                const startDate = new Date(c.start_date);
                const now = new Date();
                const diffMonth = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth()) + 1;
                total_earned = c.rate_amount * diffMonth;
                estimated_earning = total_earned;
            }

            // --- Generate Monthly Breakdown ---
            const startDate = new Date(c.start_date);
            const now = new Date();
            let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
            const last = new Date(now.getFullYear(), now.getMonth(), 1);
            let remainingPaid = totalPaid;

            while (current <= last) {
                let monthly_earned = 0;
                if (c.contract_type === 'monthly') {
                    monthly_earned = c.rate_amount;
                } else if (c.contract_type === 'timesheet' || c.contract_type === 'hourly') {
                    const minsInMonth = projectTimesheets
                        .filter(ts => {
                            const d = new Date(ts.clock_in);
                            return d.getMonth() === current.getMonth() && d.getFullYear() === current.getFullYear() && ts.status === 'approved';
                        })
                        .reduce((sum, ts) => sum + ts.duration_minutes, 0);
                    monthly_earned = (minsInMonth / 60) * c.rate_amount;
                } else if (c.contract_type === 'mandays') {
                    const daysInMonth = new Set(
                        projectTimesheets
                            .filter(ts => {
                                const d = new Date(ts.clock_in);
                                return d.getMonth() === current.getMonth() && d.getFullYear() === current.getFullYear() && ts.status === 'approved';
                            })
                            .map(ts => new Date(ts.clock_in).toDateString())
                    ).size;
                    monthly_earned = daysInMonth * c.rate_amount;
                } else if (c.contract_type === 'yearly') {
                    monthly_earned = c.rate_amount / 12;
                }

                const paidForThisMonth = Math.min(remainingPaid, monthly_earned);
                remainingPaid -= paidForThisMonth;
                const liability = monthly_earned - paidForThisMonth;

                const monthRecord = {
                    monthName: current.toLocaleString('en-US', { month: 'long' }),
                    monthIndex: current.getMonth(),
                    year: current.getFullYear(),
                    earned: monthly_earned,
                    paid: paidForThisMonth,
                    liability,
                    status: liability <= 0 ? "paid" : (paidForThisMonth > 0 ? "partially_paid" : "unpaid")
                };

                monthly_breakdown.push(monthRecord);
                if (current.getMonth() === now.getMonth() && current.getFullYear() === now.getFullYear()) {
                    this_month_liability = liability;
                }
                current.setMonth(current.getMonth() + 1);
            }

            total_liability = monthly_breakdown.reduce((sum, m) => sum + m.liability, 0);
            if (!(c.contract_type === 'timesheet' || c.contract_type === 'hourly' || c.contract_type === 'mandays')) {
                total_earned = monthly_breakdown.reduce((sum, m) => sum + m.earned, 0);
            }

            // Filter specific payments for this contract
            const payments = (paymentsData || [])
                .filter((p: any) => p.contract_id === c.id)
                .map((p: any) => ({
                    id: String(p.id),
                    name: p.name || "Payment",
                    amount: p.amount,
                    paid_at: p.paid_at,
                    description: p.description
                }));

            let payment_status: "pending" | "paid" | "partially_paid" = "pending";
            if (totalPaid > 0) {
                payment_status = total_liability <= 0 ? "paid" : "partially_paid";
            }

            return {
                ...c,
                project_name: project?.name || (c.project_id ? `Project #${c.project_id}` : "Base Contract"),
                total_paid: totalPaid,
                total_earned,
                estimated_earning,
                total_liability,
                this_month_liability,
                monthly_breakdown,
                submitted_count,
                approved_count,
                current_year_index,
                payment_status,
                payments,
                // compatibility fields
                approvedMinutes: projectTimesheets.filter(ts => ts.status === 'approved').reduce((s, ts) => s + ts.duration_minutes, 0),
                pendingMinutes: projectTimesheets.filter(ts => ts.status === 'pending').reduce((s, ts) => s + ts.duration_minutes, 0),
                approvedDays: new Set(projectTimesheets.filter(ts => ts.status === 'approved').map(ts => new Date(ts.clock_in).toDateString())).size,
            };
        });
    }, [rawData]);

    // 3. Derived KPI Computations
    const myPayments = useMemo(() => {
        if (!rawData || !rawData.payments) return [];
        return rawData.payments.map((p: any) => {
            const contract = enrichedContracts.find(c => c.id === p.contract_id);
            return {
                id: String(p.id),
                amount: p.amount,
                date: p.paid_at || p.createdAt,
                projectName: contract?.project_id ? contract.project_name : "-",
                contractType: contract?.project_id ? "Project" : "Base",
                description: p.description || ""
            };
        });
    }, [rawData, enrichedContracts]);

    const totalEarnedReleased = useMemo(() => {
        return enrichedContracts.reduce((sum, c) => sum + (c.total_paid || 0), 0);
    }, [enrichedContracts]);

    const currentMonthReleased = useMemo(() => {
        if (!rawData || !rawData.payments) return 0;
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        return rawData.payments.reduce((sum: number, p: any) => {
            const paidDate = new Date(p.paid_at || p.createdAt);
            if (paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear) {
                return sum + p.amount;
            }
            return sum;
        }, 0);
    }, [rawData]);

    const totalLiability = useMemo(() => {
        return enrichedContracts.reduce((total, c) => total + Math.max(0, c.total_earned - c.total_paid), 0);
    }, [enrichedContracts]);

    return {
        enrichedContracts,
        isLoading,
        myPayments,
        totalEarned: totalEarnedReleased,
        currentMonthReleased,
        totalLiability
    };
}
