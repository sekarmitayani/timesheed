"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRight, UserCircle2, Clock } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
        <Card className="bg-white border-slate-100 shadow-sm rounded-xl overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow p-0 py-0 gap-0">
            <CardHeader className="px-5 py-5 border-b border-slate-100 [&.border-b]:pb-5 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <Clock className="h-5 w-5 text-amber-500 shrink-0" />
                    <div className="flex flex-col">
                        <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
                            Timesheet Approval Inbox
                        </CardTitle>
                        <p className="text-[10px] text-slate-400 font-medium leading-none mt-1">
                            Pending team timesheets awaiting review
                        </p>
                    </div>
                </div>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-[9px] font-bold text-[#4B7BEC] gap-1 hover:bg-blue-50 px-2 uppercase tracking-widest" 
                    onClick={() => router.push("/pm/approvals?status=pending")}
                >
                    View All <ArrowRight className="h-3 w-3" />
                </Button>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col justify-between">
                <div className="p-3 sm:p-4 flex-1">
                {pendingTimesheets.length === 0 ? (
                    <div className="py-8 text-center">
                        <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2 opacity-50" />
                        <p className="text-xs text-slate-400 font-medium">All caught up! No pending timesheets.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {displayTimesheets.map((ts) => (
                            <div 
                                key={ts.id} 
                                className="flex items-center gap-3 py-2.5 transition-all cursor-pointer group hover:bg-slate-50/30"
                                onClick={() => router.push("/pm/approvals?status=pending")}
                            >
                                <Avatar className="h-8 w-8 border border-slate-100 shrink-0">
                                    <AvatarFallback className="text-[10px] font-bold bg-gradient-to-br from-[#2568C1] to-[#1a4f99] text-white">
                                        {ts.user?.full_name?.split(" ").slice(0, 2).map(n => n?.[0]).join("") || "U"}
                                    </AvatarFallback>
                                </Avatar>
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
                </div>
            </CardContent>
        </Card>
    );
}
