"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FileText, Briefcase, Calendar } from "lucide-react";
import { Contract } from "@/lib/services/admin-contracts";
import { User, ApiProject } from "@/lib/types";

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
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
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
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] p-0 overflow-hidden border-[#e2e8f0] gap-0 rounded-md shadow-xl flex flex-col">
                <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 pr-12 py-4 flex flex-col gap-1 shrink-0">
                    <DialogTitle className="text-base text-[#0f172a] font-bold">Contract Intelligence</DialogTitle>
                    <DialogDescription className="text-xs text-slate-500 font-medium">
                        Detailed specification overview
                    </DialogDescription>
                </div>

                <div className="px-6 pt-3.5 pb-5 space-y-4 bg-slate-50/30 overflow-y-auto">
                    <Card className="p-4 shadow-sm border-slate-200 bg-white space-y-3 rounded-md">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Identity</div>
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-[#e2e8f0] shadow-sm">
                                <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-[#2568C1] to-[#1a4f99] text-white">
                                    {(user?.full_name || user?.name || "U").split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-800">{user?.full_name || user?.name || `User #${contract.user_id}`}</span>
                                <span className="text-[11px] text-slate-500 font-medium">{user?.email || "No email provided"}</span>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 shadow-sm border-slate-200 bg-white space-y-3 rounded-md">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Origin Binding Node</div>
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-md ${contract.project_id ? "bg-purple-100 text-purple-700" : "bg-[#2568C1]/10 text-[#2568C1]"}`}>
                                <Briefcase className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-800">
                                    {contract.project_id ? (project?.name || `Project #${contract.project_id}`) : "Base Employee General Rate"}
                                </span>
                                <span className="text-[11px] text-slate-500 font-medium">
                                    {contract.project_id ? "Custom External Bound (Overrides base-rate for this project)" : "Internal Default Bound (Applied generically unless overridden)"}
                                </span>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-5 shadow-sm border-slate-200 bg-white border-l-4 border-l-[#2568C1] rounded-md">
                        <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">Contract Data Block</h4>
                        <div className="grid grid-cols-2 gap-y-4 gap-x-4">
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Type Format</div>
                                <Badge variant="outline" className="text-xs font-bold capitalize rounded-full px-2.5 py-0.5 border-slate-200 text-slate-700">
                                    {contract.contract_type}
                                </Badge>
                            </div>
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Clearance Protocol</div>
                                <span className="text-xs font-bold text-slate-700">
                                    {paymentSchemeLabel(contract.payment_scheme || "")}
                                </span>
                            </div>
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Contract Valuation</div>
                                <div className="text-base font-black text-[#2568C1]">
                                    Rp {formatNumber(contract.rate_amount)}
                                </div>
                            </div>
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Operational State</div>
                                <Badge variant="outline" className={`text-[10px] font-bold uppercase rounded-full px-2.5 py-0.5 border-none ${
                                    contract.is_active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                                }`}>
                                    {contract.is_active ? "Active" : "Archived"}
                                </Badge>
                            </div>
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Binding Epoch</div>
                                <div className="text-sm font-semibold text-slate-800">{fmtDate(contract.start_date)}</div>
                            </div>
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Termination Horizon</div>
                                <div className="text-sm font-semibold text-slate-800">{contract.end_date ? fmtDate(contract.end_date) : "Ongoing / Open"}</div>
                            </div>
                        </div>
                    </Card>

                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 px-2 uppercase tracking-widest">
                        <span>Created: {fmtDate(contract.created_at)}</span>
                        <span>Last Sync: {fmtDate(contract.updated_at)}</span>
                    </div>
                </div>

                <DialogFooter className="px-6 py-3.5 border-t border-[#e2e8f0] bg-[#f8fafc]">
                    <Button 
                        className="w-full bg-[#2568C1] hover:bg-[#1e56a6] text-white transition-colors shadow-sm h-10 rounded-md font-semibold" 
                        onClick={() => onOpenChange(false)}
                    >
                        Acknowledge & Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
