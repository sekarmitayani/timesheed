"use client";

import { DeleteImpactDialog } from "@/components/shared/DeleteImpactDialog";

interface AdminDeleteProjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projectId?: number | null;
    projectName: string;
    isDeleting: boolean;
    onConfirm: () => void;
}

export function AdminDeleteProjectDialog({
    open, onOpenChange, projectId, projectName, isDeleting, onConfirm
}: AdminDeleteProjectDialogProps) {
    return (
        <DeleteImpactDialog
            open={open}
            onOpenChange={onOpenChange}
            entity="project"
            id={projectId || null}
            name={projectName}
            isDeleting={isDeleting}
            onConfirm={onConfirm}
        />
    );
}

