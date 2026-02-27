"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ai/ai-components";
import { CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

interface Request { id: string; type: string; from: string; date: string; status: string; desc: string }

export default function RequestsPage() {
    const [requests, setRequests] = useState<Request[]>([
        { id: "r1", type: "Leave", from: "Andi Pratama", date: "2026-02-20", status: "pending", desc: "Annual leave - 3 days" },
        { id: "r2", type: "Overtime", from: "Sari Dewi", date: "2026-02-19", status: "approved", desc: "4h overtime for API deadline" },
        { id: "r3", type: "Resource", from: "Budi Santoso", date: "2026-02-18", status: "pending", desc: "Need additional design tools license" },
        { id: "r4", type: "Leave", from: "Lina Hartono", date: "2026-02-21", status: "pending", desc: "Sick leave - 1 day" },
        { id: "r5", type: "Overtime", from: "Reza Firmansyah", date: "2026-02-19", status: "pending", desc: "2h overtime for QA testing" },
    ]);

    const handleApprove = (id: string, from: string) => {
        setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: "approved" } : r));
        toast.success(`Approved request from ${from}`);
    };

    const handleReject = (id: string, from: string) => {
        setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: "rejected" } : r));
        toast.error(`Rejected request from ${from}`);
    };

    return (
        <div className="space-y-6">
            <PageHeader title="Requests" description="Team requests and resource management" />
            <div className="space-y-3">
                {requests.map((req) => (
                    <Card key={req.id}>
                        <CardContent className="p-4 flex items-center gap-4">
                            <Badge variant="outline" className="text-[10px]">{req.type}</Badge>
                            <div className="flex-1">
                                <p className="text-sm font-medium">{req.from}</p>
                                <p className="text-xs text-muted-foreground">{req.desc} • {req.date}</p>
                            </div>
                            <Badge variant={req.status === "approved" ? "secondary" : req.status === "rejected" ? "destructive" : "outline"} className={`text-[10px] ${req.status === "approved" ? "bg-emerald-500/10 text-emerald-500" : req.status === "rejected" ? "bg-red-500/10 text-red-500" : ""}`}>
                                {req.status}
                            </Badge>
                            {req.status === "pending" && (
                                <div className="flex gap-1">
                                    <Button size="sm" variant="outline" className="h-7 text-xs text-emerald-500 gap-1" onClick={() => handleApprove(req.id, req.from)}>
                                        <CheckCircle2 className="h-3 w-3" /> Approve
                                    </Button>
                                    <Button size="sm" variant="outline" className="h-7 text-xs text-red-500 gap-1" onClick={() => handleReject(req.id, req.from)}>
                                        <XCircle className="h-3 w-3" /> Reject
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
