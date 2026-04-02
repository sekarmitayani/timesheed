"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/ai/ai-components";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Plus, Trash2, Users, Loader2, ChevronLeft, ChevronRight, Search, AlertTriangle, UserPlus, X, Eye, Edit, Save, Check, ArrowRight, ArrowLeft, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { projectService, CreateProjectPayload, UpdateProjectPayload, AssignMemberPayload } from "@/lib/services/project-service";
import { adminUserService } from "@/lib/services/admin-users";
import { adminContractService, Contract } from "@/lib/services/admin-contracts";
import { ApiProject, ProjectMember, User } from "@/lib/types";

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

const statusColors: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700 border-none",
    completed: "bg-blue-50 text-blue-700 border-none",
    "on-hold": "bg-amber-50 text-amber-700 border-none",
    cancelled: "bg-red-50 text-red-700 border-none",
};
const statusDotColors: Record<string, string> = {
    active: "bg-emerald-500",
    completed: "bg-blue-500",
    "on-hold": "bg-amber-500",
    cancelled: "bg-red-500",
};

interface PendingEmployee { user: User; role_in_project: string; rateMode: "contract" | "custom"; selectedContractId: string; custom_rate: number | null; contract_type: string; payment_scheme: string; }

export default function AdminProjectsPage() {
    const [projects, setProjects] = useState<ApiProject[]>([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [wizardOpen, setWizardOpen] = useState(false);
    const [wizardStep, setWizardStep] = useState(1);
    const [isSaving, setIsSaving] = useState(false);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [projectForm, setProjectForm] = useState({ name: "", client_name: "", client_email: "", budget_revenue: 0, budget_revenue_display: "", budget_cost: 0, budget_cost_display: "", budget_cost_threshold: 0, budget_cost_threshold_display: "" });
    const [selectedPmId, setSelectedPmId] = useState<string>("");
    const [pendingEmployees, setPendingEmployees] = useState<PendingEmployee[]>([]);
    const [empUserId, setEmpUserId] = useState<string>("");
    const [empRole, setEmpRole] = useState("");
    const [empRateMode, setEmpRateMode] = useState<"contract" | "custom">("contract");
    const [empContracts, setEmpContracts] = useState<Contract[]>([]);
    const [empSelectedContract, setEmpSelectedContract] = useState("");
    const [empCustomRate, setEmpCustomRate] = useState<number | null>(null);
    const [empContractType, setEmpContractType] = useState("");
    const [empPaymentScheme, setEmpPaymentScheme] = useState("");
    const [isLoadingContracts, setIsLoadingContracts] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<ApiProject | null>(null);
    const [membersOpen, setMembersOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<ApiProject | null>(null);
    const [members, setMembers] = useState<ProjectMember[]>([]);
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);
    const [isSavingMember, setIsSavingMember] = useState(false);
    const [showAssignForm, setShowAssignForm] = useState(false);
    const [memberUserContracts, setMemberUserContracts] = useState<Contract[]>([]);
    const [memberLoadingContracts, setMemberLoadingContracts] = useState(false);
    const [memberAssignRateMode, setMemberAssignRateMode] = useState<"contract" | "custom">("contract");
    const [memberSelectedContractId, setMemberSelectedContractId] = useState("");
    const [assignForm, setAssignForm] = useState<AssignMemberPayload>({ project_id: 0, user_id: 0, role_in_project: "", custom_rate: null, contract_type: "", payment_scheme: "" });
    const router = useRouter();

    const fetchProjects = async (page: number = pagination.page) => { setIsLoading(true); try { const res = await projectService.getProjects(page, pagination.limit); setProjects(res.data || []); setPagination(res.pagination); } catch (e: any) { toast.error(e.message || "Failed to fetch"); } finally { setIsLoading(false); } };
    useEffect(() => { fetchProjects(1); }, []);
    const fetchMembers = async (pid: number) => { setIsLoadingMembers(true); try { const r = await projectService.getProjectMembers(pid); setMembers(Array.isArray(r) ? r : []); } catch (e: any) { toast.error(e.message || "Failed"); } finally { setIsLoadingMembers(false); } };
    const fetchAllUsers = async () => { if (allUsers.length > 0) return; try { const r = await adminUserService.getUsers(1, 100); setAllUsers(r.data || []); } catch { } };
    const resetEmpForm = () => { setEmpUserId(""); setEmpRole(""); setEmpRateMode("contract"); setEmpContracts([]); setEmpSelectedContract(""); setEmpCustomRate(null); setEmpContractType(""); setEmpPaymentScheme(""); };
    const openWizard = () => { setProjectForm({ name: "", client_name: "", client_email: "", budget_revenue: 0, budget_revenue_display: "", budget_cost: 0, budget_cost_display: "", budget_cost_threshold: 0, budget_cost_threshold_display: "" }); setSelectedPmId(""); setPendingEmployees([]); resetEmpForm(); setWizardStep(1); setWizardOpen(true); fetchAllUsers(); };

    const handleEmpUserSelect = async (uid: string) => {
        setEmpUserId(uid); setEmpSelectedContract(""); setEmpRateMode("contract"); setEmpCustomRate(null); setEmpContractType(""); setEmpPaymentScheme("");
        if (uid) { setIsLoadingContracts(true); try { const allC = await adminContractService.getUserContracts(Number(uid)); const c = allC.filter(x => !x.project_id); setEmpContracts(c); if (c.length === 0) setEmpRateMode("custom"); } catch { setEmpContracts([]); setEmpRateMode("custom"); } finally { setIsLoadingContracts(false); } }
    };
    const handleEmpContractSelect = (v: string) => {
        if (v === "custom") { setEmpRateMode("custom"); setEmpSelectedContract("custom"); setEmpCustomRate(null); setEmpContractType(""); setEmpPaymentScheme(""); }
        else { setEmpRateMode("contract"); setEmpSelectedContract(v); const c = empContracts.find(x => String(x.id) === v); if (c) { setEmpCustomRate(c.rate_amount); setEmpContractType(c.contract_type); setEmpPaymentScheme(c.payment_scheme); } }
    };
    const addEmployee = () => { if (!empUserId || !empRole) { toast.error("Select user and enter role"); return; } const u = allUsers.find(x => String(x.id) === empUserId); if (!u) return; setPendingEmployees([...pendingEmployees, { user: u, role_in_project: empRole, rateMode: empRateMode, selectedContractId: empSelectedContract, custom_rate: empCustomRate, contract_type: empContractType, payment_scheme: empPaymentScheme }]); resetEmpForm(); toast.success(`${u.full_name || u.name} added!`); };
    const removeEmployee = (i: number) => { setPendingEmployees(pendingEmployees.filter((_, idx) => idx !== i)); toast.success("Removed"); };

    const handleWizardSave = async () => {
        if (!projectForm.name || !projectForm.client_name) { toast.error("Name and client required"); return; }
        setIsSaving(true);
        try {
            const p: CreateProjectPayload = { name: projectForm.name, client_name: projectForm.client_name, client_email: projectForm.client_email || undefined, budget_revenue: projectForm.budget_revenue || undefined, budget_cost: projectForm.budget_cost || undefined, budget_cost_threshold: projectForm.budget_cost_threshold || undefined };
            const created = await projectService.createProject(p);
            if (selectedPmId) await projectService.assignMember({ project_id: created.id, user_id: Number(selectedPmId), role_in_project: "Project Manager" });
            for (const emp of pendingEmployees) {
                const ep: AssignMemberPayload = { project_id: created.id, user_id: Number(emp.user.id), role_in_project: emp.role_in_project };
                if (emp.rateMode === "custom" && emp.custom_rate) { ep.custom_rate = emp.custom_rate; ep.contract_type = emp.contract_type || "termin"; ep.payment_scheme = emp.payment_scheme || "monthly"; }
                else if (emp.rateMode === "contract" && emp.selectedContractId !== "custom") { ep.custom_rate = emp.custom_rate; ep.contract_type = emp.contract_type; ep.payment_scheme = emp.payment_scheme; }
                await projectService.assignMember(ep);
            }
            toast.success(`Project "${projectForm.name}" created!`); setWizardOpen(false); fetchProjects(1);
        } catch (e: any) { toast.error(e.message || "Failed"); } finally { setIsSaving(false); }
    };

    const handleDelete = async () => { if (!projectToDelete) return; setIsSaving(true); try { await projectService.deleteProject(projectToDelete.id); toast.success(`"${projectToDelete.name}" deleted!`); setDeleteOpen(false); setProjectToDelete(null); fetchProjects(); } catch (e: any) { toast.error(e.message || "Failed"); } finally { setIsSaving(false); } };
    const openMembers = async (p: ApiProject) => { setSelectedProject(p); setMembersOpen(true); setShowAssignForm(false); fetchMembers(p.id); fetchAllUsers(); };
    const openMemberAssignForm = () => { setShowAssignForm(true); setMemberUserContracts([]); setMemberAssignRateMode("contract"); setMemberSelectedContractId(""); if (selectedProject) setAssignForm({ project_id: selectedProject.id, user_id: 0, role_in_project: "", custom_rate: null, contract_type: "", payment_scheme: "" }); };

    const handleMemberUserSelect = async (uid: number) => {
        setAssignForm({ ...assignForm, user_id: uid, custom_rate: null, contract_type: "", payment_scheme: "" }); setMemberSelectedContractId(""); setMemberAssignRateMode("contract"); setMemberUserContracts([]);
        if (uid) { setMemberLoadingContracts(true); try { const allC = await adminContractService.getUserContracts(uid); const c = allC.filter(x => !x.project_id); setMemberUserContracts(c); if (c.length === 0) setMemberAssignRateMode("custom"); } catch { setMemberUserContracts([]); setMemberAssignRateMode("custom"); } finally { setMemberLoadingContracts(false); } }
    };
    const handleMemberContractSelect = (v: string) => {
        if (v === "custom") { setMemberAssignRateMode("custom"); setMemberSelectedContractId("custom"); setAssignForm({ ...assignForm, custom_rate: null, contract_type: "", payment_scheme: "" }); }
        else { setMemberAssignRateMode("contract"); setMemberSelectedContractId(v); const c = memberUserContracts.find(x => String(x.id) === v); if (c) setAssignForm({ ...assignForm, custom_rate: c.rate_amount, contract_type: c.contract_type, payment_scheme: c.payment_scheme }); }
    };
    const handleAssign = async () => {
        if (!assignForm.user_id || !assignForm.role_in_project) { toast.error("User and role required"); return; }
        setIsSavingMember(true);
        try {
            const p: any = { project_id: assignForm.project_id, user_id: Number(assignForm.user_id), role_in_project: assignForm.role_in_project };
            if (memberAssignRateMode === "custom" && assignForm.custom_rate) { p.custom_rate = Number(assignForm.custom_rate); p.contract_type = assignForm.contract_type || "termin"; p.payment_scheme = assignForm.payment_scheme || "monthly"; }
            else if (memberAssignRateMode === "contract" && memberSelectedContractId !== "custom") { const c = memberUserContracts.find(x => String(x.id) === memberSelectedContractId); if (c) { p.custom_rate = c.rate_amount; p.contract_type = c.contract_type; p.payment_scheme = c.payment_scheme; } }
            await projectService.assignMember(p); toast.success("Member assigned!"); setShowAssignForm(false); if (selectedProject) fetchMembers(selectedProject.id);
        } catch (e: any) { toast.error(e.message || "Failed"); } finally { setIsSavingMember(false); }
    };
    const handleRemoveMember = async (id: number) => { setIsSavingMember(true); try { await projectService.removeMember(id); toast.success("Member removed!"); if (selectedProject) fetchMembers(selectedProject.id); } catch (e: any) { toast.error(e.message || "Failed"); } finally { setIsSavingMember(false); } };



    const filtered = projects.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.client_name.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "All" || p.status === statusFilter;
        return matchSearch && matchStatus;
    });
    const totalPages = Math.ceil(pagination.total / pagination.limit);
    const pmUsers = allUsers.filter(u => u.role === "projectmanager");
    const availableEmployees = allUsers.filter(u => String(u.id) !== selectedPmId && !pendingEmployees.find(e => String(e.user.id) === String(u.id)));
    const stepLabels = ["Project Info", "Assign PM", "Assign Employees"];
    const initials = (name: string) => (name || "?").split(" ").slice(0, 2).map(n => n[0]).join("");
    const fmtRate = (n: number) => Number(n).toLocaleString("id-ID");

    return (
        <div className="space-y-6">
            <PageHeader title="Project Management" description={`${pagination.total} total projects`}>
                <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm" onClick={openWizard}><Plus className="h-4 w-4" /> New Project</Button>
            </PageHeader>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-[300px]"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search projects..." className="pl-9 h-10 border-[#e2e8f0] focus-visible:ring-[#2568C1]" value={search} onChange={e => setSearch(e.target.value)} /></div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="h-10 w-[140px] bg-white"><SelectValue placeholder="All Status" /></SelectTrigger><SelectContent><SelectItem value="All">All Status</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="on-hold">On Hold</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem></SelectContent></Select>
                </div>
            </div>
            <Card className="border-[#e2e8f0] shadow-sm overflow-hidden"><CardContent className="p-0"><div className="overflow-x-auto"><Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-b border-slate-100">
                        <TableHead className="pl-6 w-12 text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">No</TableHead>
                        <TableHead className="w-[250px] text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Project</TableHead>
                        <TableHead className=" text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Client</TableHead>
                        <TableHead className=" text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Revenue</TableHead>
                        <TableHead className=" text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Cost</TableHead>
                        <TableHead className=" text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Status</TableHead>
                        <TableHead className="w-[160px] pr-10 text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? <TableRow><TableCell colSpan={7} className="h-48  text-center"><div className="flex flex-col items-center justify-center text-muted-foreground"><Loader2 className="h-8 w-8 animate-spin text-[#2568C1] mb-4" /><p>Loading...</p></div></TableCell></TableRow>
                        : filtered.length === 0 ? <TableRow><TableCell colSpan={7} className="h-32 text-muted-foreground text-center">No projects found.</TableCell></TableRow>
                            : filtered.map((p, i) => (
                                <TableRow key={p.id} className="hover:bg-[#f0f4fa]/50 transition-colors">
                                    <TableCell className="pl-6 text-sm text-muted-foreground font-medium">{(pagination.page - 1) * pagination.limit + i + 1}</TableCell>
                                    <TableCell className=""><div className="flex flex-col"><span className="text-sm font-medium text-[#0f172a]">{p.name}</span><span className="text-[10px] text-muted-foreground">ID: {p.id}</span></div></TableCell>
                                    <TableCell className=""><span className="text-sm text-[#475569]">{p.client_name}</span>{p.client_email && <div className="text-[10px] text-muted-foreground">{p.client_email}</div>}</TableCell>
                                    <TableCell className=""><span className="text-sm font-medium">Rp {formatNumber(p.budget_revenue || 0)}</span></TableCell>
                                    <TableCell className=""><div className="flex flex-col"><span className="text-sm font-medium">{p.actual_cost ? `Rp ${formatNumber(p.actual_cost)}` : 'Rp 0'}</span>{(p.budget_cost || 0) > 0 && <span className="text-[10px] text-muted-foreground">Planned: Rp {formatNumber(p.budget_cost || 0)}</span>}{(p.budget_cost_threshold || 0) > 0 && (p.actual_cost || 0) > (p.budget_cost_threshold || 0) && <span className="text-[10px] text-red-500 font-medium">⚠ Over Threshold</span>}</div></TableCell>
                                    <TableCell className=""><div className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider", statusColors[p.status])}><div className={cn("w-1.5 h-1.5 rounded-full", statusDotColors[p.status])} /><span className="uppercase">{p.status}</span></div></TableCell>
                                    <TableCell className=""><div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#64748b] hover:text-[#2568C1] hover:bg-[#2568C1]/10 rounded-full" onClick={() => router.push(`/admin/projects/${p.id}`)}><Eye className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#64748b] hover:text-[#2568C1] hover:bg-[#2568C1]/10 rounded-full" onClick={() => openMembers(p)}><Users className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#64748b] hover:text-red-600 hover:bg-red-50 rounded-full" onClick={() => { setProjectToDelete(p); setDeleteOpen(true); }}><Trash2 className="h-4 w-4" /></Button>
                                    </div></TableCell>
                                </TableRow>))}
                </TableBody>
            </Table></div></CardContent>
                {!isLoading && totalPages > 0 && <div className="border-t border-[#e2e8f0] bg-white px-4 py-3 flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">Showing <span className="font-medium text-[#0f172a]">{(pagination.page - 1) * pagination.limit + 1}</span> to <span className="font-medium text-[#0f172a]">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-medium text-[#0f172a]">{pagination.total}</span> projects</div>
                    <div className="flex items-center gap-2"><Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={pagination.page <= 1} onClick={() => fetchProjects(pagination.page - 1)}><ChevronLeft className="h-4 w-4" /></Button><div className="text-xs font-medium px-2">Page {pagination.page} of {totalPages}</div><Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={pagination.page >= totalPages} onClick={() => fetchProjects(pagination.page + 1)}><ChevronRight className="h-4 w-4" /></Button></div>
                </div>}</Card>

            {/* === WIZARD === */}
            <Dialog open={wizardOpen} onOpenChange={o => !isSaving && setWizardOpen(o)}><DialogContent className="sm:max-w-[650px] max-w-[95vw] p-0 overflow-hidden border-[#e2e8f0]">
                <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4"><DialogTitle className="text-lg text-[#0f172a]">Create New Project</DialogTitle><DialogDescription className="text-xs">{`Step ${wizardStep} of 3 - ${stepLabels[wizardStep - 1]}`}</DialogDescription></div>
                <div className="px-6 pt-4 pb-2 flex items-center gap-2">{stepLabels.map((label, i) => (
                    <div key={i} className="flex items-center gap-2 flex-1">
                        <div className={`flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold shrink-0 transition-all duration-500 ease-in-out ${i + 1 < wizardStep ? "bg-emerald-500 text-white scale-100" : i + 1 === wizardStep ? "bg-[#2568C1] text-white scale-110 shadow-lg shadow-[#2568C1]/30" : "bg-[#e2e8f0] text-[#94a3b8] scale-100"}`}>
                            {i + 1 < wizardStep ? <Check className="h-3.5 w-3.5" /> : i + 1}
                        </div>
                        <span className={`text-[11px] font-medium hidden sm:inline transition-colors duration-300 ${i + 1 === wizardStep ? "text-[#0f172a]" : "text-muted-foreground"}`}>{label}</span>
                        {i < 2 && <div className="flex-1 h-[2px] bg-[#e2e8f0] rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-700 ease-in-out ${i + 1 < wizardStep ? "w-full bg-emerald-400" : "w-0 bg-[#2568C1]"}`} /></div>}
                    </div>))}</div>
                <div className="px-6 py-4 space-y-4 max-h-[55vh] overflow-y-auto">
                    {wizardStep === 1 && (<>
                        <div className="space-y-1.5"><label className="text-sm font-medium">Project Name <span className="text-red-500">*</span></label><Input value={projectForm.name} onChange={e => setProjectForm({ ...projectForm, name: e.target.value })} placeholder="Website Revamp" disabled={isSaving} /></div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5"><label className="text-sm font-medium">Client Name <span className="text-red-500">*</span></label><Input value={projectForm.client_name} onChange={e => setProjectForm({ ...projectForm, client_name: e.target.value })} placeholder="PT ABC" disabled={isSaving} /></div>
                            <div className="space-y-1.5"><label className="text-sm font-medium">Client Email</label><Input type="email" value={projectForm.client_email} onChange={e => setProjectForm({ ...projectForm, client_email: e.target.value })} placeholder="abc@example.com" disabled={isSaving} /></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5"><label className="text-sm font-medium">Budget Revenue (Rp)</label><CurrencyInput placeholder="e.g. 100.000.000" value={projectForm.budget_revenue || ""} onChange={(v: any) => setProjectForm({ ...projectForm, budget_revenue: Number(v) || 0 })} disabled={isSaving} /></div>
                            <div className="space-y-1.5"><label className="text-sm font-medium">Planned Cost / RAB (Rp)</label><CurrencyInput placeholder="e.g. 30.000.000" value={projectForm.budget_cost || ""} onChange={(v: any) => setProjectForm({ ...projectForm, budget_cost: Number(v) || 0 })} disabled={isSaving} /></div>
                        </div>
                        <div className="space-y-1.5"><label className="text-sm font-medium">Cost Threshold (Rp)</label><CurrencyInput placeholder="e.g. 40.000.000" value={projectForm.budget_cost_threshold || ""} onChange={(v: any) => setProjectForm({ ...projectForm, budget_cost_threshold: Number(v) || 0 })} disabled={isSaving} /></div>
                    </>)}
                    {wizardStep === 2 && (<>
                        <div className="space-y-1.5"><label className="text-sm font-medium">Select Project Manager <span className="text-red-500">*</span></label>
                            {pmUsers.length === 0 ? <div className="p-4 rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-700">No PM users found.</div> : <Select value={selectedPmId} onValueChange={setSelectedPmId}><SelectTrigger><SelectValue placeholder="Choose a Project Manager" /></SelectTrigger><SelectContent>{pmUsers.map(u => <SelectItem key={u.id} value={String(u.id)}>{u.full_name || u.name}</SelectItem>)}</SelectContent></Select>}
                        </div>
                        {selectedPmId && (() => { const pm = pmUsers.find(u => String(u.id) === selectedPmId); return pm ? <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200"><Avatar className="h-9 w-9"><AvatarFallback className="text-xs bg-gradient-to-br from-[#2568C1] to-[#1a4f99] text-white">{initials(pm.full_name)}</AvatarFallback></Avatar><div><div className="text-sm font-medium text-emerald-800">{pm.full_name}</div><div className="text-[11px] text-emerald-600">Project Manager</div></div></div> : null; })()}
                    </>)}
                    {wizardStep === 3 && (<>
                        <div className="p-4 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] space-y-3 animate-in slide-in-from-top-2 fade-in duration-300">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Add Employee</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1"><label className="text-xs font-medium">User <span className="text-red-500">*</span></label><Select value={empUserId} onValueChange={handleEmpUserSelect}><SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select employee" /></SelectTrigger><SelectContent>{availableEmployees.map(u => <SelectItem key={u.id} value={String(u.id)}>{u.full_name || u.name}</SelectItem>)}</SelectContent></Select></div>
                                <div className="space-y-1"><label className="text-xs font-medium">Role <span className="text-red-500">*</span></label><Input className="h-9 text-sm" placeholder="Backend Dev" value={empRole} onChange={e => setEmpRole(e.target.value)} /></div>
                            </div>
                            {empUserId && <div className="space-y-3">
                                <div className="space-y-1"><label className="text-xs font-medium">Contract / Rate</label>
                                    {isLoadingContracts ? <div className="flex items-center gap-2 h-9 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Loading...</div> : <Select value={empSelectedContract} onValueChange={handleEmpContractSelect}><SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select contract or custom" /></SelectTrigger><SelectContent>{empContracts.map(c => <SelectItem key={c.id} value={String(c.id)}>{`${c.contract_type} - Rp ${fmtRate(c.rate_amount)} (${schemeLabel(c.payment_scheme)})`}</SelectItem>)}<SelectItem value="custom">Custom Rate</SelectItem></SelectContent></Select>}
                                </div>
                                {empRateMode === "custom" && <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="space-y-1"><label className="text-xs font-medium">Rate (Rp)</label><CurrencyInput className="h-9 text-sm" value={empCustomRate || ""} onChange={(v: any) => setEmpCustomRate(Number(v) || null)} /></div>
                                    <div className="space-y-1"><label className="text-xs font-medium">Type</label><Select value={empContractType} onValueChange={setEmpContractType}><SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Type" /></SelectTrigger><SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="hourly">Hourly</SelectItem><SelectItem value="mandays">Mandays</SelectItem><SelectItem value="termin">Termin</SelectItem></SelectContent></Select></div>
                                    <div className="space-y-1"><label className="text-xs font-medium">Scheme</label><Select value={empPaymentScheme} onValueChange={setEmpPaymentScheme}><SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Scheme" /></SelectTrigger><SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="termin">Termin</SelectItem><SelectItem value="back_to_back">Back-to-back</SelectItem></SelectContent></Select></div>
                                </div>}
                                {empRateMode === "contract" && empSelectedContract && empSelectedContract !== "custom" && <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700"><Check className="h-3 w-3" /> {`Using contract - Rp ${fmtRate(empCustomRate || 0)} | ${empContractType} | ${schemeLabel(empPaymentScheme)}`}</div>}
                            </div>}
                            <Button size="sm" className="w-full h-9 bg-[#0f172a] hover:bg-slate-800 text-sm" onClick={addEmployee} disabled={!empUserId || !empRole}><UserPlus className="h-3.5 w-3.5 mr-1.5" /> Add to List</Button>
                        </div>
                        {pendingEmployees.length > 0 && <div className="space-y-2"><h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{`Assigned (${pendingEmployees.length})`}</h4>
                            {pendingEmployees.map((emp, i) => <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-[#e2e8f0] bg-white">
                                <div className="flex items-center gap-3"><Avatar className="h-8 w-8"><AvatarFallback className="text-[10px] bg-gradient-to-br from-[#2568C1] to-[#1a4f99] text-white">{initials(emp.user.full_name)}</AvatarFallback></Avatar><div><div className="text-sm font-medium">{emp.user.full_name || emp.user.name}</div><div className="text-[10px] text-muted-foreground">{`${emp.role_in_project} | ${emp.rateMode === "custom" ? `Custom Rp ${fmtRate(emp.custom_rate || 0)}` : "Contract"}`}</div></div></div>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full" onClick={() => removeEmployee(i)}><Trash2 className="h-3 w-3" /></Button>
                            </div>)}</div>}
                        {pendingEmployees.length === 0 && <p className="text-center text-sm text-muted-foreground py-2">No employees added yet.</p>}
                    </>)}
                </div>
                <div className="px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc] flex items-center justify-between gap-3">
                    <Button variant="ghost" onClick={() => { if (wizardStep === 1) setWizardOpen(false); else setWizardStep(wizardStep - 1); }} disabled={isSaving} className="gap-1.5">{wizardStep === 1 ? "Cancel" : <><ArrowLeft className="h-4 w-4" /> Back</>}</Button>
                    {wizardStep < 3 ? <Button onClick={() => { if (wizardStep === 1 && (!projectForm.name || !projectForm.client_name)) { toast.error("Name and client required"); return; } setWizardStep(wizardStep + 1); }} className="gap-1.5 bg-blue-600 hover:bg-blue-700 min-w-[120px]">Next <ArrowRight className="h-4 w-4" /></Button>
                        : <Button onClick={handleWizardSave} disabled={isSaving} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 min-w-[160px]">{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Save & Create</>}</Button>}
                </div>
            </DialogContent></Dialog>

            {/* === DELETE === */}
            <Dialog open={deleteOpen} onOpenChange={o => !isSaving && setDeleteOpen(o)}><DialogContent className="sm:max-w-md max-w-[90vw]"><div className="flex flex-col items-center gap-4 py-2"><div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center"><AlertTriangle className="h-6 w-6 text-red-600" /></div><DialogTitle className="text-center text-lg">Delete Project?</DialogTitle><DialogDescription className="text-center text-sm text-[#475569]">This will soft-delete <b className="text-[#0f172a]">{projectToDelete?.name}</b>.</DialogDescription><div className="flex gap-3 w-full justify-center pt-2"><Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={isSaving}>Cancel</Button><Button variant="destructive" onClick={handleDelete} disabled={isSaving} className="min-w-[120px]">{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes, Delete"}</Button></div></div></DialogContent></Dialog>

            {/* === MEMBERS === */}
            <Dialog open={membersOpen} onOpenChange={o => !isSavingMember && setMembersOpen(o)}><DialogContent className="sm:max-w-[600px] max-w-[95vw] max-h-[90vh] p-0 overflow-hidden border-[#e2e8f0] flex flex-col">
                <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-5 py-3 pr-10 flex items-center justify-between shrink-0"><div className="space-y-1"><DialogTitle className="text-lg text-[#0f172a]">Team Members</DialogTitle><DialogDescription className="text-xs">{selectedProject?.name} • {members.length} member{members.length !== 1 ? 's' : ''}</DialogDescription></div>{!showAssignForm && <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={openMemberAssignForm}><UserPlus className="h-3.5 w-3.5" /> Add Member</Button>}</div>
                <div className="overflow-y-auto h-full">
                    {showAssignForm && <div className="border border-[#e2e8f0] bg-[#f8fafc] rounded-lg p-4 m-6 space-y-4 animate-in slide-in-from-top-2 fade-in duration-300">
                        <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-2 mb-2"><h4 className="text-sm font-medium text-[#0f172a]">Assign New Member</h4><Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-slate-200" onClick={() => setShowAssignForm(false)}><X className="h-3 w-3" /></Button></div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5"><label className="text-xs font-medium">Select User <span className="text-red-500">*</span></label><Select value={String(assignForm.user_id || "")} onValueChange={v => handleMemberUserSelect(Number(v))}><SelectTrigger className="h-9 text-sm bg-white"><SelectValue placeholder="Choose a user" /></SelectTrigger><SelectContent>{allUsers.filter(u => !members.find(m => m.user_id === Number(u.id))).map(u => <SelectItem key={u.id} value={String(u.id)}>{u.full_name || u.name}</SelectItem>)}</SelectContent></Select></div>
                            <div className="space-y-1.5"><label className="text-xs font-medium">Role in Project <span className="text-red-500">*</span></label><Input className="h-9 text-sm bg-white" placeholder="e.g. Backend Dev" value={assignForm.role_in_project} onChange={e => setAssignForm({ ...assignForm, role_in_project: e.target.value })} /></div>
                        </div>
                        {assignForm.user_id > 0 && <div className="space-y-3 pt-2">
                            <div className="space-y-1.5"><label className="text-xs font-medium">Contract / Rate Plan</label>{memberLoadingContracts ? <div className="flex items-center gap-2 h-9 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Loading...</div> : <Select value={memberSelectedContractId} onValueChange={handleMemberContractSelect}><SelectTrigger className="h-9 text-sm bg-white"><SelectValue placeholder="Select contract or custom plan" /></SelectTrigger><SelectContent>{memberUserContracts.map(c => <SelectItem key={c.id} value={String(c.id)}>{`${c.contract_type} - Rp ${fmtRate(c.rate_amount)} (${schemeLabel(c.payment_scheme)})`}</SelectItem>)}<SelectItem value="custom">Custom Rate</SelectItem></SelectContent></Select>}</div>
                            {memberAssignRateMode === "custom" && <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="space-y-1.5"><label className="text-xs font-medium">Rate (Rp)</label><CurrencyInput className="h-9 text-sm bg-white" placeholder="0" value={assignForm.custom_rate || ""} onChange={(v: any) => setAssignForm({ ...assignForm, custom_rate: Number(v) || null })} /></div>
                                <div className="space-y-1.5"><label className="text-xs font-medium">Type</label><Select value={assignForm.contract_type || ""} onValueChange={v => setAssignForm({ ...assignForm, contract_type: v })}><SelectTrigger className="h-9 text-sm bg-white"><SelectValue placeholder="Select Type" /></SelectTrigger><SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="hourly">Hourly</SelectItem><SelectItem value="mandays">Mandays</SelectItem><SelectItem value="termin">Termin</SelectItem></SelectContent></Select></div>
                                <div className="space-y-1.5"><label className="text-xs font-medium">Scheme</label><Select value={assignForm.payment_scheme || ""} onValueChange={v => setAssignForm({ ...assignForm, payment_scheme: v })}><SelectTrigger className="h-9 text-sm bg-white"><SelectValue placeholder="Select Scheme" /></SelectTrigger><SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="termin">Termin</SelectItem><SelectItem value="back_to_back">Back-to-back</SelectItem></SelectContent></Select></div>
                            </div>}
                            {memberAssignRateMode === "contract" && memberSelectedContractId && memberSelectedContractId !== "custom" && <div className="flex items-center gap-2 p-2.5 rounded border border-slate-200 bg-slate-50 text-xs text-slate-600"><Check className="h-3.5 w-3.5 text-emerald-500" /> Member will be assigned using the selected contract.</div>}
                        </div>}
                        <Button className="w-full h-9 bg-[#0f172a] hover:bg-slate-800 text-sm font-medium mt-2" onClick={handleAssign} disabled={isSavingMember}>{isSavingMember ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Assignment"}</Button>
                    </div>}
                    <div className="px-6 py-2">
                        {isLoadingMembers ? <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                            : members.length === 0 ? <div className="py-12 text-center text-sm text-muted-foreground border border-dashed border-slate-200 rounded-lg">No members assigned to this project yet.</div>
                                : <div className="space-y-2 py-2">{members.map(m => <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 bg-white shadow-sm transition-all group">
                                    <div className="flex items-center gap-3"><Avatar className="h-9 w-9 border border-slate-100"><AvatarFallback className="text-xs bg-slate-100 text-slate-600 font-medium">{initials(m.user?.full_name || "")}</AvatarFallback></Avatar><div><div className="text-sm font-medium text-[#0f172a]">{m.user?.full_name || `User #${m.user_id}`}</div><div className="text-[11px] text-muted-foreground">{m.user?.email}</div></div></div>
                                    <div className="flex items-center gap-3"><Badge variant="secondary" className={`text-[10px] font-medium px-2 py-0.5 ${m.role_in_project === "Project Manager" ? "bg-blue-50 text-blue-700 hover:bg-blue-50 border border-blue-100" : "bg-slate-50 text-slate-600 hover:bg-slate-50 border border-slate-100"}`}>{m.role_in_project === "Project Manager" && <Crown className="h-3 w-3 mr-1" />}{m.role_in_project}</Badge><Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-red-600 hover:bg-red-50 rounded-full transition-all" onClick={() => handleRemoveMember(m.id)} disabled={isSavingMember}><Trash2 className="h-3.5 w-3.5" /></Button></div>
                                </div>)}</div>}
                    </div>
                </div>
            </DialogContent></Dialog>


        </div>
    );
}