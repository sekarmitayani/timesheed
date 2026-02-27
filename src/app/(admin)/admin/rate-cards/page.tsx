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

export default function RateCardsPage() {
    const rateCards = useDataStore((s) => s.rateCards);
    const addRateCard = useDataStore((s) => s.addRateCard);
    const updateRateCard = useDataStore((s) => s.updateRateCard);
    const deleteRateCard = useDataStore((s) => s.deleteRateCard);

    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState({ role: "", level: "Mid", hourly: "", monthly: "" });

    const resetForm = () => setForm({ role: "", level: "Mid", hourly: "", monthly: "" });

    const openEdit = (rcId: string) => {
        const rc = rateCards.find((r) => r.id === rcId);
        if (rc) {
            setForm({ role: rc.role, level: rc.level, hourly: String(rc.hourly), monthly: String(rc.monthly) });
            setEditId(rcId);
            setOpen(true);
        }
    };

    const handleSave = () => {
        if (!form.role) { toast.error("Role is required"); return; }
        if (editId) {
            updateRateCard(editId, { role: form.role, level: form.level, hourly: parseInt(form.hourly) || 0, monthly: parseInt(form.monthly) || 0 });
            toast.success(`Updated rate for ${form.role}`);
        } else {
            addRateCard({ role: form.role, level: form.level, hourly: parseInt(form.hourly) || 0, monthly: parseInt(form.monthly) || 0 });
            toast.success(`Added rate for ${form.role}`);
        }
        setOpen(false); setEditId(null); resetForm();
    };

    const handleDelete = (id: string, role: string) => {
        deleteRateCard(id);
        toast.success(`Removed rate for ${role}`);
    };

    return (
        <div className="space-y-6">
            <PageHeader title="Rate Cards" description={`${rateCards.length} rate cards`}>
                <Button size="sm" className="gap-1 bg-gradient-to-r from-[#2568C1] to-[#1a4f99]" onClick={() => { resetForm(); setEditId(null); setOpen(true); }}>
                    <Plus className="h-3 w-3" /> Add Rate
                </Button>
            </PageHeader>
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow><TableHead>Role</TableHead><TableHead>Level</TableHead><TableHead>Hourly Rate</TableHead><TableHead>Monthly Rate</TableHead><TableHead className="w-20">Actions</TableHead></TableRow>
                        </TableHeader>
                        <TableBody>
                            {rateCards.map((rc) => (
                                <TableRow key={rc.id}>
                                    <TableCell className="font-medium text-sm">{rc.role}</TableCell>
                                    <TableCell><Badge variant="outline" className="text-[10px]">{rc.level}</Badge></TableCell>
                                    <TableCell className="text-sm">Rp {rc.hourly.toLocaleString()}</TableCell>
                                    <TableCell className="text-sm">Rp {rc.monthly.toLocaleString()}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(rc.id)}><Edit className="h-3.5 w-3.5" /></Button>
                                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => handleDelete(rc.id, rc.role)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>{editId ? "Edit Rate Card" : "Add Rate Card"}</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <div><label className="text-sm font-medium mb-1 block">Role *</label><Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="e.g., DevOps Engineer" /></div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">Level</label>
                            <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent><SelectItem value="Junior">Junior</SelectItem><SelectItem value="Mid">Mid</SelectItem><SelectItem value="Senior">Senior</SelectItem><SelectItem value="Lead">Lead</SelectItem></SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div><label className="text-sm font-medium mb-1 block">Hourly (Rp)</label><Input type="number" value={form.hourly} onChange={(e) => setForm({ ...form, hourly: e.target.value })} placeholder="150000" /></div>
                            <div><label className="text-sm font-medium mb-1 block">Monthly (Rp)</label><Input type="number" value={form.monthly} onChange={(e) => setForm({ ...form, monthly: e.target.value })} placeholder="15000000" /></div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setOpen(false); setEditId(null); resetForm(); }}>Cancel</Button>
                        <Button onClick={handleSave} className="bg-gradient-to-r from-[#2568C1] to-[#1a4f99]">{editId ? "Save" : "Add Rate"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
