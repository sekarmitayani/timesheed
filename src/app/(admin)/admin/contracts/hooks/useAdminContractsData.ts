import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminContractService, Contract, CreateContractPayload, UpdateContractPayload, PaymentScheme } from "@/lib/services/admin-contracts";
import { adminUserService } from "@/lib/services/admin-users";
import { projectService } from "@/lib/services/project-service";
import { toast } from "sonner";

export function useAdminContractsData() {
    const queryClient = useQueryClient();

    // --- UI State (Filters & Pagination) ---
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [schemeFilter, setSchemeFilter] = useState("all");
    const [projectFilter, setProjectFilter] = useState("all");

    // --- Modal State ---
    const [formOpen, setFormOpen] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [contractToDelete, setContractToDelete] = useState<Contract | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

    // --- Form States ---
    const [contractForm, setContractForm] = useState<{
        user_id: number;
        contract_type: Contract["contract_type"] | "";
        payment_scheme: PaymentScheme | "";
        rate_amount: number;
        rate_display: string;
        start_date: string;
        end_date: string;
        is_active: boolean;
    }>({
        user_id: 0,
        contract_type: "",
        payment_scheme: "",
        rate_amount: 0,
        rate_display: "",
        start_date: new Date().toISOString().split("T")[0],
        end_date: "",
        is_active: true,
    });

    // --- Queries ---

    // 1. Fetch Users (for dropdown and mapping)
    const { data: usersData } = useQuery({
        queryKey: ['admin', 'users', 'all'],
        queryFn: () => adminUserService.getUsers(1, 1000),
        staleTime: 10 * 60 * 1000,
    });
    const allUsers = usersData?.data || [];

    // 2. Fetch All Projects (for mapping)
    const { data: projectsData } = useQuery({
        queryKey: ['admin', 'projects', 'all'],
        queryFn: () => projectService.getProjects(1, 1000),
        staleTime: 10 * 60 * 1000,
    });
    const allProjects = projectsData?.data || [];

    // 3. Fetch Contracts
    // Note: The current service fetches per user. For admin overview, we might need a better endpoint, 
    // but following current logic: we fetch for all users and combine.
    const { data: contractsData, isLoading } = useQuery({
        queryKey: ['admin', 'contracts', 'all'],
        queryFn: async () => {
            const allContracts: Contract[] = [];
            for (const u of allUsers) {
                try {
                    const c = await adminContractService.getUserContracts(u.id);
                    allContracts.push(...c);
                } catch { /* skip */ }
            }
            return allContracts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        },
        enabled: allUsers.length > 0,
        staleTime: 5 * 60 * 1000,
    });
    const contracts = contractsData || [];

    // --- Mutations ---

    const saveContractMutation = useMutation({
        mutationFn: async (payload: any) => {
            if (editId) return adminContractService.updateContract(editId, payload);
            return adminContractService.createContract(payload);
        },
        onSuccess: () => {
            toast.success(editId ? "Contract updated" : "Contract created");
            queryClient.invalidateQueries({ queryKey: ['admin', 'contracts'] });
            setFormOpen(false);
            resetForm();
        },
        onError: (err: any) => toast.error(err.message || "Failed to save contract")
    });

    const deleteContractMutation = useMutation({
        mutationFn: (id: number) => adminContractService.deleteContract(id),
        onSuccess: () => {
            toast.success("Contract deleted");
            queryClient.invalidateQueries({ queryKey: ['admin', 'contracts'] });
            setDeleteOpen(false);
        },
        onError: (err: any) => toast.error(err.message || "Failed to delete contract")
    });

    // --- Computed ---
    const filteredContracts = useMemo(() => {
        return contracts.filter(c => {
            const u = allUsers.find(user => Number(user.id) === c.user_id);
            const name = (u?.full_name || u?.name || "").toLowerCase();

            const matchSearch = name.includes(search.toLowerCase());
            const matchType = typeFilter === "all" || c.contract_type === typeFilter;
            const matchScheme = schemeFilter === "all" || c.payment_scheme === schemeFilter;
            const matchProject = projectFilter === "all" ? true : (projectFilter === "base" ? !c.project_id : c.project_id === Number(projectFilter));
            
            let matchStatus = true;
            if (statusFilter === "active") matchStatus = c.is_active === true;
            if (statusFilter === "inactive") matchStatus = c.is_active === false;

            return matchSearch && matchType && matchScheme && matchStatus && matchProject;
        });
    }, [contracts, allUsers, search, typeFilter, schemeFilter, projectFilter, statusFilter]);

    const paginatedContracts = useMemo(() => {
        return filteredContracts.slice((page - 1) * limit, page * limit);
    }, [filteredContracts, page, limit]);

    const totalPages = Math.ceil(filteredContracts.length / limit);

    const activeProjectsCtx = useMemo(() => {
        return Array.from(new Set(contracts.map(c => c.project_id).filter((id): id is number => !!id)));
    }, [contracts]);

    // --- Helpers ---
    const resetForm = () => {
        setEditId(null);
        setContractForm({
            user_id: 0, contract_type: "", payment_scheme: "",
            rate_amount: 0, rate_display: "",
            start_date: new Date().toISOString().split("T")[0], end_date: "", is_active: true,
        });
    };

    const openEdit = (c: Contract) => {
        setEditId(c.id);
        setContractForm({
            user_id: c.user_id,
            contract_type: c.contract_type,
            payment_scheme: c.payment_scheme || "monthly",
            rate_amount: c.rate_amount,
            rate_display: new Intl.NumberFormat('id-ID').format(c.rate_amount),
            start_date: c.start_date.split("T")[0],
            end_date: c.end_date ? c.end_date.split("T")[0] : "",
            is_active: c.is_active,
        });
        setFormOpen(true);
    };

    // --- Effects ---
    useEffect(() => {
        if (typeof window === "undefined" || !contracts.length) return;
        const params = new URLSearchParams(window.location.search);
        const detailId = params.get("detailId");
        
        if (detailId) {
            const c = contracts.find(c => String(c.id) === detailId);
            if (c && !detailsOpen) {
                setSelectedContract(c);
                setDetailsOpen(true);
                // Clean up URL without reloading
                window.history.replaceState(null, "", window.location.pathname);
            }
        }
    }, [contracts, detailsOpen]);

    const handleSaveContract = () => {
        if (!editId && !contractForm.user_id) { toast.error("Select a user"); return; }
        
        const payload: any = {
            contract_type: contractForm.contract_type,
            payment_scheme: contractForm.payment_scheme,
            rate_amount: contractForm.rate_amount,
            start_date: contractForm.start_date,
            end_date: contractForm.end_date || null,
            is_active: contractForm.is_active,
        };
        if (!editId) payload.user_id = Number(contractForm.user_id);

        saveContractMutation.mutate(payload);
    };

    return {
        state: {
            contracts: paginatedContracts,
            allContractsCount: contracts.length,
            filteredCount: filteredContracts.length,
            pagination: { page, limit, totalPages },
            allUsers,
            allProjects,
            activeProjectsCtx,
            isLoading,
            isSaving: saveContractMutation.isPending,
            search, statusFilter, typeFilter, schemeFilter, projectFilter,
            formOpen, importOpen, editId, deleteOpen, contractToDelete, detailsOpen, selectedContract,
            contractForm
        },
        actions: {
            setSearch, setStatusFilter, setTypeFilter, setSchemeFilter, setProjectFilter, setPage, setLimit,
            setFormOpen, setImportOpen, setEditId, setDeleteOpen, setContractToDelete, setDetailsOpen, setSelectedContract,
            setContractForm,
            handleSaveContract,
            handleDeleteContract: () => contractToDelete && deleteContractMutation.mutate(contractToDelete.id),
            handleImportSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'contracts'] }),
            openEdit,
            resetForm
        }
    };
}
