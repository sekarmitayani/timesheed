"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Notification } from "@/lib/types";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

interface NotificationDetailModalProps {
    notification: Notification | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onDelete: (id: number) => void;
}

export function NotificationDetailModal({
    notification,
    open,
    onOpenChange,
    onDelete
}: NotificationDetailModalProps) {
    const router = useRouter();

    const { user } = useAuthStore();

    if (!notification) return null;

    const handleActionClick = () => {
        const role = user?.role || "employee";
        const basePath = role === "projectmanager" ? "/pm" : role === "finance" ? "/management" : `/${role}`;

        // Basic routing logic based on reference_type
        if (notification.reference_type === "timesheet") {
            router.push(`${basePath}/approvals`);
        } else if (notification.reference_type === "task" || notification.type.includes("task")) {
            router.push(`${basePath}/tasks`); 
        } else if (notification.reference_type === "project") {
            router.push(`${basePath}/projects/${notification.reference_id}`);
        } else if (notification.reference_type === "resource_request") {
            router.push(`${basePath}/resources`);
        } else {
            router.push(`${basePath}/dashboard`);
        }
        onOpenChange(false);
    };

    const handleDelete = () => {
        onDelete(notification.id);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden border-[#e2e8f0] gap-0 rounded-md shadow-xl">
                <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 pr-12 py-4 flex flex-col gap-1">
                    <DialogTitle className="text-base font-bold text-[#0f172a] leading-tight">
                        {notification.title}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500 font-medium">
                        Received on {format(new Date(notification.created_at), "PPp")}
                    </DialogDescription>
                </div>
                
                <div className="px-6 pt-3.5 pb-5 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {notification.message}
                </div>

                <div className="px-6 py-3.5 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-between items-center gap-2.5">
                    <Button variant="outline" size="sm" onClick={handleDelete} className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-md">
                        Delete
                    </Button>
                    <div className="flex gap-2">
                        {notification.reference_type && (
                            <Button size="sm" onClick={handleActionClick} className="bg-[#2568C1] hover:bg-[#1e56a6] text-white rounded-md">
                                View Details
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
