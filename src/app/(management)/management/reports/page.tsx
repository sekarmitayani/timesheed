"use client";

import React, { useState } from "react";
import { useReportsData } from "./hooks/useReportsData";
import { ReportsHeader, ReportActiveTab } from "./components/ReportsHeader";
import { IndicatorComparisonView } from "./components/IndicatorComparisonView";
import { CustomDataExportView } from "./components/CustomDataExportView";
import { PresetExecutiveReports } from "./components/PresetExecutiveReports";
import { Loader2 } from "lucide-react";

export default function ManagementReportsPage() {
    const [activeTab, setActiveTab] = useState<ReportActiveTab>("compare");
    const {
        isLoading,
        projects,
        members,
        monthlyTrends,
        resources,
        compositeProjectMaster,
        compositeEmployeePayroll,
        refetch,
    } = useReportsData();

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Standard SaaS Navigation Header */}
            <div className="no-print">
                <ReportsHeader
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    onRefresh={refetch}
                    isLoading={isLoading}
                />
            </div>

            {/* Loading Skeleton */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-3 bg-white rounded-lg border border-[#e2e8f0] shadow-sm no-print">
                    <Loader2 className="h-9 w-9 animate-spin text-[#2568C1]" />
                    <p className="text-xs text-slate-500 font-medium tracking-wide">
                        Aggregating multi-source management data & financial ledgers...
                    </p>
                </div>
            ) : (
                <>
                    {/* Tab 1: Visual Indicator Comparison (Tableau / Food Systems Dashboard Style) */}
                    {activeTab === "compare" && (
                        <IndicatorComparisonView
                            projects={projects}
                            members={members}
                            monthlyTrends={monthlyTrends}
                            compositeProjects={compositeProjectMaster}
                        />
                    )}

                    {/* Tab 2: Custom Data & Merged Export Hub (Date Filtering & Cross-Module Joins) */}
                    {activeTab === "export_hub" && (
                        <CustomDataExportView
                            projects={projects}
                            members={members}
                            resources={resources}
                            monthlyTrends={monthlyTrends}
                            compositeProjectMaster={compositeProjectMaster}
                            compositeEmployeePayroll={compositeEmployeePayroll}
                        />
                    )}

                    {/* Tab 3: Preset Executive Reports (Audit-ready 1-click downloads) */}
                    {activeTab === "presets" && (
                        <PresetExecutiveReports
                            projects={projects}
                            members={members}
                            resources={resources}
                            monthlyTrends={monthlyTrends}
                            compositeProjects={compositeProjectMaster}
                            compositeMembers={compositeEmployeePayroll}
                        />
                    )}
                </>
            )}
        </div>
    );
}
