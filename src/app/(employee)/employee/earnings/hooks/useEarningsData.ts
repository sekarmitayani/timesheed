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
                    const approvedMinutes = projectTimesheets
                        .filter(ts => ts.status === 'approved')
                        .reduce((sum, ts) => sum + ts.duration_minutes, 0);
                    const pendingMinutes = projectTimesheets
                        .filter(ts => ts.status === 'pending')
                        .reduce((sum, ts) => sum + ts.duration_minutes, 0);

                    // Count approved days (unique dates)
                    const approvedDays = new Set(
                        projectTimesheets
                            .filter(ts => ts.status === 'approved')
                            .map(ts => new Date(ts.created_at || "").toDateString())
                    ).size;

                    // CORRECTED LOGIC: Calculate total earned based on contract type
                    let total_earned = 0;
                    if (c.contract_type === 'timesheet') {
                        total_earned = (approvedMinutes / 60) * c.rate_amount;
                    } else if (c.contract_type === 'mandays') {
                        total_earned = approvedDays * c.rate_amount;
                    } else {
                        // monthly or yearly
                        total_earned = c.rate_amount;
                    }

                    // FILTER PAYMENTS: Instead of calling admin API, filter the globally fetched payments
                    const payments = (paymentsData || [])
                        .filter(p => p.contract_id === c.id)
                        .map(p => ({
                            id: String(p.id),
                            name: p.name || "Payment",
                            amount: p.amount,
                            paid_at: p.paid_at,
                            description: p.description
                        }));

                    // RELY ON BACKEND DATA: Use total_paid from contract object
                    const totalPaid = c.total_paid ?? 0;
                    
                    // DYNAMIC CALCULATION: Payment Status & Liability (Frontend derived for accuracy)
                    const liability = Math.max(0, total_earned - totalPaid);
                    let payment_status: "pending" | "paid" | "partially_paid" = "pending";
                    if (totalPaid > 0) {
                        payment_status = liability <= 0 ? "paid" : "partially_paid";
                    }

                    return {
                        ...c,
                        project_name: project?.name || (c.project_id ? `Project #${c.project_id}` : "Base Contract"),
                        total_paid: totalPaid,
                        approvedMinutes,
                        pendingMinutes,
                        approvedDays,
                        total_earned,
                        payment_status,
                        payments
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
                        const total_earned = rate; // Mocking earned as full rate for fixed

                        return {
                            ...c,
                            id: Number(c.id.replace('c', '')),
                            project_id: mockProjectId,
                            project_name: project?.name || "Base Contract",
                            contract_type: c.rateType === 'monthly' ? 'monthly' : 'timesheet',
                            payment_scheme: 'monthly',
                            rate_amount: rate,
                            total_paid: total_paid,
                            approvedMinutes: 4800, // 80 hours mock
                            pendingMinutes: 600,   // 10 hours mock
                            approvedDays: 10,
                            total_earned,
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
