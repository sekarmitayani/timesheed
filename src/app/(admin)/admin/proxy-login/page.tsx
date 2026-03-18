"use client";

import { useState, useEffect } from "react";
import { Shield, AlertTriangle, LogIn, Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { PageHeader } from "@/components/ai/ai-components";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { adminUserService } from "@/lib/services/admin-users";
import { User } from "@/lib/types";

export default function ProxyLoginPage() {
    const currentUser = useAuthStore((s) => s.user);
    const impersonate = useAuthStore((s) => s.impersonate);
    const router = useRouter();

    const [users, setUsers] = useState<User[]>([]);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [isLoading, setIsLoading] = useState(true);
    const [isProxying, setIsProxying] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const limit = 10;

    // Confirmation dialog
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [targetUser, setTargetUser] = useState<User | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await adminUserService.getUsers(1, 100);
                if (res.data) setUsers(res.data);
            } catch {
                toast.error("Failed to fetch available users list");
            } finally {
                setIsLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const filteredUsers = users
        .filter((u) => u.id !== currentUser?.id)
        .filter((u) => {
            if (!search.trim()) return true;
            const q = search.toLowerCase();
            return (
                u.full_name?.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q) ||
                u.role.toLowerCase().includes(q)
            );
        })
        .filter((u) => roleFilter === "all" || u.role === roleFilter)
        .filter((u) => {
            if (statusFilter === "all") return true;
            if (statusFilter === "active") return u.status === "active";
            return u.status !== "active";
        });

    const totalPages = Math.ceil(filteredUsers.length / limit);
    const paginated = filteredUsers.slice((currentPage - 1) * limit, currentPage * limit);

    const openConfirm = (user: User) => {
        setTargetUser(user);
        setConfirmOpen(true);
    };

    const handleProxy = async () => {
        if (!targetUser) return;
        const name = targetUser.full_name || targetUser.name || "Unknown User";
        setIsProxying(String(targetUser.id));
        setConfirmOpen(false);
        try {
            const res = await adminUserService.proxyLogin(targetUser.id);
            if (res.token && res.user) {
                impersonate(res.token, res.user);
                toast.success(`Logged in as ${name}`, { description: "You are now securely impersonating this user." });
                router.push(`/${targetUser.role === "projectmanager" ? "pm" : targetUser.role === "finance" ? "management" : targetUser.role}/dashboard`);
            } else {
                toast.error("Invalid proxy token received");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to impersonate user");
        } finally {
            setIsProxying(null);
            setTargetUser(null);
        }
    };

    const getName = (u: User) => u.full_name || u.name || "Unknown User";
    const getInitials = (name: string) => name.split(" ").slice(0, 2).map((n: string) => n[0]).join("");

    const getRoleBadge = (role: string) => {
        const cls = role === "admin"
            ? "bg-amber-50 text-amber-700 border-amber-200"
            : role === "projectmanager"
                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                : role === "finance"
                    ? "bg-purple-50 text-purple-700 border-purple-200"
                    : "bg-blue-50 text-[#2568C1] border-blue-200";
        const label = role === "projectmanager" ? "Project Manager" : role === "finance" ? "Management" : role;
        return (
            <Badge variant="outline" className={`capitalize text-[11px] font-medium ${cls}`}>
                {label}
            </Badge>
        );
    };

    return (
        <div className="space-y-6">
            <PageHeader title="Proxy Login" description="Log in as another user for support and debugging" />

            <Card className="border-amber-200 bg-amber-50/50">
                <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-amber-700">Audit Compliance Notice</p>
                        <p className="text-xs text-amber-600/80">All proxy login sessions are rigorously tracked. Your impersonation actions will be securely bound to your admin credentials.</p>
                    </div>
                </CardContent>
            </Card>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-[250px] shrink-0">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search users..."
                            className="pl-9 h-10 w-full bg-white border-slate-200 focus-visible:ring-[#2568C1]"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                            disabled={isLoading}
                        />
                    </div>
                    <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setCurrentPage(1); }}>
                        <SelectTrigger className="h-10 w-[140px] bg-white shrink-0"><SelectValue placeholder="Role" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Roles</SelectItem>
                            <SelectItem value="employee">Employee</SelectItem>
                            <SelectItem value="projectmanager">Project Manager</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="finance">Management</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                        <SelectTrigger className="h-10 w-[120px] bg-white shrink-0"><SelectValue placeholder="Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Table */}
            <Card className="border-[#e2e8f0] shadow-sm overflow-hidden bg-white">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="pl-6 w-12 text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">No</TableHead>
                                    <TableHead className="w-[280px] text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">User</TableHead>
                                    <TableHead className=" text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Role</TableHead>
                                    <TableHead className=" text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Type</TableHead>
                                    <TableHead className=" text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Status</TableHead>
                                    <TableHead className="w-[140px] pr-10 text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-48  text-center">
                                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                <Loader2 className="h-8 w-8 animate-spin text-[#2568C1] mb-4" />
                                                <p>Loading user credentials...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : paginated.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-muted-foreground text-center">
                                            No users found matching your search.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginated.map((user, index) => {
                                        const name = getName(user);
                                        const globalIndex = (currentPage - 1) * limit + index + 1;
                                        return (
                                            <TableRow key={user.id} className="hover:bg-[#f0f4fa]/50 transition-colors">
                                                <TableCell className="pl-6 text-sm text-muted-foreground font-medium">
                                                    {globalIndex}
                                                </TableCell>
                                                <TableCell className="">
                                                    <div className="flex gap-3">
                                                        <Avatar className="h-9 w-9 border border-[#e2e8f0] shadow-sm">
                                                            <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-[#2568C1] to-[#1a4f99] text-white">
                                                                {getInitials(name)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium text-[#0f172a]">{name}</span>
                                                            <span className="text-xs text-muted-foreground">{user.email}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="">
                                                    {getRoleBadge(user.role)}
                                                </TableCell>
                                                <TableCell className="">
                                                    <span className="text-xs text-muted-foreground capitalize">
                                                        {user.employee_type ? user.employee_type.replace("time", "-time") : "System"}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="">
                                                    <Badge className={`text-[10px] capitalize font-bold tracking-wider rounded-full px-2.5 py-0.5 ${user.status === "active"
                                                        ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-transparent"
                                                        : "bg-slate-100 text-slate-500 hover:bg-slate-200 border-transparent"
                                                        }`}>
                                                        {user.status === "active" ? "Active" : "Inactive"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="">
                                                    <Button
                                                        size="sm"
                                                        className="gap-1.5 h-8 text-xs bg-[#2568C1] hover:bg-[#1a4f99] text-white shadow-sm"
                                                        onClick={() => openConfirm(user)}
                                                        disabled={isProxying === String(user.id)}
                                                    >
                                                        {isProxying === String(user.id) ? (
                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                        ) : (
                                                            <LogIn className="h-3 w-3" />
                                                        )}
                                                        {isProxying === String(user.id) ? "Authenticating..." : "Login As"}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 0 && (
                        <div className="border-t border-[#e2e8f0] bg-white px-4 py-3 flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">
                                Showing <span className="font-medium text-[#0f172a]">{(currentPage - 1) * limit + 1}</span> to <span className="font-medium text-[#0f172a]">{Math.min(currentPage * limit, filteredUsers.length)}</span> of <span className="font-medium text-[#0f172a]">{filteredUsers.length}</span> users
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={currentPage <= 1} onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
                                <div className="text-xs font-medium px-2">Page {currentPage} of {totalPages}</div>
                                <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}><ChevronRight className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Confirmation Dialog */}
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden border-[#e2e8f0]">
                    <div className="bg-amber-50 border-b border-amber-200 px-6 py-5 flex items-center gap-3">
                        <div className="p-2.5 bg-white rounded-xl shadow-sm border border-amber-200">
                            <Shield className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-base text-[#0f172a] mb-0.5">Confirm Proxy Login</DialogTitle>
                            <DialogDescription className="text-[11px] text-amber-600/80">
                                This action will be logged for audit compliance
                            </DialogDescription>
                        </div>
                    </div>

                    {targetUser && (
                        <div className="px-6 py-5 space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <Avatar className="h-10 w-10 border border-[#e2e8f0]">
                                    <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-[#2568C1] to-[#1a4f99] text-white">
                                        {getInitials(getName(targetUser))}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-slate-800">{getName(targetUser)}</span>
                                    <span className="text-[11px] text-slate-500">{targetUser.email}</span>
                                </div>
                                <div className="ml-auto">
                                    {getRoleBadge(targetUser.role)}
                                </div>
                            </div>
                            <p className="text-sm text-slate-600">
                                You are about to log in as <span className="font-semibold">{getName(targetUser)}</span>. You can return to your admin account at any time via the &quot;Back to Admin&quot; button.
                            </p>
                        </div>
                    )}

                    <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                        <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            className="gap-1.5 bg-[#2568C1] hover:bg-[#1a4f99] text-white"
                            onClick={handleProxy}
                        >
                            <LogIn className="h-3.5 w-3.5" />
                            Yes, Continue
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
