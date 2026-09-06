import * as XLSX from "xlsx";

/**
 * Automatically computes appropriate column widths based on cell content length
 */
export function autoComputeColumnWidths(dataRows: any[][], minWidth = 12, maxWidth = 45): XLSX.ColInfo[] {
    if (!dataRows || dataRows.length === 0) return [];
    
    const colCount = Math.max(...dataRows.map(row => row.length));
    const widths: XLSX.ColInfo[] = [];

    for (let c = 0; c < colCount; c++) {
        let maxLen = minWidth;
        for (let r = 0; r < dataRows.length; r++) {
            const cellValue = dataRows[r][c];
            if (cellValue !== undefined && cellValue !== null) {
                const str = String(cellValue);
                if (str.length > maxLen) {
                    maxLen = str.length;
                }
            }
        }
        widths.push({ wch: Math.min(maxLen + 3, maxWidth) });
    }

    return widths;
}

/**
 * Formats standard currency string
 */
export function fmtIDR(val: number): string {
    if (val === undefined || val === null || isNaN(val)) return "Rp 0";
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(val);
}

/**
 * Builds a highly polished Excel Workbook for Indicator Comparison
 */
export function generateComparisonExcelWorkbook({
    scope,
    xMetricInfo,
    yMetricInfo,
    avgX,
    avgY,
    topPerformer,
    rawDataset,
    formatValue,
}: {
    scope: string;
    xMetricInfo: { key: string; label: string; format: any };
    yMetricInfo: { key: string; label: string; format: any };
    avgX: number;
    avgY: number;
    topPerformer: any;
    rawDataset: any[];
    formatValue: (val: number, fmt: any) => string;
}): XLSX.WorkBook {
    const wb = XLSX.utils.book_new();
    const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

    // =========================================================================
    // SHEET 1: VISUAL ANALYTICS & EXECUTIVE KPI SUMMARY
    // =========================================================================
    const sheet1Data: any[][] = [
        ["HAERARCHY • EXECUTIVE MANAGEMENT INTELLIGENCE"],
        [`INDICATOR COMPARISON & BENCHMARK ANALYTICS (${scope.toUpperCase()})`],
        [`Generated On: ${today} | Total Entities Analyzed: ${rawDataset.length}`],
        [],
        ["1. EXECUTIVE KPI BASELINE BENCHMARKS", ""],
        ["Metric Dimension", "Dimension Value"],
        ["Dimension Scope", scope.toUpperCase()],
        [`Independent Indicator (X-Axis)`, xMetricInfo.label],
        [`Baseline Average (${xMetricInfo.label})`, formatValue(avgX, xMetricInfo.format)],
        [`Comparison Indicator (Y-Axis)`, yMetricInfo.label],
        [`Baseline Average (${yMetricInfo.label})`, formatValue(avgY, yMetricInfo.format)],
        ["Top Performer Entity", topPerformer?.name || "-"],
        [`Top Performer (${yMetricInfo.label})`, topPerformer ? formatValue(topPerformer.y, yMetricInfo.format) : "-"],
        [],
        ["2. TOP 5 RANKED ENTITIES BY COMPARISON METRIC", "", "", "", ""],
        ["Rank", "Entity Name", "Context Scope", `${xMetricInfo.label} (X)`, `${yMetricInfo.label} (Y)`]
    ];

    const sortedTop5 = [...rawDataset].sort((a, b) => b.y - a.y).slice(0, 5);
    sortedTop5.forEach((item, idx) => {
        sheet1Data.push([
            idx + 1,
            item.name,
            item.secondary,
            formatValue(item.x, xMetricInfo.format),
            formatValue(item.y, yMetricInfo.format)
        ]);
    });

    sheet1Data.push([]);
    sheet1Data.push(["3. QUADRANT DISTRIBUTION BENCHMARK", "", ""]);
    sheet1Data.push(["Quadrant Benchmark", "Condition", "Count of Entities"]);

    const highXHighY = rawDataset.filter(d => d.x >= avgX && d.y >= avgY).length;
    const lowXHighY = rawDataset.filter(d => d.x < avgX && d.y >= avgY).length;
    const highXLowY = rawDataset.filter(d => d.x >= avgX && d.y < avgY).length;
    const lowXLowY = rawDataset.filter(d => d.x < avgX && d.y < avgY).length;

    sheet1Data.push(["High X • High Y (Top Tier)", `X >= Avg & Y >= Avg`, highXHighY]);
    sheet1Data.push(["Low X • High Y (High Efficiency)", `X < Avg & Y >= Avg`, lowXHighY]);
    sheet1Data.push(["High X • Low Y (High Cost)", `X >= Avg & Y < Avg`, highXLowY]);
    sheet1Data.push(["Low X • Low Y (Below Baseline)", `X < Avg & Y < Avg`, lowXLowY]);

    const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
    ws1["!cols"] = autoComputeColumnWidths(sheet1Data, 15, 50);
    XLSX.utils.book_append_sheet(wb, ws1, "Visual Analytics & KPIs");

    // =========================================================================
    // SHEET 2: COMPLETE COMPARATIVE DATA MATRIX
    // =========================================================================
    const sheet2Data: any[][] = [
        ["HAERARCHY • COMPARATIVE MATRIX DATA LEDGER"],
        [`Comparing: ${yMetricInfo.label} (Y) vs ${xMetricInfo.label} (X)`],
        [`Export Scope: ${scope.toUpperCase()} | Generated: ${today}`],
        [],
        [
            "No",
            "Entity Identifier",
            "Scope Context",
            `${xMetricInfo.label} (X-Axis)`,
            `${yMetricInfo.label} (Y-Axis)`,
            "Ratio (Y / X)",
            "Benchmark Classification"
        ]
    ];

    rawDataset.forEach((d, index) => {
        const ratio = d.x !== 0 ? (d.y / d.x).toFixed(2) + "x" : "-";
        const isAboveAvgX = d.x >= avgX;
        const isAboveAvgY = d.y >= avgY;
        const benchmark = isAboveAvgX && isAboveAvgY 
            ? "High X • High Y (Top Tier)"
            : !isAboveAvgX && isAboveAvgY
            ? "Low X • High Y (High Efficiency)"
            : isAboveAvgX && !isAboveAvgY
            ? "High X • Low Y (High Cost)"
            : "Below Baseline";

        sheet2Data.push([
            index + 1,
            d.name,
            d.secondary,
            formatValue(d.x, xMetricInfo.format),
            formatValue(d.y, yMetricInfo.format),
            ratio,
            benchmark
        ]);
    });

    const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
    ws2["!cols"] = autoComputeColumnWidths(sheet2Data, 12, 45);
    // Enable AutoFilter on row 5 (index 4)
    ws2["!autofilter"] = { ref: `A5:G${sheet2Data.length}` };
    XLSX.utils.book_append_sheet(wb, ws2, "Comparative Data Matrix");

    return wb;
}

