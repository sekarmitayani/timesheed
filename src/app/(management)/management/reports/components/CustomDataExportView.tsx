"use client";

import React, { useState, useMemo, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";
import {
    FileSpreadsheet,
    Download,
    Printer,
    Calendar,
    Search,
    Layers,
    Wallet,
    Receipt,
    TrendingUp,
    FolderKanban,
    ChevronLeft,
    ChevronRight,
    X
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { generateCustomExportExcelWorkbook, fmtIDR } from "@/lib/utils/reports-excel-helper";
import { exportLandscapePDF } from "@/lib/utils/print-report-helper";

interface CustomDataExportViewProps {
    projects: UnifiedProjectRecord[];
    members: UnifiedMemberRecord[];
    resources: UnifiedResourceRecord[];
    monthlyTrends: MonthlyProfitItem[];
    compositeProjectMaster: CompositeProjectMasterRecord[];
    compositeEmployeePayroll: CompositeEmployeePayrollRecord[];
}

type DatasetOption =
    | "composite_project_master"
    | "composite_employee_payroll"
    | "projects"
    | "members"
    | "resources"
    | "monthly";

const cardClass = "bg-white border border-slate-100 shadow-sm rounded-xl flex flex-col overflow-hidden hover:shadow-md transition-shadow";

export function CustomDataExportView({
    projects,
    members,
    resources,
    monthlyTrends,
    compositeProjectMaster,
    compositeEmployeePayroll,
}: CustomDataExportViewProps) {
    const [selectedDataset, setSelectedDataset] = useState<DatasetOption>("composite_project_master");
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [page, setPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);

    // Format currency helper
    const formatCurrency = (val: number) => {
        if (!val && val !== 0) return "-";
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
        }).format(val);
    };

    const fmtCurrencyShort = (v: number): string => {
        if (!v) return "Rp 0";
        const abs = Math.abs(v);
        if (abs >= 1000000000) return `Rp ${(v / 1000000000).toFixed(1)}B`;
        if (abs >= 1000000) return `Rp ${(v / 1000000).toFixed(1)}M`;
        if (abs >= 1000) return `Rp ${(v / 1000).toFixed(1)}K`;
        return `Rp ${v.toLocaleString("id-ID")}`;
    };

    // Quick Date Presets
    const applyDatePreset = (preset: "all" | "this_month" | "last_30_days" | "this_quarter" | "ytd") => {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, "0");
        const d = String(now.getDate()).padStart(2, "0");

        if (preset === "all") {
            setStartDate("");
            setEndDate("");
        } else if (preset === "this_month") {
            setStartDate(`${y}-${m}-01`);
            setEndDate(`${y}-${m}-${d}`);
        } else if (preset === "last_30_days") {
            const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            const py = past30.getFullYear();
            const pm = String(past30.getMonth() + 1).padStart(2, "0");
            const pd = String(past30.getDate()).padStart(2, "0");
            setStartDate(`${py}-${pm}-${pd}`);
            setEndDate(`${y}-${m}-${d}`);
        } else if (preset === "this_quarter") {
            const currentQ = Math.floor(now.getMonth() / 3);
            const qStartMonth = String(currentQ * 3 + 1).padStart(2, "0");
            setStartDate(`${y}-${qStartMonth}-01`);
            setEndDate(`${y}-${m}-${d}`);
        } else if (preset === "ytd") {
            setStartDate(`${y}-01-01`);
            setEndDate(`${y}-${m}-${d}`);
        }
    };

    // Reset pagination to page 1 whenever filters change
    useEffect(() => {
        setPage(1);
    }, [selectedDataset, startDate, endDate, searchQuery, pageSize]);

    // Filter Dataset based on date range and search query
    const filteredRecords = useMemo(() => {
        let list: any[] = [];

        switch (selectedDataset) {
            case "composite_project_master":
                list = compositeProjectMaster;
                break;
            case "composite_employee_payroll":
                list = compositeEmployeePayroll;
                break;
            case "projects":
                list = projects;
                break;
            case "members":
                list = members;
                break;
            case "resources":
                list = resources;
                break;
            case "monthly":
                list = monthlyTrends;
                break;
        }

        return list.filter((item) => {
            // Date filtering
            const itemDate = item.created_at || item.deadline || item.paid_at || item.month;
            if (itemDate && typeof itemDate === "string") {
                if (startDate && itemDate < startDate) return false;
                if (endDate && itemDate > endDate) return false;
            }

            // Keyword search filter
            if (searchQuery.trim().length > 0) {
                const q = searchQuery.toLowerCase();
                const matches = Object.values(item).some(
                    (val) => val && String(val).toLowerCase().includes(q)
                );
                if (!matches) return false;
            }

            return true;
        });
    }, [
        selectedDataset,
        compositeProjectMaster,
        compositeEmployeePayroll,
        projects,
        members,
        resources,
        monthlyTrends,
        startDate,
        endDate,
        searchQuery
    ]);

    // Pagination calculations
    const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
    const paginatedRecords = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredRecords.slice(start, start + pageSize);
    }, [filteredRecords, page, pageSize]);

    // Summary Statistics for current filtered view
    const summaryStats = useMemo(() => {
        let totalRevenue = 0;
        let totalExpenses = 0;
        let totalHours = 0;

        filteredRecords.forEach((item) => {
            totalRevenue += item.contract_value || item.budget_revenue || item.revenue || item.total_paid_disbursements || 0;
            totalExpenses += item.total_expenses || item.budget_cost || item.expenses || item.amount || item.rate_amount || 0;
            totalHours += item.total_hours_logged || item.total_hours || 0;
        });

        return {
            count: filteredRecords.length,
            totalRevenue,
            totalExpenses,
            totalHours,
            netProfit: totalRevenue - totalExpenses,
        };
    }, [filteredRecords]);

    // Handle Download Professional Formatted Excel
    const handleExportExcel = () => {
        if (filteredRecords.length === 0) {
            toast.error("No records match the active filters to export.");
            return;
        }

        try {
            const workbook = generateCustomExportExcelWorkbook({
                selectedDataset,
                startDate,
                endDate,
                filteredRecords,
                summaryStats,
            });

            const dateTag = startDate && endDate ? `_${startDate}_to_${endDate}` : "_all_time";
            const fileName = `Haerarchy_Export_${selectedDataset}${dateTag}.xlsx`;
            XLSX.writeFile(workbook, fileName);
            toast.success(`Exported ${filteredRecords.length} formatted records to Excel!`);
        } catch (error: any) {
            toast.error(`Excel export failed: ${error.message}`);
        }
    };

    // Handle PDF Landscape Print (Direct native Landscape A4 PDF generator)
    const handleExportPDF = async () => {
        if (filteredRecords.length === 0) {
            toast.error("No records match the active filters to print.");
            return;
        }

        const datasetTitle = selectedDataset === "composite_project_master"
            ? "Project Master (Cost, Hours, Profit Margin & Resources)"
            : selectedDataset === "composite_employee_payroll"
                ? "Employee Utilization & Total Compensation"
                : selectedDataset.toUpperCase();

        let printCols: { header: string; key: string; align?: "left" | "right" | "center" }[] = [];
        let printRows: any[] = [];

        if (selectedDataset === "composite_project_master") {
            printCols = [
                { header: "Project Name", key: "project_name", align: "left" },
                { header: "Client", key: "client_name", align: "left" },
                { header: "Contract Value", key: "contract_val_str", align: "right" },
                { header: "Planned Cost", key: "budget_cost_str", align: "right" },
                { header: "Labor Cost", key: "labor_cost_str", align: "right" },
                { header: "Resource Cost", key: "resource_str", align: "right" },
                { header: "Total Cost", key: "total_exp_str", align: "right" },
                { header: "Net Margin", key: "net_margin_str", align: "right" },
                { header: "Margin %", key: "margin_pct_str", align: "center" },
                { header: "Hours", key: "hours_str", align: "center" },
            ];

            printRows = filteredRecords.map((r: CompositeProjectMasterRecord) => ({
                project_name: r.project_name,
                client_name: r.client_name,
                contract_val_str: formatCurrency(r.contract_value),
                budget_cost_str: formatCurrency(r.budget_cost),
                labor_cost_str: formatCurrency(r.labor_cost),
                resource_str: formatCurrency(r.resource_expenses),
                total_exp_str: formatCurrency(r.total_expenses),
                net_margin_str: formatCurrency(r.net_margin),
                margin_pct_str: `${(r.margin_percent || 0).toFixed(1)}%`,
                hours_str: `${r.total_hours_logged || 0}h`,
            }));
        } else if (selectedDataset === "composite_employee_payroll") {
            printCols = [
                { header: "Team Member", key: "full_name", align: "left" },
                { header: "Role", key: "role", align: "left" },
                { header: "Project", key: "project_name", align: "left" },
                { header: "Scheme", key: "scheme_str", align: "center" },
                { header: "Base Rate", key: "base_rate_str", align: "right" },
                { header: "Released Payout", key: "paid_str", align: "right" },
                { header: "Pending Liability", key: "liability_str", align: "right" },
                { header: "Hours", key: "hours_str", align: "center" },
                { header: "Effective Rate", key: "rate_str", align: "right" },
            ];

            printRows = filteredRecords.map((r: CompositeEmployeePayrollRecord) => ({
                full_name: r.full_name,
                role: r.role,
                project_name: r.project_name,
                scheme_str: `${r.contract_type} • ${r.payment_scheme}`,
                base_rate_str: formatCurrency(r.base_rate),
                paid_str: formatCurrency(r.total_paid_disbursements),
                liability_str: formatCurrency(r.pending_liability),
                hours_str: `${r.total_hours_logged || 0}h`,
                rate_str: `${formatCurrency(r.effective_hourly_cost)}/h`,
            }));
        } else {
            const keys = Object.keys(filteredRecords[0] || {}).slice(0, 8);
            printCols = keys.map((k) => ({
                header: k.replace(/_/g, " ").toUpperCase(),
                key: k,
                align: "left",
            }));
            printRows = filteredRecords.map((r) => {
                const formatted: any = {};
                keys.forEach((k) => {
                    const val = r[k];
                    formatted[k] = typeof val === "number" && (k.includes("revenue") || k.includes("cost") || k.includes("amount") || k.includes("profit") || k.includes("released"))
                        ? formatCurrency(val)
                        : String(val || "-");
                });
                return formatted;
            });
        }

        await exportLandscapePDF({
            title: `Executive Data Ledger: ${datasetTitle}`,
            subtitle: "Filtered dataset records from Haerarchy Management BI Hub",
            dateRangeLabel: startDate && endDate ? `${startDate} to ${endDate}` : "Full Historical Scope",
            appliedFilters: [
                { label: "Dataset", value: datasetTitle },
                { label: "From Date", value: startDate || "All Past Records" },
                { label: "To Date", value: endDate || "Present Date" },
                ...(searchQuery ? [{ label: "Search", value: searchQuery }] : []),
            ],
            summaryMetrics: [
                { label: "Matched Records", value: `${summaryStats.count} Items`, subtext: "Filtered Scope" },
                { label: "Total Revenue", value: fmtIDR(summaryStats.totalRevenue), subtext: "Contract Inflow" },
                { label: "Total Expenses", value: fmtIDR(summaryStats.totalExpenses), subtext: "Labor & Resource Outflow" },
                { label: "Net Margin", value: fmtIDR(summaryStats.netProfit), subtext: "Net Balance", highlight: summaryStats.netProfit >= 0 },
            ],
            columns: printCols,
            data: printRows,
            fileName: `Haerarchy_Export_${selectedDataset}${startDate && endDate ? `_${startDate}_to_${endDate}` : ""}.pdf`,
        });
    };

    return (
        <div className="space-y-3">
            {/* ========================================================================= */}
            {/* FILTER & DATASET SELECTION CONTROL PANEL */}
            {/* ========================================================================= */}
            <Card className="bg-white border-slate-100 shadow-sm rounded-xl overflow-hidden flex flex-col p-0 py-0 gap-0">
                <div className="px-5 py-3 border-b border-slate-100 bg-white flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <Layers className="h-4 w-4 text-[#4B7BEC] shrink-0" />
                        <div className="flex flex-col">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
                                DATASET & DATE RANGE CONFIGURATION
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium leading-none mt-1">
                                Configure target dataset, filter timeline, and search keywords
                            </p>
                        </div>
                    </div>

                    {/* Date Presets Button Group */}
                    <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider mr-1">Presets:</span>
                        <button
                            type="button"
                            onClick={() => applyDatePreset("all")}
                            className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold transition-colors"
                        >
                            All Time
                        </button>
                        <button
                            type="button"
                            onClick={() => applyDatePreset("this_month")}
                            className="px-2.5 py-1 rounded-md bg-blue-50 text-[#4B7BEC] border border-blue-200/60 hover:bg-blue-100 text-[10px] font-semibold transition-colors"
                        >
                            This Month
                        </button>
                        <button
                            type="button"
                            onClick={() => applyDatePreset("last_30_days")}
                            className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold transition-colors"
                        >
                            Last 30 Days
                        </button>
                        <button
                            type="button"
                            onClick={() => applyDatePreset("this_quarter")}
                            className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold transition-colors"
                        >
                            This Quarter
                        </button>
                        <button
                            type="button"
                            onClick={() => applyDatePreset("ytd")}
                            className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold transition-colors"
                        >
                            YTD
                        </button>
                    </div>
                </div>

                <CardContent className="px-5 py-3.5 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {/* 1. Target Dataset */}
                        <div className="space-y-1.5">
                            <div className="h-4 flex items-center justify-between">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                                    Target Dataset
                                </label>
                                <Badge variant="outline" className="text-[8px] h-3.5 px-1 py-0 border-blue-200 text-[#4B7BEC] bg-blue-50/50 leading-none">
                                    Single / Merged
                                </Badge>
                            </div>
                            <Select
                                value={selectedDataset}
                                onValueChange={(val) => setSelectedDataset(val as DatasetOption)}
                            >
                                <SelectTrigger className="w-full h-9 bg-white border-slate-200 text-xs font-semibold text-slate-800 shadow-xs">
                                    <SelectValue placeholder="Select Dataset" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="composite_project_master">
                                        Project Master (Cost, Hours, Margin & Resources)
                                    </SelectItem>
                                    <SelectItem value="composite_employee_payroll">
                                        Employee Utilization & Total Compensation
                                    </SelectItem>
                                    <SelectItem value="projects">Projects Portfolio & Financials</SelectItem>
                                    <SelectItem value="members">Personnel & Contract Rates</SelectItem>
                                    <SelectItem value="resources">Resource Procurement Requests</SelectItem>
                                    <SelectItem value="monthly">Monthly Financial Timeline</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* 2. Date Range Filter using Standard CustomDatePicker */}
                        <div className="space-y-1.5">
                            <div className="h-4 flex items-center justify-between">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none flex items-center gap-1">
                                    <Calendar className="h-3 w-3 text-[#4B7BEC]" />
                                    <span>Date Range (From - To)</span>
                                </label>
                                {(startDate || endDate) && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                             setStartDate("");
                                             setEndDate("");
                                        }}
                                        className="text-[9px] font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-wider"
                                    >
                                        Clear Range
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <CustomDatePicker
                                    date={startDate}
                                    onDateChange={setStartDate}
                                    placeholder="Start Date"
                                    className="h-9 text-xs bg-white border-slate-200"
                                />
                                <CustomDatePicker
                                    date={endDate}
                                    onDateChange={setEndDate}
                                    placeholder="End Date"
                                    className="h-9 text-xs bg-white border-slate-200"
                                />
                            </div>
                        </div>

                        {/* 3. Quick Search Query */}
                        <div className="space-y-1.5 md:col-span-2 lg:col-span-1">
                            <div className="h-4 flex items-center justify-between">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                                    Quick Search Query
                                </label>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                <Input
                                    type="text"
                                    placeholder="Search by project, client, member..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-8 pr-8 h-9 text-xs border-slate-200 bg-white shadow-xs"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ========================================================================= */}
            {/* KPI STATS ROW (DASHBOARD STANDARD ARCHITECTURE) */}
            {/* ========================================================================= */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                {/* 1. Matched Records */}
                <Card className={cardClass}>
                    <CardContent className="px-4 py-3 flex flex-row items-center gap-4 h-full">
                        <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-[#4B7BEC] shrink-0">
                            <FolderKanban className="h-6 w-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 truncate">
                                Matched Records
                            </p>
                            <span className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-tight block truncate">
                                {summaryStats.count} Items
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium truncate block">
                                {startDate && endDate ? `${startDate} to ${endDate}` : "Full Database Scope"}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Total Revenue */}
                <Card className={cardClass}>
                    <CardContent className="px-4 py-3 flex flex-row items-center gap-4 h-full">
                        <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-[#4B7BEC] shrink-0">
                            <Wallet className="h-6 w-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 truncate">
                                Total Revenue
                            </p>
                            <span className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-tight block truncate">
                                {fmtCurrencyShort(summaryStats.totalRevenue)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium truncate block">
                                Aggregated Contract Value
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Total Expenses */}
                <Card className={cardClass}>
                    <CardContent className="px-4 py-3 flex flex-row items-center gap-4 h-full">
                        <div className="h-12 w-12 rounded-xl bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                            <Receipt className="h-6 w-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 truncate">
                                Total Expenses
                            </p>
                            <span className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-tight block truncate">
                                {fmtCurrencyShort(summaryStats.totalExpenses)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium truncate block">
                                Labor & Resource Costs
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* 4. Net Margin */}
                <Card className={cardClass}>
                    <CardContent className="px-4 py-3 flex flex-row items-center gap-4 h-full">
                        <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 truncate">
                                Net Margin
                            </p>
                            <span className={`text-xl sm:text-2xl font-black tracking-tight leading-tight block truncate ${summaryStats.netProfit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                                {fmtCurrencyShort(summaryStats.netProfit)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium truncate block">
                                Net Profit Balance
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ========================================================================= */}
            {/* LIVE DATA PREVIEW TABLE WITH EMBEDDED EXPORT TOOLBAR (ZERO GAP ARCHITECTURE) */}
            {/* ========================================================================= */}
            <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden flex flex-col p-0 py-0 gap-0">
                <div className="px-5 py-3.5 border-b border-slate-100 bg-white flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <FileSpreadsheet className="h-4 w-4 text-[#4B7BEC] shrink-0" />
                        <div className="flex flex-col">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
                                DATA GRID PREVIEW ({filteredRecords.length} ROWS)
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium leading-none mt-1">
                                Filtered records ready for instant analysis and multi-format export
                            </p>
                        </div>
                    </div>

                    {/* Export Actions Toolbar & Show Rows */}
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 mr-2">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase">Show:</span>
                            <Select
                                value={String(pageSize)}
                                onValueChange={(v) => setPageSize(Number(v))}
                            >
                                <SelectTrigger className="h-8 w-[70px] bg-white border-slate-200 text-xs font-medium">
                                    <SelectValue placeholder="10" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            type="button"
                            size="sm"
                            onClick={handleExportExcel}
                            disabled={filteredRecords.length === 0}
                            className="h-8 text-xs bg-[#4B7BEC] hover:bg-[#385bb5] text-white font-semibold gap-1.5 px-3 shadow-xs"
                        >
                            <Download className="h-3.5 w-3.5" />
                            Excel (.xlsx)
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={handleExportPDF}
                            disabled={filteredRecords.length === 0}
                            className="h-8 text-xs border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold gap-1.5 px-3 shadow-xs"
                        >
                            <Printer className="h-3.5 w-3.5 text-slate-500" />
                            PDF (Landscape)
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {/* 1. COMPOSITE: PROJECT MASTER TABLE */}
                    {selectedDataset === "composite_project_master" && (
                        <table className="w-full text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-500 uppercase tracking-wider h-10">
                                    <th className="py-2 px-4 w-12 text-center">No</th>
                                    <th className="py-2 px-4 text-left">Project & Client</th>
                                    <th className="py-2 px-4 text-right">Contract Revenue</th>
                                    <th className="py-2 px-4 text-right">Planned Budget</th>
                                    <th className="py-2 px-4 text-right">Labor Cost</th>
                                    <th className="py-2 px-4 text-right">Resource Cost</th>
                                    <th className="py-2 px-4 text-right">Total Expenses</th>
                                    <th className="py-2 px-4 text-right">Net Margin</th>
                                    <th className="py-2 px-4 text-center">Margin %</th>
                                    <th className="py-2 px-4 text-center">Hours</th>
                                    <th className="py-2 px-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedRecords.map((r: CompositeProjectMasterRecord, idx) => (
                                    <tr key={`proj-master-${r.project_id || idx}-${(page - 1) * pageSize + idx}`} className="hover:bg-[#f0f4fa]/50 transition-colors border-b border-slate-100 last:border-0">
                                        <td className="py-2.5 px-4 text-center font-mono text-slate-400 text-xs">
                                            {(page - 1) * pageSize + idx + 1}
                                        </td>
                                        <td className="py-2.5 px-4">
                                            <div className="font-semibold text-slate-900 text-xs">{r.project_name}</div>
                                            <div className="text-[10px] text-slate-500">{r.client_name}</div>
                                        </td>
                                        <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900 text-xs">
                                            {formatCurrency(r.contract_value)}
                                        </td>
                                        <td className="py-2.5 px-4 text-right font-mono text-slate-500 text-xs">
                                            {formatCurrency(r.budget_cost)}
                                        </td>
                                        <td className="py-2.5 px-4 text-right font-mono text-slate-600 text-xs">
                                            {formatCurrency(r.labor_cost)}
                                        </td>
                                        <td className="py-2.5 px-4 text-right font-mono text-slate-600 text-xs">
                                            {formatCurrency(r.resource_expenses)}
                                        </td>
                                        <td className="py-2.5 px-4 text-right font-mono font-bold text-red-500 text-xs">
                                            {formatCurrency(r.total_expenses)}
                                        </td>
                                        <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-600 text-xs">
                                            {formatCurrency(r.net_margin)}
                                        </td>
                                        <td className="py-2.5 px-4 text-center font-mono font-semibold">
                                            <Badge variant="outline" className={`text-[10px] h-4.5 px-2 py-0 leading-none ${r.margin_percent >= 30 ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-amber-50 text-amber-600 border-amber-200"}`}>
                                                {r.margin_percent.toFixed(1)}%
                                            </Badge>
                                        </td>
                                        <td className="py-2.5 px-4 text-center font-mono text-slate-700 text-xs font-semibold">
                                            {r.total_hours_logged}h
                                        </td>
                                        <td className="py-2.5 px-4 text-center">
                                            <Badge variant="outline" className="text-[10px] h-4.5 px-2 py-0 leading-none capitalize bg-slate-50 text-slate-600 border-slate-200">
                                                {r.status}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {/* 2. COMPOSITE: EMPLOYEE PAYROLL TABLE */}
                    {selectedDataset === "composite_employee_payroll" && (
                        <table className="w-full text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-500 uppercase tracking-wider h-10">
                                    <th className="py-2 px-4 w-12 text-center">No</th>
                                    <th className="py-2 px-4 text-left">Team Member</th>
                                    <th className="py-2 px-4 text-left">Role & Scope</th>
                                    <th className="py-2 px-4 text-center">Contract Scheme</th>
                                    <th className="py-2 px-4 text-right">Base Rate</th>
                                    <th className="py-2 px-4 text-right">Released Payout</th>
                                    <th className="py-2 px-4 text-right">Pending Liability</th>
                                    <th className="py-2 px-4 text-center">Hours</th>
                                    <th className="py-2 px-4 text-right">Rate/hr</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedRecords.map((r: CompositeEmployeePayrollRecord, idx) => (
                                    <tr key={`emp-payroll-${r.user_id || idx}-${r.project_name || "p"}-${(page - 1) * pageSize + idx}`} className="hover:bg-[#f0f4fa]/50 transition-colors border-b border-slate-100 last:border-0">
                                        <td className="py-2.5 px-4 text-center font-mono text-slate-400 text-xs">
                                            {(page - 1) * pageSize + idx + 1}
                                        </td>
                                        <td className="py-2.5 px-4">
                                            <div className="font-semibold text-slate-900 text-xs">{r.full_name}</div>
                                            <div className="text-[10px] text-slate-500 font-mono">{r.email}</div>
                                        </td>
                                        <td className="py-2.5 px-4">
                                            <div className="font-medium text-slate-700 capitalize text-xs">{r.role}</div>
                                            <div className="text-[10px] text-slate-400">{r.project_name}</div>
                                        </td>
                                        <td className="py-2.5 px-4 text-center">
                                            <Badge variant="outline" className="text-[10px] h-4.5 px-2 py-0 leading-none capitalize font-mono bg-blue-50 text-blue-600 border-blue-200">
                                                {r.contract_type} • {r.payment_scheme}
                                            </Badge>
                                        </td>
                                        <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-700 text-xs">{formatCurrency(r.base_rate)}</td>
                                        <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-600 text-xs">{formatCurrency(r.total_paid_disbursements)}</td>
                                        <td className="py-2.5 px-4 text-right font-mono text-amber-600 text-xs">{formatCurrency(r.pending_liability)}</td>
                                        <td className="py-2.5 px-4 text-center font-mono text-slate-700 text-xs font-semibold">{r.total_hours_logged}h</td>
                                        <td className="py-2.5 px-4 text-right font-mono text-slate-500 text-xs">{formatCurrency(r.effective_hourly_cost)}/h</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {/* 3. STANDARD DATASETS FALLBACK TABLE */}
                    {["projects", "members", "resources", "monthly"].includes(selectedDataset) && (
                        <table className="w-full text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-500 uppercase tracking-wider h-10">
                                    <th className="py-2 px-4 w-12 text-center">No</th>
                                    {Object.keys(paginatedRecords[0] || {}).slice(0, 7).map((k) => (
                                        <th key={k} className="py-2 px-4 text-left capitalize">{k.replace(/_/g, " ")}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedRecords.map((r: any, idx) => (
                                    <tr key={`generic-row-${(page - 1) * pageSize + idx}`} className="hover:bg-[#f0f4fa]/50 transition-colors border-b border-slate-100 last:border-0">
                                        <td className="py-2.5 px-4 text-center font-mono text-slate-400 text-xs">
                                            {(page - 1) * pageSize + idx + 1}
                                        </td>
                                        {Object.entries(r).slice(0, 7).map(([key, val]: [string, any], cIdx) => (
                                            <td key={`cell-${idx}-${cIdx}`} className="py-2.5 px-4 text-slate-800 font-mono text-xs">
                                                {typeof val === "number" && (key.includes("revenue") || key.includes("cost") || key.includes("amount") || key.includes("profit") || key.includes("released"))
                                                    ? formatCurrency(val)
                                                    : String(val || "-")}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {filteredRecords.length === 0 && (
                        <div className="py-16 text-center text-slate-400 text-xs font-medium">
                            No records found matching the active date range or search query.
                        </div>
                    )}
                </div>

                {/* Standard Admin-Style Pagination Footer */}
                {filteredRecords.length > 0 && (
                    <div className="border-t border-[#e2e8f0] bg-white px-4 py-3 flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                            Showing <span className="font-medium text-[#0f172a]">{(page - 1) * pageSize + 1}</span> to <span className="font-medium text-[#0f172a]">{Math.min(page * pageSize, filteredRecords.length)}</span> of <span className="font-medium text-[#0f172a]">{filteredRecords.length}</span> entries
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                disabled={page <= 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="text-xs font-medium px-2">
                                Page {page} of {totalPages}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                disabled={page >= totalPages}
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
