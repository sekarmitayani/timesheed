"use client";

import { DollarSign, CheckCircle2, AlertTriangle, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, StatCard } from "@/components/ai/ai-components";
import { useDataStore } from "@/store/useDataStore";
import { toast } from "sonner";
import { useState } from "react";

export default function PaymentsPage() {
    const payments = useDataStore((s) => s.payments);
    const users = useDataStore((s) => s.users);
    const projects = useDataStore((s) => s.projects);
    const releasePayment = useDataStore((s) => s.releasePayment);
    const approvePayment = useDataStore((s) => s.approvePayment);
    const [search, setSearch] = useState("");

    const pending = payments.filter((p) => p.status === "pending");
    const approved = payments.filter((p) => p.status === "approved");
    const released = payments.filter((p) => p.status === "released");

    const handleRelease = (id: string) => {
        const payment = payments.find((p) => p.id === id);
        const userName = users.find((u) => u.id === payment?.userId)?.name;
        releasePayment(id);
        toast.success(`Payment released for ${userName}`);
    };

    const handleApprove = (id: string) => {
        const payment = payments.find((p) => p.id === id);
        const userName = users.find((u) => u.id === payment?.userId)?.name;
        approvePayment(id);
        toast.success(`Payment approved for ${userName}`);
    };

    const filtered = payments.filter((p) => {
        const userName = users.find((u) => u.id === p.userId)?.name?.toLowerCase() || "";
        return userName.includes(search.toLowerCase()) || p.status.includes(search.toLowerCase());
    });

    return (
        <div className="space-y-6">
            <PageHeader title="Payment Management" description="Manage and release team payments" />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard title="Pending" value={pending.length.toString()} subtitle={`Rp ${(pending.reduce((s, p) => s + p.amount, 0) / 1000000).toFixed(0)}M total`} icon={AlertTriangle} glow={pending.length > 0} />
                <StatCard title="Approved" value={approved.length.toString()} subtitle={`Rp ${(approved.reduce((s, p) => s + p.amount, 0) / 1000000).toFixed(0)}M total`} icon={CheckCircle2} />
                <StatCard title="Released" value={released.length.toString()} subtitle={`Rp ${(released.reduce((s, p) => s + p.amount, 0) / 1000000).toFixed(0)}M total`} icon={DollarSign} />
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search payments..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Project</TableHead>
                                <TableHead>Period</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-36">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map((payment) => {
                                const user = users.find((u) => u.id === payment.userId);
                                const project = projects.find((p) => p.id === payment.projectId);
                                return (
                                    <TableRow key={payment.id}>
                                        <TableCell className="text-sm font-medium">{user?.name || "—"}</TableCell>
                                        <TableCell className="text-sm">{project?.name || "—"}</TableCell>
                                        <TableCell className="text-sm">{payment.period}</TableCell>
                                        <TableCell className="text-sm font-medium">Rp {payment.amount.toLocaleString()}</TableCell>
                                        <TableCell>
                                            <Badge className={`text-[10px] ${payment.status === "released" ? "bg-emerald-500/10 text-emerald-500" : payment.status === "approved" ? "bg-blue-500/10 text-blue-500" : "bg-amber-500/10 text-amber-500"}`}>
                                                {payment.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                {payment.status === "pending" && (
                                                    <Button size="sm" variant="outline" className="h-7 text-xs text-blue-500" onClick={() => handleApprove(payment.id)}>Approve</Button>
                                                )}
                                                {payment.status === "approved" && (
                                                    <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={() => handleRelease(payment.id)}>Release</Button>
                                                )}
                                                {payment.status === "released" && (
                                                    <span className="text-xs text-muted-foreground">Completed</span>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
