"use client";

import { useRef, useEffect } from "react";

import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, Edit, Calendar, Clock, AlertTriangle, Bold, Italic, Underline, List, ListOrdered } from "lucide-react";
import { cn } from "@/lib/utils";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";
import { toast } from "sonner";

interface PMProjectDialogsProps {
    state: any;
    actions: any;
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

export function PMProjectDialogs({ state, actions }: PMProjectDialogsProps) {
    const { 
        taskDialogOpen, taskEditing, taskForm, 
        resDialogOpen, resEditing, resForm,
        resDetailOpen, selectedRes, deleteTarget,
        isSaving, isDeleting, members 
    } = state;

    const handleFormat = (command: string) => {
        document.execCommand(command, false, undefined);
    };

    const resStatusColors: Record<string, string> = {
        pending: "bg-amber-50 text-amber-700",
        approved: "bg-emerald-50 text-emerald-700",
        rejected: "bg-red-50 text-red-700",
    };
    const resStatusDotColors: Record<string, string> = {
        pending: "bg-amber-500",
        approved: "bg-emerald-500",
        rejected: "bg-red-500",
    };

    return (
        <>
            {/* TASK CREATE / EDIT DIALOG */}
            <Dialog open={taskDialogOpen} onOpenChange={o => !isSaving && actions.setTaskDialogOpen(o)}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-[#e2e8f0] gap-0 rounded-md">
                    <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4 pr-12">
                        <DialogTitle className="text-lg font-bold text-slate-900">{taskEditing ? "Edit Task" : "New Task"}</DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 mt-0.5">{taskEditing ? `Editing "${taskEditing.title}"` : "Create a new task for this project"}</DialogDescription>
                    </div>
                    <div className="px-6 pt-3.5 pb-5 space-y-4 max-h-[65vh] overflow-y-auto custom-scrollbar">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-[#0f172a]">Title <span className="text-red-500">*</span></label>
                            <Input value={taskForm.title} onChange={e => actions.setTaskForm({ ...taskForm, title: e.target.value })} className="h-10 bg-white border-input rounded-md text-sm" disabled={isSaving} placeholder="Enter task title..." />
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
                                    value={taskForm.description || ""}
                                    onChange={v => actions.setTaskForm({ ...taskForm, description: v })}
                                    disabled={isSaving}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-[#0f172a]">Assignee</label>
                                <Select value={String(taskForm.assigned_to_id || "")} onValueChange={v => actions.setTaskForm({ ...taskForm, assigned_to_id: Number(v) })} disabled={isSaving}>
                                    <SelectTrigger className="h-10 bg-white rounded-md"><SelectValue placeholder="Select member" /></SelectTrigger>
                                    <SelectContent className="rounded-md">
                                        {members.map((m: any) => (
                                            <SelectItem key={m.user_id} value={String(m.user_id)}>{m.user?.full_name || `User #${m.user_id}`}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-[#0f172a]">Due Date</label>
                                <CustomDatePicker 
                                    date={taskForm.due_date || undefined} 
                                    onDateChange={(d) => actions.setTaskForm({ ...taskForm, due_date: d })} 
                                    placeholder="Select due date" 
                                    disabled={isSaving} 
                                    className="h-10 text-sm w-full bg-white rounded-md" 
                                />
                            </div>
                            {taskEditing && (
                                <div className="space-y-1.5 sm:col-span-2">
                                    <label className="text-sm font-medium text-[#0f172a]">Status</label>
                                    <Select value={taskForm.status || "todo"} onValueChange={v => actions.setTaskForm({ ...taskForm, status: v })} disabled={isSaving}>
                                        <SelectTrigger className="h-10 bg-white rounded-md"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-md">
                                            <SelectItem value="todo">To Do</SelectItem>
                                            <SelectItem value="in_progress">In Progress</SelectItem>
                                            <SelectItem value="done">Done</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => actions.setTaskDialogOpen(false)} disabled={isSaving} className="text-[#64748b] hover:text-[#0f172a] rounded-md">Cancel</Button>
                        <Button onClick={() => {
                            if (!taskForm.title?.trim()) {
                                toast.error("Please fill in all required fields");
                                return;
                            }
                            actions.handleSaveTask();
                        }} disabled={isSaving} className="bg-[#2568C1] hover:bg-[#1e56a6] min-w-[120px] text-white font-semibold rounded-md shadow-sm">
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Save Task"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* RESOURCE CREATE / EDIT DIALOG */}
            <Dialog open={resDialogOpen} onOpenChange={o => !isSaving && actions.setResDialogOpen(o)}>
                <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-[#e2e8f0] gap-0 rounded-md">
                    <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4 pr-12">
                        <DialogTitle className="text-lg font-bold text-slate-900">{resEditing ? "Edit Request" : "New Resource Request"}</DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 mt-0.5">{resEditing ? "Update your resource request details" : "Submit a new request for project resources."}</DialogDescription>
                    </div>
                    <div className="px-6 pt-3.5 pb-5 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-[#0f172a]">Type</label>
                            <Select value={resForm.type} onValueChange={v => actions.setResForm({ ...resForm, type: v })} disabled={isSaving}>
                                <SelectTrigger className="h-10 bg-white rounded-md"><SelectValue placeholder="Select type" /></SelectTrigger>
                                <SelectContent className="rounded-md">
                                    <SelectItem value="manpower">Manpower</SelectItem>
                                    <SelectItem value="tools">Tools</SelectItem>
                                    <SelectItem value="infrastructure">Infrastructure</SelectItem>
                                    <SelectItem value="accommodation">Accommodation</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-[#0f172a]">Details <span className="text-red-500">*</span></label>
                            <textarea
                                className="w-full min-h-[120px] p-3 rounded-md border border-input text-sm bg-white focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none transition-[color,box-shadow]"
                                placeholder="Describe the resource needed, quantity, and reason..."
                                value={resForm.details}
                                onChange={e => actions.setResForm({ ...resForm, details: e.target.value })}
                                disabled={isSaving}
                            />
                        </div>
                    </div>
                    <div className="px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => actions.setResDialogOpen(false)} disabled={isSaving} className="text-[#64748b] hover:text-[#0f172a] rounded-md">Cancel</Button>
                        <Button onClick={() => {
                            if (!resForm.details?.trim()) {
                                toast.error("Please fill in all required fields");
                                return;
                            }
                            actions.handleSaveResource();
                        }} disabled={isSaving} className="bg-[#2568C1] hover:bg-[#1e56a6] min-w-[120px] text-white font-semibold rounded-md shadow-sm">
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Submit Request"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* RESOURCE DETAIL DIALOG */}
            <Dialog open={resDetailOpen} onOpenChange={actions.setResDetailOpen}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-[#e2e8f0] gap-0 rounded-md">
                    <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4 pr-12">
                        <DialogTitle className="text-lg font-bold text-slate-900">Resource Request Details</DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 mt-0.5">Detailed information for this resource request.</DialogDescription>
                    </div>
                    <div className="px-6 pt-4 pb-6 space-y-6 max-h-[70vh] overflow-y-auto">
                        {selectedRes && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</p>
                                        <Badge variant="outline" className="text-[11px] font-black uppercase bg-slate-50 text-slate-500 border-slate-200 px-3 py-1 rounded-md">{selectedRes.type}</Badge>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</p>
                                        <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter", resStatusColors[selectedRes.status])}>
                                            <div className={cn("w-1.5 h-1.5 rounded-full", resStatusDotColors[selectedRes.status])} />
                                            {selectedRes.status}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Details</p>
                                    <p className="text-sm text-slate-700 font-medium bg-slate-50 p-4 rounded-md border border-slate-100 whitespace-pre-wrap leading-relaxed">{selectedRes.details}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Requester</p>
                                        <p className="text-sm font-semibold text-slate-800">{selectedRes.user?.full_name || `User #${selectedRes.user_id}`}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Approved Cost</p>
                                        <p className="text-sm font-bold text-[#2568C1] text-right">Rp {(selectedRes.amount || 0).toLocaleString("id-ID")}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Created At</p>
                                        <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                                            <Calendar className="h-3.5 w-3.5 text-slate-300" />
                                            {selectedRes.created_at ? new Date(selectedRes.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                                        </div>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Update</p>
                                        <div className="flex items-center gap-2 text-xs text-slate-600 font-medium justify-end">
                                            <Clock className="h-3.5 w-3.5 text-slate-300" />
                                            {selectedRes.updated_at ? new Date(selectedRes.updated_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-between gap-3">
                        <div className="flex gap-2">
                            {selectedRes?.status === "pending" && (
                                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 font-semibold rounded-md" onClick={() => actions.setDeleteTarget({ type: "resource", id: selectedRes.id, title: selectedRes.details })}>
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete Request
                                </Button>
                            )}
                        </div>
                        <Button variant="outline" size="sm" className="px-6 font-semibold rounded-md" onClick={() => actions.setResDetailOpen(false)}>Close</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* DELETE CONFIRMATION DIALOG */}
            <Dialog open={!!deleteTarget} onOpenChange={o => !isDeleting && actions.setDeleteTarget(null)}>
                <DialogContent className="sm:max-w-md p-0 overflow-hidden border-[#e2e8f0] gap-0 rounded-md shadow-xl bg-white">
                    <div className="bg-red-50/60 border-b border-red-100 px-6 py-4 pr-12 flex items-center gap-3.5">
                        <div className="p-2 bg-white rounded-md shadow-sm border border-red-200 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-semibold text-[#0f172a]">
                                Delete {deleteTarget?.type === "task" ? "Task" : "Resource Request"}?
                            </DialogTitle>
                            <p className="text-xs text-red-600/80">Permanent action</p>
                        </div>
                    </div>
                    <div className="px-6 pt-3.5 pb-5 text-sm text-slate-600 leading-relaxed">
                        Are you sure you want to delete <span className="font-semibold text-slate-900">&ldquo;{deleteTarget?.title}&rdquo;</span>? This action cannot be undone.
                    </div>
                    <div className="px-6 py-3.5 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end gap-2.5">
                        <Button variant="outline" className="rounded-md" onClick={() => actions.setDeleteTarget(null)} disabled={isDeleting}>Cancel</Button>
                        <Button variant="destructive" className="rounded-md min-w-[100px]" onClick={actions.confirmDelete} disabled={isDeleting}>
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
