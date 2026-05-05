"use client";

import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ai/ai-components";
import { useProxyLoginData } from "./hooks/useProxyLoginData";
import { ProxyFilters } from "./components/ProxyFilters";
import { ProxyTable } from "./components/ProxyTable";
import { ConfirmProxyDialog } from "./components/ConfirmProxyDialog";

export default function ProxyLoginPage() {
    const { state, actions } = useProxyLoginData();

    return (
        <div className="space-y-6">
            <PageHeader title="Proxy Login" description="Log in as another user for support and debugging" />

            <Card className="border-amber-200 bg-amber-50/50 shadow-none">
                <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-amber-700">Audit Compliance Notice</p>
                        <p className="text-xs text-amber-600/80 font-medium">
                            All proxy login sessions are rigorously tracked. Your impersonation actions will be securely bound to your admin credentials.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Filter Bar */}
            <ProxyFilters 
                search={state.search}
                setSearch={actions.setSearch}
                roleFilter={state.roleFilter}
                setRoleFilter={actions.setRoleFilter}
                limit={state.pagination.limit}
                setLimit={actions.setLimit}
                setPage={actions.setPage}
                isLoading={state.isLoading}
            />

            {/* Table */}
            <ProxyTable 
                users={state.users}
                isLoading={state.isLoading}
                isProxying={state.isProxying}
                pagination={state.pagination}
                totalCount={state.totalCount}
                setPage={actions.setPage}
                onProxy={actions.openConfirm}
            />

            {/* Confirmation Dialog */}
            <ConfirmProxyDialog 
                open={state.confirmOpen}
                onOpenChange={actions.setConfirmOpen}
                targetUser={state.targetUser}
                onConfirm={actions.handleProxy}
            />
        </div>
    );
}