/**
 * Builds a highly polished Excel Workbook for Custom Data Export Hub
 */
export function generateCustomExportExcelWorkbook({
    selectedDataset,
    startDate,
    endDate,
    filteredRecords,
    summaryStats,
}: {
    selectedDataset: string;
    startDate?: string;
    endDate?: string;
    filteredRecords: any[];
    summaryStats: { count: number; totalRevenue: number; totalExpenses: number; netProfit: number };
}): XLSX.WorkBook {
    const wb = XLSX.utils.book_new();
    const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    const periodLabel = startDate && endDate ? `${startDate} to ${endDate}` : "Full Historical Database";

    const datasetTitle = selectedDataset === "composite_project_master"
        ? "Project Master (Cost, Hours, Profit Margin & Resources)"
        : selectedDataset === "composite_employee_payroll"
        ? "Employee Utilization & Total Compensation"
        : selectedDataset.toUpperCase();

    const sheetData: any[][] = [
        ["HAERARCHY • EXECUTIVE DATA EXPORT LEDGER"],
        [`Dataset: ${datasetTitle}`],
        [`Period: ${periodLabel} | Exported On: ${today} | Total Records: ${filteredRecords.length}`],
        [],
        ["FINANCIAL & PORTFOLIO SUMMARY", "", "", ""],
        ["Matched Records", "Total Revenue", "Total Expenses", "Net Margin"],
        [
            `${summaryStats.count} Items`,
            fmtIDR(summaryStats.totalRevenue),
            fmtIDR(summaryStats.totalExpenses),
            fmtIDR(summaryStats.netProfit)
        ],
        [],
    ];

    let headerRowIndex = 9; // 1-indexed row where headers start

    if (selectedDataset === "composite_project_master") {
        sheetData.push([
            "No",
            "Project Name",
            "Client Name",
            "Contract Value",
            "Planned Budget",
            "Labor Cost",
            "Resource Cost",
            "Total Expenses",
            "Net Margin",
            "Margin %",
            "Logged Hours",
            "Status"
        ]);

        filteredRecords.forEach((r, idx) => {
            sheetData.push([
                idx + 1,
                r.project_name,
                r.client_name,
                fmtIDR(r.contract_value),
                fmtIDR(r.budget_cost),
                fmtIDR(r.labor_cost),
                fmtIDR(r.resource_expenses),
                fmtIDR(r.total_expenses),
                fmtIDR(r.net_margin),
                `${(r.margin_percent || 0).toFixed(1)}%`,
                `${r.total_hours_logged || 0} hrs`,
                (r.status || "Active").toUpperCase()
            ]);
        });
    } else if (selectedDataset === "composite_employee_payroll") {
        sheetData.push([
            "No",
            "Team Member",
            "Email",
            "Role",
            "Assigned Project",
            "Contract Scheme",
            "Base Rate",
            "Released Payout",
            "Pending Liability",
            "Logged Hours",
            "Effective Rate/hr"
        ]);

        filteredRecords.forEach((r, idx) => {
            sheetData.push([
                idx + 1,
                r.full_name,
                r.email,
                r.role,
                r.project_name,
                `${r.contract_type} • ${r.payment_scheme}`,
                fmtIDR(r.base_rate),
                fmtIDR(r.total_paid_disbursements),
                fmtIDR(r.pending_liability),
                `${r.total_hours_logged || 0} hrs`,
                `${fmtIDR(r.effective_hourly_cost)}/h`
            ]);
        });
    } else {
        // Generic fallback for projects, members, resources, monthly
        if (filteredRecords.length > 0) {
            const keys = Object.keys(filteredRecords[0]).slice(0, 10);
            sheetData.push(["No", ...keys.map(k => k.replace(/_/g, " ").toUpperCase())]);

            filteredRecords.forEach((r, idx) => {
                const values = keys.map(k => {
                    const val = r[k];
                    if (typeof val === "number" && (k.includes("revenue") || k.includes("cost") || k.includes("amount") || k.includes("profit") || k.includes("released") || k.includes("rate"))) {
                        return fmtIDR(val);
                    }
                    return val !== undefined && val !== null ? String(val) : "-";
                });
                sheetData.push([idx + 1, ...values]);
            });
        }
    }

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    ws["!cols"] = autoComputeColumnWidths(sheetData, 14, 45);
    
    // AutoFilter on the table header row
    const lastColLetter = XLSX.utils.encode_col(sheetData[headerRowIndex - 1]?.length ? sheetData[headerRowIndex - 1].length - 1 : 8);
    ws["!autofilter"] = { ref: `A${headerRowIndex}:${lastColLetter}${sheetData.length}` };

    XLSX.utils.book_append_sheet(wb, ws, "Export Ledger");
    return wb;
}

