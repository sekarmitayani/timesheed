"use client";

import React, { useState, useMemo } from "react";
import { 
    UnifiedProjectRecord, 
    UnifiedMemberRecord,
    UnifiedResourceRecord,
    CompositeProjectMasterRecord,
    CompositeEmployeePayrollRecord
} from "../hooks/useReportsData";
import { MonthlyProfitItem } from "@/lib/services/management-service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    FileSpreadsheet, 
    Download, 
    Printer, 
    TrendingUp,
    Briefcase,
    Users,
    Laptop,
    Loader2
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

interface PresetExecutiveReportsProps {
    projects: UnifiedProjectRecord[];
    members: UnifiedMemberRecord[];
    resources: UnifiedResourceRecord[];
    monthlyTrends: MonthlyProfitItem[];
    compositeProjects: CompositeProjectMasterRecord[];
    compositeMembers: CompositeEmployeePayrollRecord[];
}

export function PresetExecutiveReports({
    projects,
    members,
    resources,
    monthlyTrends,
    compositeProjects,
    compositeMembers
}: PresetExecutiveReportsProps) {
    const [generatingReport, setGeneratingReport] = useState<string | null>(null);

    // Financial Statements Export (Monthly P&L)
    const exportPLReport = async () => {
        setGeneratingReport("pl");
        try {
            const rows = monthlyTrends.map((m, idx) => ({
                "No": idx + 1,
                "Month": m.month,
                "Gross Revenue (IDR)": m.revenue,
                "Operating Expenses (IDR)": m.expenses,
                "Net Margin (IDR)": m.net_profit,
                "Margin Ratio (%)": m.revenue > 0 ? `${((m.net_profit / m.revenue) * 100).toFixed(1)}%` : "0%",
            }));

            const ws = XLSX.utils.json_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Monthly P&L Ledger");
            XLSX.writeFile(wb, `Haerarchy_PL_Statement_${new Date().toISOString().split("T")[0]}.xlsx`);
            toast.success("Downloaded P&L Financial Statement!");
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setGeneratingReport(null);
        }
    };

    // Project Portfolio Master Export
    const exportProjectMasterReport = async () => {
        setGeneratingReport("projects");
        try {
            const rows = compositeProjects.map((p, idx) => ({
                "No": idx + 1,
                "Project Code / Name": p.project_name,
                "Client Organization": p.client_name || "Internal",
                "Contract Revenue (IDR)": p.contract_value || 0,
                "Planned Budget (IDR)": p.budget_cost || 0,
                "Labor / SDM Cost (IDR)": p.labor_cost || 0,
                "Resource Procurements (IDR)": p.resource_expenses || 0,
                "Total Outflow (IDR)": p.total_expenses || 0,
                "Net Profit (IDR)": p.net_margin || 0,
                "Margin Ratio (%)": `${(p.margin_percent).toFixed(1)}%`,
                "Assigned Personnel": p.team_size || 0,
                "Lifecycle Status": p.status,
            }));

            const ws = XLSX.utils.json_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Project Master Portfolio");
            XLSX.writeFile(wb, `Haerarchy_Project_Portfolio_Master_${new Date().toISOString().split("T")[0]}.xlsx`);
            toast.success("Downloaded Project Portfolio Master!");
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setGeneratingReport(null);
        }
    };

    // Liability & Personnel Compensation Export
    const exportLiabilityReport = async () => {
        setGeneratingReport("liability");
        try {
            const rows = compositeMembers.map((m, idx) => ({
                "No": idx + 1,
                "Staff Name": m.full_name,
                "Organizational Role": m.role,
                "Base Hourly / Monthly Rate (IDR)": m.base_rate,
                "Disbursed / Paid Out (IDR)": m.total_paid_disbursements,
                "Pending Liability (IDR)": m.pending_liability,
                "Total Compensation Exposure (IDR)": m.total_paid_disbursements + m.pending_liability,
            }));

            const ws = XLSX.utils.json_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Personnel & Liability Matrix");
            XLSX.writeFile(wb, `Haerarchy_Liability_Payroll_Exposure_${new Date().toISOString().split("T")[0]}.xlsx`);
            toast.success("Downloaded Liability & Payroll Exposure Ledger!");
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setGeneratingReport(null);
        }
    };

    // Resource Procurements Export
    const exportResourceReport = async () => {
        setGeneratingReport("resources");
        try {
            const rows = resources.map((r, idx) => ({
                "No": idx + 1,
                "Resource Name": r.item_name,
                "Resource Type": r.category,
                "Project Assignment": r.project_name || "General Overhead",
                "Unit Cost (IDR)": r.amount,
                "Lifecycle Status": r.status,
                "Procurement Date": r.created_at ? new Date(r.created_at).toLocaleDateString() : "-",
            }));

            const ws = XLSX.utils.json_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Resource Procurements");
            XLSX.writeFile(wb, `Haerarchy_Resource_Asset_Outflows_${new Date().toISOString().split("T")[0]}.xlsx`);
            toast.success("Downloaded Resource Outflow Report!");
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setGeneratingReport(null);
        }
    };

    // Comprehensive Executive Master Workbook (Multi-Sheet)
    const exportComprehensiveWorkbook = async () => {
        setGeneratingReport("all");
        try {
            const wb = XLSX.utils.book_new();

            // Sheet 1: P&L
            const plData = monthlyTrends.map((m, idx) => ({
                "No": idx + 1,
                "Month": m.month,
                "Revenue": m.revenue,
                "Expenses": m.expenses,
                "Net Margin": m.net_profit,
                "Margin %": m.revenue > 0 ? `${((m.net_profit / m.revenue) * 100).toFixed(1)}%` : "0%",
            }));
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(plData), "Monthly P&L");

            // Sheet 2: Projects
            const projData = compositeProjects.map((p, idx) => ({
                "No": idx + 1,
                "Project": p.project_name,
                "Client": p.client_name || "Internal",
                "Revenue": p.contract_value || 0,
                "Total Cost": p.total_expenses || 0,
                "Net Profit": p.net_margin || 0,
                "Margin %": `${(p.margin_percent).toFixed(1)}%`,
                "Status": p.status,
            }));
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(projData), "Projects Summary");

            // Sheet 3: Personnel
            const memberData = compositeMembers.map((m, idx) => ({
                "No": idx + 1,
                "Name": m.full_name,
                "Role": m.role,
                "Base Rate": m.base_rate,
                "Paid": m.total_paid_disbursements,
                "Liability": m.pending_liability,
            }));
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(memberData), "Personnel Payroll");

            XLSX.writeFile(wb, `Haerarchy_Executive_Master_Intelligence_${new Date().toISOString().split("T")[0]}.xlsx`);
            toast.success("Downloaded Full Multi-Sheet Executive Workbook!");
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setGeneratingReport(null);
        }
    };

    const PRESET_CARDS = [
        {
            id: "pl",
            title: "P&L FINANCIAL STATEMENT",
            description: "Detailed monthly gross revenue, operating costs, net margins, and margin percentage ratios.",
            icon: TrendingUp,
            badge: "Financial Audit",
            records: monthlyTrends.length,
            onExcel: exportPLReport,
        },
        {
            id: "projects",
            title: "PROJECT PORTFOLIO MASTER",
            description: "Cross-module aggregation of project revenues, planned budgets, labor costs, and net profitability.",
            icon: Briefcase,
            badge: "Operational",
            records: projects.length,
            onExcel: exportProjectMasterReport,
        },
        {
            id: "liability",
            title: "LIABILITY & PAYROLL EXPOSURE",
            description: "Personnel rates, compensation schemes, disbursed payouts, and pending contract liability risks.",
            icon: Users,
            badge: "HR & Finance",
            records: members.length,
            onExcel: exportLiabilityReport,
        },
        {
            id: "resources",
            title: "RESOURCE & ASSET OUTFLOW",
            description: "Itemized breakdown of hardware, software, and cloud infrastructure spending by project.",
            icon: Laptop,
            badge: "Cost Breakdown",
            records: resources.length,
            onExcel: exportResourceReport,
        },
    ];

    return (
        <div className="space-y-3">
            {/* Master Download Banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-sm">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
                        <h3 className="text-sm font-bold tracking-wide uppercase">
                            Executive All-in-One Master Workbook
                        </h3>
                    </div>
                    <p className="text-xs text-slate-300 max-w-xl">
                        Download a consolidated multi-sheet Excel workbook containing financial statements, project portfolio ledgers, and workforce liability matrices.
                    </p>
                </div>
                <Button
                    type="button"
                    onClick={exportComprehensiveWorkbook}
                    disabled={generatingReport === "all"}
                    className="shrink-0 gap-2 bg-[#4B7BEC] hover:bg-[#385bb5] text-white text-xs font-semibold shadow-md min-w-[170px]"
                >
                    {generatingReport === "all" ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Compiling Sheets...</>
                    ) : (
                        <><Download className="h-4 w-4" /> Download Master (.xlsx)</>
                    )}
                </Button>
            </div>

            {/* Grid of Preset Reports */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PRESET_CARDS.map((card) => {
                    const Icon = card.icon;
                    const isProcessing = generatingReport === card.id;

                    return (
                        <Card key={card.id} className="bg-white border-slate-100 shadow-sm rounded-xl overflow-hidden flex flex-col p-0 py-0 gap-0 hover:shadow-md transition-shadow">
                            <div className="px-5 py-5 border-b border-slate-100 bg-white flex flex-row items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center text-[#4B7BEC] shrink-0">
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
                                            {card.title}
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-medium leading-none mt-1 font-mono">
                                            {card.records} Records Available
                                        </p>
                                    </div>
                                </div>
                                <Badge variant="outline" className="text-[9px] h-4 px-1.5 py-0 leading-none font-semibold text-slate-600 bg-slate-50 border-slate-200">
                                    {card.badge}
                                </Badge>
                            </div>

                            <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    {card.description}
                                </p>

                                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                                    <span className="text-[10px] font-mono text-slate-400">
                                        Audit-Ready Standard Formats
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={card.onExcel}
                                            disabled={isProcessing}
                                            className="h-8 text-xs bg-[#4B7BEC] hover:bg-[#385bb5] text-white font-semibold gap-1.5 px-3 shadow-xs"
                                        >
                                            {isProcessing ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                                <Download className="h-3 w-3" />
                                            )}
                                            Excel (.xlsx)
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => window.print()}
                                            className="h-8 text-xs border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold gap-1.5 px-3 shadow-xs"
                                        >
                                            <Printer className="h-3 w-3 text-slate-500" />
                                            Print PDF
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
