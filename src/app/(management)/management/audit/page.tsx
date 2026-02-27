"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ai/ai-components";
import { mockAuditLogs, mockUsers } from "@/lib/mock-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield } from "lucide-react";

export default function MgmtAuditPage() {
    return (
        <div className="space-y-6">
            <PageHeader title="Audit & Compliance" description="Organization-wide compliance and audit trail" />
            <Card className="border-emerald-500/20">
                <CardContent className="p-4 flex items-center gap-3 text-sm text-emerald-500">
                    <Shield className="h-5 w-5" />
                    <span>All system activities are logged and monitored for compliance. Last audit: Feb 15, 2026.</span>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow><TableHead>User</TableHead><TableHead>Action</TableHead><TableHead>Details</TableHead><TableHead>IP</TableHead><TableHead>Timestamp</TableHead></TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockAuditLogs.map((log) => {
                                const user = mockUsers.find((u) => u.id === log.userId);
                                return (
                                    <TableRow key={log.id}>
                                        <TableCell className="font-medium text-sm">{user?.name}</TableCell>
                                        <TableCell><Badge variant="outline" className="text-[10px]">{log.action}</Badge></TableCell>
                                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{log.details}</TableCell>
                                        <TableCell className="text-xs font-mono text-muted-foreground">{log.ipAddress}</TableCell>
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
