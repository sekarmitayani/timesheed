"use client";

import { useState, useEffect } from "react";
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
    CalendarDays, Calendar as CalendarIcon, Layers,
    ChevronDown, ChevronUp
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
    const [showAllLogs, setShowAllLogs] = useState(false);

    useEffect(() => {
        setShowAllLogs(false);
    }, [selectedTask?.id, isOpen]);

    if (!selectedTask) return null;

    const getInitials = (name: string) => (name || "?").split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();

    const parseMarkdown = (text: string) => {
        if (!text) return "";
        let html = text
            .replace(/&lt;u&gt;(.*?)&lt;\/u&gt;/g, "<u>$1</u>")
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.*?)\*/g, "<em>$1</em>");
            
        // If the text contains HTML lists from the editor, avoid breaking them
        if (!html.includes("<ul") && !html.includes("<ol") && !html.includes("<li")) {
            html = html.replace(/\n/g, "<br />");
            html = html.replace(/(?:^|<br \/>)- (.*?)(?=(<br \/>|$))/g, "<li>$1</li>");
            html = html.replace(/(<li>.*?<\/li>)+/g, "<ul class='list-disc pl-5 my-1'>$&</ul>");
            html = html.replace(/(?:^|<br \/>)\d+\. (.*?)(?=(<br \/>|$))/g, "<li>$1</li>");
            html = html.replace(/(<li>.*?<\/li>)+/g, "<ol class='list-decimal pl-5 my-1'>$&</ol>");
        }

        return html;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent 
                showCloseButton={false}
                className="w-[calc(100vw-1.5rem)] sm:w-[calc(100vw-2rem)] md:max-w-[740px] lg:max-w-[1050px] xl:max-w-[1100px] p-0 gap-0 overflow-hidden border-none shadow-2xl rounded-md max-h-[92vh] sm:max-h-[90vh] flex flex-col bg-white"
            >
                <DialogDescription className="sr-only">Detailed information about the task, including description, timesheets, comments, and activity history.</DialogDescription>
                
                <div className="flex flex-wrap sm:flex-nowrap items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3.5 border-b border-slate-100 bg-white z-30 shrink-0 gap-2">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Badge variant="outline" className={`${statusConfig[selectedTask.status].badge} text-[10px] font-bold px-2.5 py-0.5 rounded-md border-opacity-50 shrink-0`}>
                            {statusConfig[selectedTask.status].label}
                        </Badge>
                        <div className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md shrink-0">
                            <Clock className="h-3.5 w-3.5 text-[#4B7BEC]" /> <span className="text-slate-500">Logged:</span>
                            <span className="text-[#4B7BEC]">{taskLogs.reduce((acc, curr) => acc + curr.duration_minutes, 0)}m</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        {canManageTask && (
                            <>
                                <Button variant="outline" size="sm" className="h-8 gap-1.5 border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold rounded-md text-[10px] uppercase tracking-wider transition-all px-2.5" onClick={() => { onClose(false); onEdit(selectedTask); }}>
                                    <Pencil className="h-3 w-3" /> Edit
                                </Button>
                                <Button variant="outline" size="sm" className="h-8 gap-1.5 border-red-100 bg-white text-red-500 hover:bg-red-50 font-bold rounded-md text-[10px] uppercase tracking-wider transition-all px-2.5" onClick={() => { onClose(false); onDelete(selectedTask); }}>
                                    <Trash2 className="h-3 w-3" /> Delete
                                </Button>
                            </>
                        )}
                        <div className="w-px h-5 bg-slate-100 mx-0.5 sm:mx-1" />
                        <Button variant="outline" size="icon" className="h-8 w-8 border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-md" onClick={() => onClose(false)}>
                            <XIcon className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto lg:overflow-hidden min-h-0">
                    {/* Left Side: Content & Tabs */}
                    <div className="w-full lg:flex-1 flex flex-col min-w-0 border-b lg:border-b-0 lg:border-r border-slate-100 lg:overflow-y-auto bg-white custom-scrollbar">
                        <div className="p-4 sm:p-5 lg:p-6 space-y-4">
                            <div>
                                <DialogTitle className="text-lg sm:text-xl font-bold text-slate-900 leading-snug tracking-tight break-words">
                                    {selectedTask.title}
                                </DialogTitle>
                            </div>
                            
                            <div className="space-y-1.5">
                                <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                    <ListTodo className="h-3.5 w-3.5" /> Description
                                </h5>
                                <div className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium bg-slate-50/40 rounded-md p-3 border border-slate-100 min-h-[60px] break-words whitespace-pre-wrap [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:my-1 [&_ol]:my-1">
                                    {selectedTask.description ? (
                                        <div dangerouslySetInnerHTML={{ __html: parseMarkdown(selectedTask.description) }} />
                                    ) : "No description provided."}
                                </div>
                            </div>

                            <div className="space-y-3 pt-3 border-t border-slate-100">
                                <Tabs defaultValue="comments" className="w-full">
                                    <TabsList className="bg-transparent h-auto p-0 border-b border-slate-100 w-full justify-start rounded-none gap-4 sm:gap-6 overflow-x-auto">
                                        <TabsTrigger value="comments" className="bg-transparent border-b-2 border-transparent data-[state=active]:border-[#4B7BEC] data-[state=active]:bg-transparent rounded-none px-0 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 data-[state=active]:text-[#4B7BEC] transition-all shrink-0">
                                            <MessageSquare className="h-3.5 w-3.5 mr-1.5" /> Comments
                                        </TabsTrigger>
                                        <TabsTrigger value="timesheet" className="bg-transparent border-b-2 border-transparent data-[state=active]:border-[#4B7BEC] data-[state=active]:bg-transparent rounded-none px-0 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 data-[state=active]:text-[#4B7BEC] transition-all shrink-0">
                                            <Clock className="h-3.5 w-3.5 mr-1.5" /> Timesheet
                                        </TabsTrigger>
                                        <TabsTrigger value="history" className="bg-transparent border-b-2 border-transparent data-[state=active]:border-[#4B7BEC] data-[state=active]:bg-transparent rounded-none px-0 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 data-[state=active]:text-[#4B7BEC] transition-all shrink-0">
                                            <HistoryIcon className="h-3.5 w-3.5 mr-1.5" /> History
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="comments" className="pt-3 space-y-3">
                                        <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                                            {isLoadingActivities ? (
                                                <div className="py-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-[#4B7BEC] opacity-20" /></div>
                                            ) : comments.length === 0 ? (
                                                <div className="py-6 text-center text-[10px] font-bold text-slate-300 uppercase tracking-wider">No comments yet</div>
                                            ) : (
                                                comments.map(comm => (
                                                    <div key={comm.id} className="flex gap-2.5">
                                                        <Avatar size="sm" className="rounded-full border border-slate-100 shrink-0">
                                                            <AvatarFallback className="text-[9px] font-bold rounded-full bg-gradient-to-br from-[#2568C1] to-[#1a4f99] text-white">
                                                                {getInitials(comm.user?.full_name || "")}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1 space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-bold text-slate-800">{comm.user?.full_name}</span>
                                                                <span className="text-[10px] font-medium text-slate-400">{format(new Date(comm.created_at), "dd MMM, HH:mm")}</span>
                                                            </div>
                                                            <div className="bg-slate-50/80 rounded-md p-2.5 text-xs text-slate-600 border border-slate-100">{comm.comment}</div>
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
                                                className="min-h-[72px] rounded-md border-slate-200 focus:ring-2 focus:ring-[#2568C1] focus:border-[#2568C1] pr-10 text-xs font-medium pt-2 resize-none shadow-xs transition-all duration-200" 
                                            />
                                            <Button 
                                                size="icon" 
                                                disabled={isSendingComment || !commentText.trim()} 
                                                onClick={onSendComment} 
                                                className="absolute bottom-2 right-2 h-7 w-7 bg-[#4B7BEC] hover:bg-[#3b60c0] rounded-md shadow-sm"
                                            >
                                                {isSendingComment ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                                            </Button>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="timesheet" className="pt-3">
                                        <div className="bg-white border border-slate-100 rounded-md overflow-hidden shadow-2xs">
                                            {isLoadingLogs ? (
                                                <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-[#4B7BEC] opacity-20" /></div>
                                            ) : taskLogs.length === 0 ? (
                                                <div className="py-8 flex flex-col items-center justify-center text-slate-300">
                                                    <Clock className="h-6 w-6 mb-1.5 opacity-20" />
                                                    <p className="text-[10px] font-bold uppercase tracking-wider">No logs recorded yet</p>
                                                </div>
                                            ) : (
                                                <>
                                                    <Table>
                                                        <TableHeader className="bg-slate-50/50">
                                                            <TableRow className="h-8 hover:bg-transparent border-b border-slate-100">
                                                                <TableHead className="text-[10px] font-bold uppercase text-slate-400 px-3 py-1">Date</TableHead>
                                                                <TableHead className="text-[10px] font-bold uppercase text-slate-400 px-3 py-1">Time Window</TableHead>
                                                                <TableHead className="text-[10px] font-bold uppercase text-slate-400 px-3 py-1 text-right">Duration</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {(showAllLogs ? taskLogs : taskLogs.slice(0, 10)).map(log => (
                                                                <TableRow key={log.id} className="h-9 text-[11px] border-b border-slate-50 last:border-0 hover:bg-slate-50/30 transition-colors">
                                                                    <TableCell className="py-1.5 px-3 font-bold text-slate-700">{format(new Date(log.clock_in), "dd MMM yyyy")}</TableCell>
                                                                    <TableCell className="py-1.5 px-3 font-medium text-slate-500">{format(new Date(log.clock_in), "HH:mm")} - {log.clock_out ? format(new Date(log.clock_out), "HH:mm") : "..."}</TableCell>
                                                                    <TableCell className="py-1.5 px-3 text-right font-bold text-[#4B7BEC]">{log.duration_minutes}m</TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                    {taskLogs.length > 10 && (
                                                        <div className="p-2 border-t border-slate-100 bg-slate-50/40 flex justify-center">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setShowAllLogs(!showAllLogs)}
                                                                className="h-7 text-[11px] font-bold text-[#4B7BEC] hover:text-[#385bb5] hover:bg-blue-50/50 gap-1.5 rounded-md transition-colors"
                                                            >
                                                                {showAllLogs ? (
                                                                    <>
                                                                        <ChevronUp className="h-3.5 w-3.5" />
                                                                        Show Less (First 10)
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <ChevronDown className="h-3.5 w-3.5" />
                                                                        Show Remaining ({taskLogs.length - 10} more)
                                                                    </>
                                                                )}
                                                            </Button>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="history" className="pt-3">
                                        <div className="space-y-3.5 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
                                            {isLoadingActivities ? (
                                                <div className="py-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-[#4B7BEC] opacity-20" /></div>
                                            ) : auditLogs.length === 0 ? (
                                                <div className="py-6 text-center text-[10px] font-bold text-slate-300 uppercase tracking-wider">No activity logs</div>
                                            ) : (
                                                auditLogs.map((log, i) => (
                                                    <div key={log.id} className="flex gap-3 relative">
                                                        {i !== auditLogs.length - 1 && <div className="absolute left-[7px] top-3.5 bottom-[-14px] w-0.5 bg-slate-100" />}
                                                        <div className="h-3.5 w-3.5 rounded-full border-2 border-slate-200 bg-white z-10 flex items-center justify-center shrink-0 mt-0.5">
                                                            <div className="h-1 w-1 rounded-full bg-slate-300" />
                                                        </div>
                                                        <div className="space-y-0.5 min-w-0">
                                                            <p className="text-xs font-medium text-slate-600">
                                                                <span className="font-bold text-slate-900">{log.user?.full_name || `User #${log.user_id}`}</span> {log.action.toLowerCase()}d task
                                                            </p>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{format(new Date(log.created_at), "dd MMM yyyy, HH:mm")}</p>
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
                    <div className="w-full lg:w-[280px] lg:shrink-0 bg-slate-50/50 flex flex-col min-w-0 lg:overflow-y-auto custom-scrollbar">
                        <div className="p-4 sm:p-5 lg:p-4 space-y-3.5 h-full">
                            <div>
                                <Button 
                                    className="w-full h-9 gap-2 bg-[#4B7BEC] hover:bg-[#3b60c0] font-bold rounded-md uppercase tracking-wider text-[11px] shadow-sm" 
                                    onClick={onClockIn} 
                                    disabled={isClockingIn}
                                >
                                    {isClockingIn ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Clock className="h-3.5 w-3.5" />} Clock In
                                </Button>
                            </div>
                            <Separator className="bg-slate-100" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 sm:gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5"><User2 className="h-3 w-3" /> Assignee</label>
                                    <div className="flex items-center gap-2.5 bg-white p-2.5 rounded-md border border-slate-100 shadow-2xs">
                                        <Avatar size="sm" className="rounded-full border border-slate-100 shrink-0">
                                            <AvatarFallback className="rounded-full font-bold text-xs bg-gradient-to-br from-[#2568C1] to-[#1a4f99] text-white">{getInitials(assignee?.full_name || "")}</AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-slate-800 truncate">{assignee?.full_name || "Unassigned"}</p>
                                            <p className="text-[10px] font-medium text-slate-400 truncate">{assignee?.email || "No email"}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5"><Briefcase className="h-3 w-3" /> Reporter</label>
                                    <div className="flex items-center gap-2.5 bg-white p-2.5 rounded-md border border-slate-100 shadow-2xs">
                                        <Avatar size="sm" className="rounded-full border border-slate-100 shrink-0">
                                            <AvatarFallback className="rounded-full font-bold text-xs bg-gradient-to-br from-[#2568C1] to-[#1a4f99] text-white">{getInitials(reporter?.full_name || "")}</AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-slate-800 truncate">{reporter?.full_name || "System"}</p>
                                            <p className="text-[10px] font-medium text-slate-400 truncate">{reporter?.email || "No email"}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5"><CalendarDays className="h-3 w-3" /> Due Date</label>
                                    <div className="bg-white p-2.5 rounded-md border border-slate-100 shadow-2xs flex items-center gap-2.5">
                                        <div className="h-7 w-7 rounded-md bg-amber-50 flex items-center justify-center text-amber-500 shrink-0"><CalendarIcon className="h-3.5 w-3.5" /></div>
                                        <span className="text-xs font-bold text-slate-700">{selectedTask.due_date ? format(new Date(selectedTask.due_date), "dd MMM yyyy") : "None"}</span>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5"><Layers className="h-3 w-3" /> Project</label>
                                    <div className="flex items-center gap-2.5 bg-white p-2.5 rounded-md border border-slate-100 shadow-2xs">
                                        <div className="h-7 w-7 rounded-md bg-[#4B7BEC]/5 flex items-center justify-center text-[#4B7BEC] shrink-0"><Layers className="h-3.5 w-3.5" /></div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-slate-800 truncate">{getProjectName(selectedTask.project_id)}</p>
                                            <p className="text-[10px] font-medium text-slate-400">ID: #{selectedTask.project_id}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 pt-1 pb-4">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Created At</span>
                                    <span className="text-[11px] font-semibold text-slate-600 bg-white border border-slate-100 px-2.5 py-1.5 rounded-md shadow-2xs">{formatDateTime(selectedTask.created_at)}</span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Last Update</span>
                                    <span className="text-[11px] font-semibold text-slate-600 bg-white border border-slate-100 px-2.5 py-1.5 rounded-md shadow-2xs">{formatDateTime(selectedTask.updated_at)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
