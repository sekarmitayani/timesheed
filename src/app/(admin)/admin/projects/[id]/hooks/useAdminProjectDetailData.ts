import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectService, UpdateProjectPayload, AssignMemberPayload } from "@/lib/services/project-service";
import { adminUserService } from "@/lib/services/admin-users";
import { adminContractService, Contract } from "@/lib/services/admin-contracts";
import { resourceService, EditResourcePayload } from "@/lib/services/resource-service";
import { ApiProject, ProjectMember, User } from "@/lib/types";
import { toast } from "sonner";

export type CostEntry = {
    id: string;
    type: "Salary" | "Resource";
    name: string;
    amount: number;
    date: string;
    user: string;
};

export function useAdminProjectDetailData(projectId: string) {
    const queryClient = useQueryClient();

    // --- UI State ---
    const [activeTab, setActiveTab] = useState("Overview");

    // Filters
    const [teamSearch, setTeamSearch] = useState("");
    const [costFilterType, setCostFilterType] = useState<"all" | "Salary" | "Resource">("all");
    const [costFilterStart, setCostFilterStart] = useState("");
    const [costFilterEnd, setCostFilterEnd] = useState("");
    const [resSearch, setResSearch] = useState("");
    const [resFilterStatus, setResFilterStatus] = useState("all");
    const [resFilterType, setResFilterType] = useState("all");

    // Modal States
    const [editOpen, setEditOpen] = useState(false);
    const [assignOpen, setAssignOpen] = useState(false);
    const [resDetailOpen, setResDetailOpen] = useState(false);
    const [resCreateOpen, setResCreateOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [zeroConfirmOpen, setZeroConfirmOpen] = useState(false);
    const [resEditMode, setResEditMode] = useState(false);
    const [selectedRes, setSelectedRes] = useState<any>(null);

    // Form States
    const [editForm, setEditForm] = useState<any>({
        name: "", client_name: "", client_email: "", status: "active",
        budget_revenue: 0, budget_cost: 0, budget_cost_threshold: 0, deadline: ""
    });

    const [assignForm, setAssignForm] = useState<AssignMemberPayload>({
        project_id: Number(projectId), user_id: 0, role_in_project: "", custom_rate: null, contract_type: "", payment_scheme: ""
    });
    const [memberAssignRateMode, setMemberAssignRateMode] = useState<"contract" | "custom">("contract");
    const [memberSelectedContractId, setMemberSelectedContractId] = useState("");
    const [memberUserContracts, setMemberUserContracts] = useState<Contract[]>([]);
    const [memberLoadingContracts, setMemberLoadingContracts] = useState(false);

    const [resCreateForm, setResCreateForm] = useState({ type: "", details: "" });
    const [resEditForm, setResEditForm] = useState<EditResourcePayload & { confirm_zero?: boolean }>({});

    // --- Queries ---
    const { data: project, isLoading: isLoadingProject } = useQuery({
        queryKey: ['admin', 'project', projectId],
        queryFn: () => projectService.getProjectById(projectId),
        enabled: !!projectId,
    });

    const { data: members = [], isLoading: isLoadingMembers } = useQuery({
        queryKey: ['admin', 'project', projectId, 'members'],
        queryFn: () => projectService.getProjectMembers(projectId),
        enabled: !!projectId,
    });

    const { data: resourcesResponse, isLoading: isLoadingResources } = useQuery({
        queryKey: ['admin', 'project', projectId, 'resources'],
        queryFn: () => resourceService.getResourceRequests({ project_id: projectId }),
        enabled: !!projectId,
    });
    const resources = Array.isArray(resourcesResponse?.data) ? resourcesResponse.data : (Array.isArray(resourcesResponse) ? resourcesResponse : []);

    const { data: allUsersResponse } = useQuery({
        queryKey: ['admin', 'users', 'all'],
        queryFn: () => adminUserService.getUsers(1, 1000),
        staleTime: 10 * 60 * 1000,
    });
    const allUsers = allUsersResponse?.data || [];

    const { data: costs = [], isLoading: isLoadingCosts } = useQuery({
        queryKey: ['admin', 'project', projectId, 'costs'],
        queryFn: async () => {
            let allCosts: CostEntry[] = [];
            
            // 1. Get Gaji Costs
            const contractPromises = (members as ProjectMember[]).map(m => adminContractService.getUserContracts(m.user_id).catch(() => []));
            const contractsArrays = await Promise.all(contractPromises);
            const projectContracts = contractsArrays.flat().filter(c => c.project_id === Number(projectId));

            const paymentPromises = projectContracts.map(c => adminContractService.getPayments(c.id).then(pays => ({ contract: c, pays })).catch(() => null));
            const paymentsResults = await Promise.all(paymentPromises);

            paymentsResults.forEach(res => {
                if (!res || !res.pays.data) return;
                const member = members.find((m: any) => m.user_id === res.contract.user_id);
                res.pays.data.forEach((p: any) => {
                    let d = p.paid_at || p.created_at || "";
                    if (d.includes("T")) d = d.split("T")[0];
                    allCosts.push({
                        id: `gaji-${p.id}`,
                        type: "Salary",
                        name: p.name || res.contract.contract_type,
                        amount: p.amount,
                        date: d,
                        user: member?.user?.full_name || `User #${res.contract.user_id}`
                    });
                });
            });

            // 2. Get Resource Costs
            resources.filter((r: any) => r.status === "approved").forEach((r: any) => {
                let d = r.updated_at || r.created_at || "";
                if (d.includes("T")) d = d.split("T")[0];
                allCosts.push({
                    id: `res-${r.id}`,
                    type: "Resource",
                    name: r.details || r.type,
                    amount: r.amount,
                    date: d,
                    user: r.user?.full_name || `User #${r.user_id}`
                });
            });

            return allCosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        },
        enabled: !!projectId && members.length > 0,
    });

    const isLoading = isLoadingProject || isLoadingMembers || isLoadingResources;

    // --- Mutations ---

    const editProjectMutation = useMutation({
        mutationFn: (payload: UpdateProjectPayload) => projectService.updateProject(Number(projectId), payload),
        onSuccess: () => {
            toast.success("Project updated!");
            queryClient.invalidateQueries({ queryKey: ['admin', 'project', projectId] });
            setEditOpen(false);
        },
        onError: (e: any) => toast.error(e.message || "Failed to update project")
    });

    const assignMemberMutation = useMutation({
        mutationFn: (payload: AssignMemberPayload) => projectService.assignMember(payload),
        onSuccess: () => {
            toast.success("Member assigned!");
            queryClient.invalidateQueries({ queryKey: ['admin', 'project', projectId, 'members'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'project', projectId, 'costs'] });
            setAssignOpen(false);
        },
        onError: (e: any) => toast.error(e.message || "Failed to assign member")
    });

    const removeMemberMutation = useMutation({
        mutationFn: (id: number) => projectService.removeMember(id),
        onSuccess: () => {
            toast.success("Member removed!");
            queryClient.invalidateQueries({ queryKey: ['admin', 'project', projectId, 'members'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'project', projectId, 'costs'] });
        },
        onError: (e: any) => toast.error(e.message || "Failed to remove member")
    });

    const createResourceMutation = useMutation({
        mutationFn: (payload: any) => resourceService.createResourceRequest(payload),
        onSuccess: () => {
            toast.success("Resource request submitted!");
            queryClient.invalidateQueries({ queryKey: ['admin', 'project', projectId, 'resources'] });
            setResCreateOpen(false);
            setResCreateForm({ type: "", details: "" });
        },
        onError: (e: any) => toast.error(e.message || "Failed to submit request")
    });

    const editResourceMutation = useMutation({
        mutationFn: ({ id, payload }: { id: number, payload: EditResourcePayload & { confirm_zero?: boolean } }) => resourceService.editResource(id, payload),
        onSuccess: () => {
            toast.success("Resource request updated!");
            queryClient.invalidateQueries({ queryKey: ['admin', 'project', projectId, 'resources'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'project', projectId, 'costs'] });
            setResDetailOpen(false);
            setZeroConfirmOpen(false);
        },
        onError: (e: any) => {
            if (e.message && e.message.includes("confirm_zero")) {
                setZeroConfirmOpen(true);
            } else {
                toast.error(e.message || "Failed to update resource");
            }
        }
    });

    const deleteResourceMutation = useMutation({
        mutationFn: (id: number) => resourceService.deleteResourceRequest(id),
        onSuccess: () => {
            toast.success("Resource request deleted!");
            queryClient.invalidateQueries({ queryKey: ['admin', 'project', projectId, 'resources'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'project', projectId, 'costs'] });
            setDeleteConfirmOpen(false);
            setResDetailOpen(false);
        },
        onError: (e: any) => toast.error(e.message || "Failed to delete resource")
    });

    // --- Computed ---
    const filteredMembers = useMemo(() => {
        const q = teamSearch.toLowerCase();
        return (members as ProjectMember[]).filter(m => 
            (m.user?.full_name?.toLowerCase() || "").includes(q) ||
            (m.user?.email?.toLowerCase() || "").includes(q) ||
            (m.role_in_project?.toLowerCase() || "").includes(q)
        );
    }, [members, teamSearch]);

    const filteredCosts = useMemo(() => {
        return costs.filter(c => {
            if (costFilterType !== "all" && c.type !== costFilterType) return false;
            if (costFilterStart && c.date < costFilterStart) return false;
            if (costFilterEnd && c.date > costFilterEnd) return false;
            return true;
        });
    }, [costs, costFilterType, costFilterStart, costFilterEnd]);

    const filteredResources = useMemo(() => {
        const q = resSearch.toLowerCase();
        return (resources as any[]).filter(r => {
            const matchesSearch = (r.details?.toLowerCase() || "").includes(q) ||
                (r.user?.full_name?.toLowerCase() || "").includes(q) ||
                r.type.toLowerCase().includes(q);
            const matchesStatus = resFilterStatus === "all" || r.status === resFilterStatus;
            const matchesType = resFilterType === "all" || r.type === resFilterType;
            return matchesSearch && matchesStatus && matchesType;
        });
    }, [resources, resSearch, resFilterStatus, resFilterType]);

    const openEditProject = () => {
        if (!project) return;
        setEditForm({
            name: project.name,
            client_name: project.client_name,
            client_email: project.client_email || "",
            status: project.status,
            budget_revenue: project.budget_revenue || 0,
            budget_cost: project.budget_cost || 0,
            budget_cost_threshold: project.budget_cost_threshold || 0,
            deadline: project.deadline || ""
        });
        setEditOpen(true);
    };

    const openAssignMember = () => {
        setAssignForm({ project_id: Number(projectId), user_id: 0, role_in_project: "", custom_rate: null, contract_type: "", payment_scheme: "" });
        setMemberUserContracts([]);
        setMemberAssignRateMode("contract");
        setMemberSelectedContractId("");
        setAssignOpen(true);
    };

    const openResDetail = (r: any) => {
        setSelectedRes(r);
        setResEditForm({ type: r.type, details: r.details, amount: r.amount, status: r.status });
        setResEditMode(false);
        setResDetailOpen(true);
    };

    const handleSaveEditProject = () => {
        editProjectMutation.mutate({ ...editForm, client_email: editForm.client_email || undefined });
    };

    const handleAssignSave = () => {
        if (!assignForm.user_id || !assignForm.role_in_project) { toast.error("User and role required"); return; }
        const p: any = { project_id: assignForm.project_id, user_id: Number(assignForm.user_id), role_in_project: assignForm.role_in_project };
        if (memberAssignRateMode === "custom" && assignForm.custom_rate) {
            p.custom_rate = Number(assignForm.custom_rate); p.contract_type = assignForm.contract_type || "termin"; p.payment_scheme = assignForm.payment_scheme || "monthly";
        } else if (memberAssignRateMode === "contract" && memberSelectedContractId !== "custom") {
            const c = memberUserContracts.find(x => String(x.id) === memberSelectedContractId);
            if (c) { p.custom_rate = c.rate_amount; p.contract_type = c.contract_type; p.payment_scheme = c.payment_scheme; }
        }
        assignMemberMutation.mutate(p);
    };

    const handleMemberUserSelect = async (uid: number) => {
        setAssignForm({ ...assignForm, user_id: uid, custom_rate: null, contract_type: "", payment_scheme: "" });
        setMemberSelectedContractId("");
        setMemberAssignRateMode("contract");
        setMemberUserContracts([]);
        if (uid) {
            setMemberLoadingContracts(true);
            try {
                const allC = await adminContractService.getUserContracts(uid);
                const c = allC.filter(x => !x.project_id);
                setMemberUserContracts(c);
                if (c.length === 0) setMemberAssignRateMode("custom");
            } catch {
                setMemberUserContracts([]);
                setMemberAssignRateMode("custom");
            } finally {
                setMemberLoadingContracts(false);
            }
        }
    };

    const handleMemberContractSelect = (v: string) => {
        if (v === "custom") {
            setMemberAssignRateMode("custom");
            setMemberSelectedContractId("custom");
            setAssignForm({ ...assignForm, custom_rate: null, contract_type: "", payment_scheme: "" });
        } else {
            setMemberAssignRateMode("contract");
            setMemberSelectedContractId(v);
            const c = memberUserContracts.find(x => String(x.id) === v);
            if (c) setAssignForm({ ...assignForm, custom_rate: c.rate_amount, contract_type: c.contract_type, payment_scheme: c.payment_scheme });
        }
    };

    return {
        state: {
            project, members, resources, allUsers, costs,
            isLoading, isLoadingCosts,
            activeTab, teamSearch, costFilterType, costFilterStart, costFilterEnd, resSearch, resFilterStatus, resFilterType,
            editOpen, assignOpen, resDetailOpen, resCreateOpen, deleteConfirmOpen, zeroConfirmOpen, resEditMode, selectedRes,
            editForm, assignForm, memberAssignRateMode, memberSelectedContractId, memberUserContracts, memberLoadingContracts, resCreateForm, resEditForm,
            filteredMembers, filteredCosts, filteredResources,
            isSaving: editProjectMutation.isPending || assignMemberMutation.isPending || createResourceMutation.isPending || editResourceMutation.isPending || deleteResourceMutation.isPending || removeMemberMutation.isPending
        },
        actions: {
            setActiveTab, setTeamSearch, setCostFilterType, setCostFilterStart, setCostFilterEnd, setResSearch, setResFilterStatus, setResFilterType,
            setEditOpen, setAssignOpen, setResDetailOpen, setResCreateOpen, setDeleteConfirmOpen, setZeroConfirmOpen, setResEditMode,
            setEditForm, setAssignForm, setResCreateForm, setResEditForm, setSelectedRes,
            openEditProject, openAssignMember, openResDetail,
            handleSaveEditProject, handleAssignSave, handleRemoveMember: (id: number) => removeMemberMutation.mutate(id),
            handleCreateRes: () => createResourceMutation.mutate({ project_id: Number(projectId), type: resCreateForm.type, details: resCreateForm.details }),
            handleSaveResEdit: (forceZero = false) => {
                if (!selectedRes) return;
                const payload = { ...resEditForm };
                if (forceZero) payload.confirm_zero = true;
                editResourceMutation.mutate({ id: selectedRes.id, payload });
            },
            handleDeleteRes: () => selectedRes && deleteResourceMutation.mutate(selectedRes.id),
            handleMemberUserSelect, handleMemberContractSelect
        }
    };
}
