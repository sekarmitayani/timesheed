"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/ai/ai-components";
import { PlayCircle, StopCircle, Loader2, Clock, FileText, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { timesheetService, TimesheetLog, ClockInPayload } from "@/lib/services/timesheet-service";
import { projectService } from "@/lib/services/project-service";
import { taskService, ApiTask } from "@/lib/services/task-service";
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

export default function TimesheetPage() {
    const [logs, setLogs] = useState<TimesheetLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasActiveSession, setHasActiveSession] = useState(false);

    // Clock In Dialog
    const [clockInOpen, setClockInOpen] = useState(false);
    const [isClockling, setIsClocking] = useState(false);
    const [projects, setProjects] = useState<ApiProject[]>([]);
    const [tasks, setTasks] = useState<ApiTask[]>([]);
    const [clockInForm, setClockInForm] = useState<ClockInPayload>({ project_id: 0, task_id: null });

    // Clock Out Dialog
    const [clockOutOpen, setClockOutOpen] = useState(false);
    const [clockOutDesc, setClockOutDesc] = useState("");

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const res = await timesheetService.getMyLogs();
            const data = Array.isArray(res) ? res : [];
            setLogs(data);
            // Check if there's an active (no clock_out) session
            setHasActiveSession(data.some(l => l.clock_in && !l.clock_out));
        } catch (e: any) {
            toast.error(e.message || "Failed to load timesheet logs");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchLogs(); }, []);

    const openClockIn = async () => {
        setClockInOpen(true);
        setClockInForm({ project_id: 0, task_id: null });
        setTasks([]);
        if (projects.length === 0) {
            try {
                const res = await projectService.getProjects(1, 100);
                setProjects(res.data || []);
            } catch { /* skip */ }
        }
    };

    const onProjectChange = async (pid: string) => {
        setClockInForm({ ...clockInForm, project_id: Number(pid), task_id: null });
        try {
            const res = await taskService.getProjectTasks(pid);
            setTasks(Array.isArray(res) ? res.filter(t => t.status !== "done") : []);
        } catch { setTasks([]); }
    };

    const handleClockIn = async () => {
        if (!clockInForm.project_id) { toast.error("Select a project"); return; }
        setIsClocking(true);
        try {
            const res = await timesheetService.clockIn(clockInForm);
            toast.success(res.message || "Clock In successful!");
            setClockInOpen(false);
            fetchLogs();
        } catch (e: any) {
            toast.error(e.message || "Clock In failed");
        } finally {
            setIsClocking(false);
        }
    };

    const handleClockOut = async () => {
        if (!clockOutDesc.trim()) { toast.error("Description is required"); return; }
        setIsClocking(true);
        try {
            const res = await timesheetService.clockOut({ task_description: clockOutDesc });
            toast.success(res.message || "Clock Out successful!");
            setClockOutOpen(false);
            setClockOutDesc("");
            fetchLogs();
        } catch (e: any) {
            toast.error(e.message || "Clock Out failed");
        } finally {
            setIsClocking(false);
        }
    };

    const activeLog = logs.find(l => l.clock_in && !l.clock_out);

    return (
        <div className="space-y-6">
            <PageHeader title="Timesheet" description="Track your daily work sessions">
                <div className="flex gap-2">
                    {hasActiveSession ? (
                        <Button size="sm" className="gap-2 bg-red-600 hover:bg-red-700 shadow-md" onClick={() => setClockOutOpen(true)}>
                            <StopCircle className="h-4 w-4" /> Clock Out
                        </Button>
                    ) : (
                        <Button size="sm" className="gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-md" onClick={openClockIn}>
                            <PlayCircle className="h-4 w-4" /> Clock In
                        </Button>
                    )}
                </div>
            </PageHeader>

            {/* Active Session Banner */}
            {activeLog && (
                <Card className="border-emerald-300 bg-emerald-50/50">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-emerald-800">Active Session</p>
                            <p className="text-xs text-emerald-600">
                                Clocked in at {new Date(activeLog.clock_in).toLocaleTimeString("id-ID")} • Project #{activeLog.project_id}
                                {activeLog.task_id ? ` • Task #${activeLog.task_id}` : ""}
                            </p>
                        </div>
                        <Button size="sm" variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-100" onClick={() => setClockOutOpen(true)}>
                            <StopCircle className="h-3 w-3 mr-1" /> End Session
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Log History */}
            <Card className="border-[#e2e8f0] shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-[#f8fafc]">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead>Date</TableHead>
                                    <TableHead>Clock In</TableHead>
                                    <TableHead>Clock Out</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={6} className="h-48 text-center"><Loader2 className="h-6 w-6 animate-spin text-[#2568C1] mx-auto" /></TableCell></TableRow>
                                ) : logs.length === 0 ? (
                                    <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-sm">No timesheet logs yet. Clock in to start!</TableCell></TableRow>
                                ) : (
                                    logs.map(l => (
                                        <TableRow key={l.id} className="hover:bg-[#f0f4fa]/50">
                                            <TableCell className="text-xs">{new Date(l.clock_in).toLocaleDateString("id-ID")}</TableCell>
                                            <TableCell className="text-xs font-medium">{new Date(l.clock_in).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</TableCell>
                                            <TableCell className="text-xs">{l.clock_out ? new Date(l.clock_out).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : <span className="text-emerald-600 font-medium">Active</span>}</TableCell>
                                            <TableCell className="text-xs">{l.duration_minutes > 0 ? `${Math.floor(l.duration_minutes / 60)}h ${l.duration_minutes % 60}m` : "—"}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{l.task_description || "—"}</TableCell>
                                            <TableCell><div className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider", statusColors[l.status])}><div className={cn("w-1.5 h-1.5 rounded-full", statusDotColors[l.status])} /><span className="uppercase">{l.status}</span></div></TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Clock In Dialog */}
            <Dialog open={clockInOpen} onOpenChange={open => !isClockling && setClockInOpen(open)}>
                <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-[#e2e8f0]">
                    <div className="bg-gradient-to-r from-emerald-50 to-white border-b border-emerald-200 px-6 py-4">
                        <DialogTitle className="text-lg text-emerald-800 flex items-center gap-2"><PlayCircle className="h-5 w-5" /> Clock In</DialogTitle>
                        <DialogDescription className="text-xs text-emerald-600">Start a new work session.</DialogDescription>
                    </div>
                    <div className="px-6 py-5 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Project <span className="text-red-500">*</span></label>
                            <Select value={String(clockInForm.project_id || "")} onValueChange={onProjectChange}>
                                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                                <SelectContent>{projects.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        {tasks.length > 0 && (
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Task (Optional)</label>
                                <Select value={String(clockInForm.task_id || "")} onValueChange={v => setClockInForm({ ...clockInForm, task_id: v ? Number(v) : null })}>
                                    <SelectTrigger><SelectValue placeholder="No specific task" /></SelectTrigger>
                                    <SelectContent>{tasks.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.title}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                    <div className="px-6 py-4 border-t bg-[#f8fafc] flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setClockInOpen(false)} disabled={isClockling}>Cancel</Button>
                        <Button onClick={handleClockIn} disabled={isClockling} className="bg-emerald-600 hover:bg-emerald-700 min-w-[100px]">
                            {isClockling ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start Session"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Clock Out Dialog */}
            <Dialog open={clockOutOpen} onOpenChange={open => !isClockling && setClockOutOpen(open)}>
                <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-[#e2e8f0]">
                    <div className="bg-gradient-to-r from-red-50 to-white border-b border-red-200 px-6 py-4">
                        <DialogTitle className="text-lg text-red-800 flex items-center gap-2"><StopCircle className="h-5 w-5" /> Clock Out</DialogTitle>
                        <DialogDescription className="text-xs text-red-600">End your current session and log your work.</DialogDescription>
                    </div>
                    <div className="px-6 py-5 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">What did you work on? <span className="text-red-500">*</span></label>
                            <Input value={clockOutDesc} onChange={e => setClockOutDesc(e.target.value)} placeholder="Describe what you accomplished..." disabled={isClockling} />
                        </div>
                    </div>
                    <div className="px-6 py-4 border-t bg-[#f8fafc] flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setClockOutOpen(false)} disabled={isClockling}>Cancel</Button>
                        <Button onClick={handleClockOut} disabled={isClockling} className="bg-red-600 hover:bg-red-700 min-w-[100px]">
                            {isClockling ? <Loader2 className="h-4 w-4 animate-spin" /> : "End Session"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
