"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ai/ai-components";
import { Download, FileText, BarChart3, Loader2, CheckCircle2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { toast } from "sonner";

const quarterlyData = [
    { quarter: "Q1", revenue: 2800, costs: 1900, profit: 900 },
    { quarter: "Q2", revenue: 3200, costs: 2100, profit: 1100 },
    { quarter: "Q3", revenue: 3500, costs: 2300, profit: 1200 },
    { quarter: "Q4", revenue: 3800, costs: 2500, profit: 1300 },
];

const reports = [
    { name: "Monthly Financial Report", type: "PDF", date: "2026-02-01" },
    { name: "Q4 Revenue Analysis", type: "XLSX", date: "2026-01-15" },
    { name: "Team Performance Summary", type: "PDF", date: "2026-02-10" },
    { name: "Budget Utilization Report", type: "PDF", date: "2026-02-05" },
    { name: "AI Insights Report", type: "PDF", date: "2026-02-12" },
];

export default function MgmtReportsPage() {
    const [downloading, setDownloading] = useState<string | null>(null);
    const [downloaded, setDownloaded] = useState<Set<string>>(new Set());

    const handleDownload = async (name: string, type: string) => {
        setDownloading(name);
        await new Promise((r) => setTimeout(r, 1200));
        setDownloading(null);
        setDownloaded((prev) => new Set(prev).add(name));
        toast.success(`${name} downloaded`, { description: `Exported as ${type}` });
    };

    return (
        <div className="space-y-6">
            <PageHeader title="Reports & Export" description="Generate and download organizational reports" />
            <Card>
                <CardHeader><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4 text-[#FFBE18]" /> Quarterly Overview (in Millions)</CardTitle></CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={quarterlyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${v}M`} />
                            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                            <Legend />
                            <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="costs" name="Costs" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="profit" name="Profit" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle className="text-sm">Available Reports</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                    {reports.map((r) => (
                        <div key={r.name} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                                <p className="text-sm font-medium">{r.name}</p>
                                <p className="text-xs text-muted-foreground">{r.date} • {r.type}</p>
                            </div>
                            <Button
                                size="sm"
                                variant={downloaded.has(r.name) ? "secondary" : "outline"}
                                className="gap-1 text-xs h-7"
                                disabled={downloading === r.name}
                                onClick={() => handleDownload(r.name, r.type)}
                            >
                                {downloading === r.name ? (
                                    <><Loader2 className="h-3 w-3 animate-spin" /> Exporting...</>
                                ) : downloaded.has(r.name) ? (
                                    <><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Downloaded</>
                                ) : (
                                    <><Download className="h-3 w-3" /> Export</>
                                )}
                            </Button>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
