"use client";

import React, { useState } from "react";
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
import { 
    fmtIDR,
    generatePresetPLExcelWorkbook,
    generatePresetProjectMasterExcelWorkbook,
    generatePresetLiabilityExcelWorkbook,
    generatePresetResourceExcelWorkbook,
    generatePresetExecutiveMasterWorkbook
} from "@/lib/utils/reports-excel-helper";
import { exportLandscapePDF } from "@/lib/utils/print-report-helper";

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

    // 1. Financial Statements Export (Monthly P&L)
    const exportPLReport = async () => {
        setGeneratingReport("pl_excel");
        try {
            const wb = generatePresetPLExcelWorkbook(monthlyTrends);
            XLSX.writeFile(wb, `Haerarchy_PL_Statement_${new Date().toISOString().split("T")[0]}.xlsx`);
            toast.success("Downloaded P&L Financial Statement Excel!");
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setGeneratingReport(null);
        }
    };

    const exportPLPDF = async () => {
        setGeneratingReport("pl_pdf");
        try {
            const totalRev = monthlyTrends.reduce((acc, m) => acc + (m.revenue || 0), 0);
            const totalExp = monthlyTrends.reduce((acc, m) => acc + (m.expenses || 0), 0);
            const totalNet = totalRev - totalExp;
            const avgMargin = totalRev > 0 ? `${((totalNet / totalRev) * 100).toFixed(1)}%` : "0.0%";

            await exportLandscapePDF({
                title: "P&L Financial Statement & Monthly Performance Ledger",
                subtitle: "Historical gross revenue, operating costs, and net profit margins across all monitored periods",
                dateRangeLabel: "Full Historical Timeline",
                appliedFilters: [
                    { label: "Report Module", value: "P&L Financial Audit" },
                    { label: "Total Periods", value: `${monthlyTrends.length} Months` }
                ],
                summaryMetrics: [
                    { label: "Total Gross Revenue", value: fmtIDR(totalRev), subtext: "Revenue Inflow" },
                    { label: "Total Operating Cost", value: fmtIDR(totalExp), subtext: "Expense Outflow" },
                    { label: "Net Margin", value: fmtIDR(totalNet), subtext: "Net Balance", highlight: totalNet >= 0 },
                    { label: "Avg Margin Ratio", value: avgMargin, subtext: "Profitability Ratio" }
                ],
                columns: [
                    { header: "Month & Year", key: "month", align: "left" },
                    { header: "Gross Revenue (IDR)", key: "rev_str", align: "right" },
                    { header: "Operating Expenses (IDR)", key: "exp_str", align: "right" },
                    { header: "Net Margin (IDR)", key: "net_str", align: "right" },
                    { header: "Margin %", key: "pct_str", align: "center" },
                ],
                data: monthlyTrends.map(m => ({
                    month: m.month,
                    rev_str: fmtIDR(m.revenue),
                    exp_str: fmtIDR(m.expenses),
                    net_str: fmtIDR(m.net_profit),
                    pct_str: m.revenue > 0 ? `${((m.net_profit / m.revenue) * 100).toFixed(1)}%` : "0.0%"
                })),
                fileName: `Haerarchy_PL_Statement_${new Date().toISOString().split("T")[0]}.pdf`
            });
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setGeneratingReport(null);
        }
    };

    // 2. Project Portfolio Master Export
    const exportProjectMasterReport = async () => {
        setGeneratingReport("projects_excel");
        try {
            const wb = generatePresetProjectMasterExcelWorkbook(compositeProjects);
            XLSX.writeFile(wb, `Haerarchy_Project_Portfolio_Master_${new Date().toISOString().split("T")[0]}.xlsx`);
            toast.success("Downloaded Project Portfolio Master Excel!");
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setGeneratingReport(null);
        }
    };

    const exportProjectMasterPDF = async () => {
        setGeneratingReport("projects_pdf");
        try {
            const totalValue = compositeProjects.reduce((acc, p) => acc + (p.contract_value || 0), 0);
            const totalOutflow = compositeProjects.reduce((acc, p) => acc + (p.total_expenses || 0), 0);
            const totalMargin = totalValue - totalOutflow;

            await exportLandscapePDF({
                title: "Project Portfolio Master & Profitability Ledger",
                subtitle: "Cross-module aggregation of project revenues, planned budgets, labor costs, and net margins",
                dateRangeLabel: "Enterprise Active Portfolio",
                appliedFilters: [
                    { label: "Report Module", value: "Project Portfolio Master" },
                    { label: "Total Projects", value: `${compositeProjects.length} Projects` }
                ],
                summaryMetrics: [
                    { label: "Total Projects", value: `${compositeProjects.length} Items`, subtext: "Portfolio Scope" },
                    { label: "Portfolio Contract Value", value: fmtIDR(totalValue), subtext: "Total Revenue" },
                    { label: "Total Expenses", value: fmtIDR(totalOutflow), subtext: "Labor & Resources" },
                    { label: "Total Net Margin", value: fmtIDR(totalMargin), subtext: "Net Balance", highlight: totalMargin >= 0 }
                ],
                columns: [
                    { header: "Project Name", key: "project_name", align: "left" },
                    { header: "Client", key: "client_name", align: "left" },
                    { header: "Contract Value", key: "val_str", align: "right" },
                    { header: "Labor Cost", key: "labor_str", align: "right" },
                    { header: "Resource Cost", key: "res_str", align: "right" },
                    { header: "Total Cost", key: "exp_str", align: "right" },
                    { header: "Net Margin", key: "margin_str", align: "right" },
                    { header: "Margin %", key: "pct_str", align: "center" },
                    { header: "Status", key: "status_str", align: "center" },
                ],
                data: compositeProjects.map(p => ({
                    project_name: p.project_name,
                    client_name: p.client_name || "Internal",
                    val_str: fmtIDR(p.contract_value),
                    labor_str: fmtIDR(p.labor_cost),
                    res_str: fmtIDR(p.resource_expenses),
                    exp_str: fmtIDR(p.total_expenses),
                    margin_str: fmtIDR(p.net_margin),
                    pct_str: `${(p.margin_percent || 0).toFixed(1)}%`,
                    status_str: (p.status || "Active").toUpperCase()
                })),
                fileName: `Haerarchy_Project_Portfolio_Master_${new Date().toISOString().split("T")[0]}.pdf`
            });
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setGeneratingReport(null);
        }
    };

    // 3. Liability & Personnel Compensation Export
    const exportLiabilityReport = async () => {
        setGeneratingReport("liability_excel");
        try {
            const wb = generatePresetLiabilityExcelWorkbook(compositeMembers);
            XLSX.writeFile(wb, `Haerarchy_Liability_Payroll_Exposure_${new Date().toISOString().split("T")[0]}.xlsx`);
            toast.success("Downloaded Liability & Payroll Exposure Excel!");
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setGeneratingReport(null);
        }
    };

    const exportLiabilityPDF = async () => {
        setGeneratingReport("liability_pdf");
        try {
            const totalPaid = compositeMembers.reduce((acc, m) => acc + (m.total_paid_disbursements || 0), 0);
            const totalLiab = compositeMembers.reduce((acc, m) => acc + (m.pending_liability || 0), 0);
            const totalExposure = totalPaid + totalLiab;

            await exportLandscapePDF({
                title: "Personnel Liability & Payroll Exposure Matrix",
                subtitle: "Staff compensation agreements, disbursed earnings, and pending contract liabilities",
                dateRangeLabel: "Workforce Active Roster",
                appliedFilters: [
                    { label: "Report Module", value: "Personnel Liability Matrix" },
                    { label: "Total Staff", value: `${compositeMembers.length} Members` }
                ],
                summaryMetrics: [
                    { label: "Total Personnel", value: `${compositeMembers.length} Staff`, subtext: "Headcount" },
                    { label: "Disbursed Payouts", value: fmtIDR(totalPaid), subtext: "Released Salary" },
                    { label: "Pending Liability", value: fmtIDR(totalLiab), subtext: "Unpaid Ledger", highlight: false },
                    { label: "Total Exposure", value: fmtIDR(totalExposure), subtext: "Total Obligation" }
                ],
                columns: [
                    { header: "Staff Member", key: "full_name", align: "left" },
                    { header: "Role", key: "role", align: "left" },
                    { header: "Assigned Project", key: "project_name", align: "left" },
                    { header: "Contract Scheme", key: "scheme_str", align: "center" },
                    { header: "Base Rate", key: "rate_str", align: "right" },
                    { header: "Paid Out", key: "paid_str", align: "right" },
                    { header: "Pending Liability", key: "liab_str", align: "right" },
                    { header: "Total Exposure", key: "exposure_str", align: "right" },
                ],
                data: compositeMembers.map(m => ({
                    full_name: m.full_name,
                    role: m.role,
                    project_name: m.project_name || "Global / Base",
                    scheme_str: `${m.contract_type} • ${m.payment_scheme}`,
                    rate_str: fmtIDR(m.base_rate),
                    paid_str: fmtIDR(m.total_paid_disbursements),
                    liab_str: fmtIDR(m.pending_liability),
                    exposure_str: fmtIDR((m.total_paid_disbursements || 0) + (m.pending_liability || 0))
                })),
                fileName: `Haerarchy_Liability_Payroll_Exposure_${new Date().toISOString().split("T")[0]}.pdf`
            });
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setGeneratingReport(null);
        }
    };

    // 4. Resource Procurements Export
    const exportResourceReport = async () => {
        setGeneratingReport("resources_excel");
        try {
            const wb = generatePresetResourceExcelWorkbook(resources);
            XLSX.writeFile(wb, `Haerarchy_Resource_Asset_Outflows_${new Date().toISOString().split("T")[0]}.xlsx`);
            toast.success("Downloaded Resource Outflow Excel!");
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setGeneratingReport(null);
        }
    };

    const exportResourcePDF = async () => {
        setGeneratingReport("resources_pdf");
        try {
            const totalAmount = resources.reduce((acc, r) => acc + (r.amount || 0), 0);
            const approvedCount = resources.filter(r => (r.status || "").toLowerCase() === "approved").length;

            await exportLandscapePDF({
                title: "Resource & Asset Procurement Outflow Ledger",
                subtitle: "Itemized breakdown of software licenses, cloud infrastructure, and tool expenses",
                dateRangeLabel: "Full Procurement Lifecycle",
                appliedFilters: [
                    { label: "Report Module", value: "Resource Procurements" },
                    { label: "Total Items", value: `${resources.length} Requests` }
                ],
                summaryMetrics: [
                    { label: "Total Requests", value: `${resources.length} Items`, subtext: "Procurement Volume" },
                    { label: "Approved Items", value: `${approvedCount} Items`, subtext: "Validated Spend", highlight: true },
                    { label: "Total Outflow", value: fmtIDR(totalAmount), subtext: "Asset & Tool Spend" }
                ],
                columns: [
                    { header: "Resource Name", key: "item_name", align: "left" },
                    { header: "Category", key: "category", align: "left" },
                    { header: "Project Assignment", key: "project_name", align: "left" },
                    { header: "Amount (IDR)", key: "amount_str", align: "right" },
                    { header: "Status", key: "status_str", align: "center" },
                    { header: "Requested Date", key: "date_str", align: "center" },
                ],
                data: resources.map(r => ({
                    item_name: r.item_name,
                    category: r.category,
                    project_name: r.project_name || "General Overhead",
                    amount_str: fmtIDR(r.amount),
                    status_str: (r.status || "Pending").toUpperCase(),
                    date_str: r.created_at ? new Date(r.created_at).toLocaleDateString("id-ID") : "-"
                })),
                fileName: `Haerarchy_Resource_Asset_Outflows_${new Date().toISOString().split("T")[0]}.pdf`
            });
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setGeneratingReport(null);
        }
    };

    // 5. Comprehensive Executive Master Workbook (Multi-Sheet)
    const exportComprehensiveWorkbook = async () => {
        setGeneratingReport("all_excel");
        try {
            const wb = generatePresetExecutiveMasterWorkbook({
                monthlyTrends,
                compositeProjects,
                compositeMembers,
                resources
            });
            XLSX.writeFile(wb, `Haerarchy_Executive_Master_Intelligence_${new Date().toISOString().split("T")[0]}.xlsx`);
            toast.success("Downloaded Consolidated Multi-Sheet Executive Master Workbook!");
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
            onPDF: exportPLPDF,
        },
        {
            id: "projects",
            title: "PROJECT PORTFOLIO MASTER",
            description: "Cross-module aggregation of project revenues, planned budgets, labor costs, and net profitability.",
            icon: Briefcase,
            badge: "Operational",
            records: projects.length,
            onExcel: exportProjectMasterReport,
            onPDF: exportProjectMasterPDF,
        },
        {
            id: "liability",
            title: "LIABILITY & PAYROLL EXPOSURE",
            description: "Personnel rates, compensation schemes, disbursed payouts, and pending contract liability risks.",
            icon: Users,
            badge: "HR & Finance",
            records: members.length,
            onExcel: exportLiabilityReport,
            onPDF: exportLiabilityPDF,
        },
        {
            id: "resources",
            title: "RESOURCE & ASSET OUTFLOW",
            description: "Itemized breakdown of hardware, software, and cloud infrastructure spending by project.",
            icon: Laptop,
            badge: "Cost Breakdown",
            records: resources.length,
            onExcel: exportResourceReport,
            onPDF: exportResourcePDF,
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
                    disabled={generatingReport === "all_excel"}
                    className="shrink-0 gap-2 bg-[#4B7BEC] hover:bg-[#385bb5] text-white text-xs font-semibold shadow-md min-w-[170px]"
                >
                    {generatingReport === "all_excel" ? (
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
                    const isProcessingExcel = generatingReport === `${card.id}_excel`;
                    const isProcessingPDF = generatingReport === `${card.id}_pdf`;

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
                                        Audit-Ready Formats
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={card.onExcel}
                                            disabled={isProcessingExcel}
                                            className="h-8 text-xs bg-[#4B7BEC] hover:bg-[#385bb5] text-white font-semibold gap-1.5 px-3 shadow-xs"
                                        >
                                            {isProcessingExcel ? (
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
                                            onClick={card.onPDF}
                                            disabled={isProcessingPDF}
                                            className="h-8 text-xs border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold gap-1.5 px-3 shadow-xs"
                                        >
                                            {isProcessingPDF ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                                <Printer className="h-3 w-3 text-slate-500" />
                                            )}
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
