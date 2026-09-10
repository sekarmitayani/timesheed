"use client";

import React, { useState } from "react";
import { useReportsData } from "./hooks/useReportsData";
import { ReportsHeader, ReportActiveTab } from "./components/ReportsHeader";
import { IndicatorComparisonView } from "./components/IndicatorComparisonView";
import { CustomDataExportView } from "./components/CustomDataExportView";
import { PresetExecutiveReports } from "./components/PresetExecutiveReports";
import { ReportsScreenRestricted } from "./components/ReportsScreenRestricted";
import { TableSkeleton } from "@/components/shared/loaders/TableSkeleton";
import { KpiCardsSkeleton } from "@/components/shared/loaders/DashboardSkeleton";
import { Table, TableBody } from "@/components/ui/table";

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
        <>
            {/* 1. Mobile Restricted Notice (Visible ONLY on viewports < 768px / smaller than tablet) */}
            <div className="block md:hidden">
                <ReportsScreenRestricted />
            </div>

            {/* 2. Main Desktop View (Visible ONLY on md screens and above >= 768px) */}
            <div className="hidden md:block space-y-6">
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
                    <div className="space-y-6 no-print animate-in fade-in duration-300">
                        <KpiCardsSkeleton count={4} />
                        <div className="bg-white border border-slate-100 rounded-lg overflow-hidden shadow-sm">
                            <Table>
                                <TableBody>
                                    <TableSkeleton rows={6} columns={6} />
                                </TableBody>
                            </Table>
                        </div>
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
        </>
    );
}
