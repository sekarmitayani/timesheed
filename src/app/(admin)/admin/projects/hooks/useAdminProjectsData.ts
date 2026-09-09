import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectService, CreateProjectPayload, AssignMemberPayload } from "@/lib/services/project-service";
import { adminUserService } from "@/lib/services/admin-users";
import { adminContractService, Contract } from "@/lib/services/admin-contracts";
import { ApiProject, ProjectMember, User } from "@/lib/types";
import { toast } from "sonner";

export interface AdminProjectCardData {
    project: ApiProject;
    members: ProjectMember[];
}

export function useAdminProjectsData() {
    const queryClient = useQueryClient();

    // --- UI State (Filters & Modals) ---
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(50); // Large limit for card view
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    const [wizardOpen, setWizardOpen] = useState(false);
    const [wizardStep, setWizardStep] = useState(1);
    const [importOpen, setImportOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<ApiProject | null>(null);
    const [membersOpen, setMembersOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<ApiProject | null>(null);
    const [showAssignForm, setShowAssignForm] = useState(false);

    // --- Form States ---
    const [projectForm, setProjectForm] = useState<any>({
        name: "", client_name: "", client_email: "",
        budget_revenue: 0, budget_cost: 0, budget_cost_threshold: 0, deadline: ""
    });
    const [selectedPmId, setSelectedPmId] = useState<string>("");
    const [pendingEmployees, setPendingEmployees] = useState<any[]>([]);
    
    const [empForm, setEmpForm] = useState({
        userId: "", role: "", rateMode: "contract" as "contract" | "custom",
        selectedContractId: "", customRate: null as number | null,
        contractType: "", paymentScheme: "", startDate: new Date().toISOString()
    });

    const [assignForm, setAssignForm] = useState<AssignMemberPayload>({
        project_id: 0, user_id: 0, role_in_project: "",
        custom_rate: null, contract_type: "", payment_scheme: "", start_date: new Date().toISOString()
    });

    // --- Queries ---
    
    // 1. Fetch Project List
    const { data: projectsResponse, isLoading: isLoadingProjects } = useQuery({
        queryKey: ['admin', 'projects', 'list', page, limit],
        queryFn: () => projectService.getProjects(page, limit),
        staleTime: 5 * 60 * 1000,
    });
    const projects = projectsResponse?.data || [];

    // 2. Fetch Members for all projects (to construct cards)
    const { data: projectCards = [], isLoading: isLoadingCards } = useQuery({
        queryKey: ['admin', 'projects', 'cards', projects.map(p => p.id)],
        queryFn: async () => {
            const cardPromises = projects.map(async (project) => {
                let members: ProjectMember[] = [];
                try {
                    const res = await projectService.getProjectMembers(String(project.id));
                    members = Array.isArray(res) ? res : [];
                } catch { /* skip */ }
                return { project, members } as AdminProjectCardData;
            });
            return await Promise.all(cardPromises);
        },
        enabled: projects.length > 0,
        staleTime: 5 * 60 * 1000,
    });

    // 3. Fetch All Users
    const { data: usersResponse } = useQuery({
        queryKey: ['admin', 'users', 'all'],
        queryFn: () => adminUserService.getUsers(1, 1000),
        staleTime: 10 * 60 * 1000,
    });
    const allUsers = usersResponse?.data || [];

    // 4. Fetch Members for selected project (Dialog)
    const { data: selectedProjectMembers = [], isLoading: isLoadingMembers } = useQuery({
        queryKey: ['admin', 'projects', 'members', selectedProject?.id],
        queryFn: () => projectService.getProjectMembers(String(selectedProject!.id)),
        enabled: !!selectedProject && membersOpen,
    });

    // --- Mutations ---

    const createProjectMutation = useMutation({
        mutationFn: async (payload: CreateProjectPayload) => projectService.createProject(payload),
        onSuccess: async (created) => {
            if (selectedPmId) {
                await projectService.assignMember({
                    project_id: created.id,
                    user_id: Number(selectedPmId),
                    role_in_project: "Project Manager"
                });
            }
            for (const emp of pendingEmployees) {
                const ep: AssignMemberPayload = {
                    project_id: created.id,
                    user_id: Number(emp.user.id),
                    role_in_project: emp.role_in_project,
                    custom_rate: emp.custom_rate,
                    contract_type: emp.contract_type,
                    payment_scheme: emp.payment_scheme,
                    start_date: emp.start_date
                };
                await projectService.assignMember(ep);
            }
            toast.success(`Project "${projectForm.name}" created!`);
            queryClient.invalidateQueries({ queryKey: ['admin', 'projects'] });
            setWizardOpen(false);
            resetWizard();
        },
        onError: (err: any) => toast.error(err.message || "Failed to create project")
    });

    const deleteProjectMutation = useMutation({
        mutationFn: (id: number) => projectService.deleteProject(id),
        onSuccess: () => {
            toast.success("Project deleted");
            queryClient.invalidateQueries({ queryKey: ['admin', 'projects'] });
            setDeleteOpen(false);
        },
        onError: (err: any) => toast.error(err.message || "Failed to delete project")
    });

    const assignMemberMutation = useMutation({
        mutationFn: (payload: AssignMemberPayload) => projectService.assignMember(payload),
        onSuccess: () => {
            toast.success("Member assigned");
            queryClient.invalidateQueries({ queryKey: ['admin', 'projects', 'members', selectedProject?.id] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'projects', 'cards'] });
            setShowAssignForm(false);
        },
        onError: (err: any) => toast.error(err.message || "Failed to assign member")
    });

    const removeMemberMutation = useMutation({
        mutationFn: (id: number) => projectService.removeProjectMember(id),
        onSuccess: () => {
            toast.success("Member removed");
            queryClient.invalidateQueries({ queryKey: ['admin', 'projects', 'members', selectedProject?.id] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'projects', 'cards'] });
        },
        onError: (err: any) => toast.error(err.message || "Failed to remove member")
    });

    // --- Computed ---
    const filteredCards = useMemo(() => {
        let result = [...projectCards];
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(c => 
                c.project.name.toLowerCase().includes(q) || 
                c.project.client_name.toLowerCase().includes(q)
            );
        }
        if (statusFilter !== "All") {
            result = result.filter(c => c.project.status === statusFilter.toLowerCase());
        }

        const getStatusPriority = (status: string) => {
            const s = (status || "").toLowerCase().replace(/[-_\s]/g, "");
            if (s === "active") return 1;
            if (s === "completed") return 2;
            if (s === "onhold") return 3;
            if (s === "cancelled" || s === "canceled") return 4;
            return 99;
        };

        result.sort((a, b) => {
            const pA = getStatusPriority(a.project.status);
            const pB = getStatusPriority(b.project.status);
            if (pA !== pB) {
                return pA - pB;
            }
            return new Date(b.project.created_at).getTime() - new Date(a.project.created_at).getTime();
        });

        return result;
    }, [projectCards, search, statusFilter]);

    // --- Helpers ---
    const resetWizard = () => {
        setProjectForm({ name: "", client_name: "", client_email: "", budget_revenue: 0, budget_cost: 0, budget_cost_threshold: 0, deadline: "" });
        setSelectedPmId("");
        setPendingEmployees([]);
        setWizardStep(1);
    };

    return {
        state: {
            cards: filteredCards,
            isLoading: isLoadingProjects || (projects.length > 0 && isLoadingCards),
            isLoadingMembers,
            isSaving: createProjectMutation.isPending || deleteProjectMutation.isPending,
            isSavingMember: assignMemberMutation.isPending || removeMemberMutation.isPending,
            search, statusFilter,
            wizardOpen, wizardStep, importOpen, deleteOpen, projectToDelete, membersOpen, selectedProject, showAssignForm,
            projectForm, selectedPmId, pendingEmployees, empForm, assignForm,
            allUsers, selectedProjectMembers,
            pagination: projectsResponse?.pagination || { page: 1, limit: 10, total: 0 }
        },
        actions: {
            setSearch, setStatusFilter, setPage, setLimit,
            setWizardOpen, setWizardStep, setImportOpen, setDeleteOpen, setProjectToDelete, setMembersOpen, setSelectedProject, setShowAssignForm,
            setProjectForm, setSelectedPmId, setPendingEmployees, setEmpForm, setAssignForm,
            handleCreateProject: () => createProjectMutation.mutate(projectForm),
            handleDeleteProject: () => projectToDelete && deleteProjectMutation.mutate(projectToDelete.id),
            handleAssignMember: (payload: AssignMemberPayload) => assignMemberMutation.mutate(payload),
            handleRemoveMember: (id: number) => removeMemberMutation.mutate(id),
            handleImportSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'projects'] }),
            resetWizard
        }
    };
}
