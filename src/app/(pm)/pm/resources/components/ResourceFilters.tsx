"use client";

import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { ApiProject } from "@/lib/types";

interface ResourceFiltersProps {
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    filterProject: string;
    setFilterProject: (val: string) => void;
    filterType: string;
    setFilterType: (val: string) => void;
    filterStatus: string;
    setFilterStatus: (val: string) => void;
    limit: number;
    setLimit: (val: number) => void;
    allProjects: ApiProject[];
}

export function ResourceFilters({
    searchQuery, setSearchQuery,
    filterProject, setFilterProject,
    filterType, setFilterType,
    filterStatus, setFilterStatus,
    limit, setLimit,
    allProjects
}: ResourceFiltersProps) {
    return (
        <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between pt-1">
            <div className="flex flex-wrap items-center gap-2 w-full">
                {/* Search Bar */}
                <div className="relative w-full sm:w-[240px] shrink-0 p-0.5">
                    <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                        placeholder="Search project or details..."
                        className="pl-9 h-10 w-full bg-white border-slate-200 text-sm focus-visible:ring-2 focus-visible:ring-[#2568C1] focus-visible:border-[#2568C1]"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* 2-Column Grid on Mobile, Inline Flex on Tablet/Desktop */}
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
                    <Select value={filterProject} onValueChange={setFilterProject}>
                        <SelectTrigger className="h-10 w-full sm:w-[160px] bg-white text-sm border-slate-200">
                            <SelectValue placeholder="All Projects" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Projects</SelectItem>
                            {allProjects.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="h-10 w-full sm:w-[135px] bg-white text-sm border-slate-200">
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

                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="h-10 w-full sm:w-[130px] bg-white text-sm border-slate-200">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
                        <SelectTrigger className="h-10 w-full sm:w-[75px] bg-white text-sm border-slate-200">
                            <SelectValue placeholder={String(limit)} />
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

