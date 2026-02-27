"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/ai/ai-components";
import { useAuthStore } from "@/store/useAuthStore";
import { roleLabels, roleColors } from "@/lib/rbac";
import { Mail, Building2, Briefcase, Calendar, DollarSign } from "lucide-react";

export default function ProfilePage() {
    const user = useAuthStore((s) => s.user);
    if (!user) return null;

    const fields = [
        { icon: Mail, label: "Email", value: user.email },
        { icon: Building2, label: "Department", value: user.department },
        { icon: Briefcase, label: "Position", value: user.position },
        { icon: Calendar, label: "Join Date", value: user.joinDate },
        { icon: DollarSign, label: "Hourly Rate", value: `Rp ${user.hourlyRate.toLocaleString()}` },
    ];

    return (
        <div className="space-y-6">
            <PageHeader title="Profile" description="Your personal information" />
            <Card className="max-w-2xl">
                <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <Avatar className="h-16 w-16">
                            <AvatarFallback className="text-xl bg-gradient-to-br from-[#2568C1] to-[#1a4f99] text-white">
                                {user.name.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="text-lg font-bold">{user.name}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge className={`${roleColors[user.role]} text-white text-xs`}>{roleLabels[user.role]}</Badge>
                                <Badge variant={user.status === "active" ? "secondary" : "destructive"} className="text-xs">{user.status}</Badge>
                            </div>
                        </div>
                    </div>
                    <Separator className="mb-4" />
                    <div className="space-y-4">
                        {fields.map(({ icon: Icon, label, value }) => (
                            <div key={label} className="flex items-center gap-3">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">{label}</p>
                                    <p className="text-sm font-medium">{value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
