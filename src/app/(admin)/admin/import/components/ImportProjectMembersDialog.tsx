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
    AlertCircle 
} from "lucide-react";
import { downloadProjectMemberExcelTemplate, parseAndValidateProjectMemberFile, ParsedProjectMemberRow } from "@/lib/utils/excel-templates";
import { importService, ImportSummary } from "@/lib/services/import-service";
import { toast } from "sonner";
import { LinearProgress } from "@/components/ui/linear-progress";

interface ImportProjectMembersDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

type Step = "upload" | "preview" | "result";
type FilterView = "all" | "valid" | "error";

export function ImportProjectMembersDialog({ open, onOpenChange, onSuccess }: ImportProjectMembersDialogProps) {
    const [step, setStep] = useState<Step>("upload");
    const [isParsing, setIsParsing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [csvBlob, setCsvBlob] = useState<Blob | null>(null);
    const [parsedRows, setParsedRows] = useState<ParsedProjectMemberRow[]>([]);
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
            const result = await parseAndValidateProjectMemberFile(file);
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

    // --- Step 2: Execute Import ---
    const handleExecuteImport = async () => {
        if (!csvBlob) return;

        setIsUploading(true);
        try {
            const csvFile = new File([csvBlob], "project_members_import.csv", { type: "text/csv" });
            const result = await importService.importProjectMembers(csvFile);
            setImportResult(result);
            setStep("result");

            if (result.success_count > 0) {
                toast.success(`Successfully assigned ${result.success_count} project members!`);
                onSuccess?.();
            } else if (result.skipped_count > 0 && result.error_count === 0) {
                toast.info("All member assignments already exist in the database (skipped).");
            } else {
                toast.error("No project members were assigned due to validation errors.");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to import project member assignments");
        } finally {
            setIsUploading(false);
        }
    };

    // Filtered Preview Rows
    const filteredRows = parsedRows.filter((r) => {
        if (filterView === "valid") return r.isValid;
        if (filterView === "error") return !r.isValid;
        return true;
    });

    const formatCurrency = (amount: number) => {
        if (!amount) return "-";
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[1050px] w-[95vw] p-0 gap-0 overflow-hidden border-[#e2e8f0] rounded-md shadow-xl bg-white">
                {/* Modal Header */}
                <div className="bg-[#f8fafc] border-b border-[#e2e8f0] pl-6 pr-16 py-4 flex items-center justify-between">
                    <div>
                        <DialogTitle className="text-base font-bold text-slate-900">
                            Import Project Members (Excel / CSV)
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 mt-0.5">
                            Bulk assign users to projects with designated roles and custom rates
                        </DialogDescription>
                    </div>

                    {/* Step Indicator Badges with safe margin from close button */}
                    <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold">
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

                {isUploading && <LinearProgress indeterminate height="h-1" color="bg-[#2568C1]" />}

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
                                        <Info className="h-3.5 w-3.5 text-[#2568C1]" /> Official Project Members Template
                                    </h4>
                                    <p className="text-xs text-slate-500">
                                        Download our formatted Excel template with pre-configured headers for multi-project assignment, member roles, and optional project-specific custom rates.
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={downloadProjectMemberExcelTemplate}
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
                                        Click to browse or drag and drop your file here
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
                                    <span className="ml-1 text-slate-700">
                                        Both <strong>project_name</strong> and <strong>email</strong> must already exist in the system. If <strong>custom_rate</strong> is provided, <strong>contract_type</strong> and <strong>payment_scheme</strong> are required. If left blank, the member uses their existing global contract.
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ========================================================= */}
                    {/* STEP 2: PREVIEW & VALIDATE */}
                    {/* ========================================================= */}
                    {step === "preview" && (
                        <div className="space-y-4">
                            {/* Summary Bar */}
                            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-md bg-[#f8fafc] border border-[#e2e8f0]">
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="font-bold text-slate-700">
                                        File: <span className="text-[#2568C1] font-semibold">{selectedFile?.name}</span>
                                    </span>
                                    <span className="text-slate-300">|</span>
                                    <span className="text-slate-600 font-medium">{parsedRows.length} total assignments</span>
                                </div>

                                {/* Filter Controls */}
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setFilterView("all")}
                                        className={`px-2.5 py-1 text-xs rounded-md transition-colors font-medium ${
                                            filterView === "all" ? "bg-slate-800 text-white" : "bg-white text-slate-600 border border-slate-200"
                                        }`}
                                    >
                                        All ({parsedRows.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFilterView("valid")}
                                        className={`px-2.5 py-1 text-xs rounded-md transition-colors font-medium flex items-center gap-1 ${
                                            filterView === "valid" ? "bg-emerald-600 text-white" : "bg-white text-emerald-700 border border-emerald-200"
                                        }`}
                                    >
                                        <CheckCircle2 className="h-3 w-3" /> Valid ({validCount})
                                    </button>
                                    {errorCount > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setFilterView("error")}
                                            className={`px-2.5 py-1 text-xs rounded-md transition-colors font-medium flex items-center gap-1 ${
                                                filterView === "error" ? "bg-rose-600 text-white" : "bg-white text-rose-700 border border-rose-200"
                                            }`}
                                        >
                                            <XCircle className="h-3 w-3" /> Errors ({errorCount})
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Table Preview */}
                            <div className="border border-[#e2e8f0] rounded-md overflow-x-auto max-h-[360px] overflow-y-auto">
                                <table className="w-full min-w-[950px] text-left text-xs">
                                    <thead className="bg-slate-50 border-b border-[#e2e8f0] sticky top-0 z-10 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                                        <tr>
                                            <th className="py-2.5 px-3 w-12 text-center">Row</th>
                                            <th className="py-2.5 px-3">Status</th>
                                            <th className="py-2.5 px-3">Project Name</th>
                                            <th className="py-2.5 px-3">User Email</th>
                                            <th className="py-2.5 px-3">Role in Project</th>
                                            <th className="py-2.5 px-3">Custom Rate</th>
                                            <th className="py-2.5 px-3">Contract Type</th>
                                            <th className="py-2.5 px-3 min-w-[260px]">Validation Notes</th>
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
                                                <td className="py-2 px-3 font-semibold text-slate-800">{r.projectName || <span className="text-slate-300 italic">-</span>}</td>
                                                <td className="py-2 px-3 font-mono text-[11px] text-slate-700">{r.email || "-"}</td>
                                                <td className="py-2 px-3 text-slate-800 font-medium">{r.roleInProject || "-"}</td>
                                                <td className="py-2 px-3 font-semibold text-slate-800">
                                                    {r.customRate > 0 ? (
                                                        formatCurrency(r.customRate)
                                                    ) : (
                                                        <span className="text-slate-400 italic">Global Rate</span>
                                                    )}
                                                </td>
                                                <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">
                                                    {r.contractType ? (
                                                        <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-700 border-slate-200 font-normal">
                                                            {r.contractType}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-slate-300 italic">Default</span>
                                                    )}
                                                </td>
                                                <td className="py-2 px-3 min-w-[260px]">
                                                    {r.errors.length > 0 ? (
                                                        <span className="text-rose-600 font-medium text-[11px] flex items-start gap-1.5 leading-snug break-words">
                                                            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                                            <span>{r.errors.join("; ")}</span>
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 text-[11px]">Ready to assign</span>
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
                                    * Note: Only valid rows will be processed. Rows containing validation errors will be rejected.
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
                                    <span className="text-xs font-semibold text-emerald-700">Successfully Assigned</span>
                                </div>

                                <div className="p-4 rounded-md bg-amber-50/70 border border-amber-100 flex flex-col items-center justify-center text-center">
                                    <AlertTriangle className="h-6 w-6 text-amber-600 mb-1" />
                                    <span className="text-2xl font-black text-amber-800">{importResult.skipped_count}</span>
                                    <span className="text-xs font-semibold text-amber-700">Skipped (Already Assigned)</span>
                                </div>

                                <div className="p-4 rounded-md bg-[#f8fafc] border border-[#e2e8f0] flex flex-col items-center justify-center text-center">
                                    <Info className="h-6 w-6 text-slate-500 mb-1" />
                                    <span className="text-2xl font-black text-slate-800">{importResult.total_rows}</span>
                                    <span className="text-xs font-semibold text-slate-600">Total Rows Processed</span>
                                </div>
                            </div>

                            {/* Details of Errors / Skipped */}
                            {importResult.errors.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Errors & Warnings ({importResult.errors.length}):
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
                                <span>Members have been assigned to their respective project rosters. Notifications have been dispatched.</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-between items-center">
                    {step === "upload" && (
                        <>
                            <div className="text-xs text-slate-400 font-medium">
                                Ensure project names and emails match registered data
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
                                    onClick={handleExecuteImport}
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
                                            Assign {validCount} Members <ArrowRight className="h-3.5 w-3.5" />
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
