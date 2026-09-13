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
    Mail, 
    Phone, 
    Calendar,
    Star
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
                    <div className="relative flex-1 sm:w-[240px] p-0.5">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        <Input 
                            placeholder="Search team..." 
                            className="pl-9 h-10 text-xs border-[#E2E8F0] rounded-[8px] bg-white shadow-none focus-visible:ring-2 focus-visible:ring-[#2568C1] focus-visible:border-[#2568C1]"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                {members.map((member) => (
                    <Card
                        key={member.id}
                        className="border-[#E2E8F0] bg-white shadow-2xs rounded-md hover:border-[#4B7BEC]/40 hover:shadow-xs transition-all group cursor-pointer p-0 py-0 gap-0 overflow-hidden"
                        onClick={() => handleCardClick(member)}
                    >
                        <CardContent className="p-3.5 sm:p-4 flex items-center gap-3.5">
                            <Avatar className="h-10 w-10 sm:h-11 sm:w-11 border border-slate-100 shadow-2xs shrink-0">
                                <AvatarFallback className="text-xs font-bold bg-gradient-to-br from-[#2568C1] to-[#1a4f99] text-white">
                                    {getInitials(member.user?.full_name || "")}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-slate-800 truncate leading-snug">{member.user?.full_name || `User #${member.user_id}`}</span>
                                </div>
                                <span className="text-[10px] sm:text-[11px] font-bold text-[#4B7BEC] uppercase tracking-wider block leading-tight mt-0.5 truncate">
                                    {member.role_in_project}
                                </span>
                                {member.user?.email && (
                                    <span className="text-[11px] font-medium text-slate-400 truncate block leading-tight mt-0.5">{member.user.email}</span>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {members.length === 0 && (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-100 rounded-md bg-slate-50/50">
                        <Users className="h-10 w-10 text-slate-200" />
                        <p className="text-sm font-medium text-slate-400">No members match your criteria.</p>
                    </div>
                )}
            </div>

            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="sm:max-w-[440px] p-0 gap-0 overflow-hidden border-[#e2e8f0] rounded-md shadow-xl bg-white">
                    <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 pr-12 py-4 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                            <Avatar className="h-12 w-12 border border-slate-200 shadow-sm shrink-0">
                                <AvatarFallback className="text-base font-bold bg-gradient-to-br from-[#2568C1] to-[#1a4f99] text-white">
                                    {getInitials(selectedMember?.user?.full_name || "")}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col min-w-0">
                                <DialogTitle className="text-base font-bold text-slate-800 truncate">
                                    {selectedMember?.user?.full_name}
                                </DialogTitle>
                                <DialogDescription className="text-xs font-bold text-[#4B7BEC] uppercase tracking-wider">
                                    {selectedMember?.role_in_project}
                                </DialogDescription>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 pt-3.5 pb-5 space-y-2.5">
                        <div className="flex items-center justify-between p-3 rounded-md border border-slate-100 bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <Mail className="h-4 w-4 text-slate-400" />
                                <span className="text-xs font-semibold text-slate-700">{selectedMember?.user?.email || "No email"}</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-md border border-slate-100 bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <Phone className="h-4 w-4 text-slate-400" />
                                <span className="text-xs font-semibold text-slate-700">{selectedMember?.user?.phone_number || "No phone"}</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-md border border-slate-100 bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <Star className="h-4 w-4 text-slate-400" />
                                <span className="text-xs font-semibold text-slate-700">
                                    {selectedMember?.user?.skill_level === 1 ? "Junior" : 
                                     selectedMember?.user?.skill_level === 2 ? "Mid-Level" : 
                                     selectedMember?.user?.skill_level === 3 ? "Senior" : "Skill Not Set"}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-md border border-slate-100 bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <Calendar className="h-4 w-4 text-slate-400" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assigned On</span>
                                    <span className="text-xs font-semibold text-slate-700">{selectedMember?.joined_at ? new Date(selectedMember.joined_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "Unknown"}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-3 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end">
                        <Button variant="outline" size="sm" onClick={() => setIsDetailOpen(false)} className="rounded-md">
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
