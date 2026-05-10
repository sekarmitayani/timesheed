import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { AuditLog } from "@/lib/services/audit-service";
import { format } from "date-fns";

interface AuditTableProps {
    logs: AuditLog[];
    isLoading: boolean;
    currentPage: number;
    setCurrentPage: (v: number) => void;
    totalPages: number;
    totalFiltered: number;
    limit: number;
    openDetail: (log: AuditLog) => void;
}

const actionColors: Record<string, string> = {
    CREATE: "bg-emerald-50 text-emerald-700 border-emerald-100",
    UPDATE: "bg-blue-50 text-blue-700 border-blue-100",
    DELETE: "bg-red-50 text-red-700 border-red-100",
    LOGIN: "bg-slate-100 text-slate-700 border-slate-200",
    LOGOUT: "bg-orange-50 text-orange-700 border-orange-100",
    LOGIN_AS_PROXY: "bg-indigo-50 text-indigo-700 border-indigo-100",
    PROXY_LOGOUT: "bg-purple-50 text-purple-700 border-purple-100",
};

const actionDotColors: Record<string, string> = {
    CREATE: "bg-emerald-500",
    UPDATE: "bg-blue-500",
    DELETE: "bg-red-500",
    LOGIN: "bg-slate-500",
    LOGOUT: "bg-orange-500",
    LOGIN_AS_PROXY: "bg-indigo-500",
    PROXY_LOGOUT: "bg-purple-500",
};

export function AuditTable({
    logs, isLoading,
    currentPage, setCurrentPage,
    totalPages, totalFiltered, limit,
    openDetail
}: AuditTableProps) {
    return (
        <div className="bg-white border border-[#e2e8f0] rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent bg-slate-50/50">
                            <TableHead className="pl-6 w-12 text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">No</TableHead>
                            <TableHead className="w-[180px] text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Timestamp</TableHead>
                            <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Actor</TableHead>
                            <TableHead className="w-[140px] text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Action</TableHead>
                            <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Module & Record ID</TableHead>
                            <TableHead className="w-[100px] pr-6 text-right text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">View</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-48 text-center">
                                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#2568C1]" />
                                </TableCell>
                            </TableRow>
                        ) : logs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                    No logs found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            logs.map((log, idx) => (
                                <TableRow key={log.id} className="hover:bg-slate-50/30 transition-colors">
                                    <TableCell className="pl-6 text-xs font-medium text-slate-400">
                                        {(currentPage - 1) * limit + idx + 1}
                                    </TableCell>
                                    <TableCell>
                                        <p className="text-xs font-semibold text-slate-900">
                                            {format(new Date(log.created_at), "dd/MM/yyyy")}
                                        </p>
                                        <p className="text-[10px] text-slate-400">
                                            {format(new Date(log.created_at), "HH:mm")}
                                        </p>
                                    </TableCell>
                                    <TableCell>
                                        <p className="text-xs font-bold text-slate-700">{log.performer?.full_name || `User #${log.user_id}`}</p>
                                        <p className="text-[10px] text-slate-500">{log.performer?.email || "Email not provided"}</p>
                                    </TableCell>
                                    <TableCell>
                                        <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap", actionColors[log.action])}>
                                            <div className={cn("w-1.5 h-1.5 rounded-full", actionDotColors[log.action])} />
                                            <span className="uppercase">{log.action.replace(/_/g, " ")}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1 max-w-[350px]">
                                            {log.entity_context ? (
                                                <p className="text-xs font-medium text-slate-700 leading-tight">
                                                    {log.entity_context}
                                                </p>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-[9px] uppercase font-bold tracking-tighter bg-slate-50 text-slate-500 border-slate-200 px-1.5 py-0">
                                                        {log.target_table}
                                                    </Badge>
                                                    <span className="text-xs font-mono text-slate-400">#{log.record_id}</span>
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 rounded-full text-[#2568C1] hover:bg-blue-50"
                                            onClick={() => openDetail(log)}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {!isLoading && totalPages > 0 && (
                <div className="border-t border-[#e2e8f0] bg-white px-4 py-3 flex items-center justify-between">
                    <div className="text-xs text-muted-foreground font-medium">
                        Showing <span className="text-slate-900">{(currentPage - 1) * limit + 1}</span> to <span className="text-slate-900">{Math.min(currentPage * limit, totalFiltered)}</span> of <span className="text-slate-900">{totalFiltered}</span> logs
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            disabled={currentPage <= 1}
                            onClick={() => setCurrentPage(currentPage - 1)}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="text-xs font-bold px-2 text-slate-700">
                            Page {currentPage} of {totalPages}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            disabled={currentPage >= totalPages}
                            onClick={() => setCurrentPage(currentPage + 1)}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
