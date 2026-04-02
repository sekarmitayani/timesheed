"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowLeft, Users, ListTodo, Package, Edit, Save, Trash2, DollarSign, Crown, UserPlus, Check, X, Search, Calendar, Clock, Eye, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { projectService, UpdateProjectPayload, AssignMemberPayload } from "@/lib/services/project-service";
import { adminUserService } from "@/lib/services/admin-users";
import { adminContractService, Contract } from "@/lib/services/admin-contracts";
import { taskService, ApiTask } from "@/lib/services/task-service";
import { resourceService, ResourceRequest, EditResourcePayload, ApprovalActionPayload } from "@/lib/services/resource-service";
import { ApiProject, ProjectMember, User } from "@/lib/types";

type CostEntry = {
    id: string;
    type: "Gaji" | "Resource";
    name: string;
    amount: number;
    date: string;
    user: string;
};

function formatNumber(value: number | string): string {
    const num = typeof value === "string" ? value.replace(/\D/g, "") : String(value);
    if (!num || num === "0") return "";
    return Number(num).toLocaleString("id-ID");
}

function schemeLabel(s: string): string {
    if (s === "back_to_back") return "Back-to-back";
    if (s === "monthly") return "Monthly";
    if (s === "termin") return "Termin";
    return s;
}

const projectStatusColors: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700",
    completed: "bg-blue-50 text-blue-700",
    "on-hold": "bg-amber-50 text-amber-700",
    cancelled: "bg-red-50 text-red-700",
};
const projectStatusDotColors: Record<string, string> = {
    active: "bg-emerald-500",
    completed: "bg-blue-500",
    "on-hold": "bg-amber-500",
    cancelled: "bg-red-500",
};
const taskStatusColors: Record<string, string> = {
    todo: "bg-slate-100 text-slate-600",
    in_progress: "bg-blue-50 text-blue-700",
    done: "bg-emerald-50 text-emerald-700",
};
const taskStatusDotColors: Record<string, string> = {
    todo: "bg-slate-400",
    in_progress: "bg-blue-500",
    done: "bg-emerald-500",
};
const resStatusColors: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700",
    approved: "bg-emerald-50 text-emerald-700",
    rejected: "bg-red-50 text-red-700",
};
const resStatusDotColors: Record<string, string> = {
    pending: "bg-amber-500",
    approved: "bg-emerald-500",
    rejected: "bg-red-500",
};

