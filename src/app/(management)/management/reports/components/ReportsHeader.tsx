"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
    LineChart, 
    FileSpreadsheet, 
    Layers, 
    RefreshCw, 
    Activity 
} from "lucide-react";

export type ReportActiveTab = "compare" | "export_hub" | "presets";

interface ReportsHeaderProps {
    activeTab: ReportActiveTab;
    onTabChange: (tab: ReportActiveTab) => void;
    onRefresh: () => void;
    isLoading?: boolean;
}

export function ReportsHeader({ activeTab, onTabChange, onRefresh, isLoading }: ReportsHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-100">
            <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                        Reports & Visual Analytics
                    </h1>
                    <Badge variant="outline" className="bg-blue-50 text-[#4B7BEC] border-blue-200 font-semibold text-[10px] px-2 py-0.5">
                        <Activity className="h-3 w-3 mr-1 text-[#4B7BEC]" /> Dynamic Engine
                    </Badge>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
                    Compare organizational indicators, explore multidimensional correlations, and export custom or merged datasets to Excel and Landscape PDF.
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                {/* Tab Navigation Pill Group */}
                <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200/60">
                    <button
                        type="button"
                        onClick={() => onTabChange("compare")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                            activeTab === "compare"
                                ? "bg-white text-[#4B7BEC] shadow-xs"
                                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                        }`}
                    >
                        <LineChart className="h-3.5 w-3.5" />
                        <span>Compare Indicators</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => onTabChange("export_hub")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                            activeTab === "export_hub"
                                ? "bg-white text-[#4B7BEC] shadow-xs"
                                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                        }`}
                    >
                        <FileSpreadsheet className="h-3.5 w-3.5" />
                        <span>Custom Data & Merged Export</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => onTabChange("presets")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                            activeTab === "presets"
                                ? "bg-white text-[#4B7BEC] shadow-xs"
                                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                        }`}
                    >
                        <Layers className="h-3.5 w-3.5" />
                        <span>Preset Reports</span>
                    </button>
                </div>

                {/* Refresh Button */}
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onRefresh}
                    disabled={isLoading}
                    className="h-8.5 gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs"
                >
                    <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-[#4B7BEC]" : "text-slate-500"}`} />
                    <span className="hidden sm:inline">Refresh Data</span>
                </Button>
            </div>
        </div>
    );
}
