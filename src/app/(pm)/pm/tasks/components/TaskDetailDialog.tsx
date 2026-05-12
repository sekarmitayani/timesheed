"use client";

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
    Clock, Pencil, Trash2, X as XIcon, ListTodo, MessageSquare, 
    History as HistoryIcon, Loader2, Send, User2, Briefcase, 
    CalendarDays, Calendar as CalendarIcon, Layers 
} from "lucide-react";
import { format } from "date-fns";
import { ApiTask, TaskComment, TaskAuditLog } from "@/lib/services/task-service";
import { TimesheetLog } from "@/lib/services/timesheet-service";
import { User } from "@/lib/types";

interface TaskDetailDialogProps {
    isOpen: boolean;
    onClose: (open: boolean) => void;
    selectedTask: ApiTask | null;
    taskLogs: TimesheetLog[];
    isLoadingLogs: boolean;
    canManageTask: boolean;
    onEdit: (task: ApiTask) => void;
    onDelete: (task: ApiTask) => void;
    statusConfig: Record<string, { label: string; badge: string }>;
    comments: TaskComment[];
    auditLogs: TaskAuditLog[];
    reporter: User | null;
    assignee: User | null;
    commentText: string;
    setCommentText: (text: string) => void;
    onSendComment: () => Promise<void>;
    isSendingComment: boolean;
    isLoadingActivities: boolean;
    onClockIn: () => Promise<void>;
    isClockingIn: boolean;
    getProjectName: (pid: number) => string;
    currentUser: User | null;
    formatDateTime: (dateStr: string | null) => string;
}

