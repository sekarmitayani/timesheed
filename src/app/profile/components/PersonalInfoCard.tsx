import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from "@/lib/types";
import { Pencil, User as UserIcon } from "lucide-react";
import { UpdateProfilePayload } from "@/lib/services/profile-service";
import { Badge } from "@/components/ui/badge";

interface PersonalInfoCardProps {
    profile?: User;
    onSave: (payload: UpdateProfilePayload) => Promise<any>;
    isSaving: boolean;
}

export function PersonalInfoCard({ profile, onSave, isSaving }: PersonalInfoCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        phone_number: "",
    });

    // Sync state when profile loads/changes
    useEffect(() => {
        if (profile && !isEditing) {
            setFormData({
                full_name: profile.name || profile.full_name || "",
                email: profile.email || "",
                phone_number: profile.phone_number || "",
            });
        }
    }, [profile, isEditing]);

    if (!profile) return null;

    const handleSave = async () => {
        await onSave({
            full_name: formData.full_name,
            email: formData.email,
            phone_number: formData.phone_number,
        });
        setIsEditing(false);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setFormData({
            full_name: profile.name || profile.full_name || "",
            email: profile.email || "",
            phone_number: profile.phone_number || "",
        });
    };

    // Format employee type nicely
    const formatEmployeeType = (type?: string | null) => {
        if (!type) return "—";
        return type.charAt(0).toUpperCase() + type.slice(1).replace("-", " ");
    };

    return (
        <Card className="bg-white border-slate-200 shadow-sm rounded-xl overflow-hidden flex flex-col">
            <CardHeader className="py-2.5 px-4 flex flex-row items-center justify-between border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-800">
                    Personal Information
                </CardTitle>
                {!isEditing ? (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="h-6 gap-1 text-[10px] px-2 border-slate-200 text-slate-600">
                        <Pencil className="h-2.5 w-2.5" />
                        Edit
                    </Button>
                ) : (
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isSaving} className="h-6 text-[10px] text-slate-500">
                            Cancel
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={isSaving} className="h-6 text-[10px] px-3 bg-[#2568C1] hover:bg-[#1a4f99]">
                            {isSaving ? "Saving..." : "Save"}
                        </Button>
                    </div>
                )}
            </CardHeader>
            <CardContent className="p-4 pt-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-2">
                    {/* Full Name */}
                    <div className="space-y-1">
                        <Label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Full Name</Label>
                        {isEditing ? (
                            <Input 
                                value={formData.full_name} 
                                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                                className="h-8 focus-visible:ring-[#2568C1] text-xs"
                            />
                        ) : (
                            <div className="flex min-h-7 w-full items-center rounded-md bg-slate-50/50 px-2.5 py-1 text-xs font-medium text-slate-800 border border-slate-200/60">
                                {profile.name || profile.full_name || "—"}
                            </div>
                        )}
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                        <Label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Email Address</Label>
                        {isEditing ? (
                            <Input 
                                type="email"
                                value={formData.email} 
                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                className="h-8 focus-visible:ring-[#2568C1] text-xs"
                            />
                        ) : (
                            <div className="flex min-h-7 w-full items-center rounded-md bg-slate-50/50 px-2.5 py-1 text-xs font-medium text-slate-800 border border-slate-200/60">
                                {profile.email}
                            </div>
                        )}
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-1">
                        <Label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Phone Number</Label>
                        {isEditing ? (
                            <Input 
                                value={formData.phone_number} 
                                onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                                className="h-8 focus-visible:ring-[#2568C1] text-xs"
                            />
                        ) : (
                            <div className="flex min-h-7 w-full items-center rounded-md bg-slate-50/50 px-2.5 py-1 text-xs font-medium text-slate-800 border border-slate-200/60">
                                {profile.phone_number || "—"}
                            </div>
                        )}
                    </div>

                    {/* Employee Type (Read-only) */}
                    <div className="space-y-1">
                        <Label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Employee Type</Label>
                        <div>
                            {profile.employee_type ? (
                                <Badge variant="secondary" className="bg-slate-50 border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 text-[10px] min-h-7 rounded px-2">
                                    {formatEmployeeType(profile.employee_type)}
                                </Badge>
                            ) : (
                                <div className="flex min-h-7 w-full items-center rounded-md bg-slate-50/50 px-2.5 py-1 text-xs font-medium text-slate-800 border border-slate-200/60">
                                    —
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
