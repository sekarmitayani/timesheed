"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/ai/ai-components";
import { Plus, Loader2, Package, Wrench, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { resourceService, ResourceRequest, CreateResourcePayload } from "@/lib/services/resource-service";
import { projectService } from "@/lib/services/project-service";
import { ApiProject } from "@/lib/types";

const statusColors: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border-none",
    approved: "bg-emerald-50 text-emerald-700 border-none",
    rejected: "bg-red-50 text-red-700 border-none",
};
const statusDotColors: Record<string, string> = {
    pending: "bg-amber-500",
    approved: "bg-emerald-500",
    rejected: "bg-red-500",
};

const typeIcons: Record<string, React.ReactNode> = {
    manpower: <Users className="h-4 w-4 text-blue-500" />,
    tools: <Wrench className="h-4 w-4 text-orange-500" />,
};

export default function RequestsPage() {
    const [requests, setRequests] = useState<ResourceRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Create
    const [createOpen, setCreateOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [projects, setProjects] = useState<ApiProject[]>([]);
    const [form, setForm] = useState<CreateResourcePayload>({ project_id: 0, type: "tools", details: "" });

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const res = await resourceService.getResourceRequests();
            setRequests(Array.isArray(res) ? res : []);
        } catch (e: any) {
            toast.error(e.message || "Failed to load requests");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchRequests(); }, []);

    const openCreate = async () => {
        setCreateOpen(true);
        setForm({ project_id: 0, type: "tools", details: "" });
        if (projects.length === 0) {
            try {
                const res = await projectService.getProjects(1, 100);
                setProjects(res.data || []);
            } catch { /* skip */ }
        }
    };

    const handleCreate = async () => {
        if (!form.project_id || !form.details.trim()) { toast.error("Project and details are required"); return; }
        setIsSaving(true);
        try {
            await resourceService.createResourceRequest(form);
            toast.success("Request submitted!");
            setCreateOpen(false);
            fetchRequests();
        } catch (e: any) {
            toast.error(e.message || "Failed to submit request");
        } finally {
            setIsSaving(false);
        }
    };

    const pendingCount = requests.filter(r => r.status === "pending").length;

    return (
        <div className="space-y-6">
            <PageHeader title="Resource Requests" description={`${pendingCount} pending`}>
                <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm" onClick={openCreate}>
                    <Plus className="h-4 w-4" /> New Request
                </Button>
            </PageHeader>

            {isLoading ? (
                <div className="py-16 flex flex-col items-center text-muted-foreground"><Loader2 className="h-8 w-8 animate-spin text-[#2568C1] mb-4" /><p>Loading requests...</p></div>
            ) : requests.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground text-sm">No resource requests yet.</div>
            ) : (
                <div className="space-y-3">
                    {requests.map(req => (
                        <Card key={req.id} className="hover:border-[#2568C1]/30 transition-colors">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="h-10 w-10 rounded-lg bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-center shrink-0">
                                    {typeIcons[req.type] || <Package className="h-4 w-4 text-slate-400" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-[10px] capitalize">{req.type}</Badge>
                                        <span className="text-xs text-muted-foreground">{req.Project?.name || `Project #${req.project_id}`}</span>
                                    </div>
                                    <p className="text-sm font-medium text-[#0f172a] mt-0.5 truncate">{req.details}</p>
                                    {req.amount > 0 && <p className="text-xs text-emerald-600 font-medium">Rp {req.amount.toLocaleString("id-ID")}</p>}
                                </div>
                                <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider", statusColors[req.status])}><div className={cn("w-1.5 h-1.5 rounded-full", statusDotColors[req.status])} /><span className="uppercase">{req.status}</span></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create Request Dialog */}
            <Dialog open={createOpen} onOpenChange={open => !isSaving && setCreateOpen(open)}>
                <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-[#e2e8f0]">
                    <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4">
                        <DialogTitle className="text-lg">New Resource Request</DialogTitle>
                        <DialogDescription className="text-xs">Submit a request for resources needed in your project.</DialogDescription>
                    </div>
                    <div className="px-6 py-5 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Project <span className="text-red-500">*</span></label>
                            <Select value={String(form.project_id || "")} onValueChange={v => setForm({ ...form, project_id: Number(v) })}>
                                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                                <SelectContent>{projects.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Type</label>
                            <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="manpower">Manpower</SelectItem>
                                    <SelectItem value="tools">Tools</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Details <span className="text-red-500">*</span></label>
                            <Input value={form.details} onChange={e => setForm({ ...form, details: e.target.value })} placeholder="Describe the resource needed..." disabled={isSaving} />
                        </div>
                    </div>
                    <div className="px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setCreateOpen(false)} disabled={isSaving}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 min-w-[110px]">
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Request"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
