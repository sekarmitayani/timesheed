"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { ApiProject } from "@/lib/types";

interface PayrollFiltersProps {
    search: string;
    setSearch: (v: string) => void;
    schemeFilter: string;
    setSchemeFilter: (v: string) => void;
    projectFilter: string;
    setProjectFilter: (v: string) => void;
    statusFilter: string;
    setStatusFilter: (v: string) => void;
    limit: number;
    setLimit: (v: number) => void;
    allProjects: ApiProject[];
}

export function PayrollFilters({
    search, setSearch,
    schemeFilter, setSchemeFilter,
    projectFilter, setProjectFilter,
    statusFilter, setStatusFilter,
    limit, setLimit,
    allProjects
}: PayrollFiltersProps) {
    return (
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap items-center gap-3 w-full">
                <div className="relative w-full sm:w-[250px] shrink-0">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search employee..." 
                        className="pl-9 h-10 w-full bg-white border-slate-200 focus-visible:ring-[#2568C1]" 
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)} 
                    />
                </div>
                <Select value={schemeFilter} onValueChange={setSchemeFilter}>
                    <SelectTrigger className="w-[160px] h-10 bg-white border-slate-200">
                        <SelectValue placeholder="Scheme" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Schemes</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="termin">Termin</SelectItem>
                        <SelectItem value="back_to_back">Back-to-back</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={projectFilter} onValueChange={setProjectFilter}>
                    <SelectTrigger className="w-[180px] h-10 bg-white border-slate-200">
                        <SelectValue placeholder="Project" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Projects</SelectItem>
                        {allProjects.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px] h-10 bg-white border-slate-200">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="partially_paid">Partially Paid</SelectItem>
                        <SelectItem value="paid">Done</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
                    <SelectTrigger className="h-10 w-[80px] bg-white border-slate-200 shrink-0 text-xs">
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
    );
}
