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
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${type === 'empty_contract' ? 'bg-amber-100' : 'bg-blue-100'}`}>
                        {type === 'empty_contract' ? <AlertTriangle className="h-6 w-6 text-amber-600" /> : <FolderKanban className="h-6 w-6 text-[#2568C1]" />}
                    </div>
                    <DialogTitle className="text-center text-lg">
                        {type === 'empty_contract' ? "No Initial Contract Set" : "Confirm User Creation"}
                    </DialogTitle>
                </DialogHeader>
                <div className="text-center text-sm text-[#475569] py-2">
                    {type === 'empty_contract'
                        ? "You are about to create a user without an initial contract. They will use default system rates until a contract is assigned. Do you want to proceed?"
                        : "All initial contract details have been filled. Are you sure you want to create this user and establish their contract?"}
                </div>
                <DialogFooter className="sm:justify-center gap-2 pt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving} className="w-full sm:w-auto">Cancel</Button>
                    <Button onClick={onConfirm} disabled={isSaving} className="w-full sm:w-auto min-w-[120px] bg-[#2568C1] hover:bg-[#1e56a6]">
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : (type === 'empty_contract' ? "Yes, Create User" : "Confirm & Create")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
