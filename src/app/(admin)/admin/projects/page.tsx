"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/ai/ai-components";
import { useDataStore } from "@/store/useDataStore";
import { Plus } from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = { active: "bg-emerald-500/10 text-emerald-500", completed: "bg-blue-500/10 text-blue-500", "on-hold": "bg-amber-500/10 text-amber-500", cancelled: "bg-red-500/10 text-red-500" };

export default function AdminProjectsPage() {
    const projects = useDataStore((s) => s.projects);
    const users = useDataStore((s) => s.users);
    const addProject = useDataStore((s) => s.addProject);
    const updateProject = useDataStore((s) => s.updateProject);
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ name: "", client: "", description: "", budget: "", totalMandays: "", startDate: "", endDate: "", pmId: "" });

    const pms = users.filter((u) => u.role === "pm");

    const handleAdd = () => {
        if (!form.name || !form.client) { toast.error("Name and client required"); return; }
        addProject({ ...form, status: "active", budget: parseInt(form.budget) || 0, spent: 0, totalMandays: parseInt(form.totalMandays) || 0, usedMandays: 0, members: [] });
        toast.success(`Project "${form.name}" created`);
        setOpen(false);
        setForm({ name: "", client: "", description: "", budget: "", totalMandays: "", startDate: "", endDate: "", pmId: "" });
    };

    const toggleStatus = (id: string, current: string) => {
        const next = current === "active" ? "on-hold" : current === "on-hold" ? "active" : current;
        updateProject(id, { status: next as any });
        toast.success(`Project status changed to ${next}`);
    };

    return (
        <div className="space-y-6">
            <PageHeader title="Project Management" description={`${projects.length} projects`}>
                <Button size="sm" className="gap-1 bg-gradient-to-r from-[#2568C1] to-[#1a4f99]" onClick={() => setOpen(true)}>
                    <Plus className="h-3 w-3" /> New Project
                </Button>
            </PageHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((p) => (
                    <Card key={p.id} className="hover:border-[#FFBE18]/30 transition-colors">
                        <CardContent className="p-5 space-y-3">
                            <div className="flex items-start justify-between">
                                <div><h3 className="font-medium">{p.name}</h3><p className="text-xs text-muted-foreground">{p.client}</p></div>
                                <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={() => toggleStatus(p.id, p.status)}>
                                    <Badge variant="outline" className={`text-[10px] ${statusColors[p.status]}`}>{p.status}</Badge>
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="space-y-1"><span className="text-muted-foreground">Budget</span><Progress value={(p.spent / p.budget) * 100} className="h-1.5" /><span>{((p.spent / p.budget) * 100).toFixed(0)}%</span></div>
                                <div className="space-y-1"><span className="text-muted-foreground">Mandays</span><Progress value={(p.usedMandays / p.totalMandays) * 100} className="h-1.5" /><span>{p.usedMandays}/{p.totalMandays}</span></div>
                            </div>
                            <p className="text-xs text-muted-foreground">{p.startDate} → {p.endDate} • {p.members.length} members</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>New Project</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <div><label className="text-sm font-medium mb-1 block">Project Name *</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="E-Commerce Redesign" /></div>
                        <div><label className="text-sm font-medium mb-1 block">Client *</label><Input value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} placeholder="PT Client Corp" /></div>
                        <div><label className="text-sm font-medium mb-1 block">Description</label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Project description" /></div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">Project Manager</label>
                            <Select value={form.pmId} onValueChange={(v) => setForm({ ...form, pmId: v })}>
                                <SelectTrigger><SelectValue placeholder="Select PM" /></SelectTrigger>
                                <SelectContent>{pms.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div><label className="text-sm font-medium mb-1 block">Budget (Rp)</label><Input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="500000000" /></div>
                            <div><label className="text-sm font-medium mb-1 block">Total Mandays</label><Input type="number" value={form.totalMandays} onChange={(e) => setForm({ ...form, totalMandays: e.target.value })} placeholder="120" /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div><label className="text-sm font-medium mb-1 block">Start Date</label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
                            <div><label className="text-sm font-medium mb-1 block">End Date</label><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button onClick={handleAdd} className="bg-gradient-to-r from-[#2568C1] to-[#1a4f99]">Create Project</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
