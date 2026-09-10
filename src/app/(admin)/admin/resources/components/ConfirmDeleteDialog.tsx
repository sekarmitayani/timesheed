import { DeleteImpactDialog } from "@/components/shared/DeleteImpactDialog";

interface ConfirmDeleteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    isProcessing: boolean;
    requestId?: number;
}

export function ConfirmDeleteDialog({
    open, onOpenChange, onConfirm, isProcessing, requestId
}: ConfirmDeleteDialogProps) {
    return (
        <DeleteImpactDialog
            open={open}
            onOpenChange={onOpenChange}
            entity="resource"
            id={requestId || null}
            name={`Resource Request #${requestId}`}
            isDeleting={isProcessing}
            onConfirm={onConfirm}
            title="Delete Resource Request?"
        />
    );
}

