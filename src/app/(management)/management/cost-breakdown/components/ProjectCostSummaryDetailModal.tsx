import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Calendar, User, Loader2, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { ProjectCostItem } from "@/lib/services/management-service";
import { useQuery } from "@tanstack/react-query";
import { projectService } from "@/lib/services/project-service";
import { useCostBreakdownLogs } from "../hooks/useCostBreakdown";
import { AdminAIForecastSection } from "@/app/(admin)/admin/projects/[id]/components/AdminAIForecastSection";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CustomDateRangePicker } from "@/components/shared/CustomDateRangePicker";
import { Badge } from "@/components/ui/badge";

interface ProjectCostSummaryDetailModalProps {
    project: ProjectCostItem | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ProjectCostSummaryDetailModal({ project, open, onOpenChange }: ProjectCostSummaryDetailModalProps) {
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    // Fetch full project details (to get created_at, members, etc.)
    const { data: projectDetails, isLoading: isLoadingDetails } = useQuery({
        queryKey: ['project', project?.project_id],
        queryFn: () => projectService.getProjectById(project!.project_id),
        enabled: !!project?.project_id,
    });

    // Fetch cost logs for this project
    const { data: logsData, isLoading: isLoadingLogs } = useCostBreakdownLogs(
        page, 
        limit, 
        search, 
        categoryFilter, 
        project?.project_id,
        startDate || undefined,
        endDate || undefined
    );

    const fmtCurrency = (v: number) => `Rp ${v.toLocaleString("id-ID")}`;
    const fmtCurrencyShort = (v: number) => {
        if (v >= 1000000000) return `Rp ${(v / 1000000000).toFixed(1)}B`;
        if (v >= 1000000) return `Rp ${(v / 1000000).toFixed(1)}M`;
        if (v >= 1000) return `Rp ${(v / 1000).toFixed(1)}K`;
        return `Rp ${v.toLocaleString("id-ID")}`;
    };

    const getStatusBadge = (status: string) => {
        const s = status.toLowerCase();
        if (s === 'active') return 'bg-emerald-50 text-emerald-600';
        if (s === 'completed') return 'bg-blue-50 text-[#2568C1]';
        if (s === 'on-hold' || s === 'on hold' || s === 'on_hold') return 'bg-amber-50 text-amber-600';
        if (s === 'cancelled') return 'bg-rose-50 text-rose-600';
        return 'bg-slate-100 text-slate-500';
    };

    const pmMember = projectDetails?.members?.find((m: any) => 
        m.role_in_project?.trim().toLowerCase() === "project manager"
    );
    const pmName = pmMember?.user?.full_name || "No PM Assigned";

    const salaryCost = project ? project.salary_cost : 0;
    const resourceCost = project ? project.resource_cost : 0;

    const totalPages = logsData?.pagination?.total ? Math.ceil(logsData.pagination.total / limit) : 1;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl md:max-w-5xl lg:max-w-6xl max-h-[90vh] overflow-hidden bg-white p-0 gap-0 border-[#e2e8f0] shadow-xl rounded-md flex flex-col">
                <div className="px-6 pr-12 py-4 bg-[#f8fafc] border-b border-[#e2e8f0] flex flex-row items-center justify-between shrink-0">
                    <div className="flex flex-col gap-0.5 min-w-0">
                        <DialogTitle className="text-base font-bold text-slate-800">
                            Project Cost Summary Detail
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 font-medium">
                            Comprehensive financial breakdown, revenue, and itemized cost logs
                        </DialogDescription>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">

                {!project ? (
                    <div className="p-12 flex items-center justify-center text-slate-500">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                ) : (
                    <div className="px-6 pt-3.5 pb-6 space-y-5 bg-[#F8FAFC]">
                        {/* 1. Project Info */}
                        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 mb-1">{project.project_name}</h2>
                                <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                                    <Badge variant="outline" className={`uppercase tracking-wider text-[10px] font-bold px-2 py-0.5 rounded-sm border-none ${getStatusBadge(project.status)}`}>
                                        {project.status.replace(/[_-]/g, ' ')}
                                    </Badge>
                                    {isLoadingDetails ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                        <>
                                            <span className="flex items-center gap-1"><User className="w-3 h-3" /> {pmName}</span>
                                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Created At: {projectDetails?.created_at ? new Date(projectDetails.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 2. KPI Cards */}
                        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                            <div className="bg-white p-3.5 rounded-md border border-slate-200 shadow-sm flex flex-col justify-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Contract / Revenue</span>
                                <span className="text-lg font-black text-slate-800">{projectDetails?.budget_revenue ? fmtCurrencyShort(projectDetails.budget_revenue) : '-'}</span>
                            </div>
                            <div className="bg-white p-3.5 rounded-md border border-slate-200 shadow-sm flex flex-col justify-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Cost</span>
                                <span className="text-lg font-black text-[#4B7BEC]">{fmtCurrencyShort(project.total_cost)}</span>
                            </div>
                            <div className="bg-white p-3.5 rounded-md border border-slate-200 shadow-sm flex flex-col justify-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cost: Salary</span>
                                <span className="text-lg font-black text-slate-800">{fmtCurrencyShort(salaryCost)}</span>
                                <span className="text-xs font-bold text-slate-400 mt-0.5">({project.salary_percent}%)</span>
                            </div>
                            <div className="bg-white p-3.5 rounded-md border border-slate-200 shadow-sm flex flex-col justify-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cost: Resources</span>
                                <span className="text-lg font-black text-amber-600">{fmtCurrencyShort(resourceCost)}</span>
                                <span className="text-xs font-bold text-amber-700/60 mt-0.5">({project.resource_percent}%)</span>
                            </div>
                        </div>

                        {/* 3. AI Forecast */}
                        <AdminAIForecastSection projectId={project.project_id.toString()} className="mt-0" compact={true} />

                        {/* 4. Cost Logs Table */}
                        <div className="bg-white rounded-md border border-slate-200 shadow-sm flex flex-col">
                            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Cost Details</h3>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <div className="relative w-full sm:w-[250px] p-0.5">
                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                        <Input 
                                            placeholder="Search details or user..." 
                                            className="pl-9 bg-slate-50 border-slate-200 h-9 text-sm focus-visible:ring-2 focus-visible:ring-[#2568C1] focus-visible:border-[#2568C1]"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                        />
                                    </div>
                                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                        <SelectTrigger className="w-[150px] bg-slate-50 border-slate-200 h-9 font-normal text-sm">
                                            <SelectValue placeholder="All Categories" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Costs</SelectItem>
                                            <SelectItem value="salary">Salary (Contract)</SelectItem>
                                            <SelectItem value="infrastructure">Infrastructure</SelectItem>
                                            <SelectItem value="tools">Tools & Licenses</SelectItem>
                                            <SelectItem value="accommodation">Accommodation</SelectItem>
                                            <SelectItem value="manpower">Manpower (Outsource)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <CustomDateRangePicker
                                        dateFrom={startDate}
                                        dateTo={endDate}
                                        onDateChange={(from, to) => { setStartDate(from); setEndDate(to); }}
                                        align="end"
                                    />
                                    <Select value={String(limit)} onValueChange={(val) => { setLimit(Number(val)); setPage(1); }}>
                                        <SelectTrigger className="w-[80px] bg-slate-50 border-slate-200 h-9 font-normal text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="10">10</SelectItem>
                                            <SelectItem value="20">20</SelectItem>
                                            <SelectItem value="50">50</SelectItem>
                                            <SelectItem value="100">100</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50/50">
                                        <TableRow className="hover:bg-transparent border-slate-100">
                                            <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10 w-12 text-center">No.</TableHead>
                                            <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Date</TableHead>
                                            <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Detail</TableHead>
                                            <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Category</TableHead>
                                            <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10 text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoadingLogs ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="h-24 text-center">
                                                    <Loader2 className="w-6 h-6 animate-spin text-[#4B7BEC] mx-auto" />
                                                </TableCell>
                                            </TableRow>
                                        ) : !logsData || !logsData.data || logsData.data.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="h-24 text-center text-sm font-medium text-slate-500">
                                                    No cost logs found matching your filters.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            logsData.data.map((log, index) => (
                                                <TableRow key={log.id} className="hover:bg-slate-50/50 transition-colors border-slate-100">
                                                    <TableCell className="text-sm font-medium text-slate-500 text-center">
                                                        {(page - 1) * limit + index + 1}
                                                    </TableCell>
                                                    <TableCell className="text-sm font-medium text-slate-600 whitespace-nowrap">
                                                        {new Date(log.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </TableCell>
                                                    <TableCell className="text-sm font-bold text-slate-900">
                                                        {log.expense_name}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-sm text-[10px] font-bold uppercase tracking-wider">
                                                            {log.category}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-sm font-bold text-slate-900 text-right">
                                                        {fmtCurrency(log.amount)}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 0 && (
                                <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
                                    <span className="text-xs font-normal text-slate-500">
                                        Showing <span className="font-bold text-slate-700">{Math.min((page - 1) * limit + 1, logsData?.pagination?.total || 0)}</span> to <span className="font-bold text-slate-700">{Math.min(page * limit, logsData?.pagination?.total || 0)}</span> of <span className="font-bold text-slate-700">{logsData?.pagination?.total || 0}</span> entries
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={page === 1 || isLoadingLogs}
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            className="h-8 w-8 p-0 border-slate-200 text-slate-600 rounded-md bg-white hover:bg-slate-50"
                                        >
                                            <span className="sr-only">Previous</span>
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        
                                        <span className="text-xs font-medium text-slate-700">
                                            Page {page} of {totalPages || 1}
                                        </span>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={page >= totalPages || isLoadingLogs}
                                            onClick={() => setPage(p => p + 1)}
                                            className="h-8 w-8 p-0 border-slate-200 text-slate-600 rounded-md bg-white hover:bg-slate-50"
                                        >
                                            <span className="sr-only">Next</span>
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                </div>

                <div className="px-6 py-3.5 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end shrink-0">
                    <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="rounded-md">Close</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
