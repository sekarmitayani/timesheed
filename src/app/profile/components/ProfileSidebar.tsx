import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User } from "@/lib/types";
import { roleLabels, roleColors } from "@/lib/rbac";
import { cn } from "@/lib/utils";

interface ProfileSidebarProps {
    profile?: User;
}

export function ProfileSidebar({ profile }: ProfileSidebarProps) {
    if (!profile) return null;
    const displayName = profile.name || profile.full_name || "User";
    const initials = displayName
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase();

    return (
        <Card className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col items-center text-center w-full">
            <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-slate-50 mb-1 bg-gradient-to-br from-[#2568C1] to-[#1a4f99] flex items-center justify-center shrink-0 shadow-sm">
                <span className="text-[28px] font-bold text-white tracking-wide">
                    {initials}
                </span>
            </div>
            
            <h2 className="text-lg font-bold text-slate-900 text-center leading-tight">{displayName}</h2>
            <p className="text-xs font-medium text-slate-500 text-center mb-1.5">{roleLabels[profile.role]}</p>
            
            {profile.is_active || profile.status === "active" ? (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
                    <div className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600">Active</span>
                </div>
            ) : (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded-full">
                    <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                    <span className="text-[10px] font-bold text-slate-600">Inactive</span>
                </div>
            )}
        </Card>
    );
}
