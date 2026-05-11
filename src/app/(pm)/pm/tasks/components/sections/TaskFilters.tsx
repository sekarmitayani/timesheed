import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, List, Calendar as CalendarIcon, Layers } from "lucide-react";
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
                <div className="w-full md:max-w-[260px]">
                    {isLoadingProjects ? (
                        <div className="h-9 bg-white animate-pulse border rounded-lg w-full" />
                    ) : (
                        <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                            <SelectTrigger className="border-slate-200 focus:ring-[#4B7BEC] bg-white h-9 shadow-sm rounded-lg text-sm">
                                <div className="flex items-center gap-2">
                                    <Layers className="h-4 w-4 text-[#4B7BEC]" />
                                    <SelectValue placeholder="All Projects" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-lg">
                                <SelectItem value="all" className="text-sm font-semibold text-[#4B7BEC]">All Projects</SelectItem>
                                {projects.map(p => (
                                    <SelectItem key={p.id} value={String(p.id)} className="text-sm">{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
            </div>
            <Tabs value={view} onValueChange={setView} className="w-full md:w-auto">
                <TabsList className="bg-white border border-slate-200 p-1 h-9 rounded-lg shadow-sm">
                    <TabsTrigger value="kanban" className="data-[state=active]:bg-[#4B7BEC] data-[state=active]:text-white gap-2 rounded-md px-4 transition-all h-7 text-xs font-bold">
                        <LayoutGrid className="h-3.5 w-3.5" /> Kanban
                    </TabsTrigger>
                    <TabsTrigger value="list" className="data-[state=active]:bg-[#4B7BEC] data-[state=active]:text-white gap-2 rounded-md px-4 transition-all h-7 text-xs font-bold">
                        <List className="h-3.5 w-3.5" /> List
                    </TabsTrigger>
                    <TabsTrigger value="calendar" className="data-[state=active]:bg-[#4B7BEC] data-[state=active]:text-white gap-2 rounded-md px-4 transition-all h-7 text-xs font-bold">
                        <CalendarIcon className="h-3.5 w-3.5" /> Calendar
                    </TabsTrigger>
                </TabsList>
            </Tabs>
        </div>
    );
}
