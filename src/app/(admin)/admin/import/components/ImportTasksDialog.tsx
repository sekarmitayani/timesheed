"use client";

import React, { useState, useRef } from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogTitle, 
    DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    Download, 
    Upload, 
    CheckCircle2, 
    AlertTriangle, 
    XCircle, 
    ArrowRight, 
    Loader2, 
    Check, 
    Info, 
    AlertCircle,
    Clock
} from "lucide-react";
import { downloadTaskAndTimesheetExcelTemplate, parseAndValidateTaskAndTimesheetFile, ParsedTaskAndTimesheetRow } from "@/lib/utils/excel-templates";
import { importService, ImportSummary } from "@/lib/services/import-service";
import { toast } from "sonner";

interface ImportTasksDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

type Step = "upload" | "preview" | "result";
type FilterView = "all" | "valid" | "error";

export function ImportTasksDialog({ open, onOpenChange, onSuccess }: ImportTasksDialogProps) {
    const [step, setStep] = useState<Step>("upload");
    const [isParsing, setIsParsing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [csvBlob, setCsvBlob] = useState<Blob | null>(null);
    const [parsedRows, setParsedRows] = useState<ParsedTaskAndTimesheetRow[]>([]);
    const [validCount, setValidCount] = useState(0);
    const [errorCount, setErrorCount] = useState(0);
    const [filterView, setFilterView] = useState<FilterView>("all");
    const [importResult, setImportResult] = useState<ImportSummary | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetDialog = () => {
        setStep("upload");
        setSelectedFile(null);
        setCsvBlob(null);
        setParsedRows([]);
        setValidCount(0);
        setErrorCount(0);
        setFilterView("all");
        setImportResult(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleClose = () => {
        if (isUploading) return;
        onOpenChange(false);
        setTimeout(resetDialog, 300);
    };

    // --- Step 1: File Selection & Parsing ---
    const processFile = async (file: File) => {
        const fileExt = file.name.split(".").pop()?.toLowerCase();
        if (!["xlsx", "xls", "csv"].includes(fileExt || "")) {
            toast.error("Unsupported file format. Please upload a .xlsx or .csv file.");
            return;
        }

        setIsParsing(true);
        setSelectedFile(file);

        try {
            const result = await parseAndValidateTaskAndTimesheetFile(file);
            setParsedRows(result.rows);
            setValidCount(result.validCount);
            setErrorCount(result.errorCount);
            setCsvBlob(result.csvBlob);

            if (result.rows.length === 0) {
                toast.error("The selected file does not contain any data rows.");
                setIsParsing(false);
                return;
            }

            setStep("preview");
        } catch (error: any) {
            toast.error(`Failed to parse file: ${error.message || "Corrupted file"}`);
        } finally {
            setIsParsing(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processFile(file);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) {
            processFile(file);
        }
    };

    // --- Step 2: Upload CSV to Backend API ---
    const handleConfirmImport = async () => {
        if (!csvBlob) {
            toast.error("No valid CSV data available for upload.");
            return;
        }

        setIsUploading(true);
        const uploadFile = new File([csvBlob], "tasks_timesheets_import.csv", { type: "text/csv" });

        try {
            const summary = await importService.importTasksAndTimesheets(uploadFile);
            setImportResult(summary);
            setStep("result");

            if (summary.success_count > 0) {
                toast.success(`Successfully imported ${summary.success_count} tasks/timesheets!`);
                onSuccess?.();
            } else {
                toast.warning("Import finished, but 0 records were created. Review logs below.");
            }
        } catch (error: any) {
            toast.error(error.message || "Bulk import failed. Please check server logs.");
        } finally {
            setIsUploading(false);
        }
    };

    const filteredRows = parsedRows.filter((r) => {
        if (filterView === "valid") return r.isValid;
        if (filterView === "error") return !r.isValid;
        return true;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "done":
            case "approved":
                return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold">{status}</Badge>;
            case "in_progress":
                return <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-semibold">{status}</Badge>;
            case "rejected":
                return <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-semibold">{status}</Badge>;
            default:
                return <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-semibold">{status}</Badge>;
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[880px] w-[95vw] p-0 gap-0 overflow-hidden border-[#e2e8f0] rounded-md shadow-xl bg-white">
                {/* Modal Header */}
                <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4 pr-12 flex items-center justify-between">
                    <div>
                        <DialogTitle className="text-base font-bold text-slate-900">
                            Import Tasks & Timesheets (Excel / CSV)
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 mt-0.5">
                            Bulk register task backlogs and auto-link employee timesheet work logs
                        </DialogDescription>
                    </div>

                    {/* Step Indicator Badges with safe margin from close button */}
                    <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold mr-8">
                        <span className={`px-2.5 py-1 rounded-md text-[11px] ${step === "upload" ? "bg-[#2568C1] text-white" : "bg-slate-100 text-slate-600"}`}>
                            1. Upload
                        </span>
                        <span className="text-slate-300">/</span>
                        <span className={`px-2.5 py-1 rounded-md text-[11px] ${step === "preview" ? "bg-[#2568C1] text-white" : "bg-slate-100 text-slate-600"}`}>
                            2. Preview
                        </span>
                        <span className="text-slate-300">/</span>
                        <span className={`px-2.5 py-1 rounded-md text-[11px] ${step === "result" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                            3. Result
                        </span>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="px-6 pt-3.5 pb-5">
                    {/* ========================================================= */}
                    {/* STEP 1: UPLOAD & TEMPLATE DOWNLOAD */}
                    {/* ========================================================= */}
                    {step === "upload" && (
                        <div className="space-y-5">
                            {/* Download Template Banner */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-md bg-[#f8fafc] border border-[#e2e8f0]">
                                <div className="space-y-1">
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                        <Info className="h-3.5 w-3.5 text-[#2568C1]" /> OFFICIAL TASK & TIMESHEET TEMPLATE
                                    </h4>
                                    <p className="text-xs text-slate-500">
                                        Download our formatted Excel template with pre-configured headers for project, assignee, task details, created date, and optional timesheets.
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={downloadTaskAndTimesheetExcelTemplate}
                                    className="shrink-0 gap-2 border-[#cbd5e1] bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs"
                                >
                                    <Download className="h-3.5 w-3.5 text-[#2568C1]" />
                                    Download Template (.xlsx)
                                </Button>
                            </div>

                            {/* Dropzone Upload */}
                            <div
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-[#cbd5e1] hover:border-[#2568C1] hover:bg-[#2568C1]/5 transition-all duration-200 rounded-md p-8 text-center cursor-pointer flex flex-col items-center justify-center gap-3"
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept=".xlsx,.xls,.csv"
                                    className="hidden"
                                />
                                <div className="h-12 w-12 rounded-md bg-slate-100 flex items-center justify-center text-slate-500 group-hover:text-[#2568C1]">
                                    <Upload className="h-6 w-6 text-[#2568C1]" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold text-slate-700">
                                        {isParsing ? "Analyzing & Validating Spreadsheet..." : "Click to browse or drag and drop your file here"}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv) formats
                                    </p>
                                </div>
                            </div>

                            {/* Prerequisite & Validation Notice */}
                            <div className="flex items-start gap-2.5 p-3 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-900 text-xs">
                                <Info className="h-4 w-4 shrink-0 text-[#2568C1] mt-0.5" />
                                <div>
                                    <span className="font-semibold text-[#1e56a6]">Prerequisites & Rules:</span>
                                    <span className="text-slate-600 ml-1">
                                        Recipient <strong>assignee_email</strong> must be a registered member of <strong>project_name</strong>. If <code>clock_in</code> is provided, a timesheet is automatically created and linked to the task.
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ========================================================= */}
                    {/* STEP 2: PREVIEW & VALIDATION */}
                    {/* ========================================================= */}
                    {step === "preview" && (
                        <div className="space-y-4">
                            {/* Summary & Filters */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#f8fafc] border border-[#e2e8f0] p-3 rounded-md text-xs">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-slate-700">Validation Status:</span>
                                    <span className="text-slate-500">
                                        {validCount} ready, {errorCount} errors of {parsedRows.length} total rows
                                    </span>
                                </div>

                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setFilterView("all")}
                                        className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                                            filterView === "all" ? "bg-slate-800 text-white" : "bg-white border border-[#e2e8f0] text-slate-600 hover:bg-slate-50"
                                        }`}
                                    >
                                        All ({parsedRows.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFilterView("valid")}
                                        className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                                            filterView === "valid" ? "bg-emerald-600 text-white" : "bg-white border border-[#e2e8f0] text-emerald-700 hover:bg-emerald-50"
                                        }`}
                                    >
                                        <CheckCircle2 className="h-3 w-3" /> Valid ({validCount})
                                    </button>
                                    {errorCount > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setFilterView("error")}
                                            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                                                filterView === "error" ? "bg-rose-600 text-white" : "bg-white border border-[#e2e8f0] text-rose-700 hover:bg-rose-50"
                                            }`}
                                        >
                                            <XCircle className="h-3 w-3" /> Errors ({errorCount})
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Table Preview */}
                            <div className="border border-[#e2e8f0] rounded-md overflow-hidden max-h-[320px] overflow-y-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 border-b border-[#e2e8f0] sticky top-0 z-10 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                                        <tr>
                                            <th className="py-2.5 px-3 w-12 text-center">Row</th>
                                            <th className="py-2.5 px-3">Status</th>
                                            <th className="py-2.5 px-3">Project & Assignee</th>
                                            <th className="py-2.5 px-3">Task Title & Details</th>
                                            <th className="py-2.5 px-3">Timesheet Log</th>
                                            <th className="py-2.5 px-3">Validation Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {filteredRows.map((r) => (
                                            <tr key={r.rowIndex} className={r.isValid ? "hover:bg-slate-50/60" : "bg-rose-50/40 hover:bg-rose-50/80"}>
                                                <td className="py-2 px-3 text-center font-mono text-slate-400">{r.rowIndex}</td>
                                                <td className="py-2 px-3">
                                                    {r.isValid ? (
                                                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold text-[10px] px-1.5 py-0">
                                                            Valid
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-rose-50 text-rose-700 border-rose-200 font-semibold text-[10px] px-1.5 py-0">
                                                            Error
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="py-2 px-3">
                                                    <div className="font-semibold text-slate-800">
                                                        {r.projectName || <span className="text-slate-300 italic">-</span>}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 font-mono">
                                                        {r.assigneeEmail || "-"}
                                                    </div>
                                                </td>
                                                <td className="py-2 px-3">
                                                    <div className="font-medium text-slate-800 max-w-xs truncate">
                                                        {r.taskTitle || <span className="text-slate-300 italic">-</span>}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                                        {getStatusBadge(r.taskStatus)}
                                                        <Badge variant="outline" className="text-[9px] px-1 py-0 text-slate-500 font-mono">
                                                            Diff {r.complexity}/5
                                                        </Badge>
                                                        {r.createdAt && (
                                                            <span className="text-[10px] text-slate-500 font-mono">
                                                                Created: {r.createdAt}
                                                            </span>
                                                        )}
                                                        {r.dueDate && (
                                                            <span className="text-[10px] text-slate-400 font-mono">
                                                                Due: {r.dueDate}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-2 px-3">
                                                    {r.clockIn ? (
                                                        <div className="space-y-0.5">
                                                            <div className="text-[11px] font-mono text-slate-700 flex items-center gap-1">
                                                                <Clock className="h-3 w-3 text-slate-400" />
                                                                {r.clockIn}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-[10px]">
                                                                {r.clockOut ? (
                                                                    <span className="font-mono text-slate-500">to {r.clockOut.split(" ")[1] || r.clockOut}</span>
                                                                ) : (
                                                                    <span className="text-amber-600 font-medium">(Active)</span>
                                                                )}
                                                                {getStatusBadge(r.timesheetStatus)}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[11px] text-slate-400 italic">No Timesheet (Task only)</span>
                                                    )}
                                                </td>
                                                <td className="py-2 px-3">
                                                    {r.errors.length > 0 ? (
                                                        <span className="text-rose-600 font-medium text-[11px] flex items-center gap-1">
                                                            <AlertCircle className="h-3 w-3 shrink-0" />
                                                            {r.errors.join(", ")}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 text-[11px]">Ready to import</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Import Note */}
                            {errorCount > 0 && (
                                <p className="text-[11px] text-slate-500 italic">
                                    * Note: Only valid rows will be processed and imported. Rows containing validation errors will be skipped automatically.
                                </p>
                            )}
                        </div>
                    )}

                    {/* ========================================================= */}
                    {/* STEP 3: RESULT SUMMARY */}
                    {/* ========================================================= */}
                    {step === "result" && importResult && (
                        <div className="space-y-5">
                            {/* KPI Highlights */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="p-4 rounded-md bg-emerald-50/70 border border-emerald-100 flex flex-col items-center justify-center text-center">
                                    <CheckCircle2 className="h-6 w-6 text-emerald-600 mb-1" />
                                    <span className="text-2xl font-black text-emerald-800">{importResult.success_count}</span>
                                    <span className="text-xs font-semibold text-emerald-700">Successfully Imported</span>
                                </div>

                                <div className="p-4 rounded-md bg-amber-50/70 border border-amber-100 flex flex-col items-center justify-center text-center">
                                    <AlertTriangle className="h-6 w-6 text-amber-600 mb-1" />
                                    <span className="text-2xl font-black text-amber-800">{importResult.skipped_count}</span>
                                    <span className="text-xs font-semibold text-amber-700">Skipped / Duplicates</span>
                                </div>

                                <div className="p-4 rounded-md bg-[#f8fafc] border border-[#e2e8f0] flex flex-col items-center justify-center text-center">
                                    <Info className="h-6 w-6 text-slate-500 mb-1" />
                                    <span className="text-2xl font-black text-slate-800">{importResult.total_rows}</span>
                                    <span className="text-xs font-semibold text-slate-600">Total Rows Processed</span>
                                </div>
                            </div>

                            {/* Details of Skipped / Errors if any */}
                            {importResult.errors.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Skipped Rows & Warnings ({importResult.errors.length}):
                                    </h4>
                                    <div className="border border-[#e2e8f0] rounded-md overflow-hidden max-h-[200px] overflow-y-auto divide-y divide-slate-100 bg-white">
                                        {importResult.errors.map((err, idx) => (
                                            <div key={idx} className="p-2.5 px-3.5 flex items-start gap-2 text-xs">
                                                <Badge variant="outline" className="text-[10px] shrink-0 font-mono">
                                                    Row {err.row}
                                                </Badge>
                                                <span className="text-slate-600 flex-1">
                                                    {err.message}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Success Notification message */}
                            <div className="p-3 rounded-md bg-[#f8fafc] border border-[#e2e8f0] text-xs text-slate-600 flex items-center gap-2">
                                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                                <span>All imported tasks and timesheets have been assigned and recorded in the database.</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-between items-center">
                    {step === "upload" && (
                        <>
                            <div className="text-xs text-slate-400 font-medium">
                                Ensure recipient emails are active project members
                            </div>
                            <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                onClick={handleClose}
                                className="text-[#64748b]"
                            >
                                Cancel
                            </Button>
                        </>
                    )}

                    {step === "preview" && (
                        <>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setStep("upload")}
                                disabled={isUploading}
                                className="text-xs font-medium text-[#64748b]"
                            >
                                Change File
                            </Button>
                            <div className="flex items-center gap-3">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleClose}
                                    disabled={isUploading}
                                    className="text-[#64748b]"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleConfirmImport}
                                    disabled={validCount === 0 || isUploading}
                                    className="gap-2 bg-[#2568C1] hover:bg-[#1e56a6] shadow-md shadow-[#2568C1]/20 min-w-[120px] text-white"
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            Import {validCount} Tasks <ArrowRight className="h-3.5 w-3.5" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </>
                    )}

                    {step === "result" && (
                        <div className="w-full flex justify-end">
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleClose}
                                className="bg-[#2568C1] hover:bg-[#1e56a6] shadow-md shadow-[#2568C1]/20 min-w-[120px] text-white"
                            >
                                Done & Close
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
