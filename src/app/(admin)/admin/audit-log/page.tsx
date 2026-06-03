"use client";

import { PageHeader } from "@/components/ai/ai-components";
import { useAuditLogData } from "./hooks/useAuditLogData";
import { AuditFilters } from "./components/AuditFilters";
import { AuditTable } from "./components/AuditTable";
import { AuditDetailDialog } from "./components/AuditDetailDialog";

export default function AdminAuditLogPage() {
    const {
        // State
        logs,
        isLoading,
        page, setPage,
        limit, setLimit,
        search, setSearch,
        filterAction, setFilterAction,
        filterModule, setFilterModule,
        dateFrom, setDateFrom,
        dateTo, setDateTo,
        totalPages,
        pagination,
        detailOpen, setDetailOpen,
        selectedLog,

        // Actions
        openDetail
    } = useAuditLogData();

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <PageHeader 
                title="Global Audit Log" 
                description="Monitor system activities, data changes, and security events across the platform."
            />

            <AuditFilters 
                search={search}
                setSearch={setSearch}
                filterAction={filterAction}
                setFilterAction={setFilterAction}
                filterModule={filterModule}
                setFilterModule={setFilterModule}
                dateFrom={dateFrom}
                setDateFrom={setDateFrom}
                dateTo={dateTo}
                setDateTo={setDateTo}
                limit={limit}
                setLimit={setLimit}
                setPage={setPage}
            />

            <AuditTable 
                logs={logs}
                isLoading={isLoading}
                currentPage={page}
                setCurrentPage={setPage}
                totalPages={totalPages}
                totalFiltered={pagination.total}
                limit={limit}
                openDetail={openDetail}
            />

            <AuditDetailDialog 
                open={detailOpen}
                onOpenChange={setDetailOpen}
                log={selectedLog}
            />
        </div>
    );
}
