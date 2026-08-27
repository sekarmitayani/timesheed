import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";

interface MetricCard {
    label: string;
    value: string | number;
    subtext?: string;
    highlight?: boolean;
}

interface PrintColumn {
    header: string;
    key: string;
    align?: "left" | "right" | "center";
}

export interface ExportReportOptions {
    title: string;
    subtitle?: string;
    dateRangeLabel?: string;
    appliedFilters?: { label: string; value: string }[];
    summaryMetrics?: MetricCard[];
    chartImageSrc?: string;
    chartSvgHtml?: string;
    columns: PrintColumn[];
    data: any[];
    fileName?: string;
}

/**
 * Generates and downloads a true native Landscape A4 PDF document using jsPDF & html2canvas.
 * This guarantees the PDF is saved in true horizontal orientation (297mm x 210mm)
 * with zero browser printer driver rotation bugs.
 */
export async function exportLandscapePDF({
    title,
    subtitle,
    dateRangeLabel,
    appliedFilters = [],
    summaryMetrics = [],
    chartImageSrc,
    chartSvgHtml,
    columns,
    data,
    fileName = "Haerarchy_Report.pdf",
}: ExportReportOptions) {
    const toastId = toast.loading("Generating Landscape PDF report...");

    try {
        const today = new Date().toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });

        // 1. Create a dedicated off-screen container with fixed A4 Landscape aspect ratio (297mm x 210mm -> 1122px x 793px)
        const container = document.createElement("div");
        container.style.position = "fixed";
        container.style.top = "-9999px";
        container.style.left = "-9999px";
        container.style.width = "1122px";
        container.style.minHeight = "793px";
        container.style.backgroundColor = "#ffffff";
        container.style.color = "#0f172a";
        container.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
        container.style.padding = "32px 36px";
        container.style.boxSizing = "border-box";
        container.style.zIndex = "-1000";

        const filterTagsHtml = appliedFilters
            .map(
                (f) => `
            <span style="display:inline-block; background:#f1f5f9; border:1px solid #cbd5e1; border-radius:4px; padding:3px 8px; font-size:11px; margin-right:6px; color:#334155;">
                <strong>${f.label}:</strong> ${f.value}
            </span>
        `
            )
            .join("");

        const kpiCardsHtml = summaryMetrics
            .map(
                (m) => `
            <div style="flex:1; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px 14px;">
                <div style="font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:4px;">
                    ${m.label}
                </div>
                <div style="font-size:17px; font-weight:900; color:${m.highlight ? "#059669" : "#0f172a"};">
                    ${m.value}
                </div>
                ${m.subtext ? `<div style="font-size:10px; color:#94a3b8; margin-top:2px;">${m.subtext}</div>` : ""}
            </div>
        `
            )
            .join("");

        const tableHeadersHtml = columns
            .map(
                (c) => `
            <th style="padding:0; background:#f8fafc; border-bottom:2px solid #cbd5e1; white-space:nowrap;">
                <div style="padding:8px 10px; display:flex; align-items:center; justify-content:${c.align === 'right' ? 'flex-end' : c.align === 'center' ? 'center' : 'flex-start'}; height:100%; color:#475569; font-size:10px; font-weight:700; text-transform:uppercase;">
                    ${c.header}
                </div>
            </th>
        `
            )
            .join("");

        const tableRowsHtml = data
            .map(
                (row, idx) => `
            <tr style="border-bottom:1px solid #f1f5f9; ${idx % 2 === 1 ? "background:#fafbfc;" : "background:#ffffff;"}">
                <td style="padding:0;">
                    <div style="padding:6px 10px; display:flex; align-items:center; justify-content:center; height:100%; font-size:10px; color:#94a3b8; font-family:monospace;">
                        ${idx + 1}
                    </div>
                </td>
                ${columns
                    .map((c) => {
                        const val = row[c.key] !== undefined && row[c.key] !== null ? row[c.key] : "-";
                        return `
                    <td style="padding:0;">
                        <div style="padding:6px 10px; display:flex; align-items:center; justify-content:${c.align === 'right' ? 'flex-end' : c.align === 'center' ? 'center' : 'flex-start'}; height:100%; font-size:11px; color:#1e293b; ${
                            c.align === "right" ? "font-family:monospace; font-weight:600;" : ""
                        }">
                            ${val}
                        </div>
                    </td>
                `;
                    })
                    .join("")}
            </tr>
        `
            )
            .join("");

        container.innerHTML = `
            <!-- Document Header -->
            <div style="border-bottom:2px solid #0f172a; padding-bottom:12px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                    <div style="font-size:11px; font-weight:900; letter-spacing:0.12em; color:#2568C1; text-transform:uppercase; margin-bottom:3px;">
                        HAERARCHY • EXECUTIVE MANAGEMENT INTELLIGENCE
                    </div>
                    <h1 style="font-size:22px; font-weight:900; color:#0f172a; margin:0;">
                        ${title}
                    </h1>
                    ${subtitle ? `<div style="font-size:12px; color:#64748b; margin-top:3px;">${subtitle}</div>` : ""}
                </div>
                <div style="text-align:right; font-size:11px; color:#64748b; font-family:monospace; line-height:1.4;">
                    <div><strong>Generated:</strong> ${today}</div>
                    ${dateRangeLabel ? `<div><strong>Period:</strong> ${dateRangeLabel}</div>` : ""}
                    <div><strong>Total Records:</strong> ${data.length}</div>
                </div>
            </div>

            <!-- Filter Tags -->
            ${
                appliedFilters.length > 0
                    ? `<div style="margin-bottom:12px; display:flex; align-items:center; flex-wrap:wrap;">
                <span style="font-size:10px; font-weight:700; text-transform:uppercase; color:#64748b; margin-right:8px;">Filters:</span>
                ${filterTagsHtml}
               </div>`
                    : ""
            }

            <!-- KPI Cards Row -->
            ${summaryMetrics.length > 0 ? `<div style="display:flex; gap:10px; margin-bottom:14px;">${kpiCardsHtml}</div>` : ""}

            <!-- Chart Section (If present) -->
            ${
                chartImageSrc
                    ? `
            <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:12px; margin-bottom:14px; text-align:center;">
                <div style="font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; text-align:left; margin-bottom:8px;">
                    VISUAL BENCHMARK DISTRIBUTION
                </div>
                <img src="${chartImageSrc}" style="width:100%; max-height:280px; object-fit:contain; display:block; margin:0 auto;" />
            </div>
            `
                    : chartSvgHtml
                    ? `
            <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:12px; margin-bottom:14px; text-align:center;">
                <div style="font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; text-align:left; margin-bottom:8px;">
                    VISUAL BENCHMARK DISTRIBUTION
                </div>
                ${chartSvgHtml}
            </div>
            `
                    : ""
            }

            <!-- Data Table -->
            <div style="border:1px solid #e2e8f0; border-radius:8px; overflow:hidden; margin-bottom:16px;">
                <table style="width:100%; border-collapse:collapse;">
                    <thead>
                        <tr>
                            <th style="padding:0; background:#f8fafc; width:40px; border-bottom:2px solid #cbd5e1;">
                                <div style="padding:8px 10px; display:flex; align-items:center; justify-content:center; height:100%; color:#475569; font-size:10px; font-weight:700;">
                                    NO
                                </div>
                            </th>
                            ${tableHeadersHtml}
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRowsHtml}
                    </tbody>
                </table>
            </div>

            <!-- Footer Notice -->
            <div style="margin-top:16px; text-align:center; font-size:10px; color:#94a3b8; font-family:monospace; letter-spacing:0.05em;">
                CONFIDENTIAL • FOR MANAGEMENT & EXECUTIVE USE ONLY • GENERATED VIA HAERARCHY
            </div>
        `;

        document.body.appendChild(container);

        // 2. Render to canvas using html2canvas with high DPI (scale: 2)
        const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
        });

        // Remove temp container
        document.body.removeChild(container);

        // 3. Create true Landscape A4 jsPDF instance (width: 297mm, height: 210mm)
        const pdf = new jsPDF({
            orientation: "landscape",
            unit: "mm",
            format: "a4",
        });

        const imgWidth = 297;
        const pageHeight = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        const imgData = canvas.toDataURL("image/png");

        // Add first page
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
        heightLeft -= pageHeight;

        // Add extra pages if content overflows 1 landscape page
        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage("a4", "landscape");
            pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
            heightLeft -= pageHeight;
        }

        const safeFileName = fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`;
        pdf.save(safeFileName);
        toast.dismiss(toastId);
        toast.success(`Downloaded Landscape PDF: ${safeFileName}`);
    } catch (err: any) {
        toast.dismiss(toastId);
        toast.error(`Failed to export PDF: ${err.message}`);
        console.error("PDF Export error:", err);
    }
}
