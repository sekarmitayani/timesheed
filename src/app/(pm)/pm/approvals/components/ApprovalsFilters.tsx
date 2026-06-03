"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { ApiProject } from "@/lib/types";
import { CustomDateRangePicker } from "./CustomDateRangePicker";

interface ApprovalsFiltersProps {
    search: string;
    setSearch: (v: string) => void;
    filterProject: string;
    setFilterProject: (v: string) => void;
    filterStatus: string;
    setFilterStatus: (v: string) => void;
    dateFrom: string;
    setDateFrom: (v: string) => void;
    dateTo: string;
    setDateTo: (v: string) => void;
    projects: ApiProject[];
    resetFilters: () => void;
    limit: number;
    setLimit: (v: number) => void;
    setPage: (v: number) => void;
}

export function ApprovalsFilters({
    search, setSearch,
    filterProject, setFilterProject,
    filterStatus, setFilterStatus,
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    projects,
    resetFilters,
    limit, setLimit, setPage
}: ApprovalsFiltersProps) {
    
    const handleProjectChange = (v: string) => {
        setFilterProject(v);
        setPage(1);
    };

    const handleStatusChange = (v: string) => {
        setFilterStatus(v);
        setPage(1);
    };

    const handleLimitChange = (v: string) => {
        setLimit(Number(v));
        setPage(1);
    };

    return (
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-1">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto pl-1">
                {/* Search */}
                <div className="relative w-full sm:w-[250px] shrink-0">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search employee..."
                        className="pl-9 h-10 w-full bg-white border-slate-200 focus-visible:ring-[#2568C1] focus-visible:border-[#2568C1]"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>

                {/* Project Filter */}
                <Select value={filterProject} onValueChange={handleProjectChange}>
                    <SelectTrigger className="h-10 w-full sm:w-[160px] bg-white border-slate-200">
                        <SelectValue placeholder="Project" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Projects</SelectItem>
                        {projects.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                    </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select value={filterStatus} onValueChange={handleStatusChange}>
                    <SelectTrigger className="h-10 w-full sm:w-[130px] bg-white border-slate-200">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                </Select>

                {/* Date Range */}
                <CustomDateRangePicker 
                    dateFrom={dateFrom} 
                    dateTo={dateTo} 
                    onDateChange={(from, to) => {
                        setDateFrom(from);
                        setDateTo(to);
                        setPage(1);
                    }} 
                />

                {/* Limit Selector */}
                <Select value={String(limit)} onValueChange={handleLimitChange}>
                    <SelectTrigger className="h-10 w-[80px] bg-white border-slate-200 shrink-0 text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
