"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, List, Calendar as CalendarIcon } from "lucide-react";
import { ApiProject } from "@/lib/types";

interface TaskFiltersProps {
    isLoadingProjects: boolean;
    projects: ApiProject[];
    selectedProjectId: string;
    setSelectedProjectId: (val: string) => void;
    view: string;
    setView: (val: string) => void;
}

export function TaskFilters({
    isLoadingProjects,
    projects,
    selectedProjectId,
    setSelectedProjectId,
    view,
    setView
}: TaskFiltersProps) {
    return (
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between shrink-0 mb-2 pt-1">
            <div className="flex items-center gap-2 w-full sm:w-auto">
                {isLoadingProjects ? (
                    <div className="h-10 bg-white animate-pulse border border-slate-200 rounded-lg w-full sm:w-[200px]" />
                ) : (
                    <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                        <SelectTrigger className="w-full sm:w-[200px] h-10 bg-white text-sm border-slate-200 focus-visible:ring-[#2568C1]">
                            <SelectValue placeholder="All Projects" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Projects</SelectItem>
                            {projects.map(p => (
                                <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>

            <Tabs value={view} onValueChange={setView} className="w-full sm:w-auto shrink-0">
                <TabsList className="bg-slate-100 p-1 h-10 rounded-xl border border-slate-200/60 w-full sm:w-auto flex">
                    <TabsTrigger value="kanban" className="data-[state=active]:bg-white data-[state=active]:text-[#4B7BEC] data-[state=active]:shadow-xs gap-1.5 rounded-lg px-3 py-1.5 transition-all text-xs font-semibold flex-1 sm:flex-none">
                        <LayoutGrid className="h-3.5 w-3.5" /> Kanban
                    </TabsTrigger>
                    <TabsTrigger value="list" className="data-[state=active]:bg-white data-[state=active]:text-[#4B7BEC] data-[state=active]:shadow-xs gap-1.5 rounded-lg px-3 py-1.5 transition-all text-xs font-semibold flex-1 sm:flex-none">
                        <List className="h-3.5 w-3.5" /> List
                    </TabsTrigger>
                    <TabsTrigger value="calendar" className="data-[state=active]:bg-white data-[state=active]:text-[#4B7BEC] data-[state=active]:shadow-xs gap-1.5 rounded-lg px-3 py-1.5 transition-all text-xs font-semibold flex-1 sm:flex-none">
                        <CalendarIcon className="h-3.5 w-3.5" /> Calendar
                    </TabsTrigger>
                </TabsList>
            </Tabs>
        </div>
    );
}

