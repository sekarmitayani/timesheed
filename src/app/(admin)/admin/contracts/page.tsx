"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/ai/ai-components";
import { useDataStore } from "@/store/useDataStore";
import { Plus, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";

export default function ContractsPage() {
    const contracts = useDataStore((s) => s.contracts);
    const users = useDataStore((s) => s.users);
    const addContract = useDataStore((s) => s.addContract);
    const updateContract = useDataStore((s) => s.updateContract);
    const deleteContract = useDataStore((s) => s.deleteContract);
    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState({ userId: "", type: "full-time" as "full-time" | "freelance" | "contract", startDate: "", endDate: "", rate: "", rateType: "monthly" as "hourly" | "monthly" | "project", status: "active" as "active" | "expired" | "pending" });

    const resetForm = () => setForm({ userId: "", type: "full-time", startDate: "", endDate: "", rate: "", rateType: "monthly", status: "active" });

    const openEdit = (contractId: string) => {
        const c = contracts.find((c) => c.id === contractId);
        if (c) {
            setForm({ userId: c.userId, type: c.type, startDate: c.startDate, endDate: c.endDate, rate: String(c.rate), rateType: c.rateType, status: c.status });
            setEditId(contractId);
            setOpen(true);
        }
    };

    const handleSave = () => {
        if (!form.userId || !form.startDate || !form.rate) { toast.error("Fill all required fields"); return; }
        if (editId) {
            updateContract(editId, { ...form, rate: parseInt(form.rate) });
            const userName = users.find((u) => u.id === form.userId)?.name;
            toast.success(`Updated contract for ${userName}`);
        } else {
            addContract({ ...form, rate: parseInt(form.rate) });
            const userName = users.find((u) => u.id === form.userId)?.name;
            toast.success(`Contract created for ${userName}`);
        }
        setOpen(false);
        setEditId(null);
        resetForm();
    };

    const handleDelete = (id: string) => {
        const contract = contracts.find((c) => c.id === id);
        const userName = users.find((u) => u.id === contract?.userId)?.name;
        deleteContract(id);
        toast.success(`Deleted contract for ${userName}`);
    };

    return (
        <div className="space-y-6">
            <PageHeader title="Contract Management" description={`${contracts.length} contracts`}>
                <Button size="sm" className="gap-1 bg-gradient-to-r from-[#2568C1] to-[#1a4f99]" onClick={() => { resetForm(); setEditId(null); setOpen(true); }}>
                    <Plus className="h-3 w-3" /> New Contract
                </Button>
            </PageHeader>
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead><TableHead>Type</TableHead><TableHead>Period</TableHead><TableHead>Rate</TableHead><TableHead>Status</TableHead><TableHead className="w-24">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {contracts.map((c) => {
                                const user = users.find((u) => u.id === c.userId);
                                return (
                                    <TableRow key={c.id}>
                                        <TableCell className="font-medium text-sm">{user?.name || "Unknown"}</TableCell>
                                        <TableCell><Badge variant="outline" className="text-[10px]">{c.type}</Badge></TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{c.startDate} → {c.endDate}</TableCell>
                                        <TableCell className="text-sm">Rp {c.rate.toLocaleString()} / {c.rateType}</TableCell>
                                        <TableCell><Badge variant={c.status === "active" ? "secondary" : c.status === "pending" ? "outline" : "destructive"} className="text-[10px]">{c.status}</Badge></TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(c.id)}><Edit className="h-3.5 w-3.5" /></Button>
                                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => handleDelete(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>{editId ? "Edit Contract" : "New Contract"}</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <label className="text-sm font-medium mb-1 block">Employee *</label>
                            <Select value={form.userId} onValueChange={(v) => setForm({ ...form, userId: v })}>
                                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                                <SelectContent>{users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name} — {u.position}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Type</label>
                                <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="full-time">Full-Time</SelectItem><SelectItem value="freelance">Freelance</SelectItem><SelectItem value="contract">Contract</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Rate Type</label>
                                <Select value={form.rateType} onValueChange={(v: any) => setForm({ ...form, rateType: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent><SelectItem value="hourly">Hourly</SelectItem><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="project">Project</SelectItem></SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div><label className="text-sm font-medium mb-1 block">Rate (Rp) *</label><Input type="number" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} placeholder="15000000" /></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div><label className="text-sm font-medium mb-1 block">Start Date *</label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
                            <div><label className="text-sm font-medium mb-1 block">End Date</label><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
                        </div>
                        {editId && (
                            <div>
                                <label className="text-sm font-medium mb-1 block">Status</label>
                                <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="expired">Expired</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setOpen(false); setEditId(null); resetForm(); }}>Cancel</Button>
                        <Button onClick={handleSave} className="bg-gradient-to-r from-[#2568C1] to-[#1a4f99]">{editId ? "Save Changes" : "Create Contract"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
