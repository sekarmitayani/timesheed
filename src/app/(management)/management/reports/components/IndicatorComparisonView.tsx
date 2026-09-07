"use client";

import React, { useState, useMemo, useEffect } from "react";
import { 
    UnifiedProjectRecord, 
    UnifiedMemberRecord, 
    CompositeProjectMasterRecord 
} from "../hooks/useReportsData";
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
import { 
    Popover, 
    PopoverContent, 
    PopoverTrigger 
} from "@/components/ui/popover";
import { 
    ScatterChart, 
    Scatter, 
    XAxis, 
    YAxis, 
    ZAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    ReferenceLine,
    BarChart,
    Bar,
    Legend,
    Cell
} from "recharts";
import { 
    Download, 
    Printer, 
    Search, 
    SlidersHorizontal, 
    BarChart3,
    BarChart2,
    FolderKanban,
    TrendingUp,
    Trophy,
    Check,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    X,
    Filter
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { MonthlyProfitItem } from "@/lib/services/management-service";
import { generateComparisonExcelWorkbook } from "@/lib/utils/reports-excel-helper";
import { exportLandscapePDF } from "@/lib/utils/print-report-helper";
import html2canvas from "html2canvas";

interface IndicatorComparisonViewProps {
    projects: UnifiedProjectRecord[];
    members: UnifiedMemberRecord[];
    monthlyTrends: MonthlyProfitItem[];
    compositeProjects: CompositeProjectMasterRecord[];
}

type EntityScope = "projects" | "members" | "monthly";
type ChartType = "scatter" | "grouped_bar" | "ranked_bar";

interface MetricOption {
    key: string;
    label: string;
    format: "currency" | "percent" | "hours" | "number";
    description?: string;
}

const PROJECT_METRICS: MetricOption[] = [
    { key: "budget_revenue", label: "Contract Revenue", format: "currency" },
    { key: "budget_cost", label: "Planned Budget Cost", format: "currency" },
    { key: "actual_cost", label: "Actual SDM / Operating Cost", format: "currency" },
    { key: "net_profit", label: "Net Margin (Profit)", format: "currency" },
    { key: "margin_percent", label: "Profit Margin %", format: "percent" },
    { key: "total_hours", label: "Total Timesheet Hours", format: "hours" },
    { key: "member_count", label: "Assigned Team Size", format: "number" },
];

const MEMBER_METRICS: MetricOption[] = [
    { key: "rate_amount", label: "Base Contract Rate", format: "currency" },
    { key: "total_released", label: "Total Released Payout", format: "currency" },
    { key: "total_liability", label: "Pending Liability", format: "currency" },
    { key: "total_hours", label: "Total Timesheet Hours", format: "hours" },
];

const MONTHLY_METRICS: MetricOption[] = [
    { key: "revenue", label: "Monthly Revenue", format: "currency" },
    { key: "expenses", label: "Monthly Expenses", format: "currency" },
    { key: "net_profit", label: "Net Monthly Profit", format: "currency" },
];

const cardClass = "bg-white border border-slate-100 shadow-sm rounded-xl flex flex-col overflow-hidden hover:shadow-md transition-shadow";

export function IndicatorComparisonView({
    projects,
    members,
    monthlyTrends,
}: IndicatorComparisonViewProps) {
    const [scope, setScope] = useState<EntityScope>("projects");
    const [xAxisKey, setXAxisKey] = useState<string>("actual_cost");
    const [yAxisKey, setYAxisKey] = useState<string>("budget_revenue");
    const [chartType, setChartType] = useState<ChartType>("scatter");
    const [highlightQuery, setHighlightQuery] = useState<string>("");
    const [selectedHighlight, setSelectedHighlight] = useState<string | null>(null);
    const [tableSearch, setTableSearch] = useState<string>("");
    const [page, setPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);

    // Entity Multi-Selection Filter State
    const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([]);
    const [hasCustomSelection, setHasCustomSelection] = useState<boolean>(false);
    const [entitySearchQuery, setEntitySearchQuery] = useState<string>("");
    const [isEntityFilterOpen, setIsEntityFilterOpen] = useState<boolean>(false);

    // Available metrics based on chosen scope
    const availableMetrics = useMemo(() => {
        switch (scope) {
            case "projects":
                return PROJECT_METRICS;
            case "members":
                return MEMBER_METRICS;
            case "monthly":
                return MONTHLY_METRICS;
            default:
                return PROJECT_METRICS;
        }
    }, [scope]);

    // Format utility
    const formatValue = (val: number, formatType: MetricOption["format"]) => {
        if (val === undefined || val === null || isNaN(val)) return "-";
        switch (formatType) {
            case "currency":
                return new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    maximumFractionDigits: 0,
                }).format(val);
            case "percent":
                return `${Number(val).toFixed(1)}%`;
            case "hours":
                return `${Number(val).toLocaleString("id-ID")} hrs`;
            case "number":
                return Number(val).toLocaleString("id-ID");
            default:
                return String(val);
        }
    };

    const xMetricInfo = availableMetrics.find((m) => m.key === xAxisKey) || availableMetrics[0];
    const yMetricInfo = availableMetrics.find((m) => m.key === yAxisKey) || availableMetrics[1] || availableMetrics[0];

    // Check which preset is currently active
    const isCostVsRev = scope === "projects" && xAxisKey === "actual_cost" && yAxisKey === "budget_revenue";
    const isPlannedVsActual = scope === "projects" && xAxisKey === "budget_cost" && yAxisKey === "actual_cost";
    const isHoursVsCost = scope === "projects" && xAxisKey === "total_hours" && yAxisKey === "actual_cost";
    const isRevVsMargin = scope === "projects" && xAxisKey === "budget_revenue" && yAxisKey === "margin_percent";

    // Handle Scope Switching
    const handleScopeChange = (newScope: EntityScope) => {
        setScope(newScope);
        setHasCustomSelection(false);
        setSelectedEntityIds([]);
        setEntitySearchQuery("");
        if (newScope === "projects") {
            setXAxisKey("actual_cost");
            setYAxisKey("budget_revenue");
        } else if (newScope === "members") {
            setXAxisKey("total_released");
            setYAxisKey("total_hours");
        } else {
            setXAxisKey("expenses");
            setYAxisKey("revenue");
        }
        setSelectedHighlight(null);
    };

    // Reset pagination on filter changes
    useEffect(() => {
        setPage(1);
    }, [scope, xAxisKey, yAxisKey, tableSearch, pageSize, selectedEntityIds, hasCustomSelection]);

    // Build Normalized Dataset for the Active Scope
    const rawDataset = useMemo(() => {
        if (scope === "projects") {
            return projects.map((p, idx) => ({
                id: String(p.id ? `project-${p.id}-${idx}` : `project-${idx}`),
                name: p.name,
                secondary: p.client_name,
                x: (p as any)[xAxisKey] || 0,
                y: (p as any)[yAxisKey] || 0,
                raw: p,
            }));
        }
        if (scope === "members") {
            return members.map((m, idx) => ({
                id: String(m.user_id ? `member-${m.user_id}-${m.project_name || "p"}-${idx}` : `member-${idx}`),
                name: m.full_name,
                secondary: `${m.role} • ${m.project_name}`,
                x: (m as any)[xAxisKey] || 0,
                y: (m as any)[yAxisKey] || 0,
                raw: m,
            }));
        }
        if (scope === "monthly") {
            return monthlyTrends.map((m, idx) => ({
                id: String(`month-${m.month}-${m.year}-${idx}`),
                name: `${m.month} ${m.year}`,
                secondary: `Year ${m.year}`,
                x: (m as any)[xAxisKey] || 0,
                y: (m as any)[yAxisKey] || 0,
                raw: m,
            }));
        }
        return [];
    }, [scope, projects, members, monthlyTrends, xAxisKey, yAxisKey]);

    // Active Dataset (Applies Custom Entity Multi-Selection)
    const activeDataset = useMemo(() => {
        if (!hasCustomSelection) {
            return rawDataset;
        }
        if (selectedEntityIds.length === 0) {
            return [];
        }
        const selectedSet = new Set(selectedEntityIds);
        return rawDataset.filter((d) => selectedSet.has(d.id));
    }, [rawDataset, hasCustomSelection, selectedEntityIds]);

    // Filtered entities for the picker search list
    const filteredEntitiesForPicker = useMemo(() => {
        if (!entitySearchQuery.trim()) return rawDataset;
        const q = entitySearchQuery.toLowerCase();
        return rawDataset.filter((d) => d.name.toLowerCase().includes(q) || d.secondary.toLowerCase().includes(q));
    }, [rawDataset, entitySearchQuery]);

    // Toggle specific entity checkbox
    const toggleEntity = (id: string) => {
        if (!hasCustomSelection) {
            const allIds = rawDataset.map((d) => d.id);
            const next = allIds.filter((item) => item !== id);
            setSelectedEntityIds(next);
            setHasCustomSelection(true);
        } else {
            const isSelected = selectedEntityIds.includes(id);
            let next: string[];
            if (isSelected) {
                next = selectedEntityIds.filter((item) => item !== id);
            } else {
                next = [...selectedEntityIds, id];
            }
            if (next.length === rawDataset.length) {
                setHasCustomSelection(false);
                setSelectedEntityIds([]);
            } else {
                setSelectedEntityIds(next);
            }
        }
    };

    const handleSelectAllEntities = () => {
        setHasCustomSelection(false);
        setSelectedEntityIds([]);
    };

    const handleDeselectAllEntities = () => {
        setHasCustomSelection(true);
        setSelectedEntityIds([]);
    };

    // Filter table records by tableSearch
    const filteredTableRecords = useMemo(() => {
        if (!tableSearch.trim()) return activeDataset;
        const q = tableSearch.toLowerCase();
        return activeDataset.filter((d) => 
            d.name.toLowerCase().includes(q) || d.secondary.toLowerCase().includes(q)
        );
    }, [activeDataset, tableSearch]);

    // Pagination
    const totalPages = Math.ceil(filteredTableRecords.length / pageSize) || 1;
    const paginatedRecords = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredTableRecords.slice(start, start + pageSize);
    }, [filteredTableRecords, page, pageSize]);

    // Average values for quadrant analysis lines
    const avgX = useMemo(() => {
        if (activeDataset.length === 0) return 0;
        return activeDataset.reduce((acc, curr) => acc + curr.x, 0) / activeDataset.length;
    }, [activeDataset]);

    const avgY = useMemo(() => {
        if (activeDataset.length === 0) return 0;
        return activeDataset.reduce((acc, curr) => acc + curr.y, 0) / activeDataset.length;
    }, [activeDataset]);

    // Top performer
    const topPerformer = useMemo(() => {
        if (activeDataset.length === 0) return null;
        return [...activeDataset].sort((a, b) => b.y - a.y)[0];
    }, [activeDataset]);

    // Filter Highlight
    const activeHighlightName = selectedHighlight || (highlightQuery.trim().length > 0 ? highlightQuery.trim().toLowerCase() : null);

    // List of searchable names for quick pill buttons (Deduplicated)
    const searchableNames = useMemo(() => {
        const unique = Array.from(new Set(activeDataset.map((d) => d.name).filter(Boolean)));
        return unique.slice(0, 15);
    }, [activeDataset]);

    // Excel Export of the Comparative Matrix (Professional Multi-Sheet)
    const handleExportExcel = () => {
        try {
            const wb = generateComparisonExcelWorkbook({
                scope,
                xMetricInfo,
                yMetricInfo,
                avgX,
                avgY,
                topPerformer,
                rawDataset: activeDataset,
                formatValue,
            });

            const fileName = `Haerarchy_Comparison_${scope}_${xAxisKey}_vs_${yAxisKey}.xlsx`;
            XLSX.writeFile(wb, fileName);
            toast.success(`Exported ${activeDataset.length} comparison records & analytics to Excel!`);
        } catch (error: any) {
            toast.error(`Failed to export Excel: ${error.message}`);
        }
    };

    // PDF Landscape Export (Direct native Landscape A4 PDF generator)
    const handleExportPDF = async () => {
        try {
            // Capture the entire live rendered chart container (including SVG + HTML legend)
            let chartImageSrc = "";
            const chartContainer = document.querySelector("#indicator-comparison-chart-container") as HTMLElement;
            if (chartContainer) {
                try {
                    const chartCanvas = await html2canvas(chartContainer, {
                        scale: 2,
                        useCORS: true,
                        logging: false,
                        backgroundColor: "#ffffff",
                    });
                    chartImageSrc = chartCanvas.toDataURL("image/png");
                } catch (e) {
                    console.warn("Failed to capture chart canvas:", e);
                }
            }

            await exportLandscapePDF({
                title: `Indicator Comparison: ${yMetricInfo.label} vs ${xMetricInfo.label}`,
                subtitle: `Multi-Dimensional Benchmark Matrix for ${scope.toUpperCase()}`,
                dateRangeLabel: "Live Portfolio Snapshot",
                appliedFilters: [
                    { label: "Dimension Scope", value: `${scope.toUpperCase()} (${activeDataset.length}/${rawDataset.length} Selected)` },
                    { label: "Independent Metric (X)", value: xMetricInfo.label },
                    { label: "Comparison Metric (Y)", value: yMetricInfo.label },
                    { label: "Visualization Type", value: chartType.toUpperCase() },
                ],
                summaryMetrics: [
                    { label: "Analyzed Entities", value: `${activeDataset.length} Records`, subtext: `Scope: ${scope}` },
                    { label: `Avg ${xMetricInfo.label}`, value: formatValue(avgX, xMetricInfo.format), subtext: "X Baseline" },
                    { label: `Avg ${yMetricInfo.label}`, value: formatValue(avgY, yMetricInfo.format), subtext: "Y Baseline", highlight: true },
                    { label: "Top Performer", value: topPerformer?.name || "-", subtext: topPerformer ? formatValue(topPerformer.y, yMetricInfo.format) : "-" },
                ],
                chartImageSrc,
                columns: [
                    { header: "Entity Identifier", key: "name", align: "left" },
                    { header: "Scope Context", key: "secondary", align: "left" },
                    { header: `${xMetricInfo.label} (X)`, key: "x_val", align: "right" },
                    { header: `${yMetricInfo.label} (Y)`, key: "y_val", align: "right" },
                    { header: "Ratio (Y/X)", key: "ratio", align: "center" },
                    { header: "Benchmark Classification", key: "benchmark", align: "center" },
                ],
                data: activeDataset.map((d) => ({
                    name: d.name,
                    secondary: d.secondary,
                    x_val: formatValue(d.x, xMetricInfo.format),
                    y_val: formatValue(d.y, yMetricInfo.format),
                    ratio: d.x !== 0 ? (d.y / d.x).toFixed(2) + "x" : "-",
                    benchmark: d.x >= avgX && d.y >= avgY 
                        ? "High X • High Y (Top Tier)" 
                        : d.x < avgX && d.y >= avgY 
                        ? "Low X • High Y (High Efficiency)" 
                        : d.x >= avgX && d.y < avgY 
                        ? "High X • Low Y (High Cost)" 
                        : "Below Baseline",
                })),
                fileName: `Haerarchy_Comparison_${scope}_${xAxisKey}_vs_${yAxisKey}.pdf`,
            });
        } catch (err: any) {
            toast.error(`PDF export failed: ${err.message}`);
        }
    };

    // Pre-set Comparison Shortcuts
    const applyPreset = (xKey: string, yKey: string) => {
        setXAxisKey(xKey);
        setYAxisKey(yKey);
    };

    return (
        <div className="space-y-3">
            {/* ========================================================================= */}
            {/* CONTROL PANEL: SCOPE, AXES, CHART TYPE, AND PRESETS */}
            {/* ========================================================================= */}
            <Card className="bg-white border-slate-100 shadow-sm rounded-xl overflow-hidden flex flex-col p-0 py-0 gap-0">
                <div className="px-5 py-3.5 border-b border-slate-100 bg-white flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <SlidersHorizontal className="h-4 w-4 text-[#4B7BEC] shrink-0" />
                        <div className="flex flex-col">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
                                INDICATOR COMPARISON BUILDER
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium leading-none mt-1">
                                Map independent and dependent indicators across organizational dimensions
                            </p>
                        </div>
                    </div>

                    {/* Pre-set Quick Shortcuts with dynamic active states */}
                    {scope === "projects" && (
                        <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider mr-1">Presets:</span>
                            <button
                                type="button"
                                onClick={() => applyPreset("actual_cost", "budget_revenue")}
                                className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors ${
                                    isCostVsRev
                                        ? "bg-blue-50 text-[#4B7BEC] border border-blue-200/80"
                                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-transparent"
                                }`}
                            >
                                Cost vs Revenue
                            </button>
                            <button
                                type="button"
                                onClick={() => applyPreset("budget_cost", "actual_cost")}
                                className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors ${
                                    isPlannedVsActual
                                        ? "bg-blue-50 text-[#4B7BEC] border border-blue-200/80"
                                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-transparent"
                                }`}
                            >
                                Planned vs Actual
                            </button>
                            <button
                                type="button"
                                onClick={() => applyPreset("total_hours", "actual_cost")}
                                className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors ${
                                    isHoursVsCost
                                        ? "bg-blue-50 text-[#4B7BEC] border border-blue-200/80"
                                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-transparent"
                                }`}
                            >
                                Hours vs Cost
                            </button>
                            <button
                                type="button"
                                onClick={() => applyPreset("budget_revenue", "margin_percent")}
                                className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors ${
                                    isRevVsMargin
                                        ? "bg-blue-50 text-[#4B7BEC] border border-blue-200/80"
                                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-transparent"
                                }`}
                            >
                                Revenue vs Margin %
                            </button>
                        </div>
                    )}
                </div>

                <CardContent className="px-5 py-3.5 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                        {/* 1. Dimension Scope & Target Entities Multi-Select */}
                        <div className="space-y-1.5">
                            <div className="h-4 flex items-center justify-between">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                                    1. Dimension Scope
                                </label>
                                {hasCustomSelection && (
                                    <span className="text-[9px] font-bold text-[#4B7BEC] bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                                        {selectedEntityIds.length}/{rawDataset.length} Active
                                    </span>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-1.5">
                                <Select
                                    value={scope}
                                    onValueChange={(val) => handleScopeChange(val as EntityScope)}
                                >
                                    <SelectTrigger className="w-full h-9 bg-white border-slate-200 text-xs font-semibold text-slate-800 shadow-xs">
                                        <SelectValue placeholder="Scope" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="projects">Projects ({projects.length})</SelectItem>
                                        <SelectItem value="members">Personnel ({members.length})</SelectItem>
                                        <SelectItem value="monthly">Timeline ({monthlyTrends.length})</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Popover open={isEntityFilterOpen} onOpenChange={setIsEntityFilterOpen}>
                                    <PopoverTrigger asChild>
                                        <button
                                            type="button"
                                            className={`flex h-9 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-xs ring-offset-background focus:outline-none focus:ring-1 focus:ring-[#4B7BEC] transition-colors ${
                                                hasCustomSelection ? "border-[#4B7BEC] text-[#4B7BEC] font-semibold bg-blue-50/40" : "text-slate-700"
                                            }`}
                                        >
                                            <span className="truncate max-w-[85px] text-xs">
                                                {!hasCustomSelection || selectedEntityIds.length === rawDataset.length
                                                    ? `All (${rawDataset.length})`
                                                    : `${selectedEntityIds.length} Picked`}
                                            </span>
                                            <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-1" />
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent align="start" className="w-80 p-3 bg-white border-slate-200 shadow-xl rounded-xl space-y-2.5 z-50">
                                        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                                    Filter {scope === "projects" ? "Projects" : scope === "members" ? "Personnel" : "Months"}
                                                </span>
                                                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono font-bold">
                                                    {!hasCustomSelection ? rawDataset.length : selectedEntityIds.length}/{rawDataset.length}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={handleSelectAllEntities}
                                                    className="text-[10px] font-bold text-[#4B7BEC] hover:text-[#385bb5]"
                                                >
                                                    Select All
                                                </button>
                                                <span className="text-slate-300">•</span>
                                                <button
                                                    type="button"
                                                    onClick={handleDeselectAllEntities}
                                                    className="text-[10px] font-semibold text-slate-500 hover:text-slate-700"
                                                >
                                                    Clear
                                                </button>
                                            </div>
                                        </div>

                                        <div className="relative p-0.5">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                                            <Input
                                                type="text"
                                                placeholder={`Search ${scope}...`}
                                                value={entitySearchQuery}
                                                onChange={(e) => setEntitySearchQuery(e.target.value)}
                                                className="pl-8 pr-7 h-8 text-xs bg-white border-slate-200 focus-visible:ring-2 focus-visible:ring-[#2568C1] focus-visible:border-[#2568C1]"
                                            />
                                            {entitySearchQuery && (
                                                <button
                                                    type="button"
                                                    onClick={() => setEntitySearchQuery("")}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            )}
                                        </div>

                                        <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
                                            {filteredEntitiesForPicker.length === 0 ? (
                                                <div className="py-4 text-center text-xs text-slate-400">No entities match search.</div>
                                            ) : (
                                                filteredEntitiesForPicker.map((entry, idx) => {
                                                    const isChecked = !hasCustomSelection || selectedEntityIds.includes(entry.id);
                                                    return (
                                                        <label
                                                            key={`entity-picker-${entry.id}-${idx}`}
                                                            className="flex items-center gap-2 p-1.5 rounded-md hover:bg-slate-50 cursor-pointer text-xs transition-colors"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={() => toggleEntity(entry.id)}
                                                                className="rounded text-[#4B7BEC] focus:ring-[#4B7BEC] h-3.5 w-3.5 border-slate-300"
                                                            />
                                                            <div className="flex flex-col min-w-0 flex-1">
                                                                <span className="font-semibold text-slate-800 truncate text-[11px] leading-tight">
                                                                    {entry.name}
                                                                </span>
                                                                <span className="text-[10px] text-slate-400 truncate leading-tight mt-0.5">
                                                                    {entry.secondary}
                                                                </span>
                                                            </div>
                                                        </label>
                                                    );
                                                })
                                            )}
                                        </div>

                                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                            <span className="text-[10px] text-slate-500 font-medium">
                                                Showing {!hasCustomSelection ? rawDataset.length : selectedEntityIds.length} entities
                                            </span>
                                            <Button
                                                type="button"
                                                size="sm"
                                                onClick={() => setIsEntityFilterOpen(false)}
                                                className="h-7 text-xs px-3 bg-[#4B7BEC] hover:bg-[#385bb5] text-white font-medium rounded-md shadow-xs"
                                            >
                                                Apply
                                            </Button>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        {/* 2. X-Axis Metric (Aligned Header) */}
                        <div className="space-y-1.5">
                            <div className="h-4 flex items-center justify-between">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                                    2. X-Axis Indicator
                                </label>
                                <Badge variant="outline" className="text-[8px] h-3.5 px-1 py-0 border-blue-200 text-[#4B7BEC] bg-blue-50/50 leading-none">
                                    Independent
                                </Badge>
                            </div>
                            <Select value={xAxisKey} onValueChange={setXAxisKey}>
                                <SelectTrigger className="w-full h-9 bg-white border-slate-200 text-xs font-semibold text-slate-800 shadow-xs">
                                    <SelectValue placeholder="Select X-Axis" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableMetrics.map((m) => (
                                        <SelectItem key={m.key} value={m.key}>
                                            {m.label} ({m.format})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* 3. Y-Axis Metric (Aligned Header) */}
                        <div className="space-y-1.5">
                            <div className="h-4 flex items-center justify-between">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                                    3. Y-Axis Indicator
                                </label>
                                <Badge variant="outline" className="text-[8px] h-3.5 px-1 py-0 border-emerald-200 text-emerald-600 bg-emerald-50/50 leading-none">
                                    Comparison
                                </Badge>
                            </div>
                            <Select value={yAxisKey} onValueChange={setYAxisKey}>
                                <SelectTrigger className="w-full h-9 bg-white border-slate-200 text-xs font-semibold text-slate-800 shadow-xs">
                                    <SelectValue placeholder="Select Y-Axis" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableMetrics.map((m) => (
                                        <SelectItem key={m.key} value={m.key}>
                                            {m.label} ({m.format})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* 4. Chart Visualization Mode (Aligned Header) */}
                        <div className="space-y-1.5">
                            <div className="h-4 flex items-center justify-between">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                                    4. Visualization Type
                                </label>
                            </div>
                            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200/60 h-9 items-center">
                                <button
                                    type="button"
                                    onClick={() => setChartType("scatter")}
                                    className={`text-[11px] font-semibold py-1 rounded transition-all ${
                                        chartType === "scatter" ? "bg-white text-[#4B7BEC] shadow-xs" : "text-slate-600 hover:text-slate-900"
                                    }`}
                                >
                                    Scatter
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setChartType("grouped_bar")}
                                    className={`text-[11px] font-semibold py-1 rounded transition-all ${
                                        chartType === "grouped_bar" ? "bg-white text-[#4B7BEC] shadow-xs" : "text-slate-600 hover:text-slate-900"
                                    }`}
                                >
                                    Dual Bar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setChartType("ranked_bar")}
                                    className={`text-[11px] font-semibold py-1 rounded transition-all ${
                                        chartType === "ranked_bar" ? "bg-white text-[#4B7BEC] shadow-xs" : "text-slate-600 hover:text-slate-900"
                                    }`}
                                >
                                    Ranked
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ========================================================================= */}
                    {/* HIGHLIGHT FILTER (FOOD SYSTEMS DASHBOARD EXPERIENCE) */}
                    {/* ========================================================================= */}
                    <div className="pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2 flex-1 w-full sm:w-auto max-w-md">
                            <div className="relative w-full p-0.5">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                                <Input
                                    type="text"
                                    placeholder={`Search & highlight specific ${scope === "projects" ? "project" : scope === "members" ? "member" : "month"}...`}
                                    value={highlightQuery}
                                    onChange={(e) => {
                                        setHighlightQuery(e.target.value);
                                        setSelectedHighlight(null);
                                    }}
                                    className="pl-8 pr-8 h-8 text-xs border-slate-200 bg-white shadow-xs focus-visible:ring-2 focus-visible:ring-[#2568C1] focus-visible:border-[#2568C1]"
                                />
                                {highlightQuery && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setHighlightQuery("");
                                            setSelectedHighlight(null);
                                        }}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Active Highlight Badge & Quick Suggestions */}
                        <div className="flex flex-wrap items-center gap-1.5 text-xs">
                            <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">Highlight:</span>
                            {searchableNames.slice(0, 4).map((name, idx) => {
                                const isSelected = selectedHighlight === name || highlightQuery.toLowerCase() === name.toLowerCase();
                                return (
                                    <button
                                        key={`highlight-pill-${name}-${idx}`}
                                        type="button"
                                        onClick={() => {
                                            if (isSelected) {
                                                setSelectedHighlight(null);
                                                setHighlightQuery("");
                                            } else {
                                                setSelectedHighlight(name);
                                                setHighlightQuery(name);
                                            }
                                        }}
                                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all flex items-center gap-1 ${
                                            isSelected
                                                ? "bg-slate-900 text-white shadow-xs"
                                                : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/60"
                                        }`}
                                    >
                                        <span className="truncate max-w-[120px]">{name}</span>
                                        {isSelected && <Check className="h-2.5 w-2.5 ml-0.5" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ========================================================================= */}
            {/* KPI STATS ROW (DASHBOARD STANDARD ARCHITECTURE) */}
            {/* ========================================================================= */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                {/* 1. Analyzed Entities */}
                <Card className={cardClass}>
                    <CardContent className="px-4 py-3 flex flex-row items-center gap-4 h-full">
                        <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-[#4B7BEC] shrink-0">
                            <FolderKanban className="h-6 w-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 truncate">
                                Analyzed Entities
                            </p>
                            <span className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-tight block truncate">
                                {activeDataset.length} Records
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium truncate block capitalize">
                                {hasCustomSelection ? `Filtered (${activeDataset.length}/${rawDataset.length})` : `Dimension: ${scope}`}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Average Metric X */}
                <Card className={cardClass}>
                    <CardContent className="px-4 py-3 flex flex-row items-center gap-4 h-full">
                        <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-[#4B7BEC] shrink-0">
                            <BarChart2 className="h-6 w-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 truncate">
                                Avg {xMetricInfo.label}
                            </p>
                            <span className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-tight block truncate">
                                {formatValue(avgX, xMetricInfo.format)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium truncate block">
                                X-Axis Baseline
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Average Metric Y */}
                <Card className={cardClass}>
                    <CardContent className="px-4 py-3 flex flex-row items-center gap-4 h-full">
                        <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 truncate">
                                Avg {yMetricInfo.label}
                            </p>
                            <span className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-tight block truncate">
                                {formatValue(avgY, yMetricInfo.format)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium truncate block">
                                Y-Axis Baseline
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* 4. Top Performer */}
                <Card className={cardClass}>
                    <CardContent className="px-4 py-3 flex flex-row items-center gap-4 h-full">
                        <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                            <Trophy className="h-6 w-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 truncate">
                                Top Indicator
                            </p>
                            <span className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-tight block truncate">
                                {topPerformer?.name || "-"}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium truncate block">
                                {topPerformer ? formatValue(topPerformer.y, yMetricInfo.format) : "-"}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ========================================================================= */}
            {/* MAIN CHART CANVAS (EXACT DASHBOARD CARD ARCHITECTURE) */}
            {/* ========================================================================= */}
            <Card className="bg-white border-slate-100 shadow-sm rounded-xl overflow-hidden flex flex-col p-0 py-0 gap-0">
                <div className="px-5 py-3.5 border-b border-slate-100 bg-white flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <BarChart3 className="h-4 w-4 text-[#4B7BEC] shrink-0" />
                        <div className="flex flex-col">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
                                {yMetricInfo.label} vs {xMetricInfo.label}
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium leading-none mt-1">
                                {chartType === "scatter"
                                    ? "Each bubble represents a distinct entity. Hover to inspect coordinates or search to highlight."
                                    : chartType === "grouped_bar"
                                    ? "Side-by-side comparative bars for scale evaluation."
                                    : "Descending ranked ordering based on primary comparison metric."}
                            </p>
                        </div>
                    </div>

                    {/* Export Actions Toolbar */}
                    <div className="flex items-center gap-2">
                        {activeHighlightName && (
                            <Badge className="bg-slate-900 text-white text-[10px] font-semibold px-2 py-0.5 mr-2">
                                Highlight: &quot;{activeHighlightName}&quot;
                            </Badge>
                        )}
                        <Button
                            type="button"
                            size="sm"
                            onClick={handleExportExcel}
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
                            className="h-8 text-xs border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold gap-1.5 px-3 shadow-xs"
                        >
                            <Printer className="h-3.5 w-3.5 text-slate-500" />
                            PDF (Landscape)
                        </Button>
                    </div>
                </div>

                <CardContent className="px-5 py-4">
                    <div id="indicator-comparison-chart-container" className="w-full h-[320px]">
                        {activeDataset.length === 0 ? (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                                <FolderKanban className="h-8 w-8 text-slate-300" />
                                <p className="text-xs font-semibold text-slate-600">No Entities Selected</p>
                                <p className="text-[11px] text-slate-400 max-w-sm text-center">
                                    You have 0 items picked. Please select one or more items from the Dimension Scope dropdown to visualize comparisons.
                                </p>
                            </div>
                        ) : chartType === "scatter" ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 40 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis
                                        type="number"
                                        dataKey="x"
                                        name={xMetricInfo.label}
                                        tick={{ fontSize: 11, fill: "#64748b" }}
                                        tickFormatter={(v) => {
                                            if (xMetricInfo.format === "currency") {
                                                return `Rp ${(v / 1000000).toFixed(0)}M`;
                                            }
                                            if (xMetricInfo.format === "percent") {
                                                return `${v}%`;
                                            }
                                            return `${v}`;
                                        }}
                                        label={{
                                            value: xMetricInfo.label,
                                            position: "bottom",
                                            offset: 20,
                                            fill: "#475569",
                                            fontSize: 11,
                                            fontWeight: 600,
                                        }}
                                    />
                                    <YAxis
                                        type="number"
                                        dataKey="y"
                                        name={yMetricInfo.label}
                                        tick={{ fontSize: 11, fill: "#64748b" }}
                                        tickFormatter={(v) => {
                                            if (yMetricInfo.format === "currency") {
                                                return `Rp ${(v / 1000000).toFixed(0)}M`;
                                            }
                                            if (yMetricInfo.format === "percent") {
                                                return `${v}%`;
                                            }
                                            return `${v}`;
                                        }}
                                        label={{
                                            value: yMetricInfo.label,
                                            angle: -90,
                                            position: "left",
                                            offset: 20,
                                            fill: "#475569",
                                            fontSize: 11,
                                            fontWeight: 600,
                                        }}
                                    />
                                    <ZAxis range={[70, 70]} />

                                    {/* Average reference quadrant crosshairs */}
                                    <ReferenceLine x={avgX} stroke="#cbd5e1" strokeDasharray="4 4" />
                                    <ReferenceLine y={avgY} stroke="#cbd5e1" strokeDasharray="4 4" />

                                    <Tooltip
                                        cursor={{ strokeDasharray: "3 3" }}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                const isHighlighted = activeHighlightName && data.name.toLowerCase().includes(activeHighlightName);
                                                return (
                                                    <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl border border-slate-800 text-xs space-y-1 z-50">
                                                        <div className="font-bold text-blue-300">
                                                            {data.name}
                                                        </div>
                                                        <div className="text-[11px] text-slate-400">{data.secondary}</div>
                                                        <div className="pt-1.5 mt-1 border-t border-slate-800 space-y-0.5 font-mono text-[11px]">
                                                            <div>
                                                                <span className="text-slate-400">{xMetricInfo.label}:</span>{" "}
                                                                <strong className="text-white">{formatValue(data.x, xMetricInfo.format)}</strong>
                                                            </div>
                                                            <div>
                                                                <span className="text-slate-400">{yMetricInfo.label}:</span>{" "}
                                                                <strong className="text-emerald-400">{formatValue(data.y, yMetricInfo.format)}</strong>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />

                                    <Scatter name="Entities" data={activeDataset} isAnimationActive={false}>
                                        {activeDataset.map((entry, index) => {
                                            const isHighlighted = activeHighlightName && entry.name.toLowerCase().includes(activeHighlightName);
                                            return (
                                                <Cell
                                                    key={`scatter-cell-${entry.id}-${index}`}
                                                    fill={isHighlighted ? "#0f172a" : "#94a3b8"}
                                                    stroke={isHighlighted ? "#4B7BEC" : "transparent"}
                                                    strokeWidth={isHighlighted ? 3 : 0}
                                                    opacity={isHighlighted ? 1 : activeHighlightName ? 0.35 : 0.75}
                                                />
                                            );
                                        })}
                                    </Scatter>
                                </ScatterChart>
                            </ResponsiveContainer>
                        ) : chartType === "grouped_bar" ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={activeDataset.slice(0, 15)} margin={{ top: 20, right: 30, bottom: 40, left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 10, fill: "#64748b" }}
                                        interval={0}
                                        angle={-25}
                                        textAnchor="end"
                                    />
                                    <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "none", color: "#fff", fontSize: "12px" }}
                                        formatter={(val: any, name: any) => [
                                            formatValue(Number(val), name === xMetricInfo.label ? xMetricInfo.format : yMetricInfo.format),
                                            name,
                                        ]}
                                    />
                                    <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                                    <Bar dataKey="x" name={xMetricInfo.label} fill="#4B7BEC" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                                    <Bar dataKey="y" name={yMetricInfo.label} fill="#10b981" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    layout="vertical"
                                    data={[...activeDataset].sort((a, b) => b.y - a.y).slice(0, 12)}
                                    margin={{ top: 10, right: 30, bottom: 20, left: 100 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} />
                                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#1e293b", fontWeight: 500 }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "none", color: "#fff", fontSize: "12px" }}
                                        formatter={(val: any) => [formatValue(Number(val), yMetricInfo.format), yMetricInfo.label]}
                                    />
                                    <Bar dataKey="y" name={yMetricInfo.label} fill="#4B7BEC" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                                        {[...activeDataset].sort((a, b) => b.y - a.y).slice(0, 12).map((entry, index) => {
                                            const isHighlighted = activeHighlightName && entry.name.toLowerCase().includes(activeHighlightName);
                                            return (
                                                <Cell
                                                    key={`cell-ranked-${entry.id}-${index}`}
                                                    fill={isHighlighted ? "#0f172a" : index === 0 ? "#10b981" : "#4B7BEC"}
                                                />
                                            );
                                        })}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </CardContent>
            </Card>
            {/* ========================================================================= */}
            {/* COMPARATIVE DATA MATRIX TABLE (ZERO GAP STANDARD ARCHITECTURE) */}
            {/* ========================================================================= */}
            <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden flex flex-col p-0 py-0 gap-0">
                <div className="px-5 py-3.5 border-b border-slate-100 bg-white flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <BarChart2 className="h-4 w-4 text-[#4B7BEC] shrink-0" />
                        <div className="flex flex-col">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
                                COMPARATIVE MATRIX ({filteredTableRecords.length} ROWS)
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium leading-none mt-1">
                                Correlation metrics matching the active parameters
                            </p>
                        </div>
                    </div>

                    {/* Table Toolbar (Search & Show Rows) */}
                    <div className="flex items-center gap-2">
                        <div className="relative w-48 p-0.5">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                            <Input
                                type="text"
                                placeholder="Search matrix..."
                                value={tableSearch}
                                onChange={(e) => {
                                    setTableSearch(e.target.value);
                                    setPage(1);
                                }}
                                className="pl-8 pr-7 h-8 text-xs border-slate-200 bg-white shadow-xs focus-visible:ring-2 focus-visible:ring-[#2568C1] focus-visible:border-[#2568C1]"
                            />
                            {tableSearch && (
                                <button
                                    type="button"
                                    onClick={() => setTableSearch("")}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase">Show:</span>
                            <Select 
                                value={String(pageSize)} 
                                onValueChange={(v) => {
                                    setPageSize(Number(v));
                                    setPage(1);
                                }}
                            >
                                <SelectTrigger className="h-8 w-[65px] bg-white border-slate-200 text-xs font-medium">
                                    <SelectValue placeholder="10" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-500 uppercase tracking-wider h-10">
                                <th className="py-2 px-4 w-12 text-center">No</th>
                                <th className="py-2 px-4 text-left">Entity Identifier</th>
                                <th className="py-2 px-4 text-left">Scope Context</th>
                                <th className="py-2 px-4 text-right">{xMetricInfo.label} (X)</th>
                                <th className="py-2 px-4 text-right">{yMetricInfo.label} (Y)</th>
                                <th className="py-2 px-4 text-center">Ratio (Y/X)</th>
                                <th className="py-2 px-4 text-center">Benchmark Quadrant</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paginatedRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center gap-1.5">
                                            <FolderKanban className="h-6 w-6 text-slate-300" />
                                            <p className="text-xs font-medium text-slate-500">No records match the active scope or filter.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedRecords.map((d, index) => {
                                    const isHighlighted = activeHighlightName && d.name.toLowerCase().includes(activeHighlightName);
                                    const ratio = d.x !== 0 ? (d.y / d.x).toFixed(2) : "-";
                                    const isAboveAvgX = d.x >= avgX;
                                    const isAboveAvgY = d.y >= avgY;

                                    return (
                                        <tr
                                            key={`matrix-row-${scope}-${d.id}-${index}`}
                                            className={`transition-colors border-b border-slate-100 last:border-0 ${
                                                isHighlighted
                                                    ? "bg-blue-50/80 font-semibold"
                                                    : "hover:bg-[#f0f4fa]/50"
                                            }`}
                                        >
                                            <td className="py-2.5 px-4 text-center text-xs font-medium text-slate-500">
                                            {(page - 1) * pageSize + index + 1}
                                        </td>
                                        <td className="py-2.5 px-4">
                                            <span className="text-xs font-semibold text-slate-900">{d.name}</span>
                                        </td>
                                        <td className="py-2.5 px-4 text-slate-500 text-[11px]">
                                            {d.secondary}
                                        </td>
                                        <td className="py-2.5 px-4 text-right font-mono text-xs text-slate-600">
                                            {formatValue(d.x, xMetricInfo.format)}
                                        </td>
                                        <td className="py-2.5 px-4 text-right font-mono text-xs font-semibold text-slate-900">
                                            {formatValue(d.y, yMetricInfo.format)}
                                        </td>
                                        <td className="py-2.5 px-4 text-center font-mono text-slate-600">
                                            <Badge variant="outline" className="text-[10px] h-4.5 px-2 py-0 leading-none font-mono">
                                                {ratio}x
                                            </Badge>
                                        </td>
                                        <td className="py-2.5 px-4 text-center">
                                            {isAboveAvgX && isAboveAvgY ? (
                                                <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 text-[10px] h-4.5 px-2 py-0 leading-none font-semibold">
                                                    High X • High Y (Top Tier)
                                                </Badge>
                                            ) : !isAboveAvgX && isAboveAvgY ? (
                                                <Badge className="bg-blue-50 text-blue-600 border-blue-200 text-[10px] h-4.5 px-2 py-0 leading-none font-semibold">
                                                    Low X • High Y (High Efficiency)
                                                </Badge>
                                            ) : isAboveAvgX && !isAboveAvgY ? (
                                                <Badge className="bg-amber-50 text-amber-600 border-amber-200 text-[10px] h-4.5 px-2 py-0 leading-none font-semibold">
                                                    High X • Low Y (High Cost)
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 text-[10px] h-4.5 px-2 py-0 leading-none font-medium">
                                                    Below Benchmark
                                                </Badge>
                                            )}
                                        </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Standard Admin-Style Pagination Footer */}
                {filteredTableRecords.length > 0 && (
                    <div className="border-t border-[#e2e8f0] bg-white px-4 py-3 flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                            Showing <span className="font-medium text-[#0f172a]">{(page - 1) * pageSize + 1}</span> to <span className="font-medium text-[#0f172a]">{Math.min(page * pageSize, filteredTableRecords.length)}</span> of <span className="font-medium text-[#0f172a]">{filteredTableRecords.length}</span> entries
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
