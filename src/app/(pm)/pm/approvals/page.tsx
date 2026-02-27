"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Inbox, Sparkles, CheckCircle2, XCircle, ChevronDown, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader, RiskBadge, AIConfidence } from "@/components/ai/ai-components";
import { useDataStore } from "@/store/useDataStore";
import { detectAnomaly } from "@/lib/ai/anomaly";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ApprovalsPage() {
    const [filter, setFilter] = useState<"all" | "flagged">("all");
    const timesheets = useDataStore((s) => s.timesheets);
    const users = useDataStore((s) => s.users);
    const projects = useDataStore((s) => s.projects);
    const approveTimesheet = useDataStore((s) => s.approveTimesheet);
    const rejectTimesheet = useDataStore((s) => s.rejectTimesheet);

    const pendingApprovals = useMemo(() => {
        const submitted = timesheets.filter((t) => t.status === "submitted");
        return submitted.map((ts) => ({
            ...ts,
            anomaly: detectAnomaly(ts),
            userName: users.find((u) => u.id === ts.userId)?.name || "Unknown",
            projectName: projects.find((p) => p.id === ts.projectId)?.name || "Unknown",
        }));
    }, [timesheets, users, projects]);

    const filtered = filter === "flagged"
        ? pendingApprovals.filter((a) => a.anomaly.riskScore > 0)
        : pendingApprovals;

    const flaggedCount = pendingApprovals.filter((a) => a.anomaly.riskScore > 0).length;

    const handleApprove = (id: string, name: string) => {
        approveTimesheet(id);
        toast.success(`Approved timesheet for ${name}`);
    };

    const handleReject = (id: string, name: string) => {
        rejectTimesheet(id);
        toast.error(`Rejected timesheet for ${name}`);
    };

    return (
        <div className="space-y-6">
            <PageHeader title="Approval Inbox" description={`${pendingApprovals.length} pending approvals • ${flaggedCount} AI flagged`}>
                <div className="flex gap-2">
                    <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
                        All ({pendingApprovals.length})
                    </Button>
                    <Button variant={filter === "flagged" ? "default" : "outline"} size="sm" onClick={() => setFilter("flagged")} className="gap-1">
                        <Sparkles className="h-3 w-3" /> AI Flagged ({flaggedCount})
                    </Button>
                </div>
            </PageHeader>

            <AnimatePresence mode="popLayout">
                <div className="space-y-3">
                    {filtered.map((approval) => (
                        <ApprovalCard
                            key={approval.id}
                            approval={approval}
                            onApprove={() => handleApprove(approval.id, approval.userName)}
                            onReject={() => handleReject(approval.id, approval.userName)}
                        />
                    ))}
                    {filtered.length === 0 && (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Inbox className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">No pending approvals</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </AnimatePresence>
        </div>
    );
}

function ApprovalCard({ approval, onApprove, onReject }: { approval: any; onApprove: () => void; onReject: () => void }) {
    const [expanded, setExpanded] = useState(false);
    const hasRisk = approval.anomaly.riskScore > 0;

    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -100, height: 0 }} layout>
            <Card className={cn(
                "transition-all",
                approval.anomaly.riskLevel === "high" && "border-red-500/30 shadow-[0_0_20px_rgba(0,0,0,0.06)]",
                approval.anomaly.riskLevel === "medium" && "border-amber-500/30",
            )}>
                <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#FFBE18]/10 to-[#E5A800]/10 flex items-center justify-center text-sm font-medium">
                                {approval.userName.split(" ").map((n: string) => n[0]).join("")}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{approval.userName}</span>
                                    {hasRisk && (
                                        <Badge variant="outline" className="text-[10px] bg-gradient-to-r from-[#FFBE18]/10 to-[#E5A800]/10 text-[#FFBE18] border-[#FFBE18]/20 gap-1">
                                            <Sparkles className="h-2.5 w-2.5" /> AI Flagged
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">{approval.projectName} • {approval.date} • {approval.hours}h</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {hasRisk && <RiskBadge level={approval.anomaly.riskLevel} score={approval.anomaly.riskScore} />}
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setExpanded(!expanded)}>
                                <motion.div animate={{ rotate: expanded ? 180 : 0 }}>
                                    <ChevronDown className="h-4 w-4" />
                                </motion.div>
                            </Button>
                        </div>
                    </div>

                    {expanded && hasRisk && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3">
                            <div className="p-3 rounded-lg bg-muted/30 space-y-2">
                                <div className="flex items-center gap-2 text-xs font-medium">
                                    <Sparkles className="h-3 w-3 text-[#FFBE18]" />
                                    AI Analysis — Explainable AI
                                </div>
                                {approval.anomaly.reasons.map((reason: string, i: number) => (
                                    <div key={i} className="flex items-start gap-2 text-sm">
                                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                                        <span className="text-muted-foreground">{reason}</span>
                                    </div>
                                ))}
                                <AIConfidence confidence={approval.anomaly.aiConfidence} />
                                <div className="p-2 rounded-md bg-[#FFBE18]/5 border border-[#FFBE18]/10">
                                    <p className="text-xs text-[#FFBE18]">
                                        <strong>AI Suggestion:</strong> {approval.anomaly.riskLevel === "high"
                                            ? "Reject this entry and request clarification from the employee."
                                            : "Review carefully before approving — minor anomaly detected."
                                        }
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Clock: {approval.clockIn} - {approval.clockOut}</span>
                        {approval.overtime > 0 && <span className="text-amber-500">+{approval.overtime}h OT</span>}
                    </div>

                    <div className="flex gap-2 pt-1">
                        <Button size="sm" className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-xs h-8" onClick={onApprove}>
                            <CheckCircle2 className="h-3 w-3" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1 text-red-500 hover:text-red-600 text-xs h-8" onClick={onReject}>
                            <XCircle className="h-3 w-3" /> Reject
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
