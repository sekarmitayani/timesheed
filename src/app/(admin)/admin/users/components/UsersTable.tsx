import { Eye, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableSkeleton } from "@/components/shared/loaders/TableSkeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User } from "@/lib/types";

interface UsersTableProps {
    users: User[];
    isLoading: boolean;
    pagination: { page: number, limit: number, total: number };
    setPage: (p: number) => void;
    onView: (u: User) => void;
    onEdit: (id: string) => void;
    onDelete: (u: User) => void;
    currentUserId?: string;
}

export function UsersTable({
    users, isLoading, pagination, setPage,
    onView, onEdit, onDelete, currentUserId
}: UsersTableProps) {
    const totalPages = Math.ceil(pagination.total / pagination.limit);

    return (
        <div className="bg-white border border-[#e2e8f0] rounded-lg shadow-sm overflow-hidden">
            <Table className="min-w-[720px]">
                <TableHeader>
                    <TableRow className="hover:bg-transparent bg-slate-50/50">
                        <TableHead className="pl-6 w-12 text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">No</TableHead>
                        <TableHead className="min-w-[170px] text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">User</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Role & Access</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Type</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Status</TableHead>
                        <TableHead className="w-28 pr-6 text-right text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Actions</TableHead>
                    </TableRow>
                </TableHeader>

                        <TableBody>
                            {isLoading ? (
                                <TableSkeleton columns={6} rows={6} hasAvatar={true} hasActions={true} />
                            ) : users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-muted-foreground text-center">
                                        No users found matching your filters.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map((user, index) => (
                                    <TableRow key={user.id} className="hover:bg-[#f0f4fa]/50 transition-colors">
                                        <TableCell className="pl-6 text-sm text-muted-foreground font-medium">
                                            {(pagination.page - 1) * pagination.limit + index + 1}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-3">
                                                <Avatar className="h-9 w-9 border border-[#e2e8f0] shadow-sm">
                                                    <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-[#2568C1] to-[#1a4f99] text-white">
                                                        {user.name.split(" ").slice(0, 2).map(n => n[0]).join("")}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-[#0f172a]">{user.name}</span>
                                                    <span className="text-xs text-muted-foreground">{user.email}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={`capitalize text-[11px] font-bold tracking-wider rounded-full px-2.5 py-0.5 border-none ${user.role === "admin"
                                                    ? "bg-amber-50 text-amber-600"
                                                    : user.role === "projectmanager"
                                                        ? "bg-indigo-50 text-indigo-600"
                                                        : (user.role === "management" || user.role === "finance")
                                                            ? "bg-purple-50 text-purple-600"
                                                            : "bg-blue-50 text-[#2568C1]"
                                                    }`}
                                            >
                                                {user.role === "projectmanager" ? "Project Manager" : (user.role === "management" || user.role === "finance") ? "Management" : user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`capitalize font-bold tracking-wider rounded-full px-2.5 py-0.5 border-none text-[10px] w-fit
                                                ${user.employee_type === 'parttime' ? "bg-slate-100 text-slate-600" :
                                                  user.employee_type === 'freelance' ? "bg-purple-50 text-purple-600" :
                                                  user.employee_type === 'fulltime' ? "bg-emerald-50 text-emerald-600" :
                                                  "bg-amber-50 text-amber-600"}`} variant="outline">
                                                {user.employee_type ? user.employee_type.replace("time", "-time") : "System"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`text-[10px] capitalize font-bold tracking-wider rounded-full px-2.5 py-0.5 border-none ${user.status === "active"
                                                ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                                : "bg-rose-50 text-rose-600 hover:bg-rose-100"
                                                }`}>
                                                {user.status === "active" ? "Active" : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-[#64748b] hover:text-[#2568C1] hover:bg-[#2568C1]/10 rounded-full" onClick={() => onView(user)} title="View Detail">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-[#64748b] hover:text-[#2568C1] hover:bg-[#2568C1]/10 rounded-full" onClick={() => onEdit(user.id)} title="Edit User">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-[#64748b] hover:text-red-600 hover:bg-red-50 rounded-full" onClick={() => onDelete(user)} disabled={currentUserId === user.id} title="Delete">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
            {!isLoading && totalPages > 0 && (
                <div className="border-t border-[#e2e8f0] bg-white px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-xs text-muted-foreground">
                        Showing <span className="font-medium text-[#0f172a]">{(pagination.page - 1) * pagination.limit + 1}</span> to <span className="font-medium text-[#0f172a]">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-medium text-[#0f172a]">{pagination.total}</span> users
                    </div>
                    
                    <div className="flex items-center gap-2 sm:pr-14 md:pr-0">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            disabled={pagination.page <= 1}
                            onClick={() => setPage(pagination.page - 1)}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="text-xs font-medium px-2">
                            Page {pagination.page} of {totalPages}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            disabled={pagination.page >= totalPages}
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
