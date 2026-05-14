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
        <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between shrink-0 mb-2 px-1">
            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto flex-1">
                {isLoadingProjects ? (
                    <div className="h-10 bg-white animate-pulse border border-slate-200 rounded-md w-full sm:w-[200px]" />
                ) : (
                    <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                        <SelectTrigger className="w-full sm:w-[200px] h-10 bg-white border-slate-200">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="truncate"><SelectValue placeholder="All Projects" /></span>
                            </div>
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
            <Tabs value={view} onValueChange={setView} className="w-full xl:w-auto shrink-0">
                <TabsList className="bg-white border border-slate-200 p-1 h-10 rounded-lg shadow-sm w-full sm:w-auto flex">
                    <TabsTrigger value="kanban" className="data-[state=active]:bg-[#4B7BEC] data-[state=active]:text-white gap-2 rounded-md px-4 transition-all h-8 text-xs font-bold flex-1 sm:flex-none">
                        <LayoutGrid className="h-3.5 w-3.5" /> Kanban
                    </TabsTrigger>
                    <TabsTrigger value="list" className="data-[state=active]:bg-[#4B7BEC] data-[state=active]:text-white gap-2 rounded-md px-4 transition-all h-8 text-xs font-bold flex-1 sm:flex-none">
                        <List className="h-3.5 w-3.5" /> List
                    </TabsTrigger>
                    <TabsTrigger value="calendar" className="data-[state=active]:bg-[#4B7BEC] data-[state=active]:text-white gap-2 rounded-md px-4 transition-all h-8 text-xs font-bold flex-1 sm:flex-none">
                        <CalendarIcon className="h-3.5 w-3.5" /> Calendar
                    </TabsTrigger>
                </TabsList>
            </Tabs>
        </div>
    );
}
