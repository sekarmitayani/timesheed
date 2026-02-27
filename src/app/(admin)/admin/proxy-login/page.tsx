"use client";

import { useState } from "react";
import { Shield, AlertTriangle, LogIn, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/ai/ai-components";
import { useDataStore } from "@/store/useDataStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { roleColors } from "@/lib/rbac";

export default function ProxyLoginPage() {
    const users = useDataStore((s) => s.users);
    const addAuditLog = useDataStore((s) => s.addAuditLog);
    const currentUser = useAuthStore((s) => s.user);
    const login = useAuthStore((s) => s.login);
    const router = useRouter();
    const [search, setSearch] = useState("");

    const filteredUsers = users
        .filter((u) => u.id !== currentUser?.id)
        .filter((u) => {
            if (!search.trim()) return true;
            const q = search.toLowerCase();
            return (
                u.name.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q) ||
                u.role.toLowerCase().includes(q) ||
                u.position.toLowerCase().includes(q) ||
                u.department.toLowerCase().includes(q)
            );
        });

    const handleProxy = (targetUserId: string, targetName: string, targetRole: string, targetUsername: string, targetPassword: string) => {
        addAuditLog({
            userId: currentUser?.id || "u6",
            action: "PROXY_LOGIN",
            target: targetUserId,
            details: `Admin ${currentUser?.name} logged in as ${targetName}`,
            ipAddress: "192.168.1.100",
        });
        login(targetUsername, targetPassword);
        toast.success(`Logged in as ${targetName}`, { description: "You are now viewing the app as this user" });
        router.push(`/${targetRole}/dashboard`);
    };

    return (
        <div className="space-y-6">
            <PageHeader title="Proxy Login" description="Log in as another user for support and debugging" />

            <Card className="border-amber-500/30 bg-amber-500/5">
                <CardContent className="p-4 flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-amber-500">Audit Compliance Notice</p>
                        <p className="text-xs text-muted-foreground">All proxy login sessions are logged for compliance. Your actions will be recorded under your admin account.</p>
                    </div>
                </CardContent>
            </Card>

            {/* Search bar */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search users by name, email, role..."
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No users found matching &quot;{search}&quot;</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredUsers.map((user) => (
                        <Card key={user.id} className="hover:border-[#2568C1]/30 transition-colors">
                            <CardContent className="p-4 space-y-3">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarFallback className={`text-sm text-white ${roleColors[user.role]}`}>
                                            {user.name.split(" ").map((n) => n[0]).join("")}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-medium">{user.name}</h4>
                                        <p className="text-xs text-muted-foreground">{user.position}</p>
                                    </div>
                                    <Badge variant="outline" className="capitalize text-[10px]">{user.role}</Badge>
                                </div>
                                <div className="flex gap-2 text-xs text-muted-foreground">
                                    <span>{user.email}</span>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full gap-2 text-xs"
                                    onClick={() => handleProxy(user.id, user.name, user.role, user.username, user.password)}
                                >
                                    <LogIn className="h-3 w-3" /> Login as {user.name.split(" ")[0]}
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
