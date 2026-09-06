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
import { downloadUserExcelTemplate, parseAndValidateUserFile, ParsedUserRow } from "@/lib/utils/excel-templates";
import { importService, ImportSummary } from "@/lib/services/import-service";
import { toast } from "sonner";

interface ImportUsersDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

type Step = "upload" | "preview" | "result";
type FilterView = "all" | "valid" | "error";

export function ImportUsersDialog({ open, onOpenChange, onSuccess }: ImportUsersDialogProps) {
    const [step, setStep] = useState<Step>("upload");
    const [isParsing, setIsParsing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [csvBlob, setCsvBlob] = useState<Blob | null>(null);
    const [parsedRows, setParsedRows] = useState<ParsedUserRow[]>([]);
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
            const result = await parseAndValidateUserFile(file);
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
            const csvFile = new File([csvBlob], "users_import.csv", { type: "text/csv" });
            const result = await importService.importUsers(csvFile);
            setImportResult(result);
            setStep("result");

            if (result.success_count > 0) {
                toast.success(`Successfully imported ${result.success_count} users!`);
                onSuccess(); // Triggers table refresh
            } else if (result.skipped_count > 0 && result.error_count === 0) {
                toast.info("All records already exist in the database (skipped).");
            } else {
                toast.error("No users were imported due to validation errors.");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to import user records");
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

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[780px] w-[95vw] p-0 gap-0 overflow-hidden border-[#e2e8f0] rounded-md shadow-xl bg-white">
                {/* Modal Header matching UserFormDialog */}
                <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4 pr-12 flex items-center justify-between">
                    <div>
                        <DialogTitle className="text-base font-bold text-slate-900">
                            Import Users (Excel / CSV)
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 mt-0.5">
                            Bulk import and migrate user accounts into the system
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
                                        <Info className="h-3.5 w-3.5 text-[#2568C1]" /> Official Import Template
                                    </h4>
                                    <p className="text-xs text-slate-500">
                                        Download our formatted Excel template with pre-configured headers and field validation rules.
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={downloadUserExcelTemplate}
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

                            {/* Security Notice */}
                            <div className="flex items-start gap-2.5 p-3 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-800 text-xs">
                                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                                <div>
                                    <span className="font-semibold text-amber-900">Security & Credentials Notice:</span>
                                    <span className="ml-1 text-amber-800">
                                        All newly imported accounts will be provisioned with default initial password: <code className="bg-white/80 px-1.5 py-0.5 rounded font-mono font-bold text-amber-900 border border-amber-300">Timesheed@2026</code>. Employees will be able to update their credentials upon first login.
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
                                    <span className="text-slate-600 font-medium">{parsedRows.length} total rows</span>
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
                            <div className="border border-[#e2e8f0] rounded-md overflow-hidden max-h-[320px] overflow-y-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 border-b border-[#e2e8f0] sticky top-0 z-10 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                                        <tr>
                                            <th className="py-2.5 px-3 w-12 text-center">Row</th>
                                            <th className="py-2.5 px-3">Status</th>
                                            <th className="py-2.5 px-3">Full Name</th>
                                            <th className="py-2.5 px-3">Email</th>
                                            <th className="py-2.5 px-3">Phone</th>
                                            <th className="py-2.5 px-3">Role</th>
                                            <th className="py-2.5 px-3">Type</th>
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
                                                <td className="py-2 px-3 font-semibold text-slate-800">{r.fullName || <span className="text-slate-300 italic">-</span>}</td>
                                                <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">{r.email || <span className="text-slate-300 italic">-</span>}</td>
                                                <td className="py-2 px-3 text-slate-600">{r.phoneNumber || <span className="text-slate-300 italic">-</span>}</td>
                                                <td className="py-2 px-3">
                                                    <span className="capitalize font-medium text-slate-700">{r.role || "-"}</span>
                                                </td>
                                                <td className="py-2 px-3">
                                                    <span className="capitalize text-slate-600">{r.employeeType}</span>
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
                                    <span className="text-xs font-semibold text-amber-700">Duplicates Skipped</span>
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
                                        Skipped Rows & Error Details ({importResult.errors.length}):
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
                                <span>All imported user accounts are active and immediately accessible in the user administration directory.</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer matching UserFormDialog */}
                <div className="px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-between items-center">
                    {step === "upload" && (
                        <>
                            <div className="text-xs text-slate-400 font-medium">
                                Ensure column structure matches the official template
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
                                            Import {validCount} Users <ArrowRight className="h-3.5 w-3.5" />
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
