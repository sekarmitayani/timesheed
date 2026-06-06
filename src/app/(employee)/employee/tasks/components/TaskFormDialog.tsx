"use client";

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Bold, Italic, Underline, List, ListOrdered } from "lucide-react";
import { cn } from "@/lib/utils";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";
import { useRef, useEffect } from "react";
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

const RichTextEditor = ({ value, onChange, disabled }: { value: string, onChange: (v: string) => void, disabled: boolean }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value || "";
        }
    }, [value]);

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.ctrlKey || e.metaKey) {
            if (e.key.toLowerCase() === 'b') { e.preventDefault(); document.execCommand('bold', false); }
            if (e.key.toLowerCase() === 'i') { e.preventDefault(); document.execCommand('italic', false); }
            if (e.key.toLowerCase() === 'u') { e.preventDefault(); document.execCommand('underline', false); }
        }
    };

    return (
        <div
            ref={editorRef}
            contentEditable={!disabled}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            className={cn(
                "min-h-[100px] max-h-[300px] overflow-y-auto p-3 text-sm focus:outline-none custom-scrollbar cursor-text [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:my-1 [&_ol]:my-1",
                disabled && "opacity-50 cursor-not-allowed bg-slate-50"
            )}
            style={{
                WebkitUserSelect: "text",
                userSelect: "text"
            }}
        />
    );
};

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
    const handleFormat = (command: string) => {
        document.execCommand(command, false, undefined);
    };

    return (
        <Dialog open={isOpen} onOpenChange={open => !isSaving && onClose(open)}>
            <DialogContent showCloseButton={false} className="sm:max-w-[500px] p-0 overflow-hidden border-[#e2e8f0] shadow-2xl rounded-md bg-white flex flex-col text-slate-900">
                <DialogDescription className="sr-only">Form to create or edit a task.</DialogDescription>
                <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4">
                    <DialogTitle className="text-lg font-bold text-slate-900">
                        {editingTask ? "Edit Task" : "New Task"}
                    </DialogTitle>
                    <DialogDescription className="text-xs">{editingTask ? `Editing "${editingTask.title}"` : "Create a new task"}</DialogDescription>
                </div>
                <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto custom-scrollbar">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Project</label>
                        <Select 
                            value={String(form.project_id || "")} 
                            onValueChange={v => setForm({ ...form, project_id: Number(v), assigned_to_id: 0 })} 
                            disabled={!!editingTask}
                        >
                            <SelectTrigger className="border-slate-200 h-9 rounded-md text-sm font-semibold focus:ring-1 focus:ring-[#4B7BEC]">
                                <SelectValue placeholder="Select project" />
                            </SelectTrigger>
                            <SelectContent className="rounded-md">
                                {projects.map(p => <SelectItem key={p.id} value={String(p.id)} className="text-sm">{p.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Title *</label>
                        <Input 
                            value={form.title} 
                            onChange={e => setForm({ ...form, title: e.target.value })} 
                            disabled={isSaving} 
                            className="border-slate-200 h-9 shadow-sm rounded-md text-sm font-bold focus:ring-1 focus:ring-[#4B7BEC]" 
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</label>
                        <div className="border border-[#e2e8f0] rounded-md overflow-hidden bg-white">
                            <div className="flex items-center gap-1 border-b border-[#e2e8f0] p-1.5 bg-[#f8fafc]">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-600 hover:bg-slate-200" onClick={(e) => { e.preventDefault(); handleFormat('bold'); }} disabled={isSaving}><Bold className="h-3.5 w-3.5" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-600 hover:bg-slate-200" onClick={(e) => { e.preventDefault(); handleFormat('italic'); }} disabled={isSaving}><Italic className="h-3.5 w-3.5" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-600 hover:bg-slate-200" onClick={(e) => { e.preventDefault(); handleFormat('underline'); }} disabled={isSaving}><Underline className="h-3.5 w-3.5" /></Button>
                                <div className="w-px h-4 bg-slate-300 mx-1"></div>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-600 hover:bg-slate-200" onClick={(e) => { e.preventDefault(); handleFormat('insertUnorderedList'); }} disabled={isSaving}><List className="h-3.5 w-3.5" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-600 hover:bg-slate-200" onClick={(e) => { e.preventDefault(); handleFormat('insertOrderedList'); }} disabled={isSaving}><ListOrdered className="h-3.5 w-3.5" /></Button>
                            </div>
                            <RichTextEditor 
                                value={form.description || ""} 
                                onChange={v => setForm({ ...form, description: v })} 
                                disabled={isSaving} 
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Due Date</label>
                            <CustomDatePicker 
                                date={form.due_date || undefined} 
                                onDateChange={(d) => setForm({ ...form, due_date: d })} 
                                placeholder="Select due date" 
                                disabled={isSaving} 
                                className="h-10 text-sm w-full" 
                            />
                        </div>
                    {!isEmployee && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assign To</label>
                            <Select 
                                value={String(form.assigned_to_id || "")} 
                                onValueChange={v => setForm({ ...form, assigned_to_id: Number(v) })}
                            >
                                <SelectTrigger className="border-slate-200 h-9 rounded-md text-sm font-semibold focus:ring-1 focus:ring-[#4B7BEC]">
                                    <SelectValue placeholder="Select member" />
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
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</label>
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
