"use client";

import React from "react";

interface PrintLandscapeReportProps {
    title: string;
    subtitle?: string;
    dateRangeLabel?: string;
    appliedFilters?: { label: string; value: string }[];
    summaryMetrics?: { label: string; value: string | number }[];
    columns: { header: string; key: string; align?: "left" | "right" | "center" }[];
    data: any[];
}

export function PrintLandscapeReport({
    title,
    subtitle,
    dateRangeLabel,
    appliedFilters = [],
    summaryMetrics = [],
    columns,
    data,
}: PrintLandscapeReportProps) {
    const todayFormatted = new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <div className="hidden print:block print:w-full print:bg-white print:text-black print:p-6 font-sans">
            <style jsx global>{`
                @media print {
                    @page {
                        size: landscape;
                        margin: 10mm 12mm;
                    }
                    body {
                        background: #ffffff !important;
                        color: #0f172a !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    /* Hide web interactive chrome */
                    header, nav, aside, .no-print, button, [role="tablist"] {
                        display: none !important;
                    }
                    .print-break-inside-avoid {
                        break-inside: avoid;
                    }
                }
            `}</style>

            {/* Document Header */}
            <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start">
                <div>
                    <div className="text-xs font-black tracking-widest text-[#2568C1] uppercase mb-1">
                        HAERARCHY • EXECUTIVE MANAGEMENT INTELLIGENCE
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 leading-tight">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-xs text-slate-600 mt-1">
                            {subtitle}
                        </p>
                    )}
                </div>

                <div className="text-right text-[11px] text-slate-600 space-y-0.5 font-mono">
                    <div><strong>Generated:</strong> {todayFormatted}</div>
                    {dateRangeLabel && <div><strong>Period:</strong> {dateRangeLabel}</div>}
                    <div><strong>Total Records:</strong> {data.length}</div>
                </div>
            </div>

            {/* Active Filters & Summary KPI Cards */}
            {(appliedFilters.length > 0 || summaryMetrics.length > 0) && (
                <div className="mb-6 space-y-3">
                    {appliedFilters.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 text-xs bg-slate-50 p-2.5 rounded border border-slate-200">
                            <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Filter Scope:</span>
                            {appliedFilters.map((f, idx) => (
                                <span key={idx} className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800 font-mono text-[11px]">
                                    <strong>{f.label}:</strong> {f.value}
                                </span>
                            ))}
                        </div>
                    )}

                    {summaryMetrics.length > 0 && (
                        <div className="grid grid-cols-4 gap-3">
                            {summaryMetrics.map((m, idx) => (
                                <div key={idx} className="bg-slate-50 p-3 rounded border border-slate-200">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                        {m.label}
                                    </div>
                                    <div className="text-lg font-black text-slate-900 mt-0.5">
                                        {m.value}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Data Table */}
            <div className="border border-slate-300 rounded overflow-hidden">
                <table className="w-full text-[11px] text-left border-collapse">
                    <thead className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800 uppercase tracking-wider text-[9px]">
                        <tr>
                            <th className="p-2 border-r border-slate-200 w-10 text-center">#</th>
                            {columns.map((col, idx) => (
                                <th
                                    key={idx}
                                    className={`p-2 border-r border-slate-200 last:border-r-0 ${
                                        col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                                    }`}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                        {data.map((row, rIdx) => (
                            <tr key={rIdx} className={rIdx % 2 === 1 ? "bg-slate-50/70" : "bg-white"}>
                                <td className="p-2 border-r border-slate-200 text-center font-mono text-slate-500">
                                    {rIdx + 1}
                                </td>
                                {columns.map((col, cIdx) => (
                                    <td
                                        key={cIdx}
                                        className={`p-2 border-r border-slate-200 last:border-r-0 ${
                                            col.align === "right" ? "text-right font-mono" : col.align === "center" ? "text-center font-mono" : "text-left"
                                        }`}
                                    >
                                        {row[col.key] !== undefined && row[col.key] !== null ? String(row[col.key]) : "-"}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer Signoff */}
            <div className="mt-8 pt-4 border-t border-slate-300 flex justify-between text-[10px] text-slate-500 font-mono">
                <div>Confidential • Internal Management Use Only</div>
                <div>Timesheed Enterprise SaaS Platform</div>
            </div>
        </div>
    );
}
