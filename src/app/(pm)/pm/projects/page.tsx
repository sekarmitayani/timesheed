"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/ai/ai-components";
import { Loader2, ChevronLeft, ChevronRight, Search, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { projectService } from "@/lib/services/project-service";
import { ApiProject } from "@/lib/types";

const statusColors: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700 border-none",
    completed: "bg-blue-50 text-blue-700 border-none",
    "on-hold": "bg-amber-50 text-amber-700 border-none",
    cancelled: "bg-red-50 text-red-700 border-none",
};
const statusDotColors: Record<string, string> = {
    active: "bg-emerald-500",
    completed: "bg-blue-500",
    "on-hold": "bg-amber-500",
    cancelled: "bg-red-500",
};

export default function PMProjectsPage() {
    const router = useRouter();
    const [projects, setProjects] = useState<ApiProject[]>([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    const fetchProjects = async (page: number = pagination.page) => {
        setIsLoading(true);
        try {
            const res = await projectService.getProjects(page, pagination.limit);
            setProjects(res.data || []);
            setPagination(res.pagination);
        } catch (e: any) {
            toast.error(e.message || "Failed to fetch projects");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchProjects(1); }, []);

    const filtered = projects.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.client_name.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "All" || p.status === statusFilter;
        return matchSearch && matchStatus;
    });
    const totalPages = Math.ceil(pagination.total / pagination.limit);

    return (
        <div className="space-y-6">
            <PageHeader title="My Projects" description="Projects under your management" />

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-[300px]">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search projects..." className="pl-9 h-10 border-[#e2e8f0] focus-visible:ring-[#2568C1]" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-10 w-[140px] bg-white">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="on-hold">On Hold</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Data Table */}
            <Card className="border-[#e2e8f0] shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-b border-slate-100">
                                    <TableHead className="pl-6 w-12 text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">No</TableHead>
                                    <TableHead className="w-[300px] text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Project</TableHead>
                                    <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Client</TableHead>
                                    <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Status</TableHead>
                                    <TableHead className="w-[120px] pr-6 text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-48 text-center">
                                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                <Loader2 className="h-8 w-8 animate-spin text-[#2568C1] mb-4" />
                                                <p>Loading your projects...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filtered.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-muted-foreground text-center">No projects found.</TableCell>
                                    </TableRow>
                                ) : (
                                    filtered.map((p, i) => (
                                        <TableRow key={p.id} className="hover:bg-[#f0f4fa]/50 transition-colors">
                                            <TableCell className="pl-6 text-sm text-muted-foreground font-medium">
                                                {(pagination.page - 1) * pagination.limit + i + 1}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-[#0f172a]">{p.name}</span>
                                                    <span className="text-[10px] text-muted-foreground">ID: {p.id}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-[#475569]">{p.client_name}</span>
                                                    {p.client_email && <span className="text-[10px] text-muted-foreground">{p.client_email}</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider", statusColors[p.status])}>
                                                    <div className={cn("w-1.5 h-1.5 rounded-full", statusDotColors[p.status])} />
                                                    <span className="uppercase">{p.status}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="pr-6">
                                                <div className="flex justify-end">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-[#64748b] hover:text-[#2568C1] hover:bg-[#2568C1]/10 rounded-full" onClick={() => router.push(`/pm/projects/${p.id}`)}>
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                {!isLoading && totalPages > 0 && (
                    <div className="border-t border-[#e2e8f0] bg-white px-4 py-3 flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                            Showing <span className="font-medium text-[#0f172a]">{(pagination.page - 1) * pagination.limit + 1}</span> to <span className="font-medium text-[#0f172a]">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-medium text-[#0f172a]">{pagination.total}</span> projects
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={pagination.page <= 1} onClick={() => fetchProjects(pagination.page - 1)}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="text-xs font-medium px-2">Page {pagination.page} of {totalPages}</div>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={pagination.page >= totalPages} onClick={() => fetchProjects(pagination.page + 1)}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
