"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

            <Card className="border-[#E2E8F0] shadow-sm rounded-xl overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="border-b border-slate-100 h-11">
                                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-500 w-12 text-center">No</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-500 w-28 text-center">Type</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-500">Details</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-500">Requester</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-500">Amount</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-500 text-center">Status</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-500 text-center w-20">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {resources.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-32 text-center">
                                            <div className="flex flex-col items-center justify-center gap-2 opacity-40">
                                                <Package className="h-8 w-8 text-slate-400" />
                                                <p className="text-sm font-medium text-slate-500">No resource requests found.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    resources.map((r, index) => (
                                        <TableRow key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                            <TableCell className="py-4 text-xs text-slate-500 font-bold text-center">{index + 1}</TableCell>
                                            <TableCell className="py-4 text-center">
                                                <Badge variant="outline" className="text-[10px] font-bold uppercase bg-slate-50 text-slate-500 border-slate-200 shadow-none px-2.5 py-0.5 rounded-full">{r.type}</Badge>
                                            </TableCell>
                                            <TableCell className="py-4 font-bold text-sm text-slate-800 max-w-[200px]">
                                                <p className="truncate" title={r.details}>{r.details}</p>
                                            </TableCell>
                                            <TableCell className="py-4 text-xs text-slate-600 font-bold">
                                                {r.user?.full_name || `User #${r.user_id}`}
                                            </TableCell>
                                            <TableCell className="py-4 text-xs font-black text-slate-900">
                                                {r.amount > 0 ? `Rp ${r.amount.toLocaleString("id-ID")}` : "—"}
                                            </TableCell>
                                            <TableCell className="py-4 text-center">
                                                <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter", resStatusColors[r.status])}>
                                                    <div className={cn("w-1 h-1 rounded-full", resStatusDotColors[r.status])} />
                                                    {r.status}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 text-center">
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
                </CardContent>
            </Card>
        </div>
    );
}
