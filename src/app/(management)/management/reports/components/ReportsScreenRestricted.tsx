"use client";

import React from "react";
import Link from "next/link";
import { 
    MonitorSmartphone, 
    Maximize2, 
    ArrowLeft, 
    Layers, 
    BarChart3, 
    FileSpreadsheet,
    ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function ReportsScreenRestricted() {
    return (
        <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
            <div className="max-w-lg w-full bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                {/* Card Top Header */}
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#4B7BEC] shrink-0 border border-blue-100">
                            <MonitorSmartphone className="h-4 w-4" />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400 block leading-none">
                                Screen Viewport Restricted
                            </span>
                            <h2 className="text-xs font-bold text-slate-700 mt-1 leading-none">
                                Tablet or Desktop Required
                            </h2>
                        </div>
                    </div>
                    <Badge variant="outline" className="text-[9px] font-semibold bg-amber-50 text-amber-700 border-amber-200 gap-1 px-2 py-0.5">
                        <ShieldAlert className="h-3 w-3 text-amber-600" />
                        Min. 768px
                    </Badge>
                </div>

                {/* Card Body */}
                <div className="p-6 space-y-5">
                    {/* Visual Illustration & Title */}
                    <div className="text-center space-y-2 py-2">
                        <div className="mx-auto h-14 w-14 rounded-2xl bg-blue-50/80 border border-blue-100 flex items-center justify-center text-[#4B7BEC] shadow-xs">
                            <Maximize2 className="h-7 w-7 animate-pulse" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 tracking-tight">
                            Display Width Insufficient
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                            The <span className="font-semibold text-slate-700">Executive Reports & Visual Analytics</span> suite is engineered for high-density multidimensional matrices, interactive scatter correlation charts, and multi-sheet data export tools.
                        </p>
                    </div>

                    {/* Specifications Box */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Layers className="h-3.5 w-3.5 text-[#4B7BEC]" />
                            <span>Supported Viewport Specifications</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div className="bg-white p-2.5 rounded-lg border border-slate-200/60 flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                                <div className="min-w-0">
                                    <span className="text-[10px] text-slate-400 block font-medium">Tablet & Desktop</span>
                                    <span className="font-semibold text-slate-800 text-xs">≥ 768px Width</span>
                                </div>
                            </div>

                            <div className="bg-white p-2.5 rounded-lg border border-slate-200/60 flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-red-400 shrink-0" />
                                <div className="min-w-0">
                                    <span className="text-[10px] text-slate-400 block font-medium">Mobile Screens</span>
                                    <span className="font-semibold text-slate-500 text-xs">&lt; 768px (Restricted)</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                            <span className="flex items-center gap-1">
                                <BarChart3 className="h-3 w-3 text-slate-400" /> Dynamic Charts
                            </span>
                            <span className="flex items-center gap-1">
                                <FileSpreadsheet className="h-3 w-3 text-slate-400" /> Master Workbooks
                            </span>
                        </div>
                    </div>

                    {/* Action Advice */}
                    <p className="text-[11px] text-slate-400 text-center italic">
                        Please expand your browser window or switch to an iPad / Tablet (portrait or landscape) or desktop monitor to access this module.
                    </p>
                </div>

                {/* Card Footer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto text-xs border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold gap-1.5 shadow-xs"
                    >
                        <Link href="/management/dashboard">
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Return to Dashboard
                        </Link>
                    </Button>

                    <span className="text-[10px] font-mono text-slate-400">
                        HAERARCHY • EXECUTIVE SUITE
                    </span>
                </div>
            </div>
        </div>
    );
}
