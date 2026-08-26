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
        <Card className="bg-white border-slate-100 shadow-sm rounded-xl overflow-hidden flex flex-col p-0 py-0 gap-0">
            <CardHeader className="px-5 py-5 border-b border-slate-100 [&.border-b]:pb-5 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <UserIcon className="h-5 w-5 text-[#4B7BEC] shrink-0" />
                    <div className="flex flex-col">
                        <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
                            Personal Information
                        </CardTitle>
                        <p className="text-[10px] text-slate-400 font-medium leading-none mt-1">
                            Manage your personal details and contact information
                        </p>
                    </div>
                </div>
                {!isEditing ? (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="h-7 gap-1 text-[9px] font-bold px-2.5 border-slate-200 text-slate-600 uppercase tracking-widest hover:bg-slate-50 hover:text-[#4B7BEC]">
                        <Pencil className="h-2.5 w-2.5" />
                        Edit
                    </Button>
                ) : (
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isSaving} className="h-7 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                            Cancel
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={isSaving} className="h-7 text-[9px] font-bold px-3 bg-[#4B7BEC] hover:bg-[#385bb5] text-white uppercase tracking-wider">
                            {isSaving ? "Saving..." : "Save"}
                        </Button>
                    </div>
                )}
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
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
                    {/* Skill Level (Read-only) */}
                    <div className="space-y-1">
                        <Label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Skill Level</Label>
                        <div>
                            {profile.skill_level ? (
                                <Badge variant="secondary" className="bg-[#EBF5FF] text-[#2568C1] border-none font-bold hover:bg-[#EBF5FF] text-[10px] min-h-7 rounded px-2">
                                    {profile.skill_level === 1 ? "Junior" : 
                                     profile.skill_level === 2 ? "Mid-Level" : 
                                     profile.skill_level === 3 ? "Senior" : "Not Set"}
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
