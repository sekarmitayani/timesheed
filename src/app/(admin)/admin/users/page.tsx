"use client";

import { useState } from "react";
import { UserCog, Plus, Trash2, Edit, Search, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/ai/ai-components";
import { useDataStore } from "@/store/useDataStore";
import { Role } from "@/lib/types";
import { toast } from "sonner";

export default function UsersPage() {
    const users = useDataStore((s) => s.users);
    const addUser = useDataStore((s) => s.addUser);
    const updateUser = useDataStore((s) => s.updateUser);
    const deleteUser = useDataStore((s) => s.deleteUser);
    const rateCards = useDataStore((s) => s.rateCards);

    const [search, setSearch] = useState("");
    const [addOpen, setAddOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState({ name: "", email: "", username: "", password: "", role: "employee" as Role, department: "", position: "", hourlyRate: "" });
    const [selectedRateCard, setSelectedRateCard] = useState<string>("");

    const filtered = users.filter((u) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.role.toLowerCase().includes(search.toLowerCase())
    );

    const resetForm = () => { setForm({ name: "", email: "", username: "", password: "", role: "employee", department: "", position: "", hourlyRate: "" }); setSelectedRateCard(""); };

    const openEdit = (userId: string) => {
        const u = users.find((u) => u.id === userId);
        if (u) {
            setForm({ name: u.name, email: u.email, username: u.username, password: u.password, role: u.role, department: u.department, position: u.position, hourlyRate: String(u.hourlyRate) });
            setSelectedRateCard("");
            setEditId(userId);
            setAddOpen(true);
        }
    };

    const handleRateCardSelect = (rcId: string) => {
        if (rcId === "manual") {
            setSelectedRateCard("manual");
            return;
        }
        const rc = rateCards.find((r) => r.id === rcId);
        if (rc) {
            setSelectedRateCard(rcId);
            setForm((prev) => ({ ...prev, position: rc.role, hourlyRate: String(rc.hourly) }));
        }
    };

    const handleSave = () => {
        if (!form.name || !form.email || (!editId && (!form.username || !form.password))) { toast.error("Name, email, username and password are required"); return; }
        if (editId) {
            updateUser(editId, { ...form, hourlyRate: parseInt(form.hourlyRate) || 0 });
            toast.success(`Updated ${form.name}`);
        } else {
            addUser({ ...form, hourlyRate: parseInt(form.hourlyRate) || 0, joinDate: new Date().toISOString().split("T")[0], status: "active", avatar: "" });
            toast.success(`Added ${form.name}`);
        }
        setAddOpen(false);
        setEditId(null);
        resetForm();
    };

    const handleDelete = (id: string, name: string) => {
        deleteUser(id);
        toast.success(`Removed ${name}`);
    };

    return (
        <div className="space-y-6">
            <PageHeader title="User Management" description={`${users.length} total users`}>
                <Button size="sm" className="gap-1 bg-gradient-to-r from-[#2568C1] to-[#1a4f99]" onClick={() => { resetForm(); setEditId(null); setAddOpen(true); }}>
                    <Plus className="h-3 w-3" /> Add User
                </Button>
            </PageHeader>

            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search users..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Rate</TableHead>
                                <TableHead className="w-24">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8"><AvatarFallback className="text-xs bg-gradient-to-br from-[#2568C1] to-[#1a4f99] text-white">{user.name.split(" ").map(n => n[0]).join("")}</AvatarFallback></Avatar>
                                            <div><p className="text-sm font-medium">{user.name}</p><p className="text-xs text-muted-foreground">{user.email}</p></div>
                                        </div>
                                    </TableCell>
                                    <TableCell><Badge variant="outline" className="capitalize text-xs">{user.role}</Badge></TableCell>
                                    <TableCell className="text-sm">{user.department}</TableCell>
                                    <TableCell><Badge className={`text-[10px] ${user.status === "active" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>{user.status}</Badge></TableCell>
                                    <TableCell className="text-sm">Rp {(user.hourlyRate).toLocaleString()}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(user.id)}><Edit className="h-3.5 w-3.5" /></Button>
                                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => handleDelete(user.id, user.name)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Add/Edit Dialog */}
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>{editId ? "Edit User" : "Add New User"}</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <label className="text-sm font-medium mb-1 block">Full Name *</label>
                            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">Email *</label>
                            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@company.com" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Username *</label>
                                <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="johndoe" />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Password *</label>
                                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Role</label>
                                <Select value={form.role} onValueChange={(v: any) => setForm({ ...form, role: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="employee">Employee</SelectItem>
                                        <SelectItem value="pm">Project Manager</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="management">Management</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Department</label>
                                <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="Engineering" />
                            </div>
                        </div>

                        {/* Rate Card Selector */}
                        <div className="p-3 rounded-lg border bg-muted/30 space-y-3">
                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                <CreditCard className="h-3.5 w-3.5" />
                                Position & Rate — Choose from Rate Card or enter manually
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Rate Card</label>
                                <Select value={selectedRateCard} onValueChange={handleRateCardSelect}>
                                    <SelectTrigger><SelectValue placeholder="Select a rate card..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="manual">✏️ Enter Manually</SelectItem>
                                        {rateCards.map((rc) => (
                                            <SelectItem key={rc.id} value={rc.id}>
                                                {rc.role} ({rc.level}) — Rp {rc.hourly.toLocaleString()}/hr
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Position</label>
                                    <Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="Developer" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Hourly Rate (Rp)</label>
                                    <Input type="number" value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })} placeholder="150000" />
                                </div>
                            </div>
                            {selectedRateCard && selectedRateCard !== "manual" && (
                                <p className="text-[10px] text-muted-foreground">
                                    ✓ Auto-filled from rate card. You can still adjust the values above.
                                </p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setAddOpen(false); setEditId(null); resetForm(); }}>Cancel</Button>
                        <Button onClick={handleSave} className="bg-gradient-to-r from-[#2568C1] to-[#1a4f99]">{editId ? "Save Changes" : "Add User"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
