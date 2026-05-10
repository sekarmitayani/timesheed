import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface AuditFiltersProps {
    search: string;
    setSearch: (v: string) => void;
    filterAction: string;
    setFilterAction: (v: string) => void;
    filterModule: string;
    setFilterModule: (v: string) => void;
    limit: number;
    setLimit: (v: number) => void;
    setPage: (v: number) => void;
}

export function AuditFilters({
    search, setSearch,
    filterAction, setFilterAction,
    filterModule, setFilterModule,
    limit, setLimit, setPage
}: AuditFiltersProps) {
    const handleActionChange = (v: string) => {
        setFilterAction(v);
        setPage(1);
    };

    const handleModuleChange = (v: string) => {
        setFilterModule(v);
        setPage(1);
    };

    const handleLimitChange = (v: string) => {
        setLimit(Number(v));
        setPage(1);
    };

    return (
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-1">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-[250px] shrink-0">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search Actor or ID..."
                        className="pl-9 h-10 w-full bg-white border-slate-200 focus-visible:ring-[#2568C1] focus-visible:border-[#2568C1]"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>

                <Select value={filterAction} onValueChange={handleActionChange}>
                    <SelectTrigger className="h-10 w-full sm:w-[130px] bg-white">
                        <SelectValue placeholder="Action" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Actions</SelectItem>
                        <SelectItem value="CREATE">CREATE</SelectItem>
                        <SelectItem value="UPDATE">UPDATE</SelectItem>
                        <SelectItem value="DELETE">DELETE</SelectItem>
                        <SelectItem value="LOGIN">LOGIN</SelectItem>
                        <SelectItem value="LOGOUT">LOGOUT</SelectItem>
                        <SelectItem value="LOGIN_AS_PROXY">PROXY LOGIN</SelectItem>
                        <SelectItem value="LOGOUT_PROXY">PROXY LOGOUT</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={filterModule} onValueChange={handleModuleChange}>
                    <SelectTrigger className="h-10 w-full sm:w-[150px] bg-white">
                        <SelectValue placeholder="Module" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Modules</SelectItem>
                        <SelectItem value="users">Users</SelectItem>
                        <SelectItem value="contracts">Contracts</SelectItem>
                        <SelectItem value="contract_payments">Payments</SelectItem>
                        <SelectItem value="projects">Projects</SelectItem>
                        <SelectItem value="tasks">Tasks</SelectItem>
                        <SelectItem value="timesheets">Timesheets</SelectItem>
                        <SelectItem value="resource_requests">Resources</SelectItem>
                    </SelectContent>
                </Select>

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
