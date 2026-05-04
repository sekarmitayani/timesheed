import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Briefcase, ChevronLeft, ChevronRight, Filter, LayoutList, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { TimesheetLog } from "@/lib/services/timesheet-service";
import { ApiProject } from "@/lib/types";

interface TimesheetTableProps {
    logs: TimesheetLog[];
    paginatedLogs: TimesheetLog[];
    isLoading: boolean;
    currentPage: number;
    totalPages: number;
    limit: number;
    projects: ApiProject[];
    filterProject: string;
    filterStatus: string;
    statusConfig: Record<string, { bg: string; text: string; icon: any; label: string }>;
    
    setFilterProject: (val: string) => void;
    setFilterStatus: (val: string) => void;
    setLimit: (val: number) => void;
    setCurrentPage: (val: number) => void;
    setSelectedLog: (log: TimesheetLog) => void;
    resetFilters: () => void;
    
    getTaskTitle: (taskId: number | null) => string;
    formatTime24: (dateStr: string | null) => string;
    formatDuration: (mins: number) => string;
}

export function TimesheetTable({
    logs,
    paginatedLogs,
    isLoading,
    currentPage,
    totalPages,
    limit,
    projects,
    filterProject,
    filterStatus,
    statusConfig,
    setFilterProject,
    setFilterStatus,
    setLimit,
    setCurrentPage,
    setSelectedLog,
    resetFilters,
    getTaskTitle,
    formatTime24,
    formatDuration
}: TimesheetTableProps) {
    return (
        <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
            <div className="flex flex-wrap items-center gap-3 px-1">
                <div className="flex items-center gap-2">
                    <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                    <Select value={filterProject} onValueChange={setFilterProject}>
                        <SelectTrigger className="w-[180px] h-8 text-[11px] bg-white border-[#E2E8F0] rounded-[4px]">
                            <SelectValue placeholder="All Projects" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Projects</SelectItem>
                            {projects.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2">
                    <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-[140px] h-8 text-[11px] bg-white border-[#E2E8F0] rounded-[4px]">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2">
                    <LayoutList className="h-3.5 w-3.5 text-muted-foreground" />
                    <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
                        <SelectTrigger className="w-[70px] h-8 text-[11px] bg-white border-[#E2E8F0] rounded-[4px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {[10, 20, 50, 100].map(v => (
                                <SelectItem key={v} value={String(v)} className="text-[11px]">{v}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="ml-auto flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
                    <Search className="h-3.5 w-3.5" />
                    Showing {logs.length} records
                </div>
            </div>

            <Card className="border-[#E2E8F0] shadow-sm rounded-[6px] overflow-hidden bg-white text-[#0f172a] h-full flex flex-col">
                <CardContent className="p-0 flex flex-col h-full overflow-x-auto custom-scrollbar">
                    <div className="flex-1 relative min-w-[900px]">
                        <Table>
                            <TableHeader className="bg-[#F8FAFC] sticky top-0 z-10 shadow-[0_1px_0_0_rgba(226,232,240,1)]">
                                <TableRow className="hover:bg-transparent border-[#E2E8F0] bg-[#F8FAFC]">
                                    <TableHead className="bg-[#F8FAFC] w-[140px] text-[10px] font-bold text-muted-foreground uppercase py-3 pl-6 tracking-wider">Date</TableHead>
                                    <TableHead className="bg-[#F8FAFC] text-[10px] font-bold text-muted-foreground uppercase py-3 tracking-wider">Task & Project</TableHead>
                                    <TableHead className="bg-[#F8FAFC] text-[10px] font-bold text-muted-foreground uppercase py-3 tracking-wider">Session Time</TableHead>
                                    <TableHead className="bg-[#F8FAFC] text-[10px] font-bold text-muted-foreground uppercase py-3 tracking-wider">Duration</TableHead>
                                    <TableHead className="bg-[#F8FAFC] text-[10px] font-bold text-muted-foreground uppercase py-3 tracking-wider">Status</TableHead>
                                    <TableHead className="bg-[#F8FAFC] w-[60px] pr-6"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={6} className="h-64 text-center"><Loader2 className="h-8 w-8 animate-spin text-[#4B7BEC] mx-auto opacity-50" /></TableCell></TableRow>
                                ) : paginatedLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-64 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                <div className="bg-slate-100 p-4 rounded-full">
                                                    <Search className="h-8 w-8 text-slate-400" />
                                                </div>
                                                <p className="text-sm font-medium text-slate-500">No sessions match your filters.</p>
                                                <Button variant="outline" size="sm" onClick={resetFilters} className="text-xs h-8">Clear All Filters</Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedLogs.map(l => (
                                        <TableRow 
                                            key={l.id} 
                                            className="hover:bg-[#F8FAFC] cursor-pointer group border-[#E2E8F0]"
                                            onClick={() => setSelectedLog(l)}
                                        >
                                            <TableCell className="py-3 pl-6">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-[#0f172a]">{new Date(l.clock_in).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</span>
                                                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tight">{new Date(l.clock_in).toLocaleDateString("en-US", { weekday: "long" })}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold truncate max-w-[250px] group-hover:text-[#4B7BEC] transition-colors">
                                                        {getTaskTitle(l.task_id)}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground font-medium">
                                                        {l.project?.name || `#${l.project_id}`}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                                                    <span>{formatTime24(l.clock_in)}</span>
                                                    <span className="text-slate-300 font-normal">→</span>
                                                    <span>{formatTime24(l.clock_out)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3 font-bold text-xs">
                                                {l.clock_out ? (
                                                    <span className="text-slate-900">{formatDuration(l.duration_minutes)}</span>
                                                ) : (
                                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[9px] font-bold animate-pulse">LIVE SESSION</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="py-3">
                                                {l.status && statusConfig[l.status] && (
                                                    <Badge className={cn(
                                                        "px-2 py-0.5 rounded-[4px] border-none text-[9px] font-bold uppercase tracking-tight",
                                                        statusConfig[l.status].bg,
                                                        statusConfig[l.status].text
                                                    )}>
                                                        {statusConfig[l.status].label}
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="py-3 text-right pr-6">
                                                <div className="flex justify-end">
                                                    <div className="h-7 w-7 rounded-full flex items-center justify-center bg-white opacity-0 group-hover:opacity-100 transition-all border border-[#E2E8F0] shadow-sm">
                                                        <ChevronRight className="h-3.5 w-3.5 text-[#4B7BEC]" />
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                {!isLoading && totalPages > 0 && (
                    <div className="border-t border-[#e2e8f0] bg-white px-4 py-3 flex items-center justify-between shrink-0">
                        <div className="text-xs text-muted-foreground">
                            Showing <span className="font-medium text-[#0f172a]">{(currentPage - 1) * limit + 1}</span> to <span className="font-medium text-[#0f172a]">{Math.min(currentPage * limit, logs.length)}</span> of <span className="font-medium text-[#0f172a]">{logs.length}</span> records
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={currentPage <= 1} onClick={() => setCurrentPage(currentPage - 1)}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="text-xs font-medium px-2">Page {currentPage} of {totalPages}</div>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(currentPage + 1)}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
