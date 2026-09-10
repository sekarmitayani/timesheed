import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Notification, Role } from "@/lib/types";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { trashService } from "@/lib/services/trash-service";
import { AlertCircle, Loader2 } from "lucide-react";

interface NotificationDetailModalProps {
    notification: Notification | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onDelete: (id: number) => void;
}

function getNotificationDetailUrl(notification: Notification, role: Role): string | null {
    const basePath = role === "projectmanager" ? "/pm" : (role === "management" || role === "finance") ? "/management" : `/${role}`;
    const refType = notification.reference_type;
    const notifType = notification.type;

    // 1. Approvals / Timesheet Review
    if (notifType === "timesheet_review") {
        if (role === "admin" || role === "projectmanager") {
            return `${basePath}/approvals`;
        }
        return null;
    }

    // 2. Timesheet Status / Clock Out / Loose Timesheet
    if (refType === "timesheet" || notifType === "timesheet_status" || notifType === "forgot_clock_out") {
        if (role === "employee" || role === "projectmanager" || role === "management" || role === "finance") {
            return `${basePath}/timesheet`;
        }
        if (role === "admin") {
            return "/admin/approvals";
        }
        return null;
    }

    // 3. Task assignment / deadline / task reference
    if (refType === "task" || notifType === "task_assignment" || notifType === "task_deadline") {
        if (role === "employee" || role === "projectmanager") {
            return `${basePath}/tasks`;
        }
        return null; // Admin & Management don't have task lists
    }

    // 4. Project assignment / budget alert / project reference
    if (refType === "project" || notifType === "project_assignment" || notifType === "project_budget_alert") {
        if (role === "employee" || role === "projectmanager" || role === "admin") {
            return notification.reference_id ? `${basePath}/projects/${notification.reference_id}` : `${basePath}/projects`;
        }
        return null; // Management does not have /projects
    }

    // 5. Resource requests
    if (refType === "resource_request" || refType === "resource" || notifType === "resource_request_new" || notifType === "resource_request_status") {
        if (role === "admin" || role === "projectmanager" || role === "management" || role === "finance") {
            return `${basePath}/resources`;
        }
        return null; // Employee does not have /resources
    }

    // 6. Payroll / Earnings
    if (refType === "payroll" || notifType === "payroll_disbursed") {
        if (role === "admin") {
            return "/admin/payroll";
        }
        if (role === "employee" || role === "projectmanager" || role === "management" || role === "finance") {
            return `${basePath}/earnings`;
        }
        return null;
    }

    return null;
}

export function NotificationDetailModal({
    notification,
    open,
    onOpenChange,
    onDelete
}: NotificationDetailModalProps) {
    const router = useRouter();
    const { user } = useAuthStore();
    const [isDeletedModalOpen, setIsDeletedModalOpen] = useState(false);
    const [deletedEntityName, setDeletedEntityName] = useState<string>("");
    const [isChecking, setIsChecking] = useState(false);

    if (!notification) return null;

    const detailUrl = user?.role ? getNotificationDetailUrl(notification, user.role) : null;

    const handleActionClick = async () => {
        if (!detailUrl) return;

        if (notification.reference_type && notification.reference_id) {
            setIsChecking(true);
            try {
                const check = await trashService.checkEntityStatus(
                    notification.reference_type,
                    notification.reference_id
                );
                if (check && check.deleted) {
                    setDeletedEntityName(check.name || notification.reference_type);
                    setIsDeletedModalOpen(true);
                    setIsChecking(false);
                    return;
                }
            } catch (err) {
                console.error("Check entity error:", err);
            }
            setIsChecking(false);
        }

        router.push(detailUrl);
        onOpenChange(false);
    };

    const handleDelete = () => {
        onDelete(notification.id);
        onOpenChange(false);
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-md p-0 overflow-hidden border-[#e2e8f0] gap-0 rounded-md shadow-xl">
                    <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 pr-12 py-4 flex flex-col gap-1">
                        <DialogTitle className="text-base font-bold text-[#0f172a] leading-tight">
                            {notification.title}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 font-medium">
                            Received on {format(new Date(notification.created_at), "dd MMM yyyy, HH:mm")}
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
                            {detailUrl && (
                                <Button 
                                    size="sm" 
                                    onClick={handleActionClick} 
                                    disabled={isChecking}
                                    className="bg-[#2568C1] hover:bg-[#1e56a6] text-white rounded-md"
                                >
                                    {isChecking ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                                    View Details
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal Informasi Ketika Entitas Sudah Dihapus */}
            <Dialog open={isDeletedModalOpen} onOpenChange={setIsDeletedModalOpen}>
                <DialogContent className="sm:max-w-md p-0 overflow-hidden border-[#e2e8f0] gap-0 rounded-md shadow-xl">
                    <div className="bg-amber-50/70 border-b border-amber-200 px-6 py-4 pr-12 flex items-center gap-3.5">
                        <div className="p-2 bg-white rounded-md shadow-sm border border-amber-300 text-amber-600 shrink-0">
                            <AlertCircle className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-semibold text-[#0f172a]">
                                Data Telah Dihapus
                            </DialogTitle>
                            <p className="text-xs text-amber-700 font-medium">Informasi Ketersediaan</p>
                        </div>
                    </div>

                    <div className="px-6 py-4 text-sm text-slate-600 leading-relaxed">
                        Data terkait <b className="text-slate-900">{deletedEntityName || "item ini"}</b> telah dihapus dari sistem atau dipindahkan ke <b>Trash &amp; Restore</b>. Anda tidak dapat mengakses halaman detail saat ini.
                    </div>

                    <div className="px-6 py-3.5 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end">
                        <Button
                            variant="default"
                            className="bg-[#2568C1] hover:bg-[#1e56a6] rounded-md font-medium text-xs px-4"
                            onClick={() => setIsDeletedModalOpen(false)}
                        >
                            Tutup
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

