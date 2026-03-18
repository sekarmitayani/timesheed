"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/ai/ai-components";
import { Loader2, ChevronLeft, ChevronRight, Search, Edit, Users } from "lucide-react";
import { toast } from "sonner";
import { projectService, UpdateProjectPayload } from "@/lib/services/project-service";
import { ApiProject, ProjectMember } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const statusColors: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-600 border-emerald-200",
    completed: "bg-blue-50 text-blue-600 border-blue-200",
    "on-hold": "bg-amber-50 text-amber-600 border-amber-200",
    cancelled: "bg-red-50 text-red-500 border-red-200",
};

export default function PMProjectsPage() {
    const [projects, setProjects] = useState<ApiProject[]>([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Edit Dialog
    const [editOpen, setEditOpen] = useState(false);
    const [editProject, setEditProject] = useState<ApiProject | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [editForm, setEditForm] = useState<UpdateProjectPayload>({});

    // Members Dialog
    const [membersOpen, setMembersOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<ApiProject | null>(null);
    const [members, setMembers] = useState<ProjectMember[]>([]);
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);

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

    const openEdit = (p: ApiProject) => {
        setEditProject(p);
        setEditForm({
            name: p.name,
            client_name: p.client_name,
            client_email: p.client_email || "",
            status: p.status,
            budget_revenue: p.budget_revenue || 0,
            budget_cost: p.budget_cost || 0,
            budget_cost_threshold: p.budget_cost_threshold || 0,
        });
        setEditOpen(true);
    };

    const handleUpdate = async () => {
        if (!editProject) return;
        setIsSaving(true);
        try {
            await projectService.updateProject(editProject.id, editForm);
            toast.success(`Project "${editForm.name || editProject.name}" updated`);
            setEditOpen(false);
            fetchProjects();
        } catch (e: any) {
            toast.error(e.message || "Failed to update project");
        } finally {
            setIsSaving(false);
        }
    };

    const openMembers = async (p: ApiProject) => {
        setSelectedProject(p);
        setMembersOpen(true);
        setIsLoadingMembers(true);
        try {
            const res = await projectService.getProjectMembers(p.id);
            setMembers(Array.isArray(res) ? res : []);
        } catch (e: any) {
            toast.error(e.message || "Failed to fetch members");
        } finally {
            setIsLoadingMembers(false);
        }
    };

    const filtered = projects.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.client_name.toLowerCase().includes(search.toLowerCase())
    );
    const totalPages = Math.ceil(pagination.total / pagination.limit);

    return (
        <div className="space-y-6">
            <PageHeader title="My Projects" description="Projects under your management" />

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search projects..." className="pl-9 border-[#e2e8f0] focus-visible:ring-[#2568C1]" value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {isLoading ? (
                <div className="py-16 flex flex-col justify-center items-center text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin text-[#2568C1] mb-4" />
                    <p>Loading your projects...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground text-sm">No projects found.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filtered.map(p => {
                        const margin = (p.budget_revenue || 0) - (p.budget_cost || 0);
                        return (
                            <Card key={p.id} className="hover:border-[#2568C1]/30 transition-colors group">
                                <CardContent className="p-5 space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-medium text-[#0f172a]">{p.name}</h3>
                                            <p className="text-xs text-muted-foreground">{p.client_name}</p>
                                        </div>
                                        <Badge variant="outline" className={`capitalize text-[10px] font-bold ${statusColors[p.status]}`}>{p.status}</Badge>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                        <div className="space-y-0.5">
                                            <span className="text-muted-foreground block">Revenue</span>
                                            <span className="font-medium">Rp {(p.budget_revenue || 0).toLocaleString("id-ID")}</span>
                                        </div>
                                        <div className="space-y-0.5">
                                            <span className="text-muted-foreground block">Cost</span>
                                            <span className="font-medium">Rp {(p.budget_cost || 0).toLocaleString("id-ID")}</span>
                                        </div>
                                        <div className="space-y-0.5">
                                            <span className="text-muted-foreground block">Margin</span>
                                            <span className={`font-medium ${margin >= 0 ? "text-emerald-600" : "text-red-500"}`}>Rp {margin.toLocaleString("id-ID")}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 pt-1">
                                        <Button variant="outline" size="sm" className="flex-1 gap-1 text-xs h-7" onClick={() => openMembers(p)}>
                                            <Users className="h-3 w-3" /> Members
                                        </Button>
                                        <Button variant="outline" size="sm" className="flex-1 gap-1 text-xs h-7" onClick={() => openEdit(p)}>
                                            <Edit className="h-3 w-3" /> Update
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {!isLoading && totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 pt-2">
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={pagination.page <= 1} onClick={() => fetchProjects(pagination.page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                    <span className="text-xs font-medium">Page {pagination.page} of {totalPages}</span>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={pagination.page >= totalPages} onClick={() => fetchProjects(pagination.page + 1)}><ChevronRight className="h-4 w-4" /></Button>
                </div>
            )}

            {/* Update Project Dialog */}
            <Dialog open={editOpen} onOpenChange={(open) => !isSaving && setEditOpen(open)}>
                <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-[#e2e8f0]">
                    <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4">
                        <DialogTitle className="text-xl text-[#0f172a]">Update Project</DialogTitle>
                        <DialogDescription className="text-sm">Modify details for "{editProject?.name}"</DialogDescription>
                    </div>
                    <div className="px-6 py-5 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5 col-span-2">
                                <label className="text-sm font-medium">Project Name</label>
                                <Input value={editForm.name || ""} onChange={e => setEditForm({ ...editForm, name: e.target.value })} disabled={isSaving} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Status</label>
                                <Select value={editForm.status || ""} onValueChange={v => setEditForm({ ...editForm, status: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="on-hold">On Hold</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Client Email</label>
                                <Input value={editForm.client_email || ""} onChange={e => setEditForm({ ...editForm, client_email: e.target.value })} disabled={isSaving} />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Budget Revenue</label>
                                <Input type="number" value={editForm.budget_revenue || ""} onChange={e => setEditForm({ ...editForm, budget_revenue: Number(e.target.value) })} disabled={isSaving} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Budget Cost</label>
                                <Input type="number" value={editForm.budget_cost || ""} onChange={e => setEditForm({ ...editForm, budget_cost: Number(e.target.value) })} disabled={isSaving} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Cost Threshold</label>
                                <Input type="number" value={editForm.budget_cost_threshold || ""} onChange={e => setEditForm({ ...editForm, budget_cost_threshold: Number(e.target.value) })} disabled={isSaving} />
                            </div>
                        </div>
                    </div>
                    <div className="px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setEditOpen(false)} disabled={isSaving}>Cancel</Button>
                        <Button onClick={handleUpdate} disabled={isSaving} className="bg-[#2568C1] hover:bg-[#1e56a6] min-w-[120px]">
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Members Dialog (Read Only for PM) */}
            <Dialog open={membersOpen} onOpenChange={setMembersOpen}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-[#e2e8f0]">
                    <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4">
                        <DialogTitle className="text-lg text-[#0f172a]">Team — {selectedProject?.name}</DialogTitle>
                        <DialogDescription className="text-xs">{members.length} members</DialogDescription>
                    </div>
                    <div className="max-h-[50vh] overflow-y-auto p-4 space-y-3">
                        {isLoadingMembers ? (
                            <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#2568C1]" /></div>
                        ) : members.length === 0 ? (
                            <p className="text-center text-sm text-muted-foreground py-8">No members assigned.</p>
                        ) : (
                            members.map(m => (
                                <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border border-[#e2e8f0] hover:bg-[#f8fafc]">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="text-[10px] bg-gradient-to-br from-[#2568C1] to-[#1a4f99] text-white">
                                            {(m.user?.full_name || "?").split(" ").slice(0, 2).map(n => n[0]).join("")}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <span className="text-sm font-medium">{m.user?.full_name || `User #${m.user_id}`}</span>
                                        <div className="text-[10px] text-muted-foreground">{m.user?.email}</div>
                                    </div>
                                    <Badge variant="outline" className="text-[10px]">{m.role_in_project}</Badge>
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
