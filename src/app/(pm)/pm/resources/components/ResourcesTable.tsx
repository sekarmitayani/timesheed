import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Loader2, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ResourceRequest } from "@/lib/services/resource-service";

interface ResourcesTableProps {
    paginatedRequests: ResourceRequest[];
    isLoading: boolean;
    currentPage: number;
    setCurrentPage: (val: number | ((prev: number) => number)) => void;
    totalPages: number;
    totalFiltered: number;
    limit: number;
    openDetail: (r: ResourceRequest) => void;
}

const statusColors: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-100",
    approved: "bg-emerald-50 text-emerald-700 border-emerald-100",
    rejected: "bg-red-50 text-red-700 border-red-100",
};
const statusDotColors: Record<string, string> = {
    pending: "bg-amber-500",
    approved: "bg-emerald-500",
    rejected: "bg-red-500",
};

export function ResourcesTable({
    paginatedRequests,
    isLoading,
    currentPage,
    setCurrentPage,
    totalPages,
    totalFiltered,
    limit,
    openDetail
}: ResourcesTableProps) {
    return (
        <div className="bg-white border border-[#e2e8f0] rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent bg-slate-50/50">
                            <TableHead className="pl-6 w-12 text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">No</TableHead>
                            <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Project</TableHead>
                            <TableHead className="w-24 text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Type</TableHead>
                            <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Details</TableHead>
                            <TableHead className="w-28 text-center text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Status</TableHead>
                            <TableHead className="w-[140px] pr-6 text-right text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={6} className="h-48 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-[#2568C1]" /></TableCell></TableRow>
                        ) : paginatedRequests.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">No requests found.</TableCell></TableRow>
                        ) : (
                            paginatedRequests.map((r, idx) => (
                                <TableRow key={r.id} className="hover:bg-[#f0f4fa]/50 transition-colors border-b border-slate-100 last:border-0">
                                    <TableCell className="text-center text-sm font-medium text-slate-500">{(currentPage - 1) * limit + idx + 1}</TableCell>
                                    <TableCell>
                                        <p className="text-sm font-medium text-slate-700">{r.project?.name || `Project #${r.project_id}`}</p>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-[10px] uppercase font-bold bg-slate-50 text-slate-600 border-slate-200">{r.type}</Badge>
                                    </TableCell>
                                    <TableCell className="max-w-[300px]">
                                        <p className="text-sm text-slate-600 truncate" title={r.details}>{r.details}</p>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border", statusColors[r.status])}>
                                            <div className={cn("w-1.5 h-1.5 rounded-full", statusDotColors[r.status])} />
                                            <span className="uppercase">{r.status}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-[#2568C1] hover:bg-blue-50" onClick={() => openDetail(r)}>
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            {totalFiltered > 0 && (
                <div className="border-t border-slate-100 bg-white px-4 py-3 flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                        Showing <span className="font-medium text-slate-900">{(currentPage - 1) * limit + 1}</span> to <span className="font-medium text-slate-900">{Math.min(currentPage * limit, totalFiltered)}</span> of <span className="font-medium text-slate-900">{totalFiltered}</span> requests
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={currentPage <= 1} onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="text-xs font-medium px-2">Page {currentPage} of {totalPages || 1}</div>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
