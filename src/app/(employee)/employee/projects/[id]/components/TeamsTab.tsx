"use client";

import { useState } from "react";
import { ProjectMember } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Phone, MailIcon, Users } from "lucide-react";

interface TeamsTabProps {
    members: ProjectMember[];
}

export function TeamsTab({ members }: TeamsTabProps) {
    const [selectedMember, setSelectedMember] = useState<ProjectMember | null>(null);

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const formatRoleLabel = (role: string) => {
        return role
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());
    };

    return (
        <div className="space-y-6 pb-10">
            {/* Summary */}
            <Card className="border-[#E2E8F0] shadow-sm rounded-xl">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                        <Users className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[15px] font-bold text-slate-800 leading-tight">{members.length} members</span>
                        <span className="text-[11px] font-medium text-slate-400">assigned to this project</span>
                    </div>
                </CardContent>
            </Card>

            {/* Members Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {members.map((member) => {
                    const name = member.user?.full_name || `User ${member.user_id}`;
                    return (
                        <Card
                            key={member.id}
                            onClick={() => setSelectedMember(member)}
                            className="border-[#E2E8F0] shadow-sm rounded-xl cursor-pointer hover:border-[#4B7BEC]/30 hover:shadow-md transition-all group"
                        >
                            <CardContent className="p-5 flex items-center gap-4">
                                <Avatar className="h-11 w-11 border border-slate-100 shadow-sm">
                                    <AvatarFallback className="text-xs font-bold bg-white text-slate-600">
                                        {getInitials(name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-bold text-slate-800 truncate group-hover:text-[#4B7BEC] transition-colors">{name}</span>
                                    <span className="text-[11px] font-medium text-slate-500">
                                        {formatRoleLabel(member.role_in_project)}
                                    </span>
                                    {member.user?.email && (
                                        <span className="text-[11px] font-medium text-slate-400 truncate mt-0.5">{member.user.email}</span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {members.length === 0 && (
                <Card className="border-[#E2E8F0] shadow-sm rounded-xl">
                    <CardContent className="py-12 flex flex-col items-center justify-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                            <Users className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-medium text-slate-400">No team members assigned to this project.</p>
                    </CardContent>
                </Card>
            )}

            {/* Member Detail Dialog */}
            <Dialog open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Team Member Details</DialogTitle>
                        <DialogDescription>
                            Contact information and role in this project.
                        </DialogDescription>
                    </DialogHeader>
                    
                    {selectedMember && (
                        <div className="flex flex-col gap-6 py-4">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12 border border-slate-100 shadow-sm">
                                    <AvatarFallback className="text-sm font-bold bg-slate-50 text-slate-600">
                                        {getInitials(selectedMember.user?.full_name || `User ${selectedMember.user_id}`)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">
                                        {selectedMember.user?.full_name || `User ${selectedMember.user_id}`}
                                    </h3>
                                    <Badge className="mt-1 bg-[#4B7BEC]/10 text-[#4B7BEC] border-none shadow-none hover:bg-[#4B7BEC]/20">
                                        {formatRoleLabel(selectedMember.role_in_project)}
                                    </Badge>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 rounded-lg border border-slate-100 bg-slate-50 p-4">
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center border border-slate-200 text-slate-500">
                                        <MailIcon className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Email</span>
                                        <span className="font-medium text-slate-700">{selectedMember.user?.email || "No email provided"}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 text-sm">
                                    <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center border border-slate-200 text-slate-500">
                                        <Phone className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Phone</span>
                                        <span className="font-medium text-slate-700">{selectedMember.user?.phone_number || "-"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
