"use client";

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { ApiTask, CreateTaskPayload } from "@/lib/services/task-service";
import { ApiProject, ProjectMember } from "@/lib/types";

interface TaskFormDialogProps {
    isOpen: boolean;
    onClose: (open: boolean) => void;
    editingTask: ApiTask | null;
    isSaving: boolean;
    form: CreateTaskPayload & { status?: string };
    setForm: (form: any) => void;
    onSave: () => Promise<void>;
    projects: ApiProject[];
    members: ProjectMember[];
    isEmployee: boolean;
}

export function TaskFormDialog({
    isOpen,
    onClose,
    editingTask,
    isSaving,
    form,
    setForm,
    onSave,
    projects,
    members,
    isEmployee
}: TaskFormDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={open => !isSaving && onClose(open)}>
            <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none shadow-2xl rounded-md bg-white flex flex-col text-slate-900">
                <DialogDescription className="sr-only">Form to create or edit a task.</DialogDescription>
                <div className="bg-slate-50 border-b border-slate-100 px-6 py-4">
                    <DialogTitle className="text-base font-bold text-slate-900">
                        {editingTask ? "Edit Task" : "New Task"}
                    </DialogTitle>
                </div>
                <div className="px-6 py-5 space-y-3.5">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Project</label>
                        <Select 
                            value={String(form.project_id || "")} 
                            onValueChange={v => setForm({ ...form, project_id: Number(v), assigned_to_id: 0 })} 
                            disabled={!!editingTask}
                        >
                            <SelectTrigger className="border-slate-200 h-9 rounded-md text-sm font-semibold focus:ring-1 focus:ring-[#4B7BEC]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-md">
                                {projects.map(p => <SelectItem key={p.id} value={String(p.id)} className="text-sm">{p.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Title</label>
                        <Input 
                            value={form.title} 
                            onChange={e => setForm({ ...form, title: e.target.value })} 
                            disabled={isSaving} 
                            className="border-slate-200 h-9 shadow-sm rounded-md text-sm font-bold focus:ring-1 focus:ring-[#4B7BEC]" 
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Description</label>
                        <textarea 
                            value={form.description || ""} 
                            onChange={e => setForm({ ...form, description: e.target.value })} 
                            disabled={isSaving} 
                            className="w-full min-h-[80px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 focus:ring-1 focus:ring-[#4B7BEC] focus:outline-none shadow-sm" 
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Due Date</label>
                        <Input 
                            type="date" 
                            value={form.due_date || ""} 
                            onChange={e => setForm({ ...form, due_date: e.target.value })} 
                            disabled={isSaving} 
                            className="border-slate-200 h-9 shadow-sm rounded-md text-sm font-bold focus:ring-1 focus:ring-[#4B7BEC]" 
                        />
                    </div>
                    {!isEmployee && (
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Assign To</label>
                            <Select 
                                value={String(form.assigned_to_id || "")} 
                                onValueChange={v => setForm({ ...form, assigned_to_id: Number(v) })}
                            >
                                <SelectTrigger className="border-slate-200 h-9 rounded-md text-sm font-semibold focus:ring-1 focus:ring-[#4B7BEC]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-md">
                                    {members.map(m => (
                                        <SelectItem key={m.user_id} value={String(m.user_id)} className="text-sm font-medium">
                                            {m.user?.full_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    {editingTask && (
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Status</label>
                            <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                                <SelectTrigger className="border-slate-200 h-9 rounded-md text-sm font-semibold focus:ring-1 focus:ring-[#4B7BEC]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-md">
                                    <SelectItem value="todo" className="text-sm font-medium">To Do</SelectItem>
                                    <SelectItem value="in_progress" className="text-sm font-medium">In Progress</SelectItem>
                                    <SelectItem value="done" className="text-sm font-medium">Done</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2.5">
                    <Button variant="ghost" onClick={() => onClose(false)} disabled={isSaving} className="font-bold rounded-md px-5 text-xs text-slate-500 h-9">
                        Cancel
                    </Button>
                    <Button onClick={onSave} disabled={isSaving} className="bg-[#4B7BEC] hover:bg-[#3b60c0] min-w-[100px] font-bold rounded-md uppercase tracking-widest text-[10px] h-9 shadow-md shadow-blue-100">
                        {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
