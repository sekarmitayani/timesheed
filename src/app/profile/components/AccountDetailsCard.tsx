import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { User } from "@/lib/types";
import { format } from "date-fns";
import { Calendar } from "lucide-react";

interface AccountDetailsCardProps {
    profile?: User;
}

export function AccountDetailsCard({ profile }: AccountDetailsCardProps) {
    if (!profile) return null;

    const formatDate = (dateString?: string) => {
        if (!dateString) return "—";
        try {
            return format(new Date(dateString), "MMM dd, yyyy");
        } catch {
            return dateString;
        }
    };

    // Format employee type nicely
    const formatEmployeeType = (type?: string | null) => {
        if (!type) return "—";
        return type.charAt(0).toUpperCase() + type.slice(1).replace("-", " ");
    };

    return (
        <Card className="bg-white border-slate-100 shadow-sm rounded-xl overflow-hidden flex flex-col p-0 py-0 gap-0">
            <CardHeader className="px-5 py-5 border-b border-slate-100 [&.border-b]:pb-5 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <Calendar className="h-5 w-5 text-[#4B7BEC] shrink-0" />
                    <div className="flex flex-col">
                        <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
                            Account Details
                        </CardTitle>
                        <p className="text-[10px] text-slate-400 font-medium leading-none mt-1">
                            Account timeline and registration metadata
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-2">
                    <div className="space-y-0.5">
                        <Label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Created At</Label>
                        <p className="text-xs font-semibold text-slate-900">{formatDate(profile.created_at || profile.joinDate)}</p>
                    </div>

                    <div className="space-y-0.5">
                        <Label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Last Updated</Label>
                        <p className="text-xs font-semibold text-slate-900">{formatDate(profile.updated_at)}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
