import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Lock } from "lucide-react";
import { ChangePasswordPayload } from "@/lib/services/profile-service";

interface SecurityCardProps {
    onChangePassword: (payload: ChangePasswordPayload) => Promise<any>;
    isChangingPassword?: boolean;
}

export function SecurityCard({ onChangePassword, isChangingPassword }: SecurityCardProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [formData, setFormData] = useState({
        current_password: "",
        new_password: "",
        confirm_password: "",
    });
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!formData.current_password || !formData.new_password || !formData.confirm_password) {
            setError("All fields are required");
            return;
        }

        if (formData.new_password !== formData.confirm_password) {
            setError("New passwords do not match");
            return;
        }

        if (formData.new_password.length < 6) {
            setError("New password must be at least 6 characters");
            return;
        }

        try {
            await onChangePassword({
                current_password: formData.current_password,
                new_password: formData.new_password,
            });
            setIsOpen(false);
            setFormData({ current_password: "", new_password: "", confirm_password: "" });
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to change password");
        }
    };

    return (
        <Card className="bg-white border-slate-100 shadow-sm rounded-xl overflow-hidden flex flex-col p-0 py-0 gap-0">
            <CardHeader className="px-5 py-5 border-b border-slate-100 [&.border-b]:pb-5 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <Lock className="h-5 w-5 text-[#4B7BEC] shrink-0" />
                    <div className="flex flex-col">
                        <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
                            Security Settings
                        </CardTitle>
                        <p className="text-[10px] text-slate-400 font-medium leading-none mt-1">
                            Password protection and authentication options
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col gap-1.5">
                    <Label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Password</Label>
                    <div className="flex items-center gap-3">
                        <Input 
                            value="••••••••••••" 
                            readOnly 
                            className="h-8 bg-slate-50/50 flex-1 border-slate-200 text-lg tracking-[0.2em] font-medium pt-2 text-slate-800" 
                        />
                        <Dialog open={isOpen} onOpenChange={setIsOpen}>
                            <DialogTrigger asChild>
                                <Button className="h-8 text-xs bg-[#4B7BEC] hover:bg-[#385bb5] text-white px-4 font-bold">
                                    Change Password
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden bg-white border border-[#e2e8f0] rounded-md shadow-xl gap-0">
                                <form onSubmit={handleSubmit}>
                                    <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4 pr-12 flex flex-col gap-1">
                                        <DialogTitle className="text-base font-bold text-[#0f172a] leading-none">Change Password</DialogTitle>
                                        <DialogDescription className="text-xs text-slate-500 font-medium">
                                            Enter your current and new secure password
                                        </DialogDescription>
                                    </div>
                                    <div className="px-6 pt-3.5 pb-5 space-y-4">
                                        {error && (
                                            <div className="p-3 text-xs text-red-600 bg-red-50 rounded-md border border-red-100 font-medium">
                                                {error}
                                            </div>
                                        )}
                                        <div className="space-y-1.5">
                                            <Label htmlFor="old_password" className="text-sm font-medium text-[#0f172a]">Current Password</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                                <Input
                                                    id="old_password"
                                                    type="password"
                                                    value={formData.current_password}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, current_password: e.target.value }))}
                                                    className="pl-9 h-9 text-xs focus-visible:ring-[#4B7BEC] rounded-md"
                                                    placeholder="Enter current password"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="new_password" className="text-sm font-medium text-[#0f172a]">New Password</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                                <Input
                                                    id="new_password"
                                                    type="password"
                                                    value={formData.new_password}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, new_password: e.target.value }))}
                                                    className="pl-9 h-9 text-xs focus-visible:ring-[#4B7BEC] rounded-md"
                                                    placeholder="Enter new password"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="confirm_password" className="text-sm font-medium text-[#0f172a]">Confirm New Password</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                                <Input
                                                    id="confirm_password"
                                                    type="password"
                                                    value={formData.confirm_password}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, confirm_password: e.target.value }))}
                                                    className="pl-9 h-9 text-xs focus-visible:ring-[#4B7BEC] rounded-md"
                                                    placeholder="Confirm new password"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <DialogFooter className="px-6 py-3.5 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end gap-2.5">
                                        <Button type="button" variant="outline" size="sm" onClick={() => setIsOpen(false)} disabled={isChangingPassword} className="h-8 text-xs font-semibold text-slate-600 rounded-md">
                                            Cancel
                                        </Button>
                                        <Button type="submit" size="sm" disabled={isChangingPassword} className="h-8 text-xs font-bold bg-[#4B7BEC] hover:bg-[#385bb5] text-white rounded-md">
                                            {isChangingPassword ? "Updating..." : "Update Password"}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
