"use client";

import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Shield, LogIn } from "lucide-react";
import { User } from "@/lib/types";

interface ConfirmProxyDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    targetUser: User | null;
    onConfirm: () => void;
}

export function ConfirmProxyDialog({
    open,
    onOpenChange,
    targetUser,
    onConfirm
}: ConfirmProxyDialogProps) {
    if (!targetUser) return null;

    const name = targetUser.full_name || targetUser.name || "Unknown User";
    const getInitials = (n: string) => n.split(" ").slice(0, 2).map((part) => part[0]).join("");

    const getRoleBadge = (role: string) => {
        const cls = role === "admin"
            ? "bg-amber-50 text-amber-700 border-amber-200"
            : role === "projectmanager"
                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                : role === "finance"
                    ? "bg-purple-50 text-purple-700 border-purple-200"
                    : "bg-blue-50 text-[#2568C1] border-blue-200";
        const label = role === "projectmanager" ? "Project Manager" : role === "finance" ? "Management" : role;
        return (
            <Badge variant="outline" className={`capitalize text-[11px] font-bold rounded-full px-2.5 py-0.5 border-none ${cls}`}>
                {label}
            </Badge>
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent showCloseButton={false} className="sm:max-w-[420px] p-0 overflow-hidden border-[#e2e8f0]">
                <div className="bg-amber-50 border-b border-amber-200 px-6 py-5 flex items-center gap-3">
                    <div className="p-2.5 bg-white rounded-xl shadow-sm border border-amber-200">
                        <Shield className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                        <DialogTitle className="text-base text-[#0f172a] mb-0.5">Confirm Proxy Login</DialogTitle>
                        <DialogDescription className="text-[11px] text-amber-600/80">
                            This action will be logged for audit compliance
                        </DialogDescription>
                    </div>
                </div>

                <div className="px-6 py-5 space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <Avatar className="h-10 w-10 border border-[#e2e8f0] shadow-sm">
                            <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-[#2568C1] to-[#1a4f99] text-white">
                                {getInitials(name)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-800">{name}</span>
                            <span className="text-[11px] text-slate-500 font-medium">{targetUser.email}</span>
                        </div>
                        <div className="ml-auto">
                            {getRoleBadge(targetUser.role)}
                        </div>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                        You are about to log in as <span className="font-semibold text-slate-900">{name}</span>. You can return to your admin account at any time via the &quot;Back to Admin&quot; button.
                    </p>
                </div>

                <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        className="gap-1.5 bg-[#2568C1] hover:bg-[#1a4f99] text-white shadow-sm h-10 px-6 transition-all duration-200"
                        onClick={onConfirm}
                    >
                        <LogIn className="h-4 w-4" />
                        Yes, Continue
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
