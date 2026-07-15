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
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl flex items-center gap-2">
                        {notification.title}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground mt-1">
                        Received on {format(new Date(notification.created_at), "PPp")}
                    </DialogDescription>
                </DialogHeader>
                
                <div className="py-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {notification.message}
                </div>

                <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
                    <Button variant="outline" size="sm" onClick={handleDelete} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                        Delete
                    </Button>
                    <div className="flex gap-2">
                        {notification.reference_type && (
                            <Button size="sm" onClick={handleActionClick} className="bg-blue-600 hover:bg-blue-700 text-white">
                                View Details
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
