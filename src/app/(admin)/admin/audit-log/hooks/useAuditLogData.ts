import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { auditService, AuditLog } from "@/lib/services/audit-service";

export function useAuditLogData() {
    // --- Filters & Pagination State ---
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState("");
    const [filterAction, setFilterAction] = useState("all");
    const [filterModule, setFilterModule] = useState("all");

    // --- Modal State ---
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    // --- Queries ---
    const { data, isLoading, error } = useQuery({
        queryKey: ['admin', 'audit-logs', page, limit, filterAction, filterModule, search],
        queryFn: async () => {
            return await auditService.getGlobalAuditLogs(page, limit, {
                action: filterAction,
                module: filterModule,
                search: search
            });
        },
        staleTime: 60 * 1000, // 1 minute cache
    });

    const logs = data?.data || [];
    const meta = data?.meta || { page: 1, limit: 10, total_data: 0, total_pages: 0 };
    const totalPages = meta.total_pages || 1;

    // --- Actions ---
    const openDetail = (log: AuditLog) => {
        setSelectedLog(log);
        setDetailOpen(true);
    };

    return {
        // State
        logs,
        isLoading,
        error,
        page,
        setPage,
        limit,
        setLimit,
        search,
        setSearch,
        filterAction,
        setFilterAction,
        filterModule,
        setFilterModule,
        pagination: { ...meta, total: meta.total_data },
        totalPages,
        detailOpen,
        setDetailOpen,
        selectedLog,

        // Actions
        openDetail
    };
}
