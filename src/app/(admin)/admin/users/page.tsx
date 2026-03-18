"use client";

import { useState, useEffect } from "react";
import { UserCog, Plus, Trash2, Edit, Search, ChevronLeft, ChevronRight, Loader2, AlertTriangle, ShieldX, Eye, UserCircle, Briefcase, Calendar, Phone, Mail, FolderKanban } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/ai/ai-components";
import { useAuthStore } from "@/store/useAuthStore";
import { Role, User, ApiProject } from "@/lib/types";
import { adminUserService, PaginatedUsersResponse, CreateUserPayload, UpdateUserPayload } from "@/lib/services/admin-users";
import { adminContractService, Contract, CreateContractPayload, UpdateContractPayload } from "@/lib/services/admin-contracts";
import { projectService } from "@/lib/services/project-service";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function UsersPage() {
    const currentUser = useAuthStore((s) => s.user);

    // API State
    const [users, setUsers] = useState<User[]>([]);
    const [pagination, setPagination] = useState<PaginatedUsersResponse['pagination']>({ page: 1, limit: 10, total: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Local State
    const [search, setSearch] = useState("");
    const [addOpen, setAddOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    // Form State (includes all physical API fields and mapped aesthetic fields)
    const [form, setForm] = useState({
        full_name: "",
        email: "",
        phone_number: "",
        password: "",
        role: "employee" as Role,
        employee_type: "fulltime" as "fulltime" | "parttime" | "freelance" | "",
        // Aesthetic/Legacy fields (can be patched later when API supports them, but currently just UI)
        position: "",
        hourlyRate: "",
        department: "",
        is_active: true
    });

    // Details / Contracts State
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedUserForDetails, setSelectedUserForDetails] = useState<User | null>(null);
    const [projects, setProjects] = useState<ApiProject[]>([]);
    const [userContracts, setUserContracts] = useState<Contract[]>([]);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [isSavingContract, setIsSavingContract] = useState(false);
    const [editingContractId, setEditingContractId] = useState<number | null>(null);

    const [confirmUserOpen, setConfirmUserOpen] = useState(false);
    const [confirmUserType, setConfirmUserType] = useState<"empty_contract" | "valid_contract" | null>(null);
    const [isContractEditorOpen, setIsContractEditorOpen] = useState(false);

    const [contractForm, setContractForm] = useState<CreateContractPayload & { is_active: boolean, rate_display?: string }>({
        user_id: 0,
        contract_type: "" as any,
        payment_scheme: "" as any,
        rate_amount: 0,
        rate_display: "",
        start_date: "",
        end_date: "",
        is_active: true
    });

    const fetchUsers = async (pageToFetch: number = pagination.page) => {
        setIsLoading(true);
        try {
            const [usersRes, projectsRes] = await Promise.all([
                adminUserService.getUsers(pageToFetch, pagination.limit),
                projectService.getProjects(1, 1000) // load background projects dict
            ]);

            // Ensure the users are mapped correctly for robust UI rendering
            const mappedUsers = usersRes.data.map(u => ({
                ...u,
                id: String(u.id), // Ensure string ID for UI keys
                name: u.full_name || u.name,
                username: u.email.split("@")[0],
                avatar: u.avatar || "",
                department: u.department || "General",
                position: u.position || (u.role === "admin" ? "Administrator" : "Staff"),
                hourlyRate: u.hourlyRate || 0,
                phone_number: u.phone_number || "-",
                joinDate: u.created_at ? u.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
                status: (u.is_active === false) ? "inactive" : "active"
            })) as User[];

            setUsers(mappedUsers);
            setPagination(usersRes.pagination);
            setProjects(projectsRes.data || []);
        } catch (error: any) {
            toast.error(error.message || "Failed to fetch users");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const [statusFilter, setStatusFilter] = useState("all");
    const [roleFilter, setRoleFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");

    const filtered = users.filter((u) => {
        const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "all" || u.status === statusFilter;
        const matchRole = roleFilter === "all" || u.role === roleFilter;
        const matchType = typeFilter === "all" || (u.employee_type || "system") === typeFilter;
        return matchSearch && matchStatus && matchRole && matchType;
    });

    const fmtDate = (d?: string) => {
        if (!d) return "-";
        const date = new Date(d);
        if (isNaN(date.getTime())) return "-";
        return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    };

    const resetForm = () => {
        setForm({
            full_name: "", email: "", phone_number: "", password: "", role: "employee", employee_type: "fulltime",
            position: "", hourlyRate: "", department: "", is_active: true
        });
    };

    const openEdit = (userId: string) => {
        const u = users.find((u) => u.id === userId);
        if (u) {
            setForm({
                full_name: u.full_name || u.name,
                email: u.email,
                phone_number: u.phone_number || "",
                password: "", // Never display password
                role: u.role,
                employee_type: u.employee_type || "fulltime",
                department: u.department || "",
                position: u.position || "",
                hourlyRate: String(u.hourlyRate || ""),
                is_active: u.status === "active" || u.is_active !== false
            });
            setEditId(userId);
            setAddOpen(true);
        }
    };

    const confirmDelete = (u: User) => {
        setUserToDelete(u);
        setDeleteOpen(true);
    };

    const handlePreSave = () => {
        // Validation
        if (!form.full_name || form.full_name.trim().length < 2) {
            toast.error("Full Name must be at least 2 characters");
            return;
        }
        if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            toast.error("Please enter a valid email address without spaces");
            return;
        }
        if (!form.phone_number || !/^\+?[0-9]{8,15}$/.test(form.phone_number.replace(/\s/g, ''))) {
            toast.error("Phone number must contain 8-15 digits");
            return;
        }
        if (!editId && (!form.password || form.password.length < 6)) {
            toast.error("Password must be at least 6 characters for new users");
            return;
        }
        if (form.role !== "admin" && !form.employee_type) {
            toast.error("Employee Type is required for non-admin roles");
            return;
        }

        if (!editId) {
            const hasContractDetails = contractForm.rate_amount > 0 && contractForm.contract_type && contractForm.payment_scheme;
            if (!hasContractDetails) {
                setConfirmUserType("empty_contract");
                setConfirmUserOpen(true);
            } else {
                setConfirmUserType("valid_contract");
                setConfirmUserOpen(true);
            }
        } else {
            executeSave();
        }
    };

    const executeSave = async () => {
        setIsSaving(true);

        try {
            if (editId) {
                const payload: UpdateUserPayload = {
                    full_name: form.full_name,
                    phone_number: form.phone_number,
                    role: form.role,
                    is_active: form.is_active
                };

                // Only send optional fields if they're provided/changed
                if (form.email) payload.email = form.email;
                if (form.password) payload.password = form.password;
                if (form.role !== "admin") payload.employee_type = form.employee_type as any;
                else payload.employee_type = null;

                await adminUserService.updateUser(editId, payload);
                toast.success(`Updated ${form.full_name} successfully`);
            } else {
                const payload: CreateUserPayload = {
                    full_name: form.full_name,
                    email: form.email,
                    phone_number: form.phone_number,
                    password: form.password,
                    role: form.role,
                    employee_type: form.role === "admin" ? null : (form.employee_type as any) || "fulltime"
                };

                const newUser = await adminUserService.createUser(payload);
                toast.success(`Added ${form.full_name} successfully`);

                if (contractForm.rate_amount > 0 && contractForm.contract_type) {
                    const contractPayload: CreateContractPayload = {
                        user_id: Number(newUser.id),
                        contract_type: contractForm.contract_type,
                        payment_scheme: contractForm.payment_scheme,
                        rate_amount: contractForm.rate_amount,
                        start_date: contractForm.start_date || new Date().toISOString().split("T")[0],
                        end_date: contractForm.end_date || undefined,
                        is_active: true
                    };
                    await adminContractService.createContract(contractPayload);
                    toast.success("Initial contract established");
                }
            }

            setAddOpen(false);
            setEditId(null);
            resetForm();

            // Refresh list
            fetchUsers();
        } catch (error: any) {
            toast.error(error.message || "Failed to save user");
        } finally {
            setIsSaving(false);
        }
    };

    const executeDelete = async () => {
        if (!userToDelete) return;

        setIsSaving(true);
        try {
            await adminUserService.deleteUser(userToDelete.id);
            toast.success(`Permanently disabled/removed ${userToDelete.full_name || userToDelete.name}`);
            setDeleteOpen(false);
            setUserToDelete(null);

            // Adjust page if we deleted the last item on current page
            if (users.length === 1 && pagination.page > 1) {
                fetchUsers(pagination.page - 1);
            } else {
                fetchUsers();
            }
        } catch (error: any) {
            if (error.message?.includes("own account")) {
                toast.error("Security Protected", {
                    description: "You cannot delete your own active admin account.",
                    icon: <ShieldX className="text-red-500 h-5 w-5" />
                });
            } else {
                toast.error(error.message || "Failed to delete user");
            }
        } finally {
            setIsSaving(false);
            setDeleteOpen(false);
        }
    };

    // --- User Detail & Contracts Handlers ---
    const fetchContracts = async (userId: string | number) => {
        setIsLoadingDetails(true);
        try {
            const contracts = await adminContractService.getUserContracts(userId);
            setUserContracts(contracts);
        } catch (error: any) {
            toast.error(error.message || "Failed to fetch user contracts");
        } finally {
            setIsLoadingDetails(false);
        }
    };

    const openDetails = (u: User) => {
        setSelectedUserForDetails(u);
        setDetailsOpen(true);
        setIsContractEditorOpen(false);
        fetchContracts(u.id);
        resetContractForm();
    };

    const resetContractForm = () => {
        setEditingContractId(null);
        setContractForm({
            user_id: 0,
            contract_type: "" as any,
            payment_scheme: "" as any,
            rate_amount: 0,
            rate_display: "",
            start_date: "",
            end_date: "",
            is_active: true
        });
    };

    const handleSaveContract = async () => {
        if (!selectedUserForDetails) return;

        if (!contractForm.contract_type || !contractForm.payment_scheme || !contractForm.rate_amount || contractForm.rate_amount <= 0 || !contractForm.start_date) {
            toast.error("Please fill all required contract fields correctly (Rate must be > 0)");
            return;
        }

        setIsSavingContract(true);
        try {
            const payload: CreateContractPayload | UpdateContractPayload = {
                contract_type: contractForm.contract_type,
                payment_scheme: contractForm.payment_scheme,
                rate_amount: Number(contractForm.rate_amount),
                start_date: contractForm.start_date,
                end_date: contractForm.end_date || null,
                is_active: contractForm.is_active
            };

            if (editingContractId) {
                await adminContractService.updateContract(editingContractId, payload as UpdateContractPayload);
                toast.success("Contract updated successfully");
            } else {
                (payload as CreateContractPayload).user_id = selectedUserForDetails.id;
                await adminContractService.createContract(payload as CreateContractPayload);
                toast.success("New contract created successfully");
            }
            fetchContracts(selectedUserForDetails.id);
            resetContractForm();
            setIsContractEditorOpen(false);
        } catch (error: any) {
            toast.error(error.message || "Failed to save contract");
        } finally {
            setIsSavingContract(false);
        }
    };

    const handleDeleteContract = async (id: number) => {
        setIsSavingContract(true);
        try {
            await adminContractService.deleteContract(id);
            toast.success("Contract deleted");
            if (selectedUserForDetails) fetchContracts(selectedUserForDetails.id);
        } catch (error: any) {
            toast.error(error.message || "Failed to delete contract");
        } finally {
            setIsSavingContract(false);
        }
    };

    const editContract = (c: Contract) => {
        setEditingContractId(c.id);
        setIsContractEditorOpen(true);
        setContractForm({
            user_id: c.user_id,
            contract_type: c.contract_type,
            payment_scheme: c.payment_scheme || "transfer",
            rate_amount: c.rate_amount,
            start_date: c.start_date.split("T")[0],
            end_date: c.end_date ? c.end_date.split("T")[0] : "",
            is_active: c.is_active
        });
    };
    // -------------------------

    // Pagination Calculation
    const totalPages = Math.ceil(pagination.total / pagination.limit);

    return (
        <div className="space-y-6">
            <PageHeader title="User Administration" description={`Managing ${pagination.total} total network users`}>
                <Button size="sm" className="gap-2 bg-gradient-to-r from-[#2568C1] to-[#1a4f99] shadow-md shadow-[#2568C1]/20" onClick={() => { resetForm(); setEditId(null); setAddOpen(true); }}>
                    <Plus className="h-4 w-4" /> Add User
                </Button>
            </PageHeader>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-[250px] shrink-0">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search Users..." className="pl-9 h-10 w-full bg-white border-slate-200 focus-visible:ring-[#2568C1]" value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="h-10 w-[130px] bg-white shrink-0"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select>
                    <Select value={roleFilter} onValueChange={setRoleFilter}><SelectTrigger className="h-10 w-[140px] bg-white shrink-0"><SelectValue placeholder="Role" /></SelectTrigger><SelectContent><SelectItem value="all">All Roles</SelectItem><SelectItem value="employee">Employee</SelectItem><SelectItem value="projectmanager">Project Manager</SelectItem><SelectItem value="admin">Admin</SelectItem><SelectItem value="finance">Finance</SelectItem></SelectContent></Select>
                    <Select value={typeFilter} onValueChange={setTypeFilter}><SelectTrigger className="h-10 w-[140px] bg-white shrink-0"><SelectValue placeholder="Type" /></SelectTrigger><SelectContent><SelectItem value="all">All Types</SelectItem><SelectItem value="fulltime">Full-time</SelectItem><SelectItem value="parttime">Part-time</SelectItem><SelectItem value="freelance">Freelance</SelectItem></SelectContent></Select>
                </div>
            </div>

            <Card className="border-[#e2e8f0] shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="pl-6 w-12 text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">No</TableHead>
                                    <TableHead className="w-[280px] text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">User</TableHead>
                                    <TableHead className=" text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Role & Access</TableHead>
                                    <TableHead className=" text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Type</TableHead>
                                    <TableHead className=" text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Status</TableHead>
                                    <TableHead className="w-[140px] pr-10 text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-64  text-center">
                                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                <Loader2 className="h-8 w-8 animate-spin text-[#2568C1] mb-4" />
                                                <p>Syncing users from active directory...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filtered.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-muted-foreground text-center">
                                            No users found matching your search.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filtered.map((user, index) => (
                                        <TableRow key={user.id} className="hover:bg-[#f0f4fa]/50 transition-colors">
                                            <TableCell className="pl-6 text-sm text-muted-foreground font-medium">
                                                {(pagination.page - 1) * pagination.limit + index + 1}
                                            </TableCell>
                                            <TableCell className="">
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
                                            <TableCell className="">
                                                <Badge
                                                    variant="outline"
                                                    className={`capitalize text-[11px] font-medium ${user.role === "admin"
                                                        ? "bg-amber-50 text-amber-700 border-amber-200"
                                                        : user.role === "projectmanager"
                                                            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                                            : user.role === "finance"
                                                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                                                : "bg-blue-50 text-[#2568C1] border-blue-200"
                                                        }`}
                                                >
                                                    {user.role === "projectmanager"
                                                        ? "Project Manager"
                                                        : user.role === "finance"
                                                            ? "Management"
                                                            : user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="">
                                                <span className="text-xs text-muted-foreground capitalize">
                                                    {user.employee_type ? user.employee_type.replace("time", "-time") : "System"}
                                                </span>
                                            </TableCell>
                                            <TableCell className="">
                                                <Badge className={`text-[10px] capitalize font-bold tracking-wider ${user.status === "active"
                                                    ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-transparent"
                                                    : "bg-slate-100 text-slate-500 hover:bg-slate-200 border-transparent"
                                                    }`}>
                                                    {user.status === "active" ? "Active" : "Inactive"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="">
                                                <div className="flex justify-start gap-1">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-[#64748b] hover:text-[#2568C1] hover:bg-[#2568C1]/10 rounded-full" onClick={() => openDetails(user)} title="View Detail">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-[#64748b] hover:text-[#2568C1] hover:bg-[#2568C1]/10 rounded-full" onClick={() => openEdit(user.id)} title="Edit User">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-[#64748b] hover:text-red-600 hover:bg-red-50 rounded-full" onClick={() => confirmDelete(user)} disabled={currentUser?.id === user.id} title="Delete">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>

                {/* Pagination Controls */}
                {!isLoading && totalPages > 0 && (
                    <div className="border-t border-[#e2e8f0] bg-white px-4 py-3 flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                            Showing <span className="font-medium text-[#0f172a]">{(pagination.page - 1) * pagination.limit + 1}</span> to <span className="font-medium text-[#0f172a]">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-medium text-[#0f172a]">{pagination.total}</span> users
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                disabled={pagination.page <= 1}
                                onClick={() => fetchUsers(pagination.page - 1)}
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
                                onClick={() => fetchUsers(pagination.page + 1)}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Premium Add/Edit Dialog */}
            <Dialog open={addOpen} onOpenChange={(open) => !isSaving && setAddOpen(open)}>
                <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-[#e2e8f0]">
                    <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4 flex flex-col gap-1">
                        <DialogTitle className="text-xl text-[#0f172a]">{editId ? "Edit User Profile" : "Register New User"}</DialogTitle>
                        <DialogDescription className="text-sm">
                            {editId ? "Update account status, access role, and credentials." : "Create a new employee or admin account for the system."}
                        </DialogDescription>
                    </div>

                    <div className="px-6 py-6 space-y-6 max-h-[60vh] overflow-y-auto">
                        {/* Account Basics Section */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <UserCog className="h-3.5 w-3.5" /> Account Details
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5 flex-1 col-span-2 sm:col-span-1">
                                    <label className="text-sm font-medium text-[#0f172a]">Full Legal Name <span className="text-red-500">*</span></label>
                                    <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="e.g. Jane Doe" className="bg-white" disabled={isSaving} />
                                </div>
                                <div className="space-y-1.5 flex-1 col-span-2 sm:col-span-1">
                                    <label className="text-sm font-medium text-[#0f172a]">Email Address <span className="text-red-500">*</span></label>
                                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@company.com" className="bg-white" disabled={isSaving} />
                                </div>
                                <div className="space-y-1.5 flex-1 col-span-2 sm:col-span-1">
                                    <label className="text-sm font-medium text-[#0f172a]">Phone Number <span className="text-red-500">*</span></label>
                                    <Input type="tel" value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value.replace(/\D/g, '') })} placeholder="08123456789" className="bg-white" disabled={isSaving} />
                                </div>
                                <div className="space-y-1.5 flex-1 col-span-2 sm:col-span-1">
                                    <label className="text-sm font-medium text-[#0f172a]">Password {editId ? "(Leave blank to keep)" : <span className="text-red-500">*</span>}</label>
                                    <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" className="bg-white" disabled={isSaving} />
                                </div>
                            </div>
                        </div>

                        {/* Role & Access Section */}
                        <div className="space-y-4 pt-2 border-t border-[#e2e8f0]">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <ShieldX className="h-3.5 w-3.5" /> Access & Employment
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-[#0f172a]">System Role</label>
                                    <Select value={form.role} onValueChange={(v: Role) => setForm({ ...form, role: v })} disabled={isSaving}>
                                        <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="employee">Employee</SelectItem>
                                            <SelectItem value="projectmanager">Project Manager</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                            <SelectItem value="finance">Management</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Employee Type - Hidden/Disabled if Admin */}
                                <div className="space-y-1.5">
                                    <label className={`text-sm font-medium ${form.role === 'admin' ? 'text-muted-foreground' : 'text-[#0f172a]'}`}>
                                        Employment Type {form.role !== 'admin' && <span className="text-red-500">*</span>}
                                    </label>
                                    <Select
                                        value={form.role === 'admin' ? "" : form.employee_type}
                                        onValueChange={(v: any) => setForm({ ...form, employee_type: v })}
                                        disabled={form.role === 'admin' || isSaving}
                                    >
                                        <SelectTrigger className={`bg-white ${form.role === 'admin' ? 'opacity-50' : ''}`}>
                                            <SelectValue placeholder={form.role === 'admin' ? "N/A for Admins" : "Select type"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="fulltime">Full-Time</SelectItem>
                                            <SelectItem value="parttime">Part-Time</SelectItem>
                                            <SelectItem value="freelance">Freelance Contract</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {editId && (
                            <div className="flex items-center justify-between p-4 rounded-lg border border-amber-200 bg-amber-50 mt-4">
                                <div className="space-y-0.5">
                                    <h5 className="text-sm font-medium text-amber-800">Account Status</h5>
                                    <p className="text-xs text-amber-600">Disabling an account revokes all access immediately.</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium">{form.is_active ? "Active" : "Disabled"}</span>
                                    <button
                                        type="button"
                                        role="switch"
                                        onClick={() => setForm(prev => ({ ...prev, is_active: !prev.is_active }))}
                                        disabled={isSaving}
                                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2568C1] focus-visible:ring-offset-2 focus-visible:ring-offset-white ${form.is_active ? 'bg-[#2568C1]' : 'bg-slate-300'}`}
                                    >
                                        <span className={`pointer-events-none absolute left-0 inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out ${form.is_active ? 'translate-x-4 border-[#2568C1]' : 'translate-x-0.5 border-slate-300'}`} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Initial Contract Setup (Only for New Users) */}
                        {!editId && form.role !== 'admin' && (
                            <div className="space-y-4 pt-4 border-t border-[#e2e8f0]">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <FolderKanban className="h-3.5 w-3.5" /> Set Initial Contract (Optional)
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5 flex-1 col-span-2 sm:col-span-1">
                                        <label className="text-sm font-medium text-[#0f172a]">Contract Type</label>
                                        <Select value={contractForm.contract_type} onValueChange={(v: any) => setContractForm({ ...contractForm, contract_type: v })} disabled={isSaving}>
                                            <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="yearly">Yearly</SelectItem>
                                                <SelectItem value="monthly">Monthly</SelectItem>
                                                <SelectItem value="mandays">Mandays</SelectItem>
                                                <SelectItem value="timesheet">Timesheet</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5 flex-1 col-span-2 sm:col-span-1">
                                        <label className="text-sm font-medium text-[#0f172a]">Payment Scheme</label>
                                        <Select value={contractForm.payment_scheme} onValueChange={(v: any) => setContractForm({ ...contractForm, payment_scheme: v })} disabled={isSaving}>
                                            <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="monthly">Monthly</SelectItem>
                                                <SelectItem value="termin">Termin</SelectItem>
                                                <SelectItem value="back_to_back">Back-to-back</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5 flex-1 col-span-2 sm:col-span-1">
                                        <label className="text-sm font-medium text-[#0f172a]">Rate Amount (Rp)</label>
                                        <Input
                                            type="text"
                                            placeholder="5.000.000"
                                            className="bg-white"
                                            value={contractForm.rate_display || ""}
                                            onChange={(e) => {
                                                const raw = e.target.value.replace(/\D/g, "");
                                                setContractForm({
                                                    ...contractForm,
                                                    rate_amount: Number(raw),
                                                    rate_display: raw ? new Intl.NumberFormat('id-ID').format(Number(raw)) : ""
                                                });
                                            }}
                                            disabled={isSaving}
                                        />
                                    </div>
                                    <div className="space-y-1.5 flex-1 col-span-2 sm:col-span-1">
                                        <label className="text-sm font-medium text-[#0f172a]">Start Date</label>
                                        <Input type="date" className="bg-white" value={contractForm.start_date} onChange={(e) => setContractForm({ ...contractForm, start_date: e.target.value })} disabled={isSaving} />
                                    </div>
                                    <div className="space-y-1.5 flex-1 col-span-2 sm:col-span-1">
                                        <label className="text-sm font-medium text-[#0f172a]">End Date (Optional)</label>
                                        <Input type="date" className="bg-white" value={contractForm.end_date || ""} onChange={(e) => setContractForm({ ...contractForm, end_date: e.target.value })} disabled={isSaving} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => { setAddOpen(false); setEditId(null); resetForm(); }} disabled={isSaving} className="text-[#64748b]">Cancel</Button>
                        <Button onClick={handlePreSave} disabled={isSaving} className="bg-[#2568C1] hover:bg-[#1e56a6] shadow-md shadow-[#2568C1]/20 min-w-[120px]">
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : (editId ? "Save Changes" : "Create User")}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Create User Confirmation Dialog */}
            <Dialog open={confirmUserOpen} onOpenChange={(open) => !isSaving && setConfirmUserOpen(open)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${confirmUserType === 'empty_contract' ? 'bg-amber-100' : 'bg-blue-100'}`}>
                            {confirmUserType === 'empty_contract' ? <AlertTriangle className="h-6 w-6 text-amber-600" /> : <FolderKanban className="h-6 w-6 text-[#2568C1]" />}
                        </div>
                        <DialogTitle className="text-center text-lg">
                            {confirmUserType === 'empty_contract' ? "No Initial Contract Set" : "Confirm User Creation"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="text-center text-sm text-[#475569] py-2">
                        {confirmUserType === 'empty_contract'
                            ? "You are about to create a user without an initial contract. They will use default system rates until a contract is assigned. Do you want to proceed?"
                            : "All initial contract details have been filled. Are you sure you want to create this user and establish their contract?"}
                    </div>
                    <DialogFooter className="sm:justify-center gap-2 pt-4">
                        <Button variant="outline" onClick={() => setConfirmUserOpen(false)} disabled={isSaving} className="w-full sm:w-auto">Cancel</Button>
                        <Button onClick={() => { setConfirmUserOpen(false); executeSave(); }} disabled={isSaving} className="w-full sm:w-auto min-w-[120px] bg-[#2568C1] hover:bg-[#1e56a6]">
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : (confirmUserType === 'empty_contract' ? "Yes, Create User" : "Confirm & Create")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteOpen} onOpenChange={(open) => !isSaving && setDeleteOpen(open)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <DialogTitle className="text-center text-lg">Remove User Account?</DialogTitle>
                    </DialogHeader>
                    <div className="text-center text-sm text-[#475569] py-2">
                        Are you sure you want to permanently delete <b className="text-[#0f172a]">{userToDelete?.name}</b>?
                        This action cannot be undone and will remove all their system access.
                    </div>
                    <DialogFooter className="sm:justify-center gap-2 pt-4">
                        <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={isSaving} className="w-full sm:w-auto">Cancel</Button>
                        <Button variant="destructive" onClick={executeDelete} disabled={isSaving} className="w-full sm:w-auto min-w-[120px]">
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes, Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* User Details & Contracts Dialog */}
            <Dialog open={detailsOpen} onOpenChange={(open) => !isSavingContract && setDetailsOpen(open)}>
                <DialogContent className="sm:max-w-[1100px] w-[95vw] p-0 overflow-hidden border-[#e2e8f0] bg-white">
                    <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4 flex items-center gap-4">
                        <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                            <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-[#2568C1] to-[#1a4f99] text-white">
                                {selectedUserForDetails?.name?.split(" ").slice(0, 2).map(n => n[0]).join("")}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <DialogTitle className="text-xl text-[#0f172a]">{selectedUserForDetails?.name}</DialogTitle>
                            <DialogDescription className="text-sm flex gap-2 items-center mt-1">
                                <span className="capitalize text-muted-foreground font-medium">{selectedUserForDetails?.role === "projectmanager" ? "Project Manager" : selectedUserForDetails?.role === "finance" ? "Management" : selectedUserForDetails?.role}</span>
                                •
                                <Badge variant="outline" className="text-[10px] font-bold tracking-wider py-0 rounded bg-emerald-50 text-emerald-600 border-none px-2 capitalize">{selectedUserForDetails?.status === "active" ? "Active" : "Inactive"}</Badge>
                            </DialogDescription>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-0 h-[70vh] md:h-auto md:max-h-[75vh] overflow-y-auto">

                        {/* 1. Profile Sidebar */}
                        <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/50 p-6 space-y-6">
                            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Profile Information</h4>
                            <div className="space-y-4">
                                <div className="flex gap-3 items-start">
                                    <Mail className="h-4 w-4 text-slate-400 mt-0.5" />
                                    <div>
                                        <div className="text-[11px] text-slate-500 font-medium">Email Address</div>
                                        <div className="text-sm text-slate-800 break-all">{selectedUserForDetails?.email}</div>
                                    </div>
                                </div>
                                <div className="flex gap-3 items-start">
                                    <Phone className="h-4 w-4 text-slate-400 mt-0.5" />
                                    <div>
                                        <div className="text-[11px] text-slate-500 font-medium">Phone Number</div>
                                        <div className="text-sm text-slate-800">{selectedUserForDetails?.phone_number || "-"}</div>
                                    </div>
                                </div>
                                <div className="flex gap-3 items-start">
                                    <Briefcase className="h-4 w-4 text-slate-400 mt-0.5" />
                                    <div>
                                        <div className="text-[11px] text-slate-500 font-medium">Employee Base Type</div>
                                        <div className="text-sm text-slate-800 capitalize">{selectedUserForDetails?.employee_type || "System Default"}</div>
                                    </div>
                                </div>
                                <div className="flex gap-3 items-start">
                                    <Calendar className="h-4 w-4 text-slate-400 mt-0.5" />
                                    <div>
                                        <div className="text-[11px] text-slate-500 font-medium">Account Created</div>
                                        <div className="text-sm text-slate-800">{fmtDate(selectedUserForDetails?.joinDate)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Contracts Array (Wider Body) */}
                        <div className="md:col-span-8 bg-white flex flex-col h-full max-h-[75vh]">

                            {/* Scrollable Content Container */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                                {isLoadingDetails ? (
                                    <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
                                        <Loader2 className="h-8 w-8 animate-spin text-[#2568C1] mb-4" />
                                        <p className="text-sm">Loading Assignment Data...</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* SECTION A: General / Base Contracts */}
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center pb-2 border-b border-[#e2e8f0]">
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-[#0f172a] flex items-center gap-2">
                                                    <Briefcase className="h-4 w-4 text-[#2568C1]" /> General Contracts (Default Rates)
                                                </h4>
                                                <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-[#2568C1] text-[#2568C1] hover:bg-blue-50" onClick={() => { resetContractForm(); setEditingContractId(null); setIsContractEditorOpen(true); }}>
                                                    <Plus className="h-3.5 w-3.5" /> Add Base Rate
                                                </Button>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {userContracts.filter(c => !c.project_id).length === 0 ? (
                                                    <p className="text-sm text-muted-foreground py-4 w-full col-span-2 border border-dashed border-slate-200 rounded-lg text-center bg-slate-50">
                                                        No general base contracts found. Employee uses default or project-specific rates.
                                                    </p>
                                                ) : (
                                                    userContracts.filter(c => !c.project_id).map((c) => (
                                                        <Card key={c.id} className={`p-4 space-y-3 cursor-pointer transition-all border-l-4 ${c.is_active ? 'border-l-[#2568C1] border-y-[#e2e8f0] border-r-[#e2e8f0] shadow-sm hover:shadow-md' : 'border-l-slate-300 border-y-[#e2e8f0] border-r-[#e2e8f0] opacity-80'}`} onClick={() => editContract(c)}>
                                                            <div className="flex justify-between items-start">
                                                                <div className="flex flex-col gap-1">
                                                                    <Badge variant="outline" className={`capitalize text-[10px] w-fit font-semibold py-0.5 px-2 ${c.is_active ? 'bg-blue-50 text-[#2568C1] border-blue-200' : 'bg-slate-100 text-slate-500'}`}>
                                                                        {c.contract_type} Rate
                                                                    </Badge>
                                                                    <span className="text-[10px] text-muted-foreground font-medium uppercase mt-0.5 tracking-wider">
                                                                        Payment: {c.payment_scheme}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                                                                    {c.is_active ? <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> : <span className="h-2 w-2 rounded-full bg-slate-300" />}
                                                                    <span className="text-[10px] font-bold text-slate-600 uppercase">{c.is_active ? 'Active' : 'Ended'}</span>
                                                                </div>
                                                            </div>
                                                            <div className="text-base font-extrabold text-[#0f172a] flex items-center justify-between mt-2">
                                                                <span className="bg-slate-50 py-1 px-2 rounded border border-slate-100 font-mono text-sm tracking-tight text-[#1e293b]">Rp {(c.rate_amount || 0).toLocaleString('id-ID')}</span>
                                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); handleDeleteContract(c.id); }} disabled={isSavingContract}>
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                            <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5 pt-2 border-t border-slate-100 mt-2">
                                                                <Calendar className="h-3 w-3" />
                                                                <span>{fmtDate(c.start_date)} &rarr; {c.end_date ? fmtDate(c.end_date) : 'Present'}</span>
                                                            </div>
                                                        </Card>
                                                    ))
                                                )}
                                            </div>
                                        </div>

                                        {/* SECTION B: Project Assignments Map */}
                                        <div className="space-y-4 pt-6 mt-4">
                                            <div className="flex justify-between items-center pb-2 border-b border-[#e2e8f0]">
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-[#0f172a] flex items-center gap-2">
                                                    <FolderKanban className="h-4 w-4 text-emerald-600" /> Project History & Assignments
                                                </h4>
                                            </div>

                                            <div className="grid grid-cols-1 gap-3">
                                                {/* Find all distinct projects this user is either assigned to via PM/Members or via a custom Contract */}
                                                {(() => {
                                                    // Map project IDs from contracts
                                                    const projectIdsWithContracts = [...new Set(userContracts.filter(c => c.project_id).map(c => c.project_id))];

                                                    // For mock purpose right now, we intersect with the projects context where user ID exists in PM or Members (requires expanding the projects array if members fetched, here we just use what we have in contracts as a baseline + any explicit membership logic if implemented later)
                                                    // In this iteration we map strictly what Contracts define as projects to prevent UI breakage, but theoretically we can map `projects.filter` here.
                                                    const boundProjects = projects.filter(p => projectIdsWithContracts.includes(p.id)) || [];

                                                    if (boundProjects.length === 0 && projectIdsWithContracts.length === 0) {
                                                        return (
                                                            <div className="text-center py-6 border border-slate-200 border-dashed rounded-xl bg-slate-50">
                                                                <FolderKanban className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                                                                <p className="text-sm font-medium text-slate-600">No project assignments linked to explicit rates.</p>
                                                                <p className="text-xs text-slate-400">User relies heavily on General rate rules.</p>
                                                            </div>
                                                        );
                                                    }

                                                    return projectIdsWithContracts.map(pid => {
                                                        const pData = projects.find(p => p.id === pid);
                                                        const pContracts = userContracts.filter(c => c.project_id === pid);

                                                        return (
                                                            <div key={pid} className="border border-slate-200 rounded-lg overflow-hidden flex flex-col">
                                                                {/* Project Header Row */}
                                                                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                                                                    <div>
                                                                        <div className="font-semibold text-sm text-slate-800">{pData?.name || `Project #${pid}`}</div>
                                                                        <div className="text-[10px] text-slate-500">{pData?.client_name || "Unknown Client"}</div>
                                                                    </div>
                                                                    <Badge variant="outline" className={`text-[10px] uppercase font-bold px-2 py-0 border-none ${pData?.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>{pData?.status || "historical"}</Badge>
                                                                </div>

                                                                {/* Sub-Contracts for this project */}
                                                                <div className="p-4 bg-white space-y-3">
                                                                    {pContracts.map(c => (
                                                                        <div key={c.id} className={`flex items-center justify-between p-3 rounded-md border ${c.is_active ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100 bg-slate-50/50'} cursor-pointer hover:border-[#2568C1]/50`} onClick={() => editContract(c)}>
                                                                            <div className="flex flex-col gap-1">
                                                                                <div className="flex items-center gap-2">
                                                                                    <Badge className={`px-1.5 py-0 rounded text-[9px] uppercase tracking-wider font-bold ${c.is_active ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-slate-200 text-slate-600 border-slate-300'}`} variant="outline">
                                                                                        Custom Rate
                                                                                    </Badge>
                                                                                    <span className="text-xs font-bold text-slate-700 capitalize">{c.contract_type}</span>
                                                                                    <span className="text-[10px] text-slate-400 uppercase">• {c.payment_scheme}</span>
                                                                                </div>
                                                                                <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5 mt-1">
                                                                                    <Calendar className="h-3 w-3" />
                                                                                    <span>{fmtDate(c.start_date)} &rarr; {c.end_date ? fmtDate(c.end_date) : 'Present'}</span>
                                                                                </div>
                                                                            </div>

                                                                            <div className="flex flex-col items-end gap-1">
                                                                                <span className="font-mono text-sm font-bold text-[#0f172a]">Rp {(c.rate_amount || 0).toLocaleString('id-ID')}</span>
                                                                                <div className="flex items-center gap-1">
                                                                                    {c.is_active ? <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> : <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />}
                                                                                    <span className="text-[9px] font-bold text-slate-500 uppercase">{c.is_active ? 'Active Rate' : 'Historical'}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        );
                                                    });
                                                })()}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Sticky Contract Editor Footer / Slide-up Overlay */}
                            <div className={`transition-all duration-300 overflow-hidden border-t border-slate-200 bg-slate-50 ${isContractEditorOpen ? 'max-h-[500px] p-5 shadow-[0_-4px_15px_-5px_rgba(0,0,0,0.05)]' : 'max-h-0 p-0'}`}>
                                <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                        <Edit className="h-4 w-4 text-[#2568C1]" /> {editingContractId ? "Edit Contract" : "New Contract Setup"}
                                    </h4>
                                    {isContractEditorOpen && (
                                        <button className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-200" onClick={() => { resetContractForm(); setEditingContractId(null); setIsContractEditorOpen(false); }}>Close Editor</button>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Contract Type</label>
                                        <Select value={contractForm.contract_type} onValueChange={(v: any) => setContractForm({ ...contractForm, contract_type: v })} disabled={isSavingContract}>
                                            <SelectTrigger className="h-9 text-xs bg-white border-slate-300"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="yearly" className="text-xs">Yearly Salary</SelectItem>
                                                <SelectItem value="monthly" className="text-xs">Monthly Salary</SelectItem>
                                                <SelectItem value="mandays" className="text-xs">Mandays Rate</SelectItem>
                                                <SelectItem value="timesheet" className="text-xs">Timesheet Rate</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Payment Scheme</label>
                                        <Select value={contractForm.payment_scheme} onValueChange={(v: any) => setContractForm({ ...contractForm, payment_scheme: v })} disabled={isSavingContract}>
                                            <SelectTrigger className="h-9 text-xs bg-white border-slate-300"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="monthly" className="text-xs">Monthly Cycle</SelectItem>
                                                <SelectItem value="termin" className="text-xs">Termin/Milestone</SelectItem>
                                                <SelectItem value="back_to_back" className="text-xs">Back-to-Back</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Rate Amount (Rp)</label>
                                        <Input
                                            type="text"
                                            placeholder="e.g. 5.000.000"
                                            className="h-9 text-sm font-semibold bg-white border-slate-300"
                                            value={contractForm.rate_display || ""}
                                            onChange={(e) => {
                                                const raw = e.target.value.replace(/\D/g, "");
                                                setContractForm({
                                                    ...contractForm,
                                                    rate_amount: Number(raw),
                                                    rate_display: raw ? new Intl.NumberFormat('id-ID').format(Number(raw)) : ""
                                                });
                                            }}
                                            disabled={isSavingContract}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 flex items-center justify-between">
                                            <span>Project ID (Opt)</span>
                                        </label>
                                        <Input type="number" placeholder="Leave blank for Base" className="h-9 text-xs bg-white border-slate-300" value={contractForm.project_id || ""} onChange={(e) => setContractForm({ ...contractForm, project_id: Number(e.target.value) || undefined })} disabled={isSavingContract} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end mt-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Start Date</label>
                                        <Input type="date" className="h-9 text-xs bg-white border-slate-300" value={contractForm.start_date} onChange={(e) => setContractForm({ ...contractForm, start_date: e.target.value })} disabled={isSavingContract} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">End Date</label>
                                        <Input type="date" className="h-9 text-xs bg-white border-slate-300" value={contractForm.end_date || ""} onChange={(e) => setContractForm({ ...contractForm, end_date: e.target.value })} disabled={isSavingContract} />
                                    </div>

                                    <div className="flex items-center gap-2 h-9">
                                        <input type="checkbox" className="rounded border-slate-300 text-[#2568C1] focus:ring-[#2568C1] h-4 w-4 cursor-pointer" id="active-contract-chk" checked={contractForm.is_active} onChange={(e) => setContractForm({ ...contractForm, is_active: e.target.checked })} disabled={isSavingContract} />
                                        <label htmlFor="active-contract-chk" className="text-xs font-bold tracking-wide text-[#0f172a] cursor-pointer">Set as Active Contract</label>
                                    </div>

                                    <div>
                                        <Button className={`w-full h-9 text-xs font-semibold shadow-sm ${!editingContractId ? 'bg-gradient-to-r from-[#2568C1] to-[#1a4f99] hover:from-[#1e56a6] hover:to-[#174382]' : 'bg-slate-800 hover:bg-slate-900'}`} onClick={handleSaveContract} disabled={isSavingContract}>
                                            {isSavingContract ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingContractId ? "Update Contract" : "Save Contract Data")}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </DialogContent>
            </Dialog>
        </div >
    );
}
