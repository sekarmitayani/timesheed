"use client";

import { ResourceRequest } from "@/lib/services/resource-service";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Search, Plus, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface PMResourcesTabProps {
    resources: ResourceRequest[];
    search: string;
    setSearch: (v: string) => void;
    filterStatus: string;
    setFilterStatus: (v: string) => void;
    filterType: string;
    setFilterType: (v: string) => void;
    onCreate: () => void;
    onViewDetail: (r: ResourceRequest) => void;
}

const resStatusColors: Record<string, string> = {
    pending: "bg-amber-50 text-amber-600",
    approved: "bg-emerald-50 text-emerald-600",
    rejected: "bg-rose-50 text-rose-600",
};

export function PMResourcesTab({
    resources, search, setSearch, filterStatus, setFilterStatus, filterType, setFilterType, onCreate, onViewDetail
}: PMResourcesTabProps) {
    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 mb-2">
                <div className="flex flex-col gap-1">
                    <h2 className="text-[15px] font-bold text-slate-800">Project Resources</h2>
                    <p className="text-xs text-slate-500">Track and manage resource requests for this project.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
                    <div className="relative w-full sm:w-[220px] md:w-[250px] shrink-0 p-0.5">
                        <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                            placeholder="Search requests..."
                            className="pl-9 h-10 w-full bg-white border-slate-200 focus-visible:ring-2 focus-visible:ring-[#2568C1] focus-visible:border-[#2568C1]"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-[130px] sm:w-[140px] h-10 bg-white border-slate-200">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-[140px] sm:w-[150px] h-10 bg-white border-slate-200">
                            <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="manpower">Manpower</SelectItem>
                            <SelectItem value="tools">Tools</SelectItem>
                            <SelectItem value="infrastructure">Infrastructure</SelectItem>
                            <SelectItem value="accommodation">Accommodation</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button size="sm" className="h-10 gap-2 bg-[#2568C1] hover:bg-[#1a4f99] font-bold px-4 shrink-0 w-full sm:w-auto" onClick={onCreate}>
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
                                <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Requester</TableHead>
                                <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Amount</TableHead>
                                <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10 text-center">Status</TableHead>
                                <TableHead className="w-20 pr-6 text-right text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {resources.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center gap-2 opacity-40">
                                            <Package className="h-8 w-8" />
                                            <p className="text-sm font-medium">No resource requests found.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                resources.map((r, index) => (
                                    <TableRow key={r.id} className="hover:bg-[#f0f4fa]/50 transition-colors border-b border-slate-100 last:border-0">
                                        <TableCell className="pl-6 text-sm text-muted-foreground font-medium">
                                            {index + 1}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize text-[10px] font-bold px-2.5 py-0.5 tracking-wider w-fit rounded-full border-none bg-slate-100 text-slate-600">
                                                {r.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="max-w-[250px]">
                                            <p className="text-sm font-semibold text-slate-700 truncate" title={r.details}>
                                                {r.details}
                                            </p>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm font-semibold text-slate-700">
                                                {r.user?.full_name || `User #${r.user_id}`}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm font-bold text-slate-800 tracking-tight">
                                                {r.amount > 0 ? `Rp ${r.amount.toLocaleString("id-ID")}` : "—"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className={cn("uppercase text-[10px] font-bold px-2.5 py-0.5 tracking-wider rounded-full border-none", resStatusColors[r.status])}>
                                                {r.status}
                                            </Badge>
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
