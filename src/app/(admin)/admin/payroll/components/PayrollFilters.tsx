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
        <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between pt-1">
            <div className="flex flex-wrap items-center gap-2 w-full">
                {/* Search Bar */}
                <div className="relative w-full sm:w-[240px] shrink-0 p-0.5">
                    <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input 
                        placeholder="Search employee..." 
                        className="pl-9 h-10 w-full bg-white border-slate-200 text-sm focus-visible:ring-2 focus-visible:ring-[#2568C1] focus-visible:border-[#2568C1]" 
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)} 
                    />
                </div>

                {/* 2-Column Grid on Mobile, Inline Flex on Tablet/Desktop */}
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
                    <Select value={schemeFilter} onValueChange={setSchemeFilter}>
                        <SelectTrigger className="h-10 w-full sm:w-[150px] bg-white text-sm border-slate-200">
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
                        <SelectTrigger className="h-10 w-full sm:w-[160px] bg-white text-sm border-slate-200">
                            <SelectValue placeholder="Project" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Projects</SelectItem>
                            {allProjects.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-10 w-full sm:w-[130px] bg-white text-sm border-slate-200">
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
                        <SelectTrigger className="h-10 w-full sm:w-[75px] bg-white text-sm border-slate-200">
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
        </div>
    );
}
