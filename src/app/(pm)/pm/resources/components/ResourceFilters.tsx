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
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between pt-1">
            <div className="flex flex-wrap items-center gap-3 w-full">
                <div className="relative w-full sm:w-[250px] shrink-0">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search project or details..."
                        className="pl-9 h-10 w-full bg-white border-slate-200 focus-visible:ring-[#2568C1] focus-visible:border-[#2568C1]"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Select value={filterProject} onValueChange={setFilterProject}>
                    <SelectTrigger className="h-10 w-[180px] bg-white border-slate-200">
                        <SelectValue placeholder="All Projects" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Projects</SelectItem>
                        {allProjects.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="h-10 w-[140px] bg-white border-slate-200">
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
                    <SelectTrigger className="h-10 w-[140px] bg-white border-slate-200">
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
                    <SelectTrigger className="h-10 w-[80px] bg-white border-slate-200 text-xs">
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
    );
}
