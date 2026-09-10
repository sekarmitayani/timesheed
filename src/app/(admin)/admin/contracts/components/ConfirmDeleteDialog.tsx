"use client";

import { Contract } from "@/lib/services/admin-contracts";
import { User } from "@/lib/types";
import { DeleteImpactDialog } from "@/components/shared/DeleteImpactDialog";

interface ConfirmDeleteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    contract: Contract | null;
    allUsers: User[];
    isDeleting: boolean;
    onConfirm: () => void;
}

export function ConfirmDeleteDialog({
    open,
    onOpenChange,
    contract,
    allUsers,
    isDeleting,
    onConfirm
}: ConfirmDeleteDialogProps) {
    const user = allUsers.find(u => Number(u.id) === contract?.user_id);
    const userName = user?.full_name || user?.name || `User #${contract?.user_id}`;

    return (
        <DeleteImpactDialog
            open={open}
            onOpenChange={onOpenChange}
            entity="contract"
            id={contract?.id || null}
            name={`Contract #${contract?.id} (${userName})`}
            isDeleting={isDeleting}
            onConfirm={onConfirm}
            title="Delete Contract?"
        />
    );
}

