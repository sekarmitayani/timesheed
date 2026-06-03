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
        <Card className="bg-white border-slate-200 shadow-sm rounded-xl overflow-hidden flex flex-col">
            <CardHeader className="py-2 px-4 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-800 flex items-center">
                    <div className="p-1.5 bg-[#4B7BEC]/10 text-[#4B7BEC] rounded-md mr-2">
                        <Lock className="h-3.5 w-3.5" />
                    </div>
                    Security
                </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
                <div className="flex flex-col gap-1">
                    <Label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Password</Label>
                    <div className="flex items-center gap-3">
                        <Input 
                            value="••••••••••••" 
                            readOnly 
                            className="h-8 bg-slate-50/50 flex-1 border-slate-200 text-lg tracking-[0.2em] font-medium pt-2 text-slate-800" 
                        />
                        <Dialog open={isOpen} onOpenChange={setIsOpen}>
                            <DialogTrigger asChild>
                                <Button className="h-8 text-xs bg-[#3B4C9B] hover:bg-[#2D3A7B] text-white px-4">
                                    Change Password
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <form onSubmit={handleSubmit}>
                                    <DialogHeader>
                                        <DialogTitle className="text-xl font-bold text-slate-900">Change Password</DialogTitle>
                                        <DialogDescription className="text-slate-500">
                                            Enter your current password and a new secure password.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        {error && (
                                            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-100">
                                                {error}
                                            </div>
                                        )}
                                        <div className="space-y-2">
                                            <Label htmlFor="old_password">Current Password</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <Input
                                                    id="old_password"
                                                    type="password"
                                                    value={formData.current_password}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, current_password: e.target.value }))}
                                                    className="pl-9"
                                                    placeholder="Enter current password"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="new_password">New Password</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <Input
                                                    id="new_password"
                                                    type="password"
                                                    value={formData.new_password}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, new_password: e.target.value }))}
                                                    className="pl-9"
                                                    placeholder="Enter new password"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="confirm_password">Confirm New Password</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <Input
                                                    id="confirm_password"
                                                    type="password"
                                                    value={formData.confirm_password}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, confirm_password: e.target.value }))}
                                                    className="pl-9"
                                                    placeholder="Confirm new password"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isChangingPassword}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={isChangingPassword} className="bg-blue-600 hover:bg-blue-700">
                                            {isChangingPassword ? "Changing..." : "Save Password"}
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
