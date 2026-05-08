import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
    adminContractService, ContractPayment, ContractSummary, 
    CreatePaymentPayload, UpdatePaymentPayload, PayrollSummaryItem 
} from "@/lib/services/admin-contracts";
import { adminUserService } from "@/lib/services/admin-users";
import { projectService } from "@/lib/services/project-service";
import { toast } from "sonner";

export function useAdminPayrollData() {
    const queryClient = useQueryClient();

    // --- Filter & Pagination State ---
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState("");
    const [schemeFilter, setSchemeFilter] = useState("all");
    const [projectFilter, setProjectFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

    // --- Modal State ---
    const [paymentsOpen, setPaymentsOpen] = useState(false);
    const [selectedContract, setSelectedContract] = useState<PayrollSummaryItem | null>(null);
    const [contractSummary, setContractSummary] = useState<ContractSummary | null>(null);

    // --- Payment Form State ---
    const [editingPaymentId, setEditingPaymentId] = useState<number | null>(null);
    const [paymentForm, setPaymentForm] = useState({
        name: "", 
        amount: 0, 
        paid_at: new Date().toISOString().split("T")[0], 
        description: "",
    });

    // --- Queries ---

    // 1. Fetch Projects (for filter dropdown)
    const { data: projectsData } = useQuery({
        queryKey: ["admin", "projects", "all"],
        queryFn: () => projectService.getProjects(1, 1000),
        staleTime: 10 * 60 * 1000,
    });
    const allProjects = projectsData?.data || [];

    // 2. Fetch Payroll Summary (The core optimized endpoint)
    const { data: summaryData, isLoading: isLoadingSummary } = useQuery({
        queryKey: ["admin", "payroll", "summary"],
        queryFn: () => adminContractService.getPayrollSummary(),
        staleTime: 5 * 60 * 1000,
    });
    const payrollItems = summaryData?.data || [];

    // 3. Fetch Payments for Selected Contract
    const { data: paymentsResponse, isLoading: isLoadingPayments } = useQuery({
        queryKey: ["admin", "payroll", "payments", selectedContract?.id],
        queryFn: () => selectedContract ? adminContractService.getPayments(selectedContract.id) : Promise.resolve(null),
        enabled: !!selectedContract && paymentsOpen,
    });
    const currentPayments = paymentsResponse?.data || [];
    const currentBreakdown = paymentsResponse?.monthly_breakdown || [];

    // --- Mutations ---

    const savePaymentMutation = useMutation({
        mutationFn: async ({ contractId, payload }: { contractId: number; payload: CreatePaymentPayload | UpdatePaymentPayload }) => {
            if (editingPaymentId) return adminContractService.updatePayment(editingPaymentId, payload);
            return adminContractService.addPayment(contractId, payload as CreatePaymentPayload);
        },
        onSuccess: (res: any) => {
            toast.success(editingPaymentId ? "Payment updated" : "Payment recorded");
            queryClient.invalidateQueries({ queryKey: ["admin", "payroll"] });
            resetPaymentForm();
            if (res && res.contract_summary) setContractSummary(res.contract_summary);
        },
        onError: (err: any) => toast.error(err.message || "Failed to save payment"),
    });

    const deletePaymentMutation = useMutation({
        mutationFn: (id: number) => adminContractService.deletePayment(id),
        onSuccess: () => {
            toast.success("Payment deleted");
            queryClient.invalidateQueries({ queryKey: ["admin", "payroll"] });
        },
        onError: (err: any) => toast.error(err.message || "Failed to delete payment"),
    });

    // --- Logic ---

    useEffect(() => {
        setPage(1);
    }, [search, schemeFilter, projectFilter, statusFilter, limit]);

    const filteredContracts = useMemo(() => {
        return payrollItems.filter(c => {
            const name = (c.full_name || "").toLowerCase();
            const matchesSearch = name.includes(search.toLowerCase()) || 
                                  c.payment_scheme.toLowerCase().includes(search.toLowerCase());
            const matchesScheme = schemeFilter === "all" || c.payment_scheme === schemeFilter;
            
            // Check project filter: either by ID or name if projectFilter is set
            // In the summary, we might only have project_name, so we filter by that if it's not "all"
            // If projectFilter is numeric ID, we'd need project_id in summary. 
            // Looking at PayrollSummaryItem, it doesn't have project_id. 
            // We'll assume projectFilter "all" or matching project_name for now or update filtered logic.
            const matchesProject = projectFilter === "all" || c.project_name === allProjects.find(p => String(p.id) === projectFilter)?.name;
            
            const matchesStatus = statusFilter === "all" || c.payment_status === statusFilter;
            return matchesSearch && matchesScheme && matchesProject && matchesStatus;
        });
    }, [payrollItems, search, schemeFilter, projectFilter, statusFilter, allProjects]);

    const totalFiltered = filteredContracts.length;
    const totalPages = Math.ceil(totalFiltered / limit);
    const paginatedContracts = useMemo(() => {
        const start = (page - 1) * limit;
        return filteredContracts.slice(start, start + limit);
    }, [filteredContracts, page, limit]);

    const stats = useMemo(() => {
        const target = payrollItems.reduce((acc, curr) => acc + curr.calculated_target, 0);
        const released = payrollItems.reduce((acc, curr) => acc + curr.total_paid, 0);
        const pending = payrollItems.filter(c => c.payment_status === "pending").length;
        const partiallyPaid = payrollItems.filter(c => c.payment_status === "partially_paid").length;
        const paid = payrollItems.filter(c => c.payment_status === "paid").length;
        return { target, released, pending, partiallyPaid, paid };
    }, [payrollItems]);

    const resetPaymentForm = () => {
        setEditingPaymentId(null);
        setPaymentForm({ 
            name: "", 
            amount: 0, 
            paid_at: new Date().toISOString().split("T")[0], 
            description: "" 
        });
    };

    const handleEditPayment = (p: ContractPayment) => {
        setEditingPaymentId(p.id);
        setPaymentForm({
            name: p.name,
            amount: p.amount,
            paid_at: p.paid_at.split("T")[0],
            description: p.description
        });
    };

    return {
        // State
        page, setPage,
        limit, setLimit,
        search, setSearch,
        schemeFilter, setSchemeFilter,
        projectFilter, setProjectFilter,
        statusFilter, setStatusFilter,
        paymentsOpen, setPaymentsOpen,
        selectedContract, setSelectedContract,
        contractSummary, setContractSummary,
        editingPaymentId,
        paymentForm, setPaymentForm,

        // Data
        allProjects,
        isLoading: isLoadingSummary,
        isLoadingPayments,
        stats,
        totalFiltered,
        totalPages,
        paginatedContracts,
        currentPayments,
        currentBreakdown,

        // Actions
        savePayment: (payload: any) => {
            if (selectedContract) {
                savePaymentMutation.mutate({ contractId: selectedContract.id, payload });
            }
        },
        deletePayment: deletePaymentMutation.mutate,
        isSavingPayment: savePaymentMutation.isPending || deletePaymentMutation.isPending,
        resetPaymentForm,
        handleEditPayment
    };
}
