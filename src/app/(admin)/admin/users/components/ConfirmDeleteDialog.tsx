"use client";

import React from "react";
import { User } from "@/lib/types";
import { DeleteImpactDialog } from "@/components/shared/DeleteImpactDialog";

interface ConfirmDeleteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: User | null;
    isDeleting: boolean;
    onConfirm: () => void;
    reasons?: string[] | null;
    onDeactivate?: () => void;
    isDeactivating?: boolean;
}

export function ConfirmDeleteDialog({
    open,
    onOpenChange,
    user,
    isDeleting,
    onConfirm,
}: ConfirmDeleteDialogProps) {
    const userName = user?.name || user?.full_name || user?.email || "this user";

    return (
        <DeleteImpactDialog
            open={open}
            onOpenChange={onOpenChange}
            entity="user"
            id={user?.id || null}
            name={userName}
            isDeleting={isDeleting}
            onConfirm={onConfirm}
            title="Delete User Account?"
        />
    );
}

