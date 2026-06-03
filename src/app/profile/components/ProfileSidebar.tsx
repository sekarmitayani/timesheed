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
        <Card className="bg-white border-slate-200 shadow-sm rounded-xl overflow-hidden flex flex-col justify-center items-center py-6">
            <Avatar className="h-20 w-20 shadow-sm mb-3 bg-white">
                <AvatarFallback className="text-2xl font-bold bg-slate-100 text-slate-700">
                    {initials}
                </AvatarFallback>
            </Avatar>
            
            <h2 className="text-lg font-bold text-slate-900 text-center mb-0.5">{displayName}</h2>
            <p className="text-xs font-medium text-slate-500 text-center mb-3">{roleLabels[profile.role]}</p>
            
            {profile.is_active || profile.status === "active" ? (
                <div className="flex items-center gap-2 px-3 py-1 bg-[#4B7BEC]/5 border border-[#4B7BEC]/10 rounded-full">
                    <div className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4B7BEC] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#4B7BEC]"></span>
                    </div>
                    <span className="text-[10px] font-bold text-[#4B7BEC]">Active</span>
                </div>
            ) : (
                <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-full">
                    <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                    <span className="text-[10px] font-bold text-slate-600">Inactive</span>
                </div>
            )}
        </Card>
    );
}