export default function AdminProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;

    const [project, setProject] = useState<ApiProject | null>(null);
    const [members, setMembers] = useState<ProjectMember[]>([]);
    const [tasks, setTasks] = useState<ApiTask[]>([]);
    const [resources, setResources] = useState<ResourceRequest[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");

    /* ── Team Filters ── */
    const [teamSearch, setTeamSearch] = useState("");

    /* ── Detail Cost ── */
    const [costs, setCosts] = useState<CostEntry[]>([]);
    const [costFilterType, setCostFilterType] = useState<"all" | "Gaji" | "Resource">("all");
    const [costFilterStart, setCostFilterStart] = useState("");
    const [costFilterEnd, setCostFilterEnd] = useState("");

    /* ── Resource Filters ── */
    const [resSearch, setResSearch] = useState("");
    const [resFilterStatus, setResFilterStatus] = useState("all");
    const [resFilterType, setResFilterType] = useState("all");

    /* ── Resource Detail & Edit ── */
    const [resDetailOpen, setResDetailOpen] = useState(false);
    const [selectedRes, setSelectedRes] = useState<ResourceRequest | null>(null);
    const [resEditMode, setResEditMode] = useState(false);
    const [resEditForm, setResEditForm] = useState<EditResourcePayload & { confirm_zero?: boolean }>({});
    const [isSavingRes, setIsSavingRes] = useState(false);
    const [isDeletingRes, setIsDeletingRes] = useState(false);

    /* ── Resource Create ── */
    const [resCreateOpen, setResCreateOpen] = useState(false);
    const [resCreateForm, setResCreateForm] = useState({ type: "manpower", details: "" });
    const [isCreatingRes, setIsCreatingRes] = useState(false);

    const handleCreateRes = async () => {
        if (!resCreateForm.details) {
            toast.error("Please fill request details");
            return;
        }
        setIsCreatingRes(true);
        try {
            await resourceService.createResourceRequest({
                project_id: Number(projectId),
                type: resCreateForm.type,
                details: resCreateForm.details
            });
            toast.success("Resource request submitted!");
            setResCreateOpen(false);
            setResCreateForm({ type: "manpower", details: "" });
            fetchAll();
        } catch (e: any) {
            toast.error(e.message || "Failed to submit request");
        } finally {
            setIsCreatingRes(false);
        }
    };

    /* ── Confirmation Modals ── */
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [zeroConfirmOpen, setZeroConfirmOpen] = useState(false);

    const openResDetail = (r: ResourceRequest) => {
        setSelectedRes(r);
        setResEditForm({
            type: r.type,
            details: r.details,
            amount: r.amount,
            status: r.status
        });
        setResEditMode(false);
        setResDetailOpen(true);
    };

    const handleSaveResEdit = async (forceZero = false) => {
        if (!selectedRes) return;
        setIsSavingRes(true);
        try {
            const payload = { ...resEditForm };
            if (forceZero) payload.confirm_zero = true;

            await resourceService.editResource(selectedRes.id, payload);
            toast.success("Resource request updated!");
            setResDetailOpen(false);
            setZeroConfirmOpen(false);
            fetchAll();
        } catch (e: any) {
            if (e.message && e.message.includes("confirm_zero")) {
                setZeroConfirmOpen(true);
            } else {
                toast.error(e.message || "Failed to update resource");
            }
        } finally {
            setIsSavingRes(false);
        }
    };

    const handleDeleteRes = async () => {
        if (!selectedRes) return;
        setIsDeletingRes(true);
        try {
            await resourceService.deleteResourceRequest(selectedRes.id);
            toast.success("Resource request deleted!");
            setDeleteConfirmOpen(false);
            setResDetailOpen(false);
            fetchAll();
        } catch (e: any) {
            toast.error(e.message || "Failed to delete resource");
        } finally {
            setIsDeletingRes(false);
        }
    };

    /* ── Edit Project ── */
    const [editOpen, setEditOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editForm, setEditForm] = useState({
        name: "", client_name: "", client_email: "", status: "",
        budget_revenue: 0, budget_cost: 0, budget_cost_threshold: 0
    });

    /* ── Assign Member ── */
    const [assignOpen, setAssignOpen] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);
    const [assignForm, setAssignForm] = useState<AssignMemberPayload>({ project_id: 0, user_id: 0, role_in_project: "", custom_rate: null, contract_type: "", payment_scheme: "" });
    const [memberUserContracts, setMemberUserContracts] = useState<Contract[]>([]);
    const [memberLoadingContracts, setMemberLoadingContracts] = useState(false);
    const [memberAssignRateMode, setMemberAssignRateMode] = useState<"contract" | "custom">("contract");
    const [memberSelectedContractId, setMemberSelectedContractId] = useState("");

    const fetchAll = useCallback(async () => {
        setIsLoading(true);
        try {
            const [proj, membs, tsks, ress, usersRes] = await Promise.all([
                projectService.getProjectById(projectId),
                projectService.getProjectMembers(projectId),
                taskService.getProjectTasks(projectId).catch(() => []),
                resourceService.getResourceRequests(Number(projectId)).catch(() => []),
                adminUserService.getUsers(1, 100).catch(() => ({ data: [] }))
            ]);
            setProject(proj);
            const validMembers = Array.isArray(membs) ? membs : [];
            setMembers(validMembers);
            setTasks(Array.isArray(tsks) ? tsks : []);
            const validResources = Array.isArray(ress) ? ress : [];
            setResources(validResources);
            setAllUsers(usersRes?.data || []);

            // === Fetch & Combine Detail Costs (Gaji + Resource) ===
            let allCosts: CostEntry[] = [];
            const contractPromises = validMembers.map(m => adminContractService.getUserContracts(m.user_id).catch(() => []));
            const contractsArrays = await Promise.all(contractPromises);
            const projectContracts = contractsArrays.flat().filter(c => c.project_id === Number(projectId));

            const paymentPromises = projectContracts.map(c => adminContractService.getPayments(c.id).then(pays => ({ contract: c, pays })).catch(() => null));
            const paymentsResults = await Promise.all(paymentPromises);

            paymentsResults.forEach(res => {
                if (!res) return;
                const member = validMembers.find(m => m.user_id === res.contract.user_id);
                res.pays.forEach(p => {
                    let d = p.paid_at || p.created_at || "";
                    if (d.includes("T")) d = d.split("T")[0];
                    allCosts.push({
                        id: `gaji-${p.id}`,
                        type: "Gaji",
                        name: p.name || res.contract.contract_type,
                        amount: p.amount,
                        date: d,
                        user: member?.user?.full_name || `User #${res.contract.user_id}`
                    });
                });
            });

            validResources.filter(r => r.status === "approved").forEach(r => {
                let d = r.updated_at || r.created_at || "";
                if (d.includes("T")) d = d.split("T")[0];
                allCosts.push({
                    id: `res-${r.id}`,
                    type: "Resource",
                    name: r.details || r.type,
                    amount: r.amount,
                    date: d,
                    user: r.user?.full_name || `User #${r.user_id}`
                });
            });

            allCosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setCosts(allCosts);
            // ======================================================

        } catch (e: any) {
            toast.error(e.message || "Failed to load project details");
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const openEditProject = () => {
        if (!project) return;
        setEditForm({
            name: project.name,
            client_name: project.client_name,
            client_email: project.client_email || "",
            status: project.status,
            budget_revenue: project.budget_revenue || 0,
            budget_cost: project.budget_cost || 0,
            budget_cost_threshold: project.budget_cost_threshold || 0
        });
        setEditOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!project) return;
        setIsSaving(true);
        try {
            const payload: UpdateProjectPayload = { ...editForm, client_email: editForm.client_email || undefined };
            const u = await projectService.updateProject(project.id, payload);
            setProject({ ...project, ...u });
            toast.success("Project updated!");
            setEditOpen(false);
        } catch (e: any) {
            toast.error(e.message || "Failed to update project");
        } finally {
            setIsSaving(false);
        }
    };

    /* ── Member Handlers ── */
    const openAssignMember = () => {
        setAssignForm({ project_id: project!.id, user_id: 0, role_in_project: "", custom_rate: null, contract_type: "", payment_scheme: "" });
        setMemberUserContracts([]);
        setMemberAssignRateMode("contract");
        setMemberSelectedContractId("");
        setAssignOpen(true);
    };

    const handleMemberUserSelect = async (uid: number) => {
        setAssignForm({ ...assignForm, user_id: uid, custom_rate: null, contract_type: "", payment_scheme: "" });
        setMemberSelectedContractId("");
        setMemberAssignRateMode("contract");
        setMemberUserContracts([]);
        if (uid) {
            setMemberLoadingContracts(true);
            try {
                const allC = await adminContractService.getUserContracts(uid);
                const c = allC.filter(x => !x.project_id);
                setMemberUserContracts(c);
                if (c.length === 0) setMemberAssignRateMode("custom");
            } catch {
                setMemberUserContracts([]);
                setMemberAssignRateMode("custom");
            } finally {
                setMemberLoadingContracts(false);
            }
        }
    };

    const handleMemberContractSelect = (v: string) => {
        if (v === "custom") {
            setMemberAssignRateMode("custom");
            setMemberSelectedContractId("custom");
            setAssignForm({ ...assignForm, custom_rate: null, contract_type: "", payment_scheme: "" });
        } else {
            setMemberAssignRateMode("contract");
            setMemberSelectedContractId(v);
            const c = memberUserContracts.find(x => String(x.id) === v);
            if (c) setAssignForm({ ...assignForm, custom_rate: c.rate_amount, contract_type: c.contract_type, payment_scheme: c.payment_scheme });
        }
    };

    const handleAssignSave = async () => {
        if (!assignForm.user_id || !assignForm.role_in_project) { toast.error("User and role required"); return; }
        setIsAssigning(true);
        try {
            const p: any = { project_id: assignForm.project_id, user_id: Number(assignForm.user_id), role_in_project: assignForm.role_in_project };
            if (memberAssignRateMode === "custom" && assignForm.custom_rate) {
                p.custom_rate = Number(assignForm.custom_rate); p.contract_type = assignForm.contract_type || "termin"; p.payment_scheme = assignForm.payment_scheme || "monthly";
            } else if (memberAssignRateMode === "contract" && memberSelectedContractId !== "custom") {
                const c = memberUserContracts.find(x => String(x.id) === memberSelectedContractId);
                if (c) { p.custom_rate = c.rate_amount; p.contract_type = c.contract_type; p.payment_scheme = c.payment_scheme; }
            }
            await projectService.assignMember(p);
            toast.success("Member assigned!");
            setAssignOpen(false);
            fetchAll();
        } catch (e: any) {
            toast.error(e.message || "Failed to assign member");
        } finally {
            setIsAssigning(false);
        }
    };

    const handleRemoveMember = async (id: number) => {
        if (!confirm("Remove this member?")) return;
        try {
            await projectService.removeMember(id);
            toast.success("Member removed!");
            fetchAll();
        } catch (e: any) {
            toast.error(e.message || "Failed to remove member");
        }
    };

    /* ── Render Utils ── */
    const getMemberName = (userId: number) => {
        const m = members.find(m => m.user_id === userId || m.user?.id === userId);
        return m?.user?.full_name || `User #${userId}`;
    };
    const initials = (name: string) => (name || "?").split(" ").slice(0, 2).map(n => n[0]).join("");
    const fmtDate = (d?: string) => {
        if (!d) return "-";
        const date = new Date(d);
        if (isNaN(date.getTime())) return "-";
        return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    };

    if (isLoading) {
        return (
            <div className="py-24 flex flex-col items-center justify-center text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
                <p className="text-sm font-medium">Loading project Details...</p>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="py-24 text-center space-y-4">
                <p className="text-muted-foreground font-medium">Project not found.</p>
                <Button variant="outline" onClick={() => router.push("/admin/projects")}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Projects
                </Button>
            </div>
        );
    }

    const margin = (project.budget_revenue || 0) - (project.budget_cost || 0);

    return (
        <div className="space-y-6 pb-10 -mx-4 sm:-mx-6 px-4 sm:px-6">
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 mt-2.5 shrink-0 hover:bg-slate-200 rounded-full transition-colors" onClick={() => router.push("/admin/projects")}>
                        <ArrowLeft className="h-5 w-5 text-slate-700" />
                    </Button>
                    <div className="min-w-0 flex flex-col pt-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-0.5">Project Detail</span>
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-2xl font-bold text-slate-900 truncate tracking-tight">{project.name}</h1>
                            <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider", projectStatusColors[project.status] || "bg-slate-100 text-slate-600")}>
                                <div className={cn("w-1.5 h-1.5 rounded-full", projectStatusDotColors[project.status] || "bg-slate-400")} />
                                <span className="uppercase">{project.status}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm" onClick={openEditProject}>
                        <Edit className="h-4 w-4" /> Edit Project
                    </Button>
                </div>
            </div>

            {/* ── Tabs Content ── */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-slate-100 p-1 mb-6 rounded-xl flex self-start overflow-x-auto">
                    <TabsTrigger value="overview" className="rounded-lg text-sm px-4 whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">Overview</TabsTrigger>
                    <TabsTrigger value="team" className="rounded-lg text-sm px-4 whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">Team Members</TabsTrigger>
                    <TabsTrigger value="costs" className="rounded-lg text-sm px-4 whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">Cost Detail</TabsTrigger>
                    <TabsTrigger value="resources" className="rounded-lg text-sm px-4 whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">Resources</TabsTrigger>
                </TabsList>

                {/* OVERVIEW TAB */}
                <TabsContent value="overview" className="space-y-6 mt-0 focus:outline-none">
                    <div className="mb-2">
                        <h2 className="text-base font-semibold text-slate-900">Project Overview</h2>
                        <p className="text-xs text-slate-500 mt-1">Summary of financial performance, key metrics, and overall status of this project.</p>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: "Revenue", value: project.budget_revenue, color: "text-slate-900", icon: "bg-blue-50 text-blue-600" },
                            { label: "Cost Threshold", value: project.budget_cost_threshold, color: "text-slate-900", icon: "bg-orange-50 text-orange-600" },
                            { label: "Planned Cost", value: project.budget_cost, color: "text-slate-900", icon: "bg-amber-50 text-amber-600" },
                            { label: "Actual Cost", value: project.actual_cost, color: (project.actual_cost || 0) > (project.budget_cost_threshold || Infinity) ? "text-red-600" : "text-slate-900", icon: "bg-purple-50 text-purple-600" },
                        ].map((item, i) => (
                            <Card key={i} className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                                <CardContent className="p-4 sm:p-5 flex items-start gap-4">
                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", item.icon)}>
                                        <DollarSign className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-slate-500 mb-1">{item.label}</p>
                                        <p className={cn("text-base sm:text-lg font-bold tracking-tight truncate", item.color)}>
                                            Rp {(item.value || 0).toLocaleString("id-ID")}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="border-slate-200 shadow-sm rounded-2xl">
                            <CardContent className="p-6">
                                <h3 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">Project Information</h3>
                                <div className="space-y-4">
                                    <div className="flex flex-wrap lg:flex-nowrap justify-between items-center text-sm border-b border-slate-100 pb-3 gap-2">
                                        <span className="text-slate-500">Client Name</span>
                                        <span className="font-semibold text-slate-900">{project.client_name || "-"}</span>
                                    </div>
                                    <div className="flex flex-wrap lg:flex-nowrap justify-between items-center text-sm border-b border-slate-100 pb-3 gap-2">
                                        <span className="text-slate-500">Client Email</span>
                                        <span className="font-semibold text-slate-900">{project.client_email || "-"}</span>
                                    </div>
                                    <div className="flex flex-wrap lg:flex-nowrap justify-between items-center text-sm border-b border-slate-100 pb-3 gap-2">
                                        <span className="text-slate-500 flex items-center gap-2"><Crown className="h-4 w-4 text-amber-500" /> Assigned PM</span>
                                        <span className="font-semibold text-slate-900">{members.find(m => m.role_in_project === "Project Manager")?.user?.full_name || "Not Assigned"}</span>
                                    </div>
                                    <div className="flex flex-wrap lg:flex-nowrap justify-between items-center text-sm border-b border-slate-100 pb-3 gap-2">
                                        <span className="text-slate-500">Created At</span>
                                        <span className="font-semibold text-slate-700">{fmtDate(project.created_at)}</span>
                                    </div>
                                    <div className="flex flex-wrap lg:flex-nowrap justify-between items-center text-sm pb-1 gap-2">
                                        <span className="text-slate-500">Last Updated</span>
                                        <span className="font-semibold text-slate-700">{fmtDate(project.updated_at)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200 shadow-sm rounded-2xl">
                            <CardContent className="p-6">
                                <h3 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">Additional Summary</h3>
                                <div className="space-y-4">
                                    <div className="flex flex-wrap lg:flex-nowrap justify-between items-center text-sm border-b border-slate-100 pb-3 gap-2">
                                        <span className="text-slate-500">Margin Estimate</span>
                                        <span className={cn("font-bold text-base", margin >= 0 ? "text-emerald-600" : "text-red-600")}>Rp {margin.toLocaleString("id-ID")}</span>
                                    </div>
                                    <div className="flex flex-wrap lg:flex-nowrap justify-between items-center text-sm border-b border-slate-100 pb-3 gap-2">
                                        <span className="text-slate-500">Detail Cost Composition</span>
                                        <span className="font-medium text-slate-500 italic text-xs">Payments + Resources</span>
                                    </div>
                                    <div className="flex flex-wrap lg:flex-nowrap justify-between items-center text-sm pb-1 gap-2">
                                        <span className="text-slate-500">Team Size</span>
                                        <span className="font-semibold text-slate-900">{members.length} members</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* TEAM TAB */}
                <TabsContent value="team" className="space-y-4 mt-0 focus:outline-none">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-semibold text-slate-900">Project Members</h2>
                                <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-600">{members.length}</Badge>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">List of assigned team members along with their roles and payment contract structures.</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                            <div className="relative w-full sm:w-[220px]">
                                <Search className="absolute left-3 top-2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search members..."
                                    className="pl-9 h-9 text-sm bg-white border-slate-200"
                                    value={teamSearch}
                                    onChange={(e) => setTeamSearch(e.target.value)}
                                />
                            </div>
                            <Button size="sm" className="gap-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm h-9 px-4 shrink-0" onClick={openAssignMember}>
                                <UserPlus className="h-4 w-4" /> Add Member
                            </Button>
                        </div>
                    </div>

                    {(() => {
                        const q = teamSearch.toLowerCase();
                        const filteredMembers = members.filter(m => 
                            (m.user?.full_name?.toLowerCase() || "").includes(q) ||
                            (m.user?.email?.toLowerCase() || "").includes(q) ||
                            (m.role_in_project?.toLowerCase() || "").includes(q)
                        );

                        if (members.length === 0) {
                            return (
                                <Card className="border-dashed border-slate-200 bg-slate-50 shadow-none">
                                    <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                                        <Users className="h-10 w-10 text-slate-300 mb-3" />
                                        <p className="text-sm font-medium text-slate-600">No members assigned</p>
                                    </CardContent>
                                </Card>
                            );
                        }

                        if (filteredMembers.length === 0) {
                            return (
                                <Card className="border-dashed border-slate-200 bg-slate-50 shadow-none">
                                    <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                                        <Search className="h-10 w-10 text-slate-300 mb-3" />
                                        <p className="text-sm font-medium text-slate-600">No members match your search</p>
                                    </CardContent>
                                </Card>
                            );
                        }

                        return (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {filteredMembers.map(m => (
                                    <div key={m.id} className="group flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-200 hover:shadow-sm transition-all duration-200">
                                        <Avatar className="h-10 w-10 shrink-0">
                                            <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700">
                                                {initials(m.user?.full_name || "?")}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-sm font-semibold text-slate-900 truncate block group-hover:text-blue-700 transition-colors">{m.user?.full_name || `User #${m.user_id}`}</span>
                                            <span className="text-[11px] text-slate-500 truncate block mt-0.5">{m.user?.email || "-"}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="text-[9px] font-bold bg-slate-100 shrink-0 uppercase tracking-widest text-slate-600">{m.role_in_project}</Badge>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-red-600 hover:bg-red-50 rounded-full transition-all" onClick={() => handleRemoveMember(m.id)}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}
                </TabsContent>

                {/* COST DETAIL TAB */}
                <TabsContent value="costs" className="space-y-4 mt-0 focus:outline-none">
                    <div className="flex flex-col lg:flex-row justify-between gap-4 mb-4">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-base font-semibold text-slate-900 leading-tight">Project Cost Breakdown</h2>
                            <p className="text-xs text-slate-500 mt-0.5">Detailed breakdown of all approved cost expenditures for salaries and resources.</p>
                        </div>
                        <div className="flex flex-wrap gap-2 items-center">
                            <Select value={costFilterType} onValueChange={(v: any) => setCostFilterType(v)}>
                                <SelectTrigger className="w-[140px] h-9 text-sm bg-white border-slate-200"><SelectValue placeholder="Type" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Costs</SelectItem>
                                    <SelectItem value="Gaji">Gaji</SelectItem>
                                    <SelectItem value="Resource">Resource</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input type="date" className="w-[140px] h-9 text-sm bg-white border-slate-200 text-slate-600 font-medium" value={costFilterStart} onChange={e => setCostFilterStart(e.target.value)} />
                            <span className="text-slate-400 font-medium text-sm px-1">-</span>
                            <Input type="date" className="w-[140px] h-9 text-sm bg-white border-slate-200 text-slate-600 font-medium" value={costFilterEnd} onChange={e => setCostFilterEnd(e.target.value)} />
                        </div>
                    </div>

                    <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow className="border-slate-200">
                                        <TableHead className="font-bold text-[11px] uppercase tracking-widest text-slate-500 h-11 w-12 text-center">No</TableHead>
                                        <TableHead className="font-bold text-[11px] uppercase tracking-widest text-slate-500 h-11 w-28 whitespace-nowrap">Date</TableHead>
                                        <TableHead className="font-bold text-[11px] uppercase tracking-widest text-slate-500 h-11 w-32 text-center">Type</TableHead>
                                        <TableHead className="font-bold text-[11px] uppercase tracking-widest text-slate-500 h-11">Description</TableHead>
                                        <TableHead className="font-bold text-[11px] uppercase tracking-widest text-slate-500 h-11 min-w-[150px]">Recipient / User</TableHead>
                                        <TableHead className="font-bold text-[11px] uppercase tracking-widest text-slate-500 h-11 text-right min-w-[120px]">Sum Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(() => {
                                        const filteredCosts = costs.filter(c => {
                                            if (costFilterType !== "all" && c.type !== costFilterType) return false;
                                            if (costFilterStart && c.date < costFilterStart) return false;
                                            if (costFilterEnd && c.date > costFilterEnd) return false;
                                            return true;
                                        });
                                        const total = filteredCosts.reduce((sum, c) => sum + c.amount, 0);

                                        if (filteredCosts.length === 0) {
                                            return <TableRow><TableCell colSpan={5} className="h-32 text-center text-slate-400 font-medium">No cost entries matching the filter.</TableCell></TableRow>;
                                        }

                                        return (
                                            <>
                                                {filteredCosts.map((c, index) => (
                                                    <TableRow key={c.id} className="border-slate-100 hover:bg-slate-50/50">
                                                        <TableCell className="py-3 text-sm text-slate-500 font-medium text-center">{index + 1}</TableCell>
                                                        <TableCell className="py-3 text-sm text-slate-600 font-medium whitespace-nowrap">{fmtDate(c.date)}</TableCell>
                                                        <TableCell className="py-3 text-center">
                                                            <Badge variant="outline" className={`uppercase text-[10px] font-bold px-2.5 py-0.5 tracking-wider w-fit rounded-full border-none ${c.type === 'Gaji' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'}`}>{c.type}</Badge>
                                                        </TableCell>
                                                        <TableCell className="py-3 font-medium text-sm text-slate-900">{c.name}</TableCell>
                                                        <TableCell className="py-3 text-sm text-slate-600 font-medium">{c.user}</TableCell>
                                                        <TableCell className="py-3 text-sm font-bold text-slate-700 text-right">Rp {c.amount.toLocaleString("id-ID")}</TableCell>
                                                    </TableRow>
                                                ))}
                                                <TableRow className="bg-slate-50/80">
                                                    <TableCell colSpan={5} className="py-3.5 font-bold text-right text-slate-500 uppercase tracking-widest text-[10px]">Total Filtered Cost</TableCell>
                                                    <TableCell className="py-3.5 font-black text-slate-900 text-right text-[15px]">Rp {total.toLocaleString("id-ID")}</TableCell>
                                                </TableRow>
                                            </>
                                        );
                                    })()}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </TabsContent>

                {/* RESOURCES TAB */}
                <TabsContent value="resources" className="space-y-4 mt-0 focus:outline-none">
                    <div className="flex flex-col lg:flex-row justify-between gap-4 mb-4">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-base font-semibold text-slate-900 leading-tight">Project Resources</h2>
                            <p className="text-xs text-slate-500 mt-0.5">All resource requests for this project with their current status and details.</p>
                        </div>
                        <div className="flex flex-wrap gap-2 items-center">
                            <div className="relative w-full md:w-[220px]">
                                <Search className="absolute left-3 top-2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search details or requester..."
                                    className="pl-9 h-9 text-sm bg-white border-slate-200"
                                    value={resSearch}
                                    onChange={(e) => setResSearch(e.target.value)}
                                />
                            </div>
                            <Select value={resFilterStatus} onValueChange={setResFilterStatus}>
                                <SelectTrigger className="h-9 w-[130px] text-sm bg-white border-slate-200"><SelectValue placeholder="All Status" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={resFilterType} onValueChange={setResFilterType}>
                                <SelectTrigger className="h-9 w-[150px] text-sm bg-white border-slate-200"><SelectValue placeholder="All Types" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="manpower">Manpower</SelectItem>
                                    <SelectItem value="tools">Tools</SelectItem>
                                    <SelectItem value="infrastructure">Infrastructure</SelectItem>
                                    <SelectItem value="accommodation">Accommodation</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button size="sm" className="h-9 gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm px-4" onClick={() => setResCreateOpen(true)}>
                                + New Request
                            </Button>
                        </div>
                    </div>
                    {(() => {
                        const q = resSearch.toLowerCase();
                        const filteredResources = resources.filter(r => {
                            const matchesSearch = (r.details?.toLowerCase() || "").includes(q) ||
                                (r.user?.full_name?.toLowerCase() || "").includes(q) ||
                                r.type.toLowerCase().includes(q);
                            const matchesStatus = resFilterStatus === "all" || r.status === resFilterStatus;
                            const matchesType = resFilterType === "all" || r.type === resFilterType;
                            return matchesSearch && matchesStatus && matchesType;
                        });

                        if (filteredResources.length === 0) {
                            return (
                                <Card className="border-dashed border-slate-200 bg-slate-50 shadow-none">
                                    <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                                        <Package className="h-10 w-10 text-slate-300 mb-3" />
                                        <p className="text-sm font-medium text-slate-600">No resource requests found</p>
                                        <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filter criteria.</p>
                                    </CardContent>
                                </Card>
                            );
                        }

                        return (
                            <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-slate-50">
                                            <TableRow className="border-slate-200">
                                                <TableHead className="font-bold text-[11px] uppercase tracking-widest text-slate-500 h-11 w-12 text-center">No</TableHead>
                                                <TableHead className="font-bold text-[11px] uppercase tracking-widest text-slate-500 h-11 w-24 text-center">Type</TableHead>
                                                <TableHead className="font-bold text-[11px] uppercase tracking-widest text-slate-500 h-11">Details</TableHead>
                                                <TableHead className="font-bold text-[11px] uppercase tracking-widest text-slate-500 h-11">Requester</TableHead>
                                                <TableHead className="font-bold text-[11px] uppercase tracking-widest text-slate-500 h-11">Cost</TableHead>
                                                <TableHead className="font-bold text-[11px] uppercase tracking-widest text-slate-500 h-11 text-center">Status</TableHead>
                                                <TableHead className="font-bold text-[11px] uppercase tracking-widest text-slate-500 h-11 text-center">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredResources.map((r, index) => (
                                                <TableRow key={r.id} className="border-slate-100 hover:bg-slate-50/50">
                                                    <TableCell className="py-3 text-sm text-slate-500 font-medium text-center">{index + 1}</TableCell>
                                                    <TableCell className="py-3 text-center">
                                                        <Badge variant="outline" className="text-[10px] uppercase font-bold bg-slate-50 text-slate-600 border-slate-200">{r.type}</Badge>
                                                    </TableCell>
                                                    <TableCell className="py-3 font-medium text-sm text-slate-900 max-w-[200px]">
                                                        <p className="truncate" title={r.details}>{r.details}</p>
                                                    </TableCell>
                                                    <TableCell className="py-3 text-sm text-slate-600 font-medium">{r.user?.full_name || `User #${r.user_id}`}</TableCell>
                                                    <TableCell className="py-3 text-sm font-semibold text-slate-700">{r.amount > 0 ? `Rp ${r.amount.toLocaleString("id-ID")}` : "—"}</TableCell>
                                                    <TableCell className="py-3 text-center">
                                                        <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider", resStatusColors[r.status])}>
                                                            <div className={cn("w-1.5 h-1.5 rounded-full", resStatusDotColors[r.status])} />
                                                            <span className="uppercase">{r.status}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-3 text-center">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#64748b] hover:text-[#2568C1] hover:bg-[#2568C1]/10 rounded-full" onClick={() => openResDetail(r)}>
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </Card>
                        );
                    })()}
                </TabsContent>
            </Tabs>

            {/* ════ DIALOGS ════ */}

            {/* EDIT PROJECT DIALOG */}
            <Dialog open={editOpen} onOpenChange={o => !isSaving && setEditOpen(o)}>
                <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-[#e2e8f0]">
                    <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4">
                        <DialogTitle className="text-lg font-bold text-slate-900">Edit Project Information</DialogTitle>
                        <DialogDescription className="text-xs">Update project details and budget thresholds.</DialogDescription>
                    </div>
                    <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Project Name <span className="text-red-500">*</span></label>
                                <Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="h-9 text-sm" disabled={isSaving} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</label>
                                <Select value={editForm.status} onValueChange={v => setEditForm({ ...editForm, status: v })} disabled={isSaving}>
                                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="on-hold">On Hold</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Client Name <span className="text-red-500">*</span></label>
                                <Input value={editForm.client_name} onChange={e => setEditForm({ ...editForm, client_name: e.target.value })} className="h-9 text-sm" disabled={isSaving} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Client Email</label>
                                <Input type="email" value={editForm.client_email} onChange={e => setEditForm({ ...editForm, client_email: e.target.value })} className="h-9 text-sm" disabled={isSaving} />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Budget Revenue</label>
                                <CurrencyInput value={editForm.budget_revenue || ""} onChange={(v: any) => setEditForm({ ...editForm, budget_revenue: Number(v) || 0 })} className="h-9 text-sm" disabled={isSaving} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Planned Cost (RAB)</label>
                                <CurrencyInput value={editForm.budget_cost || ""} onChange={(v: any) => setEditForm({ ...editForm, budget_cost: Number(v) || 0 })} className="h-9 text-sm" disabled={isSaving} />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cost Threshold</label>
                            <CurrencyInput value={editForm.budget_cost_threshold || ""} onChange={(v: any) => setEditForm({ ...editForm, budget_cost_threshold: Number(v) || 0 })} className="h-9 text-sm" disabled={isSaving} />
                        </div>
                    </div>
                    <div className="px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setEditOpen(false)} disabled={isSaving}>Cancel</Button>
                        <Button onClick={handleSaveEdit} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 min-w-[120px]">
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ASSIGN MEMBER DIALOG */}
            <Dialog open={assignOpen} onOpenChange={o => !isAssigning && setAssignOpen(o)}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-[#e2e8f0]">
                    <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4">
                        <DialogTitle className="text-lg font-bold text-slate-900">Assign Member</DialogTitle>
                        <DialogDescription className="text-xs">Add a new user to this project and define their rate.</DialogDescription>
                    </div>
                    <div className="px-6 py-5 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Select User <span className="text-red-500">*</span></label>
                            <Select value={String(assignForm.user_id || "")} onValueChange={v => handleMemberUserSelect(Number(v))} disabled={isAssigning}>
                                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Choose a user" /></SelectTrigger>
                                <SelectContent>
                                    {allUsers.filter(u => !members.find(m => m.user_id === Number(u.id))).map(u => (
                                        <SelectItem key={u.id} value={String(u.id)}>{u.full_name || u.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Role in Project <span className="text-red-500">*</span></label>
                            <Input placeholder="e.g. Backend Dev" value={assignForm.role_in_project} onChange={e => setAssignForm({ ...assignForm, role_in_project: e.target.value })} className="h-9 text-sm" disabled={isAssigning} />
                        </div>

                        {assignForm.user_id > 0 && (
                            <div className="space-y-4 pt-3 border-t border-slate-100">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Contract / Rate Plan</label>
                                    {memberLoadingContracts ? (
                                        <div className="flex items-center gap-2 h-9 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Loading...</div>
                                    ) : (
                                        <Select value={memberSelectedContractId} onValueChange={handleMemberContractSelect} disabled={isAssigning}>
                                            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select contract or custom plan" /></SelectTrigger>
                                            <SelectContent>
                                                {memberUserContracts.map(c => (
                                                    <SelectItem key={c.id} value={String(c.id)}>{`${c.contract_type} - Rp ${Number(c.rate_amount).toLocaleString("id-ID")} (${schemeLabel(c.payment_scheme)})`}</SelectItem>
                                                ))}
                                                <SelectItem value="custom">Custom Rate</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>

                                {memberAssignRateMode === "custom" && (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Rate (Rp)</label>
                                            <CurrencyInput className="h-9 text-sm" placeholder="0" value={assignForm.custom_rate || ""} onChange={(v: any) => setAssignForm({ ...assignForm, custom_rate: Number(v) || null })} disabled={isAssigning} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Type</label>
                                            <Select value={assignForm.contract_type || ""} onValueChange={v => setAssignForm({ ...assignForm, contract_type: v })} disabled={isAssigning}>
                                                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Type" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="monthly">Monthly</SelectItem>
                                                    <SelectItem value="hourly">Hourly</SelectItem>
                                                    <SelectItem value="mandays">Mandays</SelectItem>
                                                    <SelectItem value="termin">Termin</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Scheme</label>
                                            <Select value={assignForm.payment_scheme || ""} onValueChange={v => setAssignForm({ ...assignForm, payment_scheme: v })} disabled={isAssigning}>
                                                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Scheme" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="monthly">Monthly</SelectItem>
                                                    <SelectItem value="termin">Termin</SelectItem>
                                                    <SelectItem value="back_to_back">Back-to-back</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setAssignOpen(false)} disabled={isAssigning}>Cancel</Button>
                        <Button onClick={handleAssignSave} disabled={isAssigning} className="bg-slate-900 hover:bg-slate-800 text-white min-w-[120px]">
                            {isAssigning ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Assign"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* RESOURCE DETAIL DIALOG */}
            <Dialog open={resDetailOpen} onOpenChange={o => !isSavingRes && !isDeletingRes && setResDetailOpen(o)}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-[#e2e8f0]">
                    <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4">
                        <DialogTitle className="text-lg font-bold text-slate-900">Resource Request Details</DialogTitle>
                        <DialogDescription className="text-xs">Detailed information for this resource request.</DialogDescription>
                    </div>
                    <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
                        {resEditMode ? (
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</label>
                                    <Select value={resEditForm.type} onValueChange={v => setResEditForm({ ...resEditForm, type: v })} disabled={isSavingRes}>
                                        <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="manpower">Manpower</SelectItem>
                                            <SelectItem value="tools">Tools</SelectItem>
                                            <SelectItem value="infrastructure">Infrastructure</SelectItem>
                                            <SelectItem value="accommodation">Accommodation</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Details</label>
                                    <Textarea value={resEditForm.details} onChange={e => setResEditForm({ ...resEditForm, details: e.target.value })} className="min-h-[100px] text-sm" disabled={isSavingRes} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount (Rp)</label>
                                    <CurrencyInput value={resEditForm.amount || ""} onChange={(v: any) => setResEditForm({ ...resEditForm, amount: Number(v) || 0 })} className="h-9 text-sm" disabled={isSavingRes} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</label>
                                    <Select value={resEditForm.status} onValueChange={v => setResEditForm({ ...resEditForm, status: v })} disabled={isSavingRes}>
                                        <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="approved">Approved</SelectItem>
                                            <SelectItem value="rejected">Rejected</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        ) : (
                            selectedRes && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</p>
                                            <Badge variant="outline" className="text-[11px] font-bold uppercase bg-slate-100 text-slate-700 border-none">{selectedRes.type}</Badge>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</p>
                                            <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider", resStatusColors[selectedRes.status])}>
                                                <div className={cn("w-1.5 h-1.5 rounded-full", resStatusDotColors[selectedRes.status])} />
                                                <span className="uppercase">{selectedRes.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Details</p>
                                        <p className="text-sm text-slate-700 font-medium bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap">{selectedRes.details}</p>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Requester</p>
                                            <p className="text-sm font-semibold text-slate-800">{selectedRes.user?.full_name || `User #${selectedRes.user_id}`}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount</p>
                                            <p className="text-sm font-bold text-blue-600">Rp {(selectedRes.amount || 0).toLocaleString("id-ID")}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Created At</p>
                                            <div className="flex items-center gap-2 text-xs text-slate-600">
                                                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                {fmtDate(selectedRes.created_at)}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Update</p>
                                            <div className="flex items-center gap-2 text-xs text-slate-600">
                                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                                {fmtDate(selectedRes.updated_at)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                    <div className="px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc] flex flex-col sm:flex-row justify-between gap-3">
                        <div className="flex gap-2">
                            {resEditMode ? (
                                <Button variant="ghost" size="sm" onClick={() => setResEditMode(false)} disabled={isSavingRes}>Cancel Edit</Button>
                            ) : (
                                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteConfirmOpen(true)} disabled={isDeletingRes}>
                                    {isDeletingRes ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                                    Delete
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-2 justify-end">
                            {!resEditMode ? (
                                <Button variant="outline" size="sm" className="h-9 gap-2" onClick={() => setResEditMode(true)}>
                                    <Edit className="h-3.5 w-3.5" /> Edit Request
                                </Button>
                            ) : (
                                <>
                                    <Button variant="outline" size="sm" className="h-9" onClick={() => setResEditMode(false)} disabled={isSavingRes}>Cancel</Button>
                                    <Button size="sm" className="h-9 bg-blue-600 hover:bg-blue-700 min-w-[100px]" onClick={() => handleSaveResEdit()} disabled={isSavingRes}>
                                        {isSavingRes ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* DELETE RESOURCE CONFIRMATION */}
            <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <div className="pt-4 text-center">
                        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="h-6 w-6" />
                        </div>
                        <DialogTitle className="text-xl font-bold text-slate-900">Confirm Delete</DialogTitle>
                        <DialogDescription className="mt-2 text-slate-500">
                            Are you sure you want to delete this resource request? This action cannot be undone.
                        </DialogDescription>
                    </div>
                    <div className="flex gap-3 mt-6">
                        <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirmOpen(false)} disabled={isDeletingRes}>Cancel</Button>
                        <Button variant="destructive" className="flex-1" onClick={handleDeleteRes} disabled={isDeletingRes}>
                            {isDeletingRes ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Request"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ZERO AMOUNT CONFIRMATION */}
            <Dialog open={zeroConfirmOpen} onOpenChange={setZeroConfirmOpen}>
                <DialogContent className="sm:max-w-[420px]">
                    <div className="pt-4 text-center">
                        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <DollarSign className="h-6 w-6" />
                        </div>
                        <DialogTitle className="text-xl font-bold text-slate-900">Confirm Zero Amount</DialogTitle>
                        <DialogDescription className="mt-2 text-slate-500">
                            You are setting the amount to 0 for a non-manpower resource. Are you sure you want to proceed with this amount?
                        </DialogDescription>
                    </div>
                    <div className="flex gap-3 mt-6">
                        <Button variant="outline" className="flex-1" onClick={() => setZeroConfirmOpen(false)} disabled={isSavingRes}>Cancel</Button>
                        <Button className="flex-1 bg-amber-600 hover:bg-amber-700 text-white" onClick={() => handleSaveResEdit(true)} disabled={isSavingRes}>
                            {isSavingRes ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm & Save"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* NEW PROJECT RESOURCE REQUEST */}
            <Dialog open={resCreateOpen} onOpenChange={setResCreateOpen}>
                <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-[#e2e8f0]">
                    <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4">
                        <DialogTitle className="text-lg font-bold text-slate-900">Request Resource</DialogTitle>
                        <DialogDescription className="text-xs">Submit a new resource request for this project.</DialogDescription>
                    </div>
                    <div className="px-6 py-5 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Type</label>
                            <Select value={resCreateForm.type} onValueChange={v => setResCreateForm({...resCreateForm, type: v})}>
                                <SelectTrigger className="h-11 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="manpower">Manpower</SelectItem>
                                    <SelectItem value="tools">Tools</SelectItem>
                                    <SelectItem value="infrastructure">Infrastructure</SelectItem>
                                    <SelectItem value="accommodation">Accommodation</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Details <span className="text-red-500">*</span></label>
                            <textarea 
                                className="w-full min-h-[120px] p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" 
                                placeholder="Describe the resource needed..."
                                value={resCreateForm.details} 
                                onChange={e => setResCreateForm({...resCreateForm, details: e.target.value})} 
                            />
                        </div>
                    </div>
                    <div className="px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc] flex gap-3">
                        <Button variant="ghost" className="flex-1" onClick={() => setResCreateOpen(false)} disabled={isCreatingRes}>Cancel</Button>
                        <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleCreateRes} disabled={isCreatingRes}>
                            {isCreatingRes ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Request"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
