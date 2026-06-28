"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";

interface AdminDeleteProjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projectName: string;
    isDeleting: boolean;
    onConfirm: () => void;
}

export function AdminDeleteProjectDialog({
    open, onOpenChange, projectName, isDeleting, onConfirm
}: AdminDeleteProjectDialogProps) {
    return (
        <Dialog open={open} onOpenChange={o => !isDeleting && onOpenChange(o)}>
            <DialogContent showCloseButton={false} className="sm:max-w-md max-w-[90vw]">
                <div className="flex flex-col items-center gap-4 py-2">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <DialogTitle className="text-center text-lg font-bold">Delete Project?</DialogTitle>
                    <DialogDescription className="text-center text-sm text-slate-500">
                        This will soft-delete <b className="text-slate-900">{projectName}</b>. This action can be undone by system administrators if needed.
                    </DialogDescription>
                    <div className="flex gap-3 w-full justify-center pt-4">
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting} className="flex-1">
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={onConfirm} disabled={isDeleting} className="min-w-[120px] flex-1">
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes, Delete"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
