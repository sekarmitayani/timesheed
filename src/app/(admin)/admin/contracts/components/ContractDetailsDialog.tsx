"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FileText, Briefcase, Calendar } from "lucide-react";
import { Contract } from "@/lib/services/admin-contracts";
import { User, ApiProject } from "@/lib/types";
import { format } from "date-fns";

interface ContractDetailsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    contract: Contract | null;
    allUsers: User[];
    allProjects: ApiProject[];
}

const fmtDate = (d?: string) => {
    if (!d) return "-";
    const date = new Date(d);
    if (isNaN(date.getTime())) return "-";
    return format(date, "dd MMM yyyy");
};

const formatNumber = (value: number | string): string => {
    const num = typeof value === "string" ? value.replace(/\D/g, "") : String(value);
    if (!num) return "";
    return Number(num).toLocaleString("id-ID");
};

const paymentSchemeLabel = (s: string) => {
    switch (s) {
        case "back_to_back": return "Back-to-back";
        case "termin": return "Termin";
        case "monthly": return "Monthly";
        default: return s;
    }
};

export function ContractDetailsDialog({
    open,
    onOpenChange,
    contract,
    allUsers,
    allProjects
}: ContractDetailsDialogProps) {
    if (!contract) return null;

    const user = allUsers.find(u => Number(u.id) === contract.user_id);
    const project = allProjects.find(p => p.id === contract.project_id);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] p-0 overflow-hidden border-[#e2e8f0] gap-0 rounded-md shadow-xl flex flex-col">
                <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-5 pr-12 py-3.5 flex flex-col gap-0.5 shrink-0">
                    <DialogTitle className="text-sm text-[#0f172a] font-bold">Contract Intelligence</DialogTitle>
                    <DialogDescription className="text-[11px] text-slate-500 font-medium">
                        Detailed specification overview
                    </DialogDescription>
                </div>

                <div className="px-5 py-3.5 space-y-3 bg-slate-50/40 overflow-y-auto">
                    <div className="p-3.5 border border-slate-200/80 bg-white rounded-md space-y-2 shadow-2xs">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Assigned Identity</div>
                        <div className="flex items-center gap-2.5">
                            <Avatar className="h-9 w-9 border border-[#e2e8f0] shadow-2xs shrink-0">
                                <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-[#2568C1] to-[#1a4f99] text-white">
                                    {(user?.full_name || user?.name || "U").split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-slate-800 truncate">{user?.full_name || user?.name || `User #${contract.user_id}`}</span>
                                <span className="text-[10px] text-slate-500 font-medium truncate">{user?.email || "No email provided"}</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-3.5 border border-slate-200/80 bg-white rounded-md space-y-2 shadow-2xs">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Origin Binding Node</div>
                        <div className="flex items-center gap-2.5">
                            <div className={`p-2 rounded-md shrink-0 ${contract.project_id ? "bg-purple-100 text-purple-700" : "bg-[#2568C1]/10 text-[#2568C1]"}`}>
                                <Briefcase className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-slate-800 truncate">
                                    {contract.project_id ? (project?.name || `Project #${contract.project_id}`) : "Base Employee General Rate"}
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium truncate">
                                    {contract.project_id ? "Custom External Bound (Overrides base-rate for this project)" : "Internal Default Bound (Applied generically unless overridden)"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="p-3.5 border border-slate-200/80 bg-white border-l-4 border-l-[#2568C1] rounded-md shadow-2xs space-y-2.5">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 leading-none">
                            <FileText className="h-3.5 w-3.5 text-[#2568C1]" /> Contract Data Block
                        </h4>
                        <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 pt-0.5">
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Type Format</div>
                                <Badge variant="outline" className="text-[11px] font-bold capitalize rounded-full px-2 py-0 border-slate-200 text-slate-700 h-5">
                                    {contract.contract_type}
                                </Badge>
                            </div>
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Clearance Protocol</div>
                                <span className="text-xs font-bold text-slate-700">
                                    {paymentSchemeLabel(contract.payment_scheme || "")}
                                </span>
                            </div>
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Contract Valuation</div>
                                <div className="text-sm font-black text-[#2568C1] font-mono leading-none">
                                    Rp {formatNumber(contract.rate_amount)}
                                </div>
                            </div>
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Operational State</div>
                                <Badge variant="outline" className={`text-[9px] font-bold uppercase rounded-full px-2 py-0 border-none h-4.5 ${
                                    contract.is_active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                                }`}>
                                    {contract.is_active ? "Active" : "Archived"}
                                </Badge>
                            </div>
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Binding Epoch</div>
                                <div className="text-xs font-semibold text-slate-800">{fmtDate(contract.start_date)}</div>
                            </div>
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Termination Horizon</div>
                                <div className="text-xs font-semibold text-slate-800">{contract.end_date ? fmtDate(contract.end_date) : "Ongoing / Open"}</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 px-1 uppercase tracking-widest pt-1">
                        <span>Created: {fmtDate(contract.created_at)}</span>
                        <span>Last Sync: {fmtDate(contract.updated_at)}</span>
                    </div>
                </div>

                <DialogFooter className="px-5 py-3 border-t border-[#e2e8f0] bg-[#f8fafc]">
                    <Button 
                        className="w-full bg-[#2568C1] hover:bg-[#1e56a6] text-white transition-colors shadow-2xs h-9 rounded-md font-semibold text-xs" 
                        onClick={() => onOpenChange(false)}
                    >
                        Acknowledge & Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
