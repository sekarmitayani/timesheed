import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminUserService, CreateUserPayload, UpdateUserPayload } from "@/lib/services/admin-users";
import { adminContractService, CreateContractPayload, UpdateContractPayload, Contract } from "@/lib/services/admin-contracts";
import { projectService } from "@/lib/services/project-service";
import { User, Role } from "@/lib/types";
import { toast } from "sonner";

export function useAdminUsersData() {
    const queryClient = useQueryClient();

    // --- UI State (Filters & Pagination) ---
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [roleFilter, setRoleFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");

    // --- Modal State ---
    const [addOpen, setAddOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedUserForDetails, setSelectedUserForDetails] = useState<User | null>(null);
    const [isContractEditorOpen, setIsContractEditorOpen] = useState(false);
    const [editingContractId, setEditingContractId] = useState<number | null>(null);

    // --- Form States ---
    const [form, setForm] = useState({
        full_name: "",
        email: "",
        phone_number: "",
        password: "",
        role: "" as Role,
        employee_type: "" as any,
        is_active: true,
        skill_level: "" as any
    });

    const [contractForm, setContractForm] = useState<CreateContractPayload & { is_active: boolean, rate_display?: string }>({
        user_id: 0,
        contract_type: "" as any,
        payment_scheme: "" as any,
        rate_amount: 0,
        rate_display: "",
        start_date: "",
        end_date: "",
        is_active: true
    });

    const [confirmUserOpen, setConfirmUserOpen] = useState(false);
    const [confirmUserType, setConfirmUserType] = useState<"empty_contract" | "valid_contract" | null>(null);

    // --- Queries ---
    
    // 1. Fetch Users (Paginated)
    const { data: usersResponse, isLoading: isLoadingUsers } = useQuery({
        queryKey: ['admin', 'users', 'list', page, limit],
        queryFn: () => adminUserService.getUsers(page, limit),
        staleTime: 5 * 60 * 1000,
    });

    // 2. Fetch All Projects (for mapping)
    const { data: projectsData } = useQuery({
        queryKey: ['admin', 'projects', 'all'],
        queryFn: () => projectService.getProjects(1, 1000),
        staleTime: 10 * 60 * 1000,
    });
    const projects = projectsData?.data || [];

    // 3. Fetch User Contracts (when detail is open)
    const { data: userContractsRaw, isLoading: isLoadingContracts } = useQuery({
        queryKey: ['admin', 'users', 'contracts', selectedUserForDetails?.id],
        queryFn: () => adminContractService.getUserContracts(selectedUserForDetails!.id),
        enabled: !!selectedUserForDetails && detailsOpen,
        staleTime: 5 * 60 * 1000,
    });
    const userContracts = userContractsRaw || [];

    // --- Mutations ---

    const saveUserMutation = useMutation({
        mutationFn: async (payload: any) => {
            if (editId) return adminUserService.updateUser(editId, payload);
            return adminUserService.createUser(payload);
        },
        onSuccess: (newUser) => {
            toast.success(editId ? "User updated" : "User created");
            // If new user and has initial contract, create it
            if (!editId && contractForm.rate_amount > 0 && contractForm.contract_type) {
                 const contractPayload: CreateContractPayload = {
                    user_id: Number(newUser.id),
                    contract_type: contractForm.contract_type,
                    payment_scheme: contractForm.payment_scheme,
                    rate_amount: contractForm.rate_amount,
                    start_date: contractForm.start_date || new Date().toISOString().split("T")[0],
                    end_date: contractForm.end_date || undefined,
                    is_active: true
                };
                adminContractService.createContract(contractPayload).then(() => {
                    toast.success("Initial contract established");
                });
            }
            queryClient.invalidateQueries({ queryKey: ['admin', 'users', 'list'] });
            setAddOpen(false);
            setEditId(null);
            resetForm();
        },
        onError: (err: any) => toast.error(err.message || "Failed to save user")
    });

    const deleteUserMutation = useMutation({
        mutationFn: (id: string | number) => adminUserService.deleteUser(id),
        onSuccess: () => {
            toast.success("User deleted");
            queryClient.invalidateQueries({ queryKey: ['admin', 'users', 'list'] });
            setDeleteOpen(false);
        },
        onError: (err: any) => toast.error(err.message || "Failed to delete user")
    });

    const saveContractMutation = useMutation({
        mutationFn: async (payload: any) => {
            if (editingContractId) return adminContractService.updateContract(editingContractId, payload);
            return adminContractService.createContract(payload);
        },
        onSuccess: () => {
            toast.success(editingContractId ? "Contract updated" : "Contract created");
            queryClient.invalidateQueries({ queryKey: ['admin', 'users', 'contracts', selectedUserForDetails?.id] });
            setIsContractEditorOpen(false);
            setEditingContractId(null);
            resetContractForm();
        },
        onError: (err: any) => toast.error(err.message || "Failed to save contract")
    });

    const deleteContractMutation = useMutation({
        mutationFn: (id: number) => adminContractService.deleteContract(id),
        onSuccess: () => {
            toast.success("Contract deleted");
            queryClient.invalidateQueries({ queryKey: ['admin', 'users', 'contracts', selectedUserForDetails?.id] });
        },
        onError: (err: any) => toast.error(err.message || "Failed to delete contract")
    });

    // --- Computed ---
    const mappedUsers = useMemo(() => {
        if (!usersResponse?.data) return [];
        return usersResponse.data.map(u => ({
            ...u,
            id: String(u.id),
            name: u.full_name || u.name,
            username: u.email.split("@")[0],
            status: (u.is_active === false) ? "inactive" : "active",
            joinDate: u.created_at ? u.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
        })) as User[];
    }, [usersResponse]);

    const filteredUsers = useMemo(() => {
        return mappedUsers.filter((u) => {
            const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
            const matchStatus = statusFilter === "all" || u.status === statusFilter;
            const matchRole = roleFilter === "all" || u.role === roleFilter;
            const matchType = typeFilter === "all" || (u.employee_type || "system") === typeFilter;
            return matchSearch && matchStatus && matchRole && matchType;
        });
    }, [mappedUsers, search, statusFilter, roleFilter, typeFilter]);

    // --- Helpers ---
    const resetForm = () => {
        setForm({
            full_name: "", email: "", phone_number: "", password: "", role: "" as any, employee_type: "" as any, is_active: true, skill_level: "" as any
        });
        resetContractForm();
    };

    const resetContractForm = () => {
        setContractForm({
            user_id: 0, contract_type: "" as any, payment_scheme: "" as any, rate_amount: 0, rate_display: "",
            start_date: "", end_date: "", is_active: true
        });
    };

    const openEdit = (userId: string) => {
        const u = mappedUsers.find((u) => u.id === userId);
        if (u) {
            setForm({
                full_name: u.full_name || u.name,
                email: u.email,
                phone_number: u.phone_number || "",
                password: "",
                role: u.role,
                employee_type: u.employee_type || "fulltime",
                is_active: u.status === "active" || u.is_active !== false,
                skill_level: (u as any).skill_level || 2
            });
            setEditId(userId);
            setAddOpen(true);
        }
    };

    const handlePreSave = () => {
        if (!form.full_name || form.full_name.trim().length < 2) { toast.error("Full Name too short"); return; }
        if (!form.email || !form.email.includes("@")) { toast.error("Invalid email"); return; }
        if (!form.role) { toast.error("System Role is required"); return; }
        
        if (form.role !== "admin") {
            if (!form.employee_type) { toast.error("Employment Type is required"); return; }
            if (!form.skill_level) { toast.error("Skill Level is required"); return; }
        }
        
        if (!editId) {
            const hasContract = contractForm.rate_amount > 0 && contractForm.contract_type && contractForm.payment_scheme;
            setConfirmUserType(hasContract ? "valid_contract" : "empty_contract");
            setConfirmUserOpen(true);
        } else {
            handleSaveUser();
        }
    };

    const handleSaveUser = () => {
        const payload: any = {
            full_name: form.full_name,
            email: form.email,
            phone_number: form.phone_number,
            role: form.role,
            is_active: form.is_active
        };
        if (form.password) payload.password = form.password;
        if (form.role !== "admin") {
            payload.employee_type = form.employee_type;
            payload.skill_level = form.skill_level;
        } else {
            payload.employee_type = null;
        }

        saveUserMutation.mutate(payload);
        setConfirmUserOpen(false);
    };

    const handleSaveContract = () => {
        if (!selectedUserForDetails) return;
        const payload: any = {
            contract_type: contractForm.contract_type,
            payment_scheme: contractForm.payment_scheme,
            rate_amount: Number(contractForm.rate_amount),
            start_date: contractForm.start_date,
            end_date: contractForm.end_date || null,
            is_active: contractForm.is_active
        };
        if (!editingContractId) payload.user_id = selectedUserForDetails.id;
        saveContractMutation.mutate(payload);
    };

    const openDetails = (u: User) => {
        setSelectedUserForDetails(u);
        setDetailsOpen(true);
        setIsContractEditorOpen(false);
        resetContractForm();
    };

    // --- Effects ---
    useEffect(() => {
        if (typeof window === "undefined" || !mappedUsers.length) return;
        const params = new URLSearchParams(window.location.search);
        const detailId = params.get("detailId");
        
        if (detailId) {
            const u = mappedUsers.find(u => u.id === detailId);
            if (u && !detailsOpen) {
                openDetails(u);
                // Clean up URL without reloading
                window.history.replaceState(null, "", window.location.pathname);
            }
        }
    }, [mappedUsers, detailsOpen]);

    const editContract = (c: Contract) => {
        setEditingContractId(c.id);
        setIsContractEditorOpen(true);
        setContractForm({
            user_id: c.user_id,
            contract_type: c.contract_type,
            payment_scheme: c.payment_scheme || "transfer",
            rate_amount: c.rate_amount,
            rate_display: new Intl.NumberFormat('id-ID').format(c.rate_amount),
            start_date: c.start_date.split("T")[0],
            end_date: c.end_date ? c.end_date.split("T")[0] : "",
            is_active: c.is_active
        });
    };

    return {
        state: {
            users: filteredUsers,
            pagination: usersResponse?.pagination || { page: 1, limit: 10, total: 0 },
            projects,
            userContracts,
            isLoading: isLoadingUsers,
            isLoadingDetails: isLoadingContracts,
            isSaving: saveUserMutation.isPending,
            isSavingContract: saveContractMutation.isPending,
            search, statusFilter, roleFilter, typeFilter,
            addOpen, editId, deleteOpen, userToDelete, detailsOpen, selectedUserForDetails,
            isContractEditorOpen, editingContractId, form, contractForm,
            page, confirmUserOpen, confirmUserType
        },
        actions: {
            setSearch, setStatusFilter, setRoleFilter, setTypeFilter, setPage, setLimit,
            setAddOpen, setEditId, setDeleteOpen, setUserToDelete, setDetailsOpen,
            setSelectedUserForDetails, setIsContractEditorOpen, setEditingContractId,
            setForm, setContractForm, setConfirmUserOpen,
            handlePreSave,
            handleSaveUser,
            handleSaveContract,
            handleDeleteUser: () => userToDelete && deleteUserMutation.mutate(userToDelete.id),
            handleDeleteContract: (id: number) => deleteContractMutation.mutate(id),
            openEdit,
            openDetails,
            editContract,
            resetForm,
            resetContractForm
        }
    };
}
