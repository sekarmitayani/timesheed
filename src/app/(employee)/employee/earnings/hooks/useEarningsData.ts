import { useEffect, useState, useMemo } from "react";
import { Contract, adminContractService } from "@/lib/services/admin-contracts";
import { contractService } from "@/lib/services/contract-service";
import { timesheetService } from "@/lib/services/timesheet-service";
import { projectService } from "@/lib/services/project-service";
import { mockPayments, mockContracts, mockProjects } from "@/lib/mock-data";
import { EnrichedContract } from "../types";

export function useEarningsData(userId: string | undefined) {
    const [enrichedContracts, setEnrichedContracts] = useState<EnrichedContract[]>([]);
    const [globalPayments, setGlobalPayments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            if (!userId) return;
            try {
                // 1. Fetch data in parallel - Using the new global payments endpoint
                const [contractsData, timesheetsData, projectsRes, paymentsData] = await Promise.all([
                    contractService.getMyContracts(),
                    timesheetService.getMyLogs(),
                    projectService.getProjects(1, 100),
                    contractService.getMyPayments()
                ]);

                const projects = projectsRes.data || [];
                setGlobalPayments(paymentsData);

                // 2. Enrich each contract with details
                const enriched = await Promise.all(contractsData.map(async (c: Contract) => {
                    // Get project name
                    const project = projects.find(p => p.id === c.project_id) ||
                        mockProjects.find(p => p.id === `p${c.project_id}`);

                    // Filter timesheets for this project
                    const projectTimesheets = timesheetsData.filter(ts => ts.project_id === c.project_id);

                    let total_earned = 0;
                    let estimated_earning = 0;
                    let approved_count = 0;
                    let submitted_count = 0;
                    let current_year_index = 0;
                    let monthly_breakdown: any[] = [];
                    let this_month_liability = 0;
                    let total_liability = 0;

                    const totalPaid = c.total_paid ?? 0;

                    // 1. Calculate Base Earnings by Type
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

                    // 2. Generate Monthly Breakdown for ALL Payment Schemes
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
                            monthly_earned = c.rate_amount / 12; // Approximation for breakdown
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

                    // Update totals for consistency
                    total_liability = monthly_breakdown.reduce((sum, m) => sum + m.liability, 0);
                    // Add remaining pending if any (only for non-fixed types)
                    if (c.contract_type === 'timesheet' || c.contract_type === 'hourly' || c.contract_type === 'mandays') {
                        // total_earned stays as approved only for "fixed" display
                    } else {
                        total_earned = monthly_breakdown.reduce((sum, m) => sum + m.earned, 0);
                    }
                    // FILTER PAYMENTS
                    const payments = (paymentsData || [])
                        .filter(p => p.contract_id === c.id)
                        .map(p => ({
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
                        // legacy fields for compatibility if needed
                        approvedMinutes: projectTimesheets.filter(ts => ts.status === 'approved').reduce((s, ts) => s + ts.duration_minutes, 0),
                        pendingMinutes: projectTimesheets.filter(ts => ts.status === 'pending').reduce((s, ts) => s + ts.duration_minutes, 0),
                        approvedDays: new Set(projectTimesheets.filter(ts => ts.status === 'approved').map(ts => new Date(ts.clock_in).toDateString())).size,
                    };
                }));

                setEnrichedContracts(enriched as EnrichedContract[]);
            } catch (error: any) {
                console.warn("Failed to load real data, using local fallback:", error.message);

                // Fallback implementation
                const fallbackContracts = mockContracts
                    .filter((c: any) => String(c.userId) === String(userId))
                    .map((c: any) => {
                        const mockProjectId = c.id === 'c1' ? 1 : c.id === 'c3' ? 3 : null;
                        const project = mockProjectId ? mockProjects.find(p => p.id === `p${mockProjectId}`) : null;
                        const rate = c.rate;
                        const total_paid = Math.floor(rate * 0.4);

                        // Default mock stats
                        const approvedMinutes = 4800; // 80 hours
                        const pendingMinutes = 600;   // 10 hours
                        const approvedDays = 10;
                        const allDays = 12;

                        const contract_type = c.rateType === 'monthly' ? 'monthly' : (c.id === 'c3' ? 'mandays' : (c.rateType === 'hourly' ? 'hourly' : 'timesheet'));

                        let total_earned = 0;
                        let estimated_earning = 0;
                        let total_liability = 0;
                        let monthly_breakdown: any[] = [];
                        let this_month_liability = 0;

                        if (contract_type === 'timesheet' || contract_type === 'hourly') {
                            total_earned = (approvedMinutes / 60) * rate;
                            estimated_earning = (pendingMinutes / 60) * rate;
                            total_liability = Math.max(0, total_earned - total_paid);
                        } else if (contract_type === 'mandays') {
                            total_earned = approvedDays * rate;
                            estimated_earning = (allDays - approvedDays) * rate;
                            total_liability = Math.max(0, total_earned - total_paid);
                        } else if (contract_type === 'monthly') {
                            total_earned = rate;
                            estimated_earning = rate;
                            total_liability = Math.max(0, total_earned - total_paid);
                            this_month_liability = total_liability;
                            monthly_breakdown = [{
                                monthName: new Date().toLocaleString('en-US', { month: 'long' }),
                                monthIndex: new Date().getMonth(),
                                year: new Date().getFullYear(),
                                earned: rate,
                                paid: total_paid,
                                liability: total_liability,
                                status: "partially_paid"
                            }];
                        }

                        return {
                            ...c,
                            id: Number(c.id.replace('c', '')),
                            project_id: mockProjectId,
                            project_name: project?.name || "Base Contract",
                            contract_type,
                            payment_scheme: 'monthly',
                            rate_amount: rate,
                            total_paid: total_paid,
                            approvedMinutes,
                            pendingMinutes,
                            approvedDays,
                            total_earned,
                            estimated_earning,
                            total_liability,
                            this_month_liability,
                            monthly_breakdown,
                            submitted_count: (contract_type === 'timesheet' || contract_type === 'hourly') ? 20 : allDays,
                            approved_count: (contract_type === 'timesheet' || contract_type === 'hourly') ? 15 : approvedDays,
                            payment_status: "partially_paid",
                            payments: [
                                { id: 'm1', name: 'Initial Payment', amount: total_paid, paid_at: '2026-01-20', description: 'Initial payment from fallback' }
                            ]
                        } as unknown as EnrichedContract;
                    });
                setEnrichedContracts(fallbackContracts);
                setGlobalPayments(mockPayments.filter(p => String(p.userId) === String(userId)));
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, [userId]);

    const myPayments = useMemo(() => {
        return globalPayments.map(p => {
            // Enrich payment with project info from contracts
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
    }, [globalPayments, enrichedContracts]);

    const totalEarnedReleased = useMemo(() => {
        // Semua pembayaran yang tercatat di backend (total_paid) adalah uang yang sudah "released"
        return enrichedContracts.reduce((sum, c) => sum + c.total_paid, 0);
    }, [enrichedContracts]);

    const currentMonthReleased = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        return globalPayments.reduce((sum, p) => {
            const paidDate = new Date(p.paid_at || p.createdAt);
            if (paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear) {
                return sum + p.amount;
            }
            return sum;
        }, 0);
    }, [globalPayments]);

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
