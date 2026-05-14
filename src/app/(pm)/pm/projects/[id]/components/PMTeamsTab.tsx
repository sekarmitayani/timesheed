"use client";

import { useState } from "react";
import { ProjectMember } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import { 
    Users, 
    Search, 
    Crown, 
    Mail, 
    Phone, 
    Calendar
} from "lucide-react";

interface PMTeamsTabProps {
    members: ProjectMember[];
    search: string;
    setSearch: (v: string) => void;
}

export function PMTeamsTab({
    members, search, setSearch
}: PMTeamsTabProps) {
    const [selectedMember, setSelectedMember] = useState<ProjectMember | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const getInitials = (name: string) => (name || "?").split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();

    const handleCardClick = (member: ProjectMember) => {
        setSelectedMember(member);
        setIsDetailOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <h2 className="text-[15px] font-bold text-slate-800">Project Members</h2>
                        <Badge variant="secondary" className="text-[10px] font-bold bg-slate-100 text-slate-500 rounded-full">{members.length}</Badge>
                    </div>
                    <p className="text-xs text-slate-500">View team roles and project assignments.</p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto mr-4">
                    <div className="relative flex-1 sm:w-[240px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                            placeholder="Search team..." 
                            className="pl-9 h-10 text-xs border-[#E2E8F0] rounded-[8px] bg-white shadow-none focus-visible:ring-[#2568C1]"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {members.map((member) => (
                    <Card
                        key={member.id}
                        className="border-[#E2E8F0] shadow-sm rounded-xl hover:border-[#4B7BEC]/30 hover:shadow-md transition-all group cursor-pointer"
                        onClick={() => handleCardClick(member)}
                    >
                        <CardContent className="p-5 flex items-center gap-4">
                            <Avatar className="h-11 w-11 border border-slate-100 shadow-sm">
                                <AvatarFallback className="text-xs font-bold bg-gradient-to-br from-[#2568C1] to-[#1a4f99] text-white">
                                    {getInitials(member.user?.full_name || "")}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-slate-800 truncate">{member.user?.full_name || `User #${member.user_id}`}</span>
                                    {member.role_in_project === "Project Manager" && <Crown className="h-3 w-3 text-amber-500 shrink-0" />}
                                </div>
                                <span className="text-[11px] font-bold text-[#4B7BEC] uppercase tracking-wider block mt-0.5">
                                    {member.role_in_project}
                                </span>
                                {member.user?.email && (
                                    <span className="text-[11px] font-medium text-slate-400 truncate block mt-0.5">{member.user.email}</span>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {members.length === 0 && (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                        <Users className="h-10 w-10 text-slate-200" />
                        <p className="text-sm font-medium text-slate-400">No members match your criteria.</p>
                    </div>
                )}
            </div>

            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="sm:max-w-[425px] p-6 bg-white rounded-xl shadow-xl border border-slate-100">
                    <DialogHeader className="flex flex-row items-start gap-4 space-y-0 pb-4 border-b border-slate-100">
                        <Avatar className="h-16 w-16 border-2 border-slate-50 shadow-sm">
                            <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-[#2568C1] to-[#1a4f99] text-white">
                                {getInitials(selectedMember?.user?.full_name || "")}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col pt-1">
                            <DialogTitle className="text-lg font-bold text-slate-800">
                                {selectedMember?.user?.full_name}
                            </DialogTitle>
                            <DialogDescription className="text-xs font-bold text-[#4B7BEC] uppercase tracking-widest mt-1">
                                {selectedMember?.role_in_project}
                            </DialogDescription>
                        </div>
                    </DialogHeader>

                    <div className="space-y-3 py-2">
                        <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <Mail className="h-4 w-4 text-slate-400" />
                                <span className="text-xs font-semibold text-slate-700">{selectedMember?.user?.email || "No email"}</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <Phone className="h-4 w-4 text-slate-400" />
                                <span className="text-xs font-semibold text-slate-700">{selectedMember?.user?.phone_number || "No phone"}</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <Calendar className="h-4 w-4 text-slate-400" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assigned On</span>
                                    <span className="text-xs font-semibold text-slate-700">{selectedMember?.joined_at ? new Date(selectedMember.joined_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "Unknown"}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                        <Button variant="outline" className="h-9 px-6 rounded-lg text-xs font-bold border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700" onClick={() => setIsDetailOpen(false)}>
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
