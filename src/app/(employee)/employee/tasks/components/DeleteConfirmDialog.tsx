"use client";

import { DeleteImpactDialog } from "@/components/shared/DeleteImpactDialog";

interface DeleteConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void> | void;
    isDeleting: boolean;
    taskTitle: string;
    taskId?: number | null;
}

export function DeleteConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    isDeleting,
    taskTitle,
    taskId
}: DeleteConfirmDialogProps) {
    return (
        <DeleteImpactDialog
            open={isOpen}
            onOpenChange={(open) => !open && onClose()}
            entity="task"
            id={taskId || null}
            name={taskTitle}
            isDeleting={isDeleting}
            onConfirm={onConfirm}
            title="Delete Task?"
        />
    );
}

