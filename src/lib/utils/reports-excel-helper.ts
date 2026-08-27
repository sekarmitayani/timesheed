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