/**
 * Builds a clean, audit-ready Excel Workbook for P&L Financial Statement
 */
export function generatePresetPLExcelWorkbook(monthlyTrends: any[]): XLSX.WorkBook {
    const wb = XLSX.utils.book_new();
    const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

    const totalRev = monthlyTrends.reduce((acc, m) => acc + (m.revenue || 0), 0);
    const totalExp = monthlyTrends.reduce((acc, m) => acc + (m.expenses || 0), 0);
    const totalNet = totalRev - totalExp;
    const avgMarginPct = totalRev > 0 ? ((totalNet / totalRev) * 100).toFixed(1) : "0.0";

    const sheetData: any[][] = [
        ["HAERARCHY • EXECUTIVE MANAGEMENT INTELLIGENCE"],
        ["P&L FINANCIAL STATEMENT & MONTHLY PERFORMANCE LEDGER"],
        [`Generated On: ${today} | Total Periods: ${monthlyTrends.length}`],
        [],
        ["EXECUTIVE FINANCIAL SUMMARY", "", "", ""],
        ["Total Gross Revenue", "Total Operating Expenses", "Net Margin", "Average Margin %"],
        [fmtIDR(totalRev), fmtIDR(totalExp), fmtIDR(totalNet), `${avgMarginPct}%`],
        [],
        ["No", "Month & Year", "Gross Revenue (IDR)", "Operating Expenses (IDR)", "Net Margin (IDR)", "Margin Ratio (%)"]
    ];

    monthlyTrends.forEach((m, idx) => {
        sheetData.push([
            idx + 1,
            m.month,
            fmtIDR(m.revenue),
            fmtIDR(m.expenses),
            fmtIDR(m.net_profit),
            m.revenue > 0 ? `${((m.net_profit / m.revenue) * 100).toFixed(1)}%` : "0.0%"
        ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    ws["!cols"] = autoComputeColumnWidths(sheetData, 15, 35);
    ws["!autofilter"] = { ref: `A9:F${sheetData.length}` };
    XLSX.utils.book_append_sheet(wb, ws, "Monthly P&L Ledger");
    return wb;
}

/**
 * Builds a clean, audit-ready Excel Workbook for Project Portfolio Master
 */
export function generatePresetProjectMasterExcelWorkbook(compositeProjects: any[]): XLSX.WorkBook {
    const wb = XLSX.utils.book_new();
    const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

    const totalValue = compositeProjects.reduce((acc, p) => acc + (p.contract_value || 0), 0);
    const totalOutflow = compositeProjects.reduce((acc, p) => acc + (p.total_expenses || 0), 0);
    const totalMargin = totalValue - totalOutflow;

    const sheetData: any[][] = [
        ["HAERARCHY • EXECUTIVE MANAGEMENT INTELLIGENCE"],
        ["PROJECT PORTFOLIO MASTER & PROFITABILITY LEDGER"],
        [`Generated On: ${today} | Total Projects: ${compositeProjects.length}`],
        [],
        ["PORTFOLIO FINANCIAL SUMMARY", "", "", ""],
        ["Total Projects", "Portfolio Contract Value", "Total Portfolio Outflow", "Total Net Margin"],
        [`${compositeProjects.length} Projects`, fmtIDR(totalValue), fmtIDR(totalOutflow), fmtIDR(totalMargin)],
        [],
        [
            "No",
            "Project Name",
            "Client Organization",
            "Contract Revenue",
            "Planned Budget",
            "Labor / SDM Cost",
            "Resource Procurements",
            "Total Outflow",
            "Net Profit",
            "Margin Ratio (%)",
            "Assigned Staff",
            "Status"
        ]
    ];

    compositeProjects.forEach((p, idx) => {
        sheetData.push([
            idx + 1,
            p.project_name,
            p.client_name || "Internal",
            fmtIDR(p.contract_value),
            fmtIDR(p.budget_cost),
            fmtIDR(p.labor_cost),
            fmtIDR(p.resource_expenses),
            fmtIDR(p.total_expenses),
            fmtIDR(p.net_margin),
            `${(p.margin_percent || 0).toFixed(1)}%`,
            p.team_size || 0,
            (p.status || "Active").toUpperCase()
        ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    ws["!cols"] = autoComputeColumnWidths(sheetData, 14, 40);
    ws["!autofilter"] = { ref: `A9:L${sheetData.length}` };
    XLSX.utils.book_append_sheet(wb, ws, "Project Portfolio Master");
    return wb;
}

/**
 * Builds a clean, audit-ready Excel Workbook for Liability & Payroll Exposure
 */
export function generatePresetLiabilityExcelWorkbook(compositeMembers: any[]): XLSX.WorkBook {
    const wb = XLSX.utils.book_new();
    const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

    const totalPaid = compositeMembers.reduce((acc, m) => acc + (m.total_paid_disbursements || 0), 0);
    const totalLiab = compositeMembers.reduce((acc, m) => acc + (m.pending_liability || 0), 0);
    const totalExposure = totalPaid + totalLiab;

    const sheetData: any[][] = [
        ["HAERARCHY • EXECUTIVE MANAGEMENT INTELLIGENCE"],
        ["PERSONNEL LIABILITY & PAYROLL EXPOSURE MATRIX"],
        [`Generated On: ${today} | Total Personnel: ${compositeMembers.length}`],
        [],
        ["LIABILITY & COMPENSATION SUMMARY", "", "", ""],
        ["Total Personnel", "Total Disbursed Payouts", "Pending Contract Liability", "Total Financial Exposure"],
        [`${compositeMembers.length} Staff`, fmtIDR(totalPaid), fmtIDR(totalLiab), fmtIDR(totalExposure)],
        [],
        [
            "No",
            "Staff Full Name",
            "Email Address",
            "Organizational Role",
            "Assigned Project",
            "Contract Scheme",
            "Base Rate",
            "Disbursed Payouts",
            "Pending Liability",
            "Total Compensation Exposure"
        ]
    ];

    compositeMembers.forEach((m, idx) => {
        sheetData.push([
            idx + 1,
            m.full_name,
            m.email,
            m.role,
            m.project_name || "Global / Base",
            `${m.contract_type} • ${m.payment_scheme}`,
            fmtIDR(m.base_rate),
            fmtIDR(m.total_paid_disbursements),
            fmtIDR(m.pending_liability),
            fmtIDR((m.total_paid_disbursements || 0) + (m.pending_liability || 0))
        ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    ws["!cols"] = autoComputeColumnWidths(sheetData, 14, 40);
    ws["!autofilter"] = { ref: `A9:J${sheetData.length}` };
    XLSX.utils.book_append_sheet(wb, ws, "Personnel & Liability Matrix");
    return wb;
}

/**
 * Builds a clean, audit-ready Excel Workbook for Resource & Asset Outflows
 */
export function generatePresetResourceExcelWorkbook(resources: any[]): XLSX.WorkBook {
    const wb = XLSX.utils.book_new();
    const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

    const totalAmount = resources.reduce((acc, r) => acc + (r.amount || 0), 0);
    const approvedCount = resources.filter(r => (r.status || "").toLowerCase() === "approved").length;

    const sheetData: any[][] = [
        ["HAERARCHY • EXECUTIVE MANAGEMENT INTELLIGENCE"],
        ["RESOURCE & ASSET PROCUREMENT OUTFLOW LEDGER"],
        [`Generated On: ${today} | Total Procurement Items: ${resources.length}`],
        [],
        ["PROCUREMENT SPENDING SUMMARY", "", "", ""],
        ["Total Requests", "Approved Items", "Total Outflow Amount", ""],
        [`${resources.length} Items`, `${approvedCount} Approved`, fmtIDR(totalAmount), ""],
        [],
        [
            "No",
            "Resource / Asset Name",
            "Category Type",
            "Project Assignment",
            "Cost / Amount (IDR)",
            "Procurement Status",
            "Requested On"
        ]
    ];

    resources.forEach((r, idx) => {
        sheetData.push([
            idx + 1,
            r.item_name,
            r.category,
            r.project_name || "General Overhead",
            fmtIDR(r.amount),
            (r.status || "Pending").toUpperCase(),
            r.created_at ? new Date(r.created_at).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }) : "-"
        ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    ws["!cols"] = autoComputeColumnWidths(sheetData, 14, 40);
    ws["!autofilter"] = { ref: `A9:G${sheetData.length}` };
    XLSX.utils.book_append_sheet(wb, ws, "Resource Procurements");
    return wb;
}

/**
 * Builds a comprehensive Multi-Sheet Master Executive Workbook
 */
export function generatePresetExecutiveMasterWorkbook({
    monthlyTrends,
    compositeProjects,
    compositeMembers,
    resources,
}: {
    monthlyTrends: any[];
    compositeProjects: any[];
    compositeMembers: any[];
    resources: any[];
}): XLSX.WorkBook {
    const wb = XLSX.utils.book_new();
    const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

    // 1. Sheet: Executive Summary
    const totalRev = monthlyTrends.reduce((acc, m) => acc + (m.revenue || 0), 0);
    const totalExp = monthlyTrends.reduce((acc, m) => acc + (m.expenses || 0), 0);
    const totalNet = totalRev - totalExp;
    const totalProjectsVal = compositeProjects.reduce((acc, p) => acc + (p.contract_value || 0), 0);
    const totalPayrollPaid = compositeMembers.reduce((acc, m) => acc + (m.total_paid_disbursements || 0), 0);
    const totalPayrollLiab = compositeMembers.reduce((acc, m) => acc + (m.pending_liability || 0), 0);

    const summarySheetData: any[][] = [
        ["HAERARCHY • EXECUTIVE MANAGEMENT INTELLIGENCE"],
        ["EXECUTIVE MASTER BI INTELLIGENCE WORKBOOK"],
        [`Consolidated Export Generated On: ${today}`],
        [],
        ["ENTERPRISE KPI METRICS", "VALUE"],
        ["Total Projects Monitored", `${compositeProjects.length} Projects`],
        ["Total Portfolio Contract Value", fmtIDR(totalProjectsVal)],
        ["Consolidated Net Margin", fmtIDR(totalNet)],
        ["Total Disbursed Payroll", fmtIDR(totalPayrollPaid)],
        ["Pending Contract Liability", fmtIDR(totalPayrollLiab)],
        ["Total Resource Procurement Spending", fmtIDR(resources.reduce((acc, r) => acc + (r.amount || 0), 0))],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summarySheetData);
    wsSummary["!cols"] = [{ wch: 38 }, { wch: 28 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, "Executive Summary");

    // 2. Sheet: Monthly P&L
    const plSheet = generatePresetPLExcelWorkbook(monthlyTrends).Sheets["Monthly P&L Ledger"];
    XLSX.utils.book_append_sheet(wb, plSheet, "Monthly P&L");

    // 3. Sheet: Projects Portfolio
    const projSheet = generatePresetProjectMasterExcelWorkbook(compositeProjects).Sheets["Project Portfolio Master"];
    XLSX.utils.book_append_sheet(wb, projSheet, "Projects Portfolio");

    // 4. Sheet: Personnel Liability
    const memberSheet = generatePresetLiabilityExcelWorkbook(compositeMembers).Sheets["Personnel & Liability Matrix"];
    XLSX.utils.book_append_sheet(wb, memberSheet, "Personnel & Liability");

    // 5. Sheet: Resource Procurements
    const resourceSheet = generatePresetResourceExcelWorkbook(resources).Sheets["Resource Procurements"];
    XLSX.utils.book_append_sheet(wb, resourceSheet, "Resource Procurements");

    return wb;
}
