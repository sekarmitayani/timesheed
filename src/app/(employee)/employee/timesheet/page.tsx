"use client";

import { useState, useMemo } from "react";
import { FileText, Send, Edit2, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, RiskBadge, AIConfidence } from "@/components/ai/ai-components";
import { useDataStore } from "@/store/useDataStore";
import { useAuthStore } from "@/store/useAuthStore";
import { detectAnomaly } from "@/lib/ai/anomaly";
import { toast } from "sonner";

export default function TimesheetPage() {
    const user = useAuthStore((s) => s.user);
    const timesheets = useDataStore((s) => s.timesheets);
    const projects = useDataStore((s) => s.projects);
    const submitTimesheet = useDataStore((s) => s.submitTimesheet);
    const updateTask = useDataStore((s) => s.updateTask);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editHours, setEditHours] = useState("");

    const myTimesheets = useMemo(() => {
        return timesheets
            .filter((t) => t.userId === user?.id)
            .map((ts) => ({
                ...ts,
                anomaly: detectAnomaly(ts),
                projectName: projects.find((p) => p.id === ts.projectId)?.name || "Unknown",
            }));
    }, [timesheets, user?.id, projects]);

    const handleSubmit = (id: string) => {
        submitTimesheet(id);
        toast.success("Timesheet submitted for approval");
    };

    const handleStartEdit = (id: string, currentHours: number) => {
        setEditingId(id);
        setEditHours(String(currentHours));
    };

    const handleSaveEdit = (id: string) => {
        const newHours = parseFloat(editHours);
        if (isNaN(newHours) || newHours <= 0) { toast.error("Enter valid hours"); return; }
        // Update hours in data store via direct state mutation
        useDataStore.setState((s) => ({
            timesheets: s.timesheets.map((t) => t.id === id ? { ...t, hours: newHours, overtime: Math.max(0, newHours - 8) } : t),
        }));
        setEditingId(null);
        toast.success("Hours updated");
    };

    const statusColor: Record<string, string> = {
        draft: "bg-zinc-500/10 text-zinc-500",
        submitted: "bg-blue-500/10 text-blue-500",
        approved: "bg-emerald-500/10 text-emerald-500",
        rejected: "bg-red-500/10 text-red-500",
    };

    return (
        <div className="space-y-6">
            <PageHeader title="My Timesheet" description="Log and submit your weekly hours with AI anomaly detection" />

            <Card>
                <CardHeader><CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4" /> Weekly Entries</CardTitle></CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Project</TableHead>
                                <TableHead>Hours</TableHead>
                                <TableHead>OT</TableHead>
                                <TableHead>Clock</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>AI Risk</TableHead>
                                <TableHead className="w-32">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {myTimesheets.map((ts) => (
                                <TableRow key={ts.id} className={ts.anomaly.riskLevel === "high" ? "bg-red-500/5" : ts.anomaly.riskLevel === "medium" ? "bg-amber-500/5" : ""}>
                                    <TableCell className="text-sm">{ts.date}</TableCell>
                                    <TableCell className="text-sm">{ts.projectName}</TableCell>
                                    <TableCell>
                                        {editingId === ts.id ? (
                                            <Input type="number" value={editHours} onChange={(e) => setEditHours(e.target.value)} className="h-7 w-16 text-sm" />
                                        ) : (
                                            <span className={`text-sm font-medium ${ts.hours > 10 ? "text-red-500" : ""}`}>{ts.hours}h</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm">{ts.overtime > 0 ? <span className="text-amber-500">+{ts.overtime}h</span> : "—"}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">{ts.clockIn} – {ts.clockOut}</TableCell>
                                    <TableCell><Badge className={`text-[10px] ${statusColor[ts.status]}`}>{ts.status}</Badge></TableCell>
                                    <TableCell>
                                        {ts.anomaly.riskScore > 0 ? (
                                            <RiskBadge level={ts.anomaly.riskLevel} score={ts.anomaly.riskScore} />
                                        ) : (
                                            <span className="text-xs text-emerald-500">✓ Clean</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            {editingId === ts.id ? (
                                                <>
                                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-emerald-500" onClick={() => handleSaveEdit(ts.id)}><Save className="h-3.5 w-3.5" /></Button>
                                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditingId(null)}><X className="h-3.5 w-3.5" /></Button>
                                                </>
                                            ) : (
                                                <>
                                                    {ts.status === "draft" && (
                                                        <>
                                                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleStartEdit(ts.id, ts.hours)}><Edit2 className="h-3.5 w-3.5" /></Button>
                                                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleSubmit(ts.id)}>
                                                                <Send className="h-3 w-3" /> Submit
                                                            </Button>
                                                        </>
                                                    )}
                                                    {ts.status === "rejected" && (
                                                        <>
                                                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleStartEdit(ts.id, ts.hours)}><Edit2 className="h-3.5 w-3.5" /></Button>
                                                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleSubmit(ts.id)}>
                                                                <Send className="h-3 w-3" /> Re-submit
                                                            </Button>
                                                        </>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
