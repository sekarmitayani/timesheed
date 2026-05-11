"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Eye, Plus, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminResourcesTabProps {
    resources: any[];
    search: string;
    setSearch: (v: string) => void;
    filterStatus: string;
    setFilterStatus: (v: string) => void;
    filterType: string;
    setFilterType: (v: string) => void;
    onCreate: () => void;
    onViewDetail: (r: any) => void;
}

const resStatusColors: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700",
    approved: "bg-emerald-50 text-emerald-700",
    rejected: "bg-red-50 text-red-700",
};
const resStatusDotColors: Record<string, string> = {
    pending: "bg-amber-500",
    approved: "bg-emerald-500",
    rejected: "bg-red-500",
};

export function AdminResourcesTab({
    resources, search, setSearch, filterStatus, setFilterStatus, filterType, setFilterType, onCreate, onViewDetail
}: AdminResourcesTabProps) {
    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h2 className="text-[15px] font-bold text-slate-800">Project Resources</h2>
                    <p className="text-xs text-slate-500">Track and manage resource requests for this project.</p>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                    <div className="relative w-full md:w-[220px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search requests..."
                            className="pl-9 h-9 text-xs border-[#E2E8F0] rounded-[6px] bg-white shadow-none focus-visible:ring-[#2568C1]"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="h-9 w-[130px] text-xs bg-white border-slate-200 rounded-[6px] shadow-none"><SelectValue placeholder="Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="h-9 w-[150px] text-xs bg-white border-slate-200 rounded-[6px] shadow-none"><SelectValue placeholder="All Types" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="manpower">Manpower</SelectItem>
                            <SelectItem value="tools">Tools</SelectItem>
                            <SelectItem value="infrastructure">Infrastructure</SelectItem>
                            <SelectItem value="accommodation">Accommodation</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button size="sm" className="h-9 gap-2 bg-[#2568C1] hover:bg-[#1a4f99] font-bold px-4 rounded-[6px]" onClick={onCreate}>
                        <Plus className="h-4 w-4" /> New Request
                    </Button>
                </div>
            </div>

            <div className="bg-white border border-[#e2e8f0] rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent bg-slate-50/50">
                                <TableHead className="pl-6 w-[60px] text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">No</TableHead>
                                <TableHead className="w-[120px] text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Type</TableHead>
                                <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Details</TableHead>
                                <TableHead className="w-[200px] text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Requester</TableHead>
                                <TableHead className="w-[150px] text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Amount</TableHead>
                                <TableHead className="w-[120px] text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Status</TableHead>
                                <TableHead className="w-24 pr-6 text-right text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {resources.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-slate-400 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2 opacity-40">
                                            <Package className="h-8 w-8 text-slate-400" />
                                            <p className="text-sm font-medium text-slate-500">No resource requests found.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                resources.map((r, index) => (
                                    <TableRow key={r.id} className="hover:bg-[#f0f4fa]/50 transition-colors border-b border-slate-100 last:border-0">
                                        <TableCell className="pl-6 text-sm text-muted-foreground font-medium">{index + 1}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-[10px] font-bold uppercase bg-slate-50 text-slate-500 border-none shadow-none px-2.5 py-0.5 rounded-full">{r.type}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm font-semibold text-slate-700 truncate block max-w-[250px]" title={r.details}>{r.details}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-[11px] text-slate-500 font-medium">{r.user?.full_name || `User #${r.user_id}`}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm font-bold text-slate-800 tracking-tight">{r.amount > 0 ? `Rp ${r.amount.toLocaleString("id-ID")}` : "—"}</span>
                                        </TableCell>
                                        <TableCell>
                                            <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter", resStatusColors[r.status])}>
                                                <div className={cn("w-1 h-1 rounded-full", resStatusDotColors[r.status])} />
                                                {r.status}
                                            </div>
                                        </TableCell>
                                        <TableCell className="pr-6 text-right">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[#2568C1] hover:bg-blue-50 rounded-full" onClick={() => onViewDetail(r)}>
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
