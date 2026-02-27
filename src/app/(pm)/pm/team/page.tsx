"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/ai/ai-components";
import { getPriorityBadgeClasses } from "@/lib/priority-utils";
import { useDataStore } from "@/store/useDataStore";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function TeamPage() {
    const users = useDataStore((s) => s.users);
    const tasks = useDataStore((s) => s.tasks);
    const projects = useDataStore((s) => s.projects);
    const addTask = useDataStore((s) => s.addTask);
    const deleteTask = useDataStore((s) => s.deleteTask);
    const employees = users.filter((u) => u.role === "employee");

    const [assignOpen, setAssignOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<string | null>(null);
    const [form, setForm] = useState({ title: "", projectId: "", priority: "medium" as "low" | "medium" | "high" | "urgent", dueDate: "", estimatedHours: "" });

    const handleAssign = () => {
        if (!selectedMember || !form.title || !form.projectId) {
            toast.error("Please fill in all required fields");
            return;
        }
        addTask({
            title: form.title,
            projectId: form.projectId,
            assigneeId: selectedMember,
            status: "todo",
            priority: form.priority,
            dueDate: form.dueDate || "2026-03-01",
            estimatedHours: parseInt(form.estimatedHours) || 8,
            loggedHours: 0,
            description: form.title,
        });
        const memberName = users.find((u) => u.id === selectedMember)?.name;
        toast.success(`Task "${form.title}" assigned to ${memberName}`);
        setAssignOpen(false);
        setForm({ title: "", projectId: "", priority: "medium", dueDate: "", estimatedHours: "" });
        setSelectedMember(null);
    };

    const handleDeleteTask = (taskId: string, title: string) => {
        deleteTask(taskId);
        toast.success(`Task "${title}" removed`);
    };

    return (
        <div className="space-y-6">
            <PageHeader title="Team & Tasks" description="Manage your team members and task assignments">
                <Button size="sm" className="gap-1 bg-gradient-to-r from-[#2568C1] to-[#1a4f99]" onClick={() => setAssignOpen(true)}>
                    <Plus className="h-3 w-3" /> Assign Task
                </Button>
            </PageHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {employees.map((member) => {
                    const memberTasks = tasks.filter((t) => t.assigneeId === member.id);
                    const activeTasks = memberTasks.filter((t) => t.status !== "done");
                    const completedTasks = memberTasks.filter((t) => t.status === "done");
                    return (
                        <Card key={member.id} className="hover:border-[#FFBE18]/30 transition-colors">
                            <CardContent className="p-4 space-y-3">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarFallback className="text-sm bg-gradient-to-br from-[#2568C1] to-[#1a4f99] text-white">
                                            {member.name.split(" ").map((n) => n[0]).join("")}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-medium">{member.name}</h4>
                                        <p className="text-xs text-muted-foreground">{member.position}</p>
                                    </div>
                                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => { setSelectedMember(member.id); setAssignOpen(true); }}>
                                        <Plus className="h-3 w-3" /> Assign
                                    </Button>
                                </div>
                                <div className="flex gap-2 text-xs">
                                    <Badge variant="secondary">{activeTasks.length} active</Badge>
                                    <Badge variant="outline">{completedTasks.length} done</Badge>
                                </div>
                                <div className="space-y-1.5">
                                    {activeTasks.slice(0, 4).map((task) => (
                                        <div key={task.id} className="flex items-center justify-between p-2 rounded bg-muted/30 text-xs group">
                                            <span className="truncate flex-1">{task.title}</span>
                                            <div className="flex items-center gap-1">
                                                <Badge variant="outline" className={`text-[10px] ml-2 ${getPriorityBadgeClasses(task.priority)}`}>{task.priority}</Badge>
                                                <Button variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-500" onClick={() => handleDeleteTask(task.id, task.title)}>
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Assign Task Dialog */}
            <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Assign New Task</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium mb-1 block">Assign To</label>
                            <Select value={selectedMember || ""} onValueChange={setSelectedMember}>
                                <SelectTrigger><SelectValue placeholder="Select team member" /></SelectTrigger>
                                <SelectContent>
                                    {employees.map((u) => (
                                        <SelectItem key={u.id} value={u.id}>{u.name} — {u.position}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">Task Title *</label>
                            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g., Implement user settings page" />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">Project *</label>
                            <Select value={form.projectId} onValueChange={(v) => setForm({ ...form, projectId: v })}>
                                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                                <SelectContent>
                                    {projects.filter((p) => p.status === "active").map((p) => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Priority</label>
                                <Select value={form.priority} onValueChange={(v: any) => setForm({ ...form, priority: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="urgent">Urgent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Est. Hours</label>
                                <Input type="number" value={form.estimatedHours} onChange={(e) => setForm({ ...form, estimatedHours: e.target.value })} placeholder="8" />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">Due Date</label>
                            <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
                        <Button onClick={handleAssign} className="bg-gradient-to-r from-[#2568C1] to-[#1a4f99]">Assign Task</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
