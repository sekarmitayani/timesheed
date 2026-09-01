"use client";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { LiabilityGroup } from "@/lib/services/management-service";

interface LiabilityFiltersProps {
    search: string;
    setSearch: (val: string) => void;
    filterProject: string;
    setFilterProject: (val: string) => void;
    filterType: string;
    setFilterType: (val: string) => void;
    groups: LiabilityGroup[];
}

export function LiabilityFilters({
    search,
    setSearch,
    filterProject,
    setFilterProject,
    filterType,
    setFilterType,
    groups,
}: LiabilityFiltersProps) {
    const projectOptions = groups.map((g) => ({
        id: g.project_id !== null ? String(g.project_id) : "base",
        name: g.project_name,
    }));

    return (
        <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between pt-1">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
                {/* Search Bar */}
                <div className="relative w-full sm:w-[240px] md:w-[260px] shrink-0">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search personnel or project..."
                        className="pl-9 h-10 w-full bg-white border-slate-200 text-sm focus-visible:ring-[#2568C1] focus-visible:border-[#2568C1]"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* 2-Column Grid on Mobile, Inline Flex on Tablet/Desktop */}
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
                    <Select value={filterProject} onValueChange={setFilterProject}>
                        <SelectTrigger className="h-10 w-full sm:w-[170px] bg-white text-sm border-slate-200">
                            <SelectValue placeholder="All Projects" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Projects</SelectItem>
                            {projectOptions.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                    {p.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="h-10 w-full sm:w-[145px] bg-white text-sm border-slate-200">
                            <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="fulltime">Full-time</SelectItem>
                            <SelectItem value="parttime">Part-time</SelectItem>
                            <SelectItem value="freelance">Freelance</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}
