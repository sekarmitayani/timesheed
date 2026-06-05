import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { User } from "@/lib/types";
import { format } from "date-fns";
import { Contact } from "lucide-react";

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
        <Card className="bg-white border-slate-200 shadow-sm rounded-xl overflow-hidden flex flex-col">
            <CardHeader className="py-2.5 px-4 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-800">
                    Account Details
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-3">
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