export function TaskDetailDialog({
    isOpen,
    onClose,
    selectedTask,
    taskLogs,
    isLoadingLogs,
    canManageTask,
    onEdit,
    onDelete,
    statusConfig,
    comments,
    auditLogs,
    reporter,
    assignee,
    commentText,
    setCommentText,
    onSendComment,
    isSendingComment,
    isLoadingActivities,
    onClockIn,
    isClockingIn,
    getProjectName,
    currentUser,
    formatDateTime
}: TaskDetailDialogProps) {
    if (!selectedTask) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent showCloseButton={false} className="sm:max-w-[1100px] p-0 gap-0 overflow-hidden border-none shadow-2xl rounded-md max-h-[90vh] flex flex-col bg-white">
                <DialogDescription className="sr-only">Detailed information about the task, including description, timesheets, comments, and activity history.</DialogDescription>
                
                <div className="flex items-center justify-between px-8 py-4 border-b border-slate-100 bg-white z-30 shrink-0">
                    <div className="flex items-center gap-4">
                        <Badge variant="outline" className={`${statusConfig[selectedTask.status].badge} text-[10px] font-bold px-3 py-1 rounded-md border-opacity-50`}>
                            {statusConfig[selectedTask.status].label}
                        </Badge>
                        <div className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-md">
                            <Clock className="h-3.5 w-3.5 text-[#4B7BEC]" /> <span className="text-slate-500">Logged:</span>
                            <span className="text-[#4B7BEC]">{taskLogs.reduce((acc, curr) => acc + curr.duration_minutes, 0)}m</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {canManageTask && (
                            <>
                                <Button variant="outline" size="sm" className="h-9 gap-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold rounded-md text-[10px] uppercase tracking-widest transition-all" onClick={() => { onClose(false); onEdit(selectedTask); }}>
                                    <Pencil className="h-3.5 w-3.5" /> Edit
                                </Button>
                                <Button variant="outline" size="sm" className="h-9 gap-2 border-red-100 bg-white text-red-500 hover:bg-red-50 font-bold rounded-md text-[10px] uppercase tracking-widest transition-all" onClick={() => { onClose(false); onDelete(selectedTask); }}>
                                    <Trash2 className="h-3.5 w-3.5" /> Delete
                                </Button>
                            </>
                        )}
                        <div className="w-px h-6 bg-slate-100 mx-1" />
                        <Button variant="outline" size="icon" className="h-9 w-9 border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-md" onClick={() => onClose(false)}>
                            <XIcon className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Left Side: Content & Tabs */}
                    <div className="flex-[7] flex flex-col min-w-0 border-r border-slate-100 overflow-y-auto bg-white custom-scrollbar">
                        <div className="p-8 pt-6 pb-12 space-y-8">
                            <div className="space-y-4">
                                <DialogTitle className="text-3xl font-bold text-slate-900 leading-tight tracking-tight break-words">
                                    {selectedTask.title}
                                </DialogTitle>
                            </div>
                            
                            <div className="space-y-3">
                                <h5 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <ListTodo className="h-3.5 w-3.5" /> Description
                                </h5>
                                <div className="text-sm text-slate-600 leading-relaxed font-medium bg-slate-50/30 rounded-md p-4 border border-slate-50 min-h-[100px] break-words whitespace-pre-wrap">
                                    {selectedTask.description || "No description provided."}
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-slate-100">
                                <Tabs defaultValue="comments" className="w-full">
                                    <TabsList className="bg-transparent h-auto p-0 border-b border-slate-100 w-full justify-start rounded-none gap-8">
                                        <TabsTrigger value="comments" className="bg-transparent border-b-2 border-transparent data-[state=active]:border-[#4B7BEC] data-[state=active]:bg-transparent rounded-none px-0 py-3 text-xs font-bold uppercase tracking-widest text-slate-400 data-[state=active]:text-[#4B7BEC] transition-all">
                                            <MessageSquare className="h-3.5 w-3.5 mr-2" /> Comments
                                        </TabsTrigger>
                                        <TabsTrigger value="timesheet" className="bg-transparent border-b-2 border-transparent data-[state=active]:border-[#4B7BEC] data-[state=active]:bg-transparent rounded-none px-0 py-3 text-xs font-bold uppercase tracking-widest text-slate-400 data-[state=active]:text-[#4B7BEC] transition-all">
                                            <Clock className="h-3.5 w-3.5 mr-2" /> Timesheet
                                        </TabsTrigger>
                                        <TabsTrigger value="history" className="bg-transparent border-b-2 border-transparent data-[state=active]:border-[#4B7BEC] data-[state=active]:bg-transparent rounded-none px-0 py-3 text-xs font-bold uppercase tracking-widest text-slate-400 data-[state=active]:text-[#4B7BEC] transition-all">
                                            <HistoryIcon className="h-3.5 w-3.5 mr-2" /> History
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="comments" className="pt-6 space-y-6">
                                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                            {isLoadingActivities ? (
                                                <div className="py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#4B7BEC] opacity-20" /></div>
                                            ) : comments.length === 0 ? (
                                                <div className="py-10 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">No comments yet</div>
                                            ) : (
                                                comments.map(comm => (
                                                    <div key={comm.id} className="flex gap-3">
                                                        <Avatar size="sm" className="rounded-md border border-slate-100">
                                                            <AvatarFallback className="text-[10px] font-bold rounded-md bg-blue-100 text-blue-600">
                                                                {comm.user?.full_name?.charAt(0)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1 space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-bold text-slate-800">{comm.user?.full_name}</span>
                                                                <span className="text-[10px] font-medium text-slate-400">{format(new Date(comm.created_at), "MMM d, HH:mm")}</span>
                                                            </div>
                                                            <div className="bg-slate-50 rounded-md p-3 text-sm text-slate-600 border border-slate-100 shadow-sm">{comm.comment}</div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        <div className="relative group">
                                            <Textarea 
                                                value={commentText} 
                                                onChange={(e) => setCommentText(e.target.value)} 
                                                placeholder="Write a comment..." 
                                                className="min-h-[100px] rounded-md border-slate-200 focus:ring-[#4B7BEC] focus:border-[#4B7BEC] pr-12 text-sm font-medium pt-3 resize-none shadow-sm" 
                                            />
                                            <Button 
                                                size="icon" 
                                                disabled={isSendingComment || !commentText.trim()} 
                                                onClick={onSendComment} 
                                                className="absolute bottom-3 right-3 h-8 w-8 bg-[#4B7BEC] hover:bg-[#3b60c0] rounded-md shadow-md shadow-blue-100"
                                            >
                                                {isSendingComment ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                                            </Button>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="timesheet" className="pt-6">
                                        <div className="bg-white border border-slate-100 rounded-md overflow-hidden shadow-sm">
                                            {isLoadingLogs ? (
                                                <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#4B7BEC] opacity-20" /></div>
                                            ) : taskLogs.length === 0 ? (
                                                <div className="py-12 flex flex-col items-center justify-center text-slate-300">
                                                    <Clock className="h-8 w-8 mb-2 opacity-20" />
                                                    <p className="text-[10px] font-bold uppercase tracking-widest">No logs recorded yet</p>
                                                </div>
                                            ) : (
                                                <Table>
                                                    <TableHeader className="bg-slate-50/50">
                                                        <TableRow className="h-10 hover:bg-transparent border-b border-slate-100">
                                                            <TableHead className="text-[10px] font-bold uppercase text-slate-400 px-4">Date</TableHead>
                                                            <TableHead className="text-[10px] font-bold uppercase text-slate-400 px-4">Time Window</TableHead>
                                                            <TableHead className="text-[10px] font-bold uppercase text-slate-400 px-4 text-right">Duration</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {taskLogs.map(log => (
                                                            <TableRow key={log.id} className="h-12 text-[11px] border-b border-slate-50 last:border-0 hover:bg-slate-50/30 transition-colors">
                                                                <TableCell className="py-2 px-4 font-bold text-slate-700">{format(new Date(log.clock_in), "MMM d, yyyy")}</TableCell>
                                                                <TableCell className="py-2 px-4 font-medium text-slate-500">{format(new Date(log.clock_in), "HH:mm")} - {log.clock_out ? format(new Date(log.clock_out), "HH:mm") : "..."}</TableCell>
                                                                <TableCell className="py-2 px-4 text-right font-bold text-[#4B7BEC]">{log.duration_minutes}m</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            )}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="history" className="pt-6">
                                        <div className="space-y-5 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                            {isLoadingActivities ? (
                                                <div className="py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#4B7BEC] opacity-20" /></div>
                                            ) : auditLogs.length === 0 ? (
                                                <div className="py-10 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">No activity logs</div>
                                            ) : (
                                                auditLogs.map((log, i) => (
                                                    <div key={log.id} className="flex gap-4 relative">
                                                        {i !== auditLogs.length - 1 && <div className="absolute left-[7px] top-4 bottom-[-20px] w-0.5 bg-slate-100" />}
                                                        <div className="h-4 w-4 rounded-full border-2 border-slate-200 bg-white z-10 flex items-center justify-center shrink-0 mt-0.5">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                                                        </div>
                                                        <div className="space-y-0.5 min-w-0">
                                                            <p className="text-xs font-medium text-slate-600">
                                                                <span className="font-bold text-slate-900">{log.user?.full_name || `User #${log.user_id}`}</span> {log.action.toLowerCase()}d task
                                                            </p>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{format(new Date(log.created_at), "MMM d, yyyy · HH:mm")}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Sidebar Info */}
                    <div className="flex-[3] bg-slate-50/50 flex flex-col min-w-0 overflow-y-auto custom-scrollbar">
                        <div className="p-8 pt-6 pb-12 space-y-8 h-full">
                            <div className="space-y-3">
                                <Button 
                                    className="w-full h-11 gap-2 bg-[#4B7BEC] hover:bg-[#3b60c0] font-bold rounded-md uppercase tracking-widest text-[11px] shadow-lg shadow-blue-100/30" 
                                    onClick={onClockIn} 
                                    disabled={isClockingIn}
                                >
                                    {isClockingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />} Clock In
                                </Button>
                            </div>
                            <Separator className="bg-slate-100" />
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 flex items-center gap-2"><User2 className="h-3 w-3" /> Assignee</label>
                                    <div className="flex items-center gap-3 bg-white p-3 rounded-md border border-slate-100 shadow-sm">
                                        <Avatar size="sm" className="rounded-md border border-slate-100">
                                            <AvatarFallback className="rounded-md font-bold text-xs bg-blue-50 text-blue-600">{assignee?.full_name?.charAt(0) || "?"}</AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-slate-800 truncate">{assignee?.full_name || "Unassigned"}</p>
                                            <p className="text-[10px] font-medium text-slate-400 truncate">{assignee?.email || "No email"}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 flex items-center gap-2"><Briefcase className="h-3 w-3" /> Reporter</label>
                                    <div className="flex items-center gap-3 bg-white p-3 rounded-md border border-slate-100 shadow-sm">
                                        <Avatar size="sm" className="rounded-md border border-slate-100">
                                            <AvatarFallback className="rounded-md font-bold text-xs bg-slate-100 text-slate-600">{reporter?.full_name?.charAt(0) || "?"}</AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-slate-800 truncate">{reporter?.full_name || "System"}</p>
                                            <p className="text-[10px] font-medium text-slate-400 truncate">{reporter?.email || "No email"}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 flex items-center gap-2"><CalendarDays className="h-3 w-3" /> Due Date</label>
                                    <div className="bg-white p-3 rounded-md border border-slate-100 shadow-sm flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-md bg-amber-50 flex items-center justify-center text-amber-500"><CalendarIcon className="h-4 w-4" /></div>
                                        <span className="text-sm font-bold text-slate-700">{selectedTask.due_date ? format(new Date(selectedTask.due_date), "MMM d, yyyy") : "None"}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 flex items-center gap-2"><Layers className="h-3 w-3" /> Project</label>
                                    <div className="flex items-center gap-3 bg-white p-3 rounded-md border border-slate-100 shadow-sm">
                                        <div className="h-8 w-8 rounded-md bg-[#4B7BEC]/5 flex items-center justify-center text-[#4B7BEC]"><Layers className="h-4 w-4" /></div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-slate-800 truncate">{getProjectName(selectedTask.project_id)}</p>
                                            <p className="text-[10px] font-medium text-slate-400">ID: #{selectedTask.project_id}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-5 pt-2 pb-12">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Created At</span>
                                        <span className="text-xs font-bold text-slate-600 bg-white border border-slate-100 px-3 py-2 rounded-md shadow-sm">{formatDateTime(selectedTask.created_at)}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Last Update</span>
                                        <span className="text-xs font-bold text-slate-600 bg-white border border-slate-100 px-3 py-2 rounded-md shadow-sm">{formatDateTime(selectedTask.updated_at)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
