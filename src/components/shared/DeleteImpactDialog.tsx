"use client";

import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, Info } from "lucide-react";
import { trashService, DeleteImpactResponse } from "@/lib/services/trash-service";

export interface DeleteImpactDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    entity: "project" | "user" | "contract" | "task" | "resource";
    id: number | string | null;
    name: string;
    isDeleting: boolean;
    onConfirm: () => void;
    title?: string;
    description?: string;
}

export function DeleteImpactDialog({
    open,
    onOpenChange,
    entity,
    id,
    name,
    isDeleting,
    onConfirm,
    title,
    description
}: DeleteImpactDialogProps) {
    const [impact, setImpact] = useState<DeleteImpactResponse | null>(null);
    const [isLoadingImpact, setIsLoadingImpact] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open && id) {
            setIsLoadingImpact(true);
            setError(null);
            trashService
                .getDeleteImpact(entity, id)
                .then((res) => {
                    setImpact(res);
                })
                .catch((err) => {
                    console.error("Failed to load delete impact:", err);
                    setError("Unable to calculate impact breakdown.");
                })
                .finally(() => {
                    setIsLoadingImpact(false);
                });
        } else {
            setImpact(null);
            setError(null);
        }
    }, [open, entity, id]);

    const displayTitle = title || `Delete ${entity.charAt(0).toUpperCase() + entity.slice(1)}?`;
    const filteredImpacts = impact?.impacts.filter((imp) => imp.count > 0) || [];
    const hasCascadeChildren = filteredImpacts.length > 0;

    return (
        <Dialog open={open} onOpenChange={(val) => !isDeleting && onOpenChange(val)}>
            <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-[#e2e8f0] gap-0 rounded-md shadow-xl">
                {/* Header */}
                <div className="bg-red-50/60 border-b border-red-100 px-6 py-4 pr-12 flex items-center gap-3.5">
                    <div className="p-2 bg-white rounded-md shadow-sm border border-red-200 text-red-600 shrink-0">
                        <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                        <DialogTitle className="text-base font-semibold text-[#0f172a]">
                            {displayTitle}
                        </DialogTitle>
                        <p className="text-xs text-red-600/80 font-medium">
                            Confirm Cascade Deletion
                        </p>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-4 space-y-3.5 text-sm text-slate-600 leading-relaxed">
                    <div>
                        {description ? (
                            description
                        ) : (
                            <>
                                Are you sure you want to delete <b className="text-slate-900">{name}</b>?
                                This item will be moved to <span className="font-semibold text-slate-800">Trash &amp; Restore</span>.
                            </>
                        )}
                    </div>

                    {/* Impact Analysis Section */}
                    {isLoadingImpact ? (
                        <div className="flex items-center gap-2.5 py-3 px-3.5 bg-slate-50 border border-slate-200/80 rounded-md text-xs text-slate-500">
                            <Loader2 className="h-4 w-4 animate-spin text-[#4B7BEC]" />
                            <span>Calculating connected records and cascade impact...</span>
                        </div>
                    ) : error ? (
                        <div className="flex items-center gap-2 py-2 px-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-700">
                            <Info className="h-3.5 w-3.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    ) : hasCascadeChildren ? (
                        <div className="space-y-2.5 pt-1">
                            <div className="bg-amber-50/70 border border-amber-200/80 rounded-md p-3">
                                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-1.5 block">
                                    Cascade Deletion Warning ({impact?.total_impacted} Items)
                                </span>
                                <p className="text-[11px] text-amber-800 leading-relaxed">
                                    The following active records linked to this {entity} will also be soft-deleted:
                                </p>

                                <div className="grid grid-cols-2 gap-1.5 mt-2.5">
                                    {filteredImpacts.map((item) => (
                                        <div
                                            key={item.key}
                                            className="flex items-center justify-between bg-white border border-amber-200/60 rounded px-2.5 py-1.5 text-xs"
                                        >
                                            <span className="text-slate-700 font-medium truncate pr-1">
                                                {item.label}
                                            </span>
                                            <span className="bg-amber-100/80 text-amber-900 font-bold px-1.5 py-0.5 rounded text-[11px] shrink-0">
                                                {item.count}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="px-3 py-2 bg-blue-50/60 border border-blue-100 rounded-md text-[11px] text-[#2568C1]">
                                Restoring this {entity} from <b>Trash &amp; Restore</b> will automatically recover all {impact?.total_impacted} connected items together.
                            </div>
                        </div>
                    ) : impact ? (
                        <div className="flex items-center gap-2 py-2 px-3 bg-slate-50 border border-slate-100 rounded-md text-xs text-slate-500">
                            <Info className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>No active child entities will be affected by this deletion.</span>
                        </div>
                    ) : null}
                </div>

                {/* Footer */}
                <DialogFooter className="px-6 py-3.5 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end gap-2.5">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isDeleting}
                        className="rounded-md"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={isDeleting || isLoadingImpact}
                        className="min-w-[120px] rounded-md"
                    >
                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                        Yes, Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
