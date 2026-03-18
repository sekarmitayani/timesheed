"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ai/ai-components";
import { useDataStore } from "@/store/useDataStore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Search } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function AuditLogPage() {
    const auditLogs = useDataStore((s) => s.auditLogs);
    const users = useDataStore((s) => s.users);
    const [search, setSearch] = useState("");

    const filtered = auditLogs.filter((log) => {
        const user = users.find((u) => u.id === log.userId);
        const text = `${user?.name} ${log.action} ${log.details}`.toLowerCase();
        return text.includes(search.toLowerCase());
    });

    const handleExport = () => {
        const csv = "User,Action,Details,IP Address,Timestamp\n" + filtered.map((log) => {
            const user = users.find((u) => u.id === log.userId);
            return `"${user?.name}","${log.action}","${log.details}","${log.ipAddress}","${log.timestamp}"`;
        }).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "audit-log.csv"; a.click();
        URL.revokeObjectURL(url);
        toast.success("Audit log exported as CSV");
    };

    return (
        <div className="space-y-6">
            <PageHeader title="Audit Log" description={`${auditLogs.length} entries`}>
                <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={handleExport}>
                    <Download className="h-3 w-3" /> Export CSV
                </Button>
            </PageHeader>

            <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search audit logs..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-b border-slate-100">
                                <TableHead className="pl-6  text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">User</TableHead>
                                <TableHead className=" text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Action</TableHead>
                                <TableHead className=" text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Details</TableHead>
                                <TableHead className=" text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">IP Address</TableHead>
                                <TableHead className=" text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Timestamp</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map((log) => {
                                const user = users.find((u) => u.id === log.userId);
                                return (
                                    <TableRow key={log.id}>
                                        <TableCell className="pl-6 font-medium text-sm">{user?.name || "System"}</TableCell>
                                        <TableCell className=""><Badge variant="outline" className="text-[10px]">{log.action}</Badge></TableCell>
                                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{log.details}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground font-mono">{log.ipAddress}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</TableCell>
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
