import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { approvalService, BulkActionPayload, ReviewTimesheetPayload } from "@/lib/services/approval-service";
import { projectService } from "@/lib/services/project-service";
import { TimesheetLog } from "@/lib/services/timesheet-service";
import { ApiProject } from "@/lib/types";
import { toast } from "sonner";

export function useApprovalsData() {
    const queryClient = useQueryClient();

    // --- UI States ---
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState("");
    const [filterProject, setFilterProject] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const [selectedLog, setSelectedLog] = useState<TimesheetLog | null>(null);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectNote, setRejectNote] = useState("");
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    const [anomalyWarningOpen, setAnomalyWarningOpen] = useState(false);
    const [pendingApprovalAction, setPendingApprovalAction] = useState<(() => void) | null>(null);

    // --- Queries ---
    const { data: inboxRaw = [], isLoading: isLoadingInbox } = useQuery({
        queryKey: ['pm', 'approvals', 'inbox', filterStatus],
        queryFn: () => approvalService.getInbox(filterStatus),
    });

    const { data: projectsData } = useQuery({
        queryKey: ['pm', 'approvals', 'projects'],
        queryFn: () => projectService.getProjects(1, 100),
    });
    const projects = projectsData?.data || [];

    // --- Mutations ---
    const reviewMutation = useMutation({
        mutationFn: ({ id, payload }: { id: number, payload: ReviewTimesheetPayload }) => 
            approvalService.reviewTimesheet(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pm', 'approvals', 'inbox'] });
            toast.success("Timesheet updated successfully");
            setRejectOpen(false);
            setSelectedLog(null);
        },
        onError: (e: any) => toast.error(e.message || "Action failed")
    });

    const bulkMutation = useMutation({
        mutationFn: (payload: BulkActionPayload) => approvalService.bulkAction(payload),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['pm', 'approvals', 'inbox'] });
            toast.success(`${res.rows_affected} timesheets processed`);
            setSelectedIds(new Set());
        },
        onError: (e: any) => toast.error(e.message || "Bulk action failed")
    });

    // --- Computed ---
    const filteredInbox = useMemo(() => {
        let result = [...inboxRaw];

        if (filterProject !== "all") {
            result = result.filter(l => l.project_id === Number(filterProject));
        }

        if (filterStatus !== "all") {
            result = result.filter(l => l.status === filterStatus);
        }

        if (dateFrom) {
            const from = new Date(dateFrom);
            from.setHours(0, 0, 0, 0);
            result = result.filter(l => new Date(l.clock_in) >= from);
        }
        if (dateTo) {
            const to = new Date(dateTo);
            to.setHours(23, 59, 59, 999);
            result = result.filter(l => new Date(l.clock_in) <= to);
        }

        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(l => 
                (l.user?.full_name?.toLowerCase() || "").includes(q) ||
                (l.task_description?.toLowerCase() || "").includes(q)
            );
        }

        return result.sort((a, b) => new Date(b.clock_in).getTime() - new Date(a.clock_in).getTime());
    }, [inboxRaw, filterProject, filterStatus, dateFrom, dateTo, search]);

    const paginatedInbox = useMemo(() => {
        const start = (page - 1) * limit;
        return filteredInbox.slice(start, start + limit);
    }, [filteredInbox, page, limit]);

    const totalPages = Math.ceil(filteredInbox.length / limit);

    useEffect(() => {
        setPage(1);
    }, [filterProject, filterStatus, dateFrom, dateTo, search, limit]);

    // --- Handlers ---
    const toggleSelect = (id: number) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredInbox.length) setSelectedIds(new Set());
        else setSelectedIds(new Set(filteredInbox.map(l => l.id)));
    };

    const handleApprove = (id: number) => {
        const log = filteredInbox.find(l => l.id === id);
        if (log?.is_anomaly) {
            setPendingApprovalAction(() => () => reviewMutation.mutate({ id, payload: { status: "approved" } }));
            setAnomalyWarningOpen(true);
            return;
        }
        reviewMutation.mutate({ id, payload: { status: "approved" } });
    };
    
    const handleReject = () => {
        if (!selectedLog) return;
        if (!rejectNote.trim()) { toast.error("Rejection note is required"); return; }
        reviewMutation.mutate({ id: selectedLog.id, payload: { status: "rejected", rejection_note: rejectNote } });
    };

    const handleBulkApprove = () => {
        if (selectedIds.size === 0) return;
        const hasAnomaly = filteredInbox.some(l => selectedIds.has(l.id) && l.is_anomaly);
        
        if (hasAnomaly) {
            setPendingApprovalAction(() => () => bulkMutation.mutate({ timesheet_ids: Array.from(selectedIds), status: "approved" }));
            setAnomalyWarningOpen(true);
            return;
        }
        bulkMutation.mutate({ timesheet_ids: Array.from(selectedIds), status: "approved" });
    };

    const confirmApproval = () => {
        if (pendingApprovalAction) pendingApprovalAction();
        setAnomalyWarningOpen(false);
        setPendingApprovalAction(null);
    };

    const resetFilters = () => {
        setFilterProject("all");
        setFilterStatus("all");
        setDateFrom("");
        setDateTo("");
        setSearch("");
    };

    return {
        state: {
            inbox: paginatedInbox,
            totalCount: filteredInbox.length,
            isLoading: isLoadingInbox,
            isProcessing: reviewMutation.isPending || bulkMutation.isPending,
            page,
            limit,
            totalPages,
            projects,
            search,
            filterProject,
            filterStatus,
            dateFrom,
            dateTo,
            selectedLog,
            rejectOpen,
            rejectNote,
            selectedIds,
            anomalyWarningOpen
        },
        actions: {
            setPage,
            setLimit,
            setSearch,
            setFilterProject,
            setFilterStatus,
            setDateFrom,
            setDateTo,
            setSelectedLog,
            setRejectOpen,
            setRejectNote,
            toggleSelect,
            toggleSelectAll,
            handleApprove,
            handleReject,
            handleBulkApprove,
            confirmApproval,
            setAnomalyWarningOpen,
            resetFilters
        }
    };
}
