import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, FolderKanban, Loader2 } from "lucide-react";

interface ConfirmUserCreationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    type: "empty_contract" | "valid_contract" | null;
    isSaving: boolean;
    onConfirm: () => void;
}

export function ConfirmUserCreationDialog({
    open, onOpenChange, type, isSaving, onConfirm
}: ConfirmUserCreationDialogProps) {
    return (
        <Dialog open={open} onOpenChange={(open) => !isSaving && onOpenChange(open)}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden border-[#e2e8f0] gap-0 rounded-md shadow-xl">
                <div className={`px-6 py-4 pr-12 border-b flex items-center gap-3.5 ${
                    type === 'empty_contract' ? "bg-amber-50/70 border-amber-200/60" : "bg-blue-50/60 border-blue-100"
                }`}>
                    <div className={`p-2 bg-white rounded-md shadow-sm border ${
                        type === 'empty_contract' ? "border-amber-200 text-amber-600" : "border-blue-200 text-[#2568C1]"
                    }`}>
                        {type === 'empty_contract' ? <AlertTriangle className="h-5 w-5" /> : <FolderKanban className="h-5 w-5" />}
                    </div>
                    <div>
                        <DialogTitle className="text-base font-semibold text-[#0f172a]">
                            {type === 'empty_contract' ? "No Initial Contract Set" : "Confirm User Creation"}
                        </DialogTitle>
                        <p className={`text-xs ${
                            type === 'empty_contract' ? "text-amber-700/80" : "text-blue-600/80"
                        }`}>
                            {type === 'empty_contract' ? "Default system rates will apply" : "Verify contract terms"}
                        </p>
                    </div>
                </div>
                <div className="px-6 pt-3.5 pb-5 text-sm text-slate-600 leading-relaxed">
                    {type === 'empty_contract'
                        ? "You are about to create a user without an initial contract. They will use default system rates until a contract is assigned. Do you want to proceed?"
                        : "All initial contract details have been filled. Are you sure you want to create this user and establish their contract?"}
                </div>
                <DialogFooter className="px-6 py-3.5 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end gap-2.5">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving} className="rounded-md">Cancel</Button>
                    <Button onClick={onConfirm} disabled={isSaving} className="rounded-md min-w-[120px] bg-[#2568C1] hover:bg-[#1e56a6] text-white">
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : (type === 'empty_contract' ? "Yes, Create User" : "Confirm & Create")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
