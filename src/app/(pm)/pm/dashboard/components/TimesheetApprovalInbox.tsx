"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRight, UserCircle2, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { TimesheetLog } from "@/lib/services/timesheet-service";

interface TimesheetApprovalInboxProps {
    pendingTimesheets: TimesheetLog[];
}

export function TimesheetApprovalInbox({ pendingTimesheets }: TimesheetApprovalInboxProps) {
    const router = useRouter();

    // Show only the 5 most recent
    const displayTimesheets = pendingTimesheets.slice(0, 5);

    const formatDuration = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}h ${m}m`;
    };

    return (
        <Card className="bg-white border-slate-100 shadow-sm rounded-xl overflow-hidden flex flex-col">
            <CardHeader className="pb-2.5 border-b border-slate-50 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-amber-500" /> Timesheet Approval Inbox
                    </CardTitle>
                    <p className="text-[9px] text-slate-400 font-medium ml-5.5 -mt-0.5">Pending team timesheets awaiting review</p>
                </div>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-[9px] font-bold text-[#4B7BEC] gap-1 hover:bg-blue-50 px-2" 
                    onClick={() => router.push("/pm/approvals?status=pending")}
                >
                    View All <ArrowRight className="h-3 w-3" />
                </Button>
            </CardHeader>
            <CardContent className="p-3 flex-1">
                {pendingTimesheets.length === 0 ? (
                    <div className="py-8 text-center">
                        <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2 opacity-50" />
                        <p className="text-xs text-slate-400 font-medium">All caught up! No pending timesheets.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {displayTimesheets.map((ts) => (
                            <div 
                                key={ts.id} 
                                className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50/50 border border-slate-100/50 hover:bg-slate-50 hover:border-blue-100/50 transition-all cursor-pointer group"
                                onClick={() => router.push("/pm/approvals?status=pending")}
                            >
                                <div className="h-8 w-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                                    <UserCircle2 className="h-4 w-4 text-amber-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-xs font-bold text-slate-800 truncate group-hover:text-[#4B7BEC] transition-colors">
                                            {ts.user?.full_name || `User #${ts.user_id}`}
                                        </p>
                                        <span className="text-[10px] font-black text-slate-600 shrink-0">
                                            {formatDuration(ts.duration_minutes)}
                                        </span>
                                    </div>
                                    <p className="text-[9px] text-slate-400 font-medium truncate mt-0.5 uppercase tracking-tighter">
                                        {ts.project?.name || `Project #${ts.project_id}`} · {ts.task_description}
                                    </p>
                                </div>
                                <Badge variant="outline" className="text-[8px] font-black rounded-full px-2 py-0 bg-amber-50 text-amber-600 border-none shrink-0 uppercase tracking-tighter">
                                    Pending
                                </Badge>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
