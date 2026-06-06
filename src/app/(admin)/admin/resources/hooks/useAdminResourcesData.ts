import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { resourceService, ResourceRequest, ApprovalActionPayload, EditResourcePayload } from "@/lib/services/resource-service";
import { projectService } from "@/lib/services/project-service";
import { toast } from "sonner";

export function useAdminResourcesData() {
    const queryClient = useQueryClient();

    // --- UI State (Filters & Pagination) ---
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterProject, setFilterProject] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterType, setFilterType] = useState("all");

    // --- Modal State ---
    const [createOpen, setCreateOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [detailMode, setDetailMode] = useState<"view" | "approve" | "reject" | "edit">("view");

    // --- Active Data ---
    const [selectedRequest, setSelectedRequest] = useState<ResourceRequest | null>(null);
    const [approveAmount, setApproveAmount] = useState<number>(0);
    const [editForm, setEditForm] = useState<EditResourcePayload>({});
    const [createForm, setCreateForm] = useState<CreateResourcePayload>({ project_id: "", type: "", details: "" });

    // --- Queries ---
    const { data: resourceRes, isLoading: isLoadingRequests } = useQuery({
        queryKey: ["admin", "resources", page, limit, filterProject, filterStatus, filterType],
        queryFn: () => resourceService.getResourceRequests({
            page,
            limit,
            project_id: filterProject,
            status: filterStatus,
            type: filterType
        }),
    });
    const requests = resourceRes?.data || [];
    const pagination = resourceRes?.pagination;

    const { data: projectsData, isLoading: isLoadingProjects } = useQuery({
        queryKey: ["admin", "projects", "all"],
        queryFn: () => projectService.getProjects(1, 200),
        staleTime: 10 * 60 * 1000,
    });
    const allProjects = projectsData?.data || [];

    const isLoading = isLoadingRequests || isLoadingProjects;

    // --- Reset Page on Filter Change ---
    useEffect(() => {
        setPage(1);
    }, [filterProject, filterStatus, filterType, limit]);

    // --- Memoized Filtered & Paginated Data ---
    const filteredRequests = useMemo(() => {
        if (!searchQuery.trim()) return requests;
        const q = searchQuery.toLowerCase();
        return requests.filter(r => 
            (r.details?.toLowerCase() || "").includes(q) ||
            (r.project?.name?.toLowerCase() || "").includes(q) ||
            (r.user?.full_name?.toLowerCase() || "").includes(q)
        );
    }, [requests, searchQuery]);

    const totalPages = pagination?.total_pages || 1;
    const paginatedRequests = filteredRequests;
    const totalFiltered = pagination?.total_rows || 0;

    // --- Handlers & Helpers ---
    const openDetail = (r: ResourceRequest, mode: "view" | "approve" | "reject" | "edit" = "view") => {
        setSelectedRequest(r);
        setDetailMode(mode);
        setApproveAmount(r.amount || 0);
        setEditForm({ type: r.type, details: r.details, amount: r.amount, status: r.status });
        setDetailOpen(true);
    };

    // --- Mutations ---
    const createMutation = useMutation({
        mutationFn: (payload: { project_id: number; type: string; details: string }) => 
            resourceService.createResourceRequest(payload),
        onSuccess: () => {
            toast.success("Resource request created!");
            queryClient.invalidateQueries({ queryKey: ["admin", "resources"] });
            setCreateOpen(false);
            setCreateForm({ project_id: "", type: "", details: "" });
        },
        onError: (err: any) => toast.error(err.message || "Failed to create request"),
    });

    const approvalMutation = useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: ApprovalActionPayload }) =>
            resourceService.approvalAction(id, payload),
        onSuccess: (_, variables) => {
            const status = variables.payload.status;
            toast.success(status === "approved" ? "Request approved!" : "Request rejected");
            queryClient.invalidateQueries({ queryKey: ["admin", "resources"] });
            setDetailOpen(false);
        },
        onError: (err: any) => toast.error(err.message || "Failed to process approval"),
    });

    const editMutation = useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: EditResourcePayload }) =>
            resourceService.editResource(id, payload),
        onSuccess: () => {
            toast.success("Request updated");
            queryClient.invalidateQueries({ queryKey: ["admin", "resources"] });
            setDetailOpen(false);
        },
        onError: (err: any) => toast.error(err.message || "Failed to update"),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => resourceService.deleteResourceRequest(id),
        onSuccess: () => {
            toast.success("Request deleted successfully");
            queryClient.invalidateQueries({ queryKey: ["admin", "resources"] });
            setDeleteOpen(false);
            setDetailOpen(false);
        },
        onError: (err: any) => toast.error(err.message || "Failed to delete request"),
    });
return {
    // State
    page, setPage,
    limit, setLimit,
    searchQuery, setSearchQuery,
    filterProject, setFilterProject,
    filterStatus, setFilterStatus,
    filterType, setFilterType,
    createOpen, setCreateOpen,
    detailOpen, setDetailOpen,
    deleteOpen, setDeleteOpen,
    detailMode, setDetailMode,
    selectedRequest, setSelectedRequest,
    approveAmount, setApproveAmount,
    editForm, setEditForm,
    createForm, setCreateForm,

    // Data
    requests,
    allProjects,
    isLoading,
    paginatedRequests,
    totalPages,
    totalFiltered,


        // Handlers
        openDetail,
        
        // Actions
        createRequest: createMutation.mutate,
        processApproval: approvalMutation.mutate,
        editRequest: editMutation.mutate,
        deleteRequest: deleteMutation.mutate,
        isProcessing: createMutation.isPending || approvalMutation.isPending || editMutation.isPending || deleteMutation.isPending
    };
}
