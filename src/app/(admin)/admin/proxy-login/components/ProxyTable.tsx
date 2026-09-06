"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, LogIn, ChevronLeft, ChevronRight } from "lucide-react";
import { User } from "@/lib/types";

interface ProxyTableProps {
    users: User[];
    isLoading: boolean;
    isProxying: string | null;
    pagination: {
        page: number;
        limit: number;
        totalPages: number;
    };
    totalCount: number;
    setPage: (p: number) => void;
    onProxy: (u: User) => void;
}

export function ProxyTable({
    users,
    isLoading,
    isProxying,
    pagination,
    totalCount,
    setPage,
    onProxy
}: ProxyTableProps) {
    const getName = (u: User) => u.full_name || u.name || "Unknown User";
    const getInitials = (name: string) => name.split(" ").slice(0, 2).map((n: string) => n[0]).join("");

    const getRoleBadge = (role: string) => {
        const cls = role === "admin"
            ? "bg-amber-50 text-amber-700 border-amber-200"
            : role === "projectmanager"
                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                : (role === "management" || role === "finance")
                    ? "bg-purple-50 text-purple-700 border-purple-200"
                    : "bg-blue-50 text-[#2568C1] border-blue-200";
        const label = role === "projectmanager" ? "Project Manager" : (role === "management" || role === "finance") ? "Management" : role;
        return (
            <Badge variant="outline" className={`capitalize text-[11px] font-bold rounded-full px-2.5 py-0.5 border-none ${cls}`}>
                {label}
            </Badge>
        );
    };

    return (
        <div className="bg-white border border-[#e2e8f0] rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent bg-slate-50/50">
                            <TableHead className="pl-6 w-12 text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">No</TableHead>
                            <TableHead className="w-[280px] text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">User</TableHead>
                            <TableHead className=" text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Role</TableHead>
                            <TableHead className=" text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Type</TableHead>
                            <TableHead className=" text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Status</TableHead>
                            <TableHead className="w-[140px] pr-6 text-right text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-48 text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-400">
                                        <Loader2 className="h-8 w-8 animate-spin text-[#2568C1] mb-4" />
                                        <p>Loading user credentials...</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-slate-400 text-center">
                                    No users found matching your search.
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user, index) => {
                                const name = getName(user);
                                const globalIndex = (pagination.page - 1) * pagination.limit + index + 1;
                                return (
                                    <TableRow key={user.id} className="hover:bg-[#f0f4fa]/50 transition-colors border-b border-slate-100 last:border-0">
                                        <TableCell className="pl-6 text-sm text-muted-foreground font-medium">
                                            {globalIndex}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-3 items-center">
                                                <Avatar className="h-9 w-9 border border-[#e2e8f0] shadow-sm">
                                                    <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-[#2568C1] to-[#1a4f99] text-white">
                                                        {getInitials(name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-[#0f172a]">{name}</span>
                                                    <span className="text-[11px] text-slate-400 font-medium">{user.email}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {getRoleBadge(user.role)}
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs text-slate-500 font-medium capitalize">
                                                {user.employee_type ? user.employee_type.replace("time", "-time") : "System"}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`text-[10px] capitalize font-bold tracking-wider rounded-full px-2.5 py-0.5 border-none ${user.status === "active"
                                                ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                                : "bg-rose-50 text-rose-600 hover:bg-rose-100"
                                                }`}>
                                                {user.status === "active" ? "Active" : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="pr-6">
                                            <div className="flex justify-end">
                                                <Button
                                                    size="sm"
                                                    className="gap-1.5 h-8 text-xs bg-[#2568C1] hover:bg-[#1a4f99] text-white shadow-sm transition-all duration-200"
                                                    onClick={() => onProxy(user)}
                                                    disabled={isProxying === String(user.id)}
                                                >
                                                    {isProxying === String(user.id) ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <LogIn className="h-3 w-3" />
                                                    )}
                                                    {isProxying === String(user.id) ? "Authenticating..." : "Login As"}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {!isLoading && pagination.totalPages > 0 && (
                <div className="border-t border-[#e2e8f0] bg-slate-50/30 px-6 py-4 flex items-center justify-between">
                    <div className="text-xs text-slate-500 font-medium">
                        Showing <span className="text-slate-900">{(pagination.page - 1) * pagination.limit + 1}</span> to <span className="text-slate-900">{Math.min(pagination.page * pagination.limit, totalCount)}</span> of <span className="text-slate-900">{totalCount}</span> users
                    </div>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-8 p-0 border-slate-200" 
                            disabled={pagination.page <= 1} 
                            onClick={() => setPage(pagination.page - 1)}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="text-xs font-semibold px-2 text-slate-700">
                            Page {pagination.page} of {pagination.totalPages}
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-8 p-0 border-slate-200" 
                            disabled={pagination.page >= pagination.totalPages} 
                            onClick={() => setPage(pagination.page + 1)}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
