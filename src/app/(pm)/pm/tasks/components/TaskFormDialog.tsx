"use client";

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Bold, Italic, Underline, List, ListOrdered } from "lucide-react";
import { cn } from "@/lib/utils";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";
import { useRef, useEffect, useState } from "react";
import { toast } from "sonner";
import { aiService } from "@/lib/services/ai-service";
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
    const [isRecommending, setIsRecommending] = useState(false);
    const [recommendedComplexity, setRecommendedComplexity] = useState<number | null>(null);

    const handleFormat = (command: string) => {
        document.execCommand(command, false, undefined);
    };

    const handleAISuggestion = async () => {
        if (!form.title) return;
        setIsRecommending(true);
        try {
            const score = await aiService.recommendTaskComplexity(form.title, form.description || "");
            setRecommendedComplexity(score);
        } catch (error) {
            console.error("Failed to get recommendation", error);
        } finally {
            setIsRecommending(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={open => !isSaving && onClose(open)}>
            <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden border-[#e2e8f0] gap-0 rounded-md">
                <DialogDescription className="sr-only">Form to create or edit a task.</DialogDescription>
                <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4 pr-12">
                    <DialogTitle className="text-lg font-bold text-slate-900">
                        {editingTask ? "Edit Task" : "New Task"}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500 mt-0.5">{editingTask ? `Editing "${editingTask.title}"` : "Create a new task"}</DialogDescription>
                </div>
                <div className="px-6 pt-3.5 pb-5 space-y-4 max-h-[65vh] overflow-y-auto custom-scrollbar">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-[#0f172a]">Project <span className="text-red-500">*</span></label>
                        <Select 
                            value={String(form.project_id || "")} 
                            onValueChange={v => setForm({ ...form, project_id: Number(v), assigned_to_id: 0 })} 
                            disabled={!!editingTask}
                        >
                            <SelectTrigger className="h-10 bg-white rounded-md">
                                <SelectValue placeholder="Select project" />
                            </SelectTrigger>
                            <SelectContent className="rounded-md">
                                {projects.map(p => <SelectItem key={p.id} value={String(p.id)} className="text-sm">{p.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-[#0f172a]">Title <span className="text-red-500">*</span></label>
                        <Input 
                            value={form.title} 
                            onChange={e => setForm({ ...form, title: e.target.value })} 
                            disabled={isSaving} 
                            placeholder="Enter task title..."
                            className="h-10 bg-white border-input rounded-md text-sm" 
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-[#0f172a]">Description</label>
                        <div className="border border-slate-200 rounded-md overflow-hidden bg-white">
                            <div className="flex items-center gap-1 border-b border-slate-200 p-1.5 bg-[#f8fafc]">
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
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Due Date <span className="text-red-500">*</span></label>
                            <CustomDatePicker 
                                date={form.due_date || undefined} 
                                onDateChange={(d) => setForm({ ...form, due_date: d })} 
                                placeholder="Select due date" 
                                disabled={isSaving} 
                                className="h-11 text-sm w-full border border-slate-200" 
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
                                Complexity (1-5) <span className="text-red-500">*</span>
                            </label>
                            <Input 
                                type="number" 
                                min={1} max={5}
                                value={form.complexity || ""} 
                                onChange={e => setForm({ ...form, complexity: Number(e.target.value) })} 
                                disabled={isSaving} 
                                placeholder="1 = Very Easy, 5 = Very Hard"
                                className="h-11 border-slate-200 text-sm" 
                            />
                            <div className="flex items-center justify-between mt-1">
                                <Button 
                                    type="button"
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={handleAISuggestion} 
                                    disabled={isRecommending || !form.title}
                                    className="h-6 text-[10px] px-2 text-[#4B7BEC] hover:bg-blue-50"
                                >
                                    {isRecommending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : "AI Suggestion"}
                                </Button>
                                {recommendedComplexity && (
                                    <p className="text-[10px] text-emerald-600 font-semibold">
                                        AI merekomendasikan level: {recommendedComplexity}
                                    </p>
                                )}
                            </div>
                        </div>
                    {!isEmployee && (
                        <div className="space-y-1.5 sm:col-span-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Assign To <span className="text-red-500">*</span></label>
                            <Select 
                                value={String(form.assigned_to_id || "")} 
                                onValueChange={v => setForm({ ...form, assigned_to_id: Number(v) })}
                            >
                                <SelectTrigger className="h-11">
                                    <SelectValue placeholder="Select member" />
                                </SelectTrigger>
                                <SelectContent>
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
                        <div className="space-y-1.5 sm:col-span-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Status <span className="text-red-500">*</span></label>
                            <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                                <SelectTrigger className="h-11">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todo" className="text-sm font-medium">To Do</SelectItem>
                                    <SelectItem value="in_progress" className="text-sm font-medium">In Progress</SelectItem>
                                    <SelectItem value="done" className="text-sm font-medium">Done</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    </div>
                </div>
                <div className="px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end gap-3">
                    <Button variant="ghost" onClick={() => onClose(false)} disabled={isSaving} className="text-[#64748b] hover:text-[#0f172a] rounded-md">
                        Cancel
                    </Button>
                    <Button onClick={() => {
                        if (!form.project_id || !form.title?.trim() || !form.due_date || !form.complexity || (!isEmployee && !form.assigned_to_id) || (editingTask && !form.status)) {
                            toast.error("Please fill in all required fields");
                            return;
                        }
                        onSave();
                    }} disabled={isSaving} className="bg-[#2568C1] hover:bg-[#1e56a6] min-w-[120px] text-white font-semibold rounded-md shadow-sm">
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Save Task"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
