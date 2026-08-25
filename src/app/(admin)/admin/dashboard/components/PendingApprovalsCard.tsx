"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowRight, CheckCircle2, Users, Wrench } from "lucide-react";
import { useRouter } from "next/navigation";
import { ResourceRequest } from "@/lib/services/resource-service";

interface PendingApprovalsCardProps {
    requests: ResourceRequest[];
}

export function PendingApprovalsCard({ requests }: PendingApprovalsCardProps) {
    const router = useRouter();

    return (
        <Card className="bg-white border-slate-100 shadow-sm rounded-xl overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow p-0 py-0 gap-0">
            <CardHeader className="px-5 py-5 border-b border-slate-100 [&.border-b]:pb-5 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                    <div className="flex flex-col">
                        <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
                            Pending Approvals
                        </CardTitle>
                        <p className="text-[10px] text-slate-400 font-medium leading-none mt-1">
                            Resource requests awaiting administrative action
                        </p>
                    </div>
                </div>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-[9px] font-bold text-[#4B7BEC] gap-1 hover:bg-blue-50 px-2 uppercase tracking-widest" 
                    onClick={() => router.push("/admin/resources")}
                >
                    View All <ArrowRight className="h-3 w-3" />
                </Button>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col justify-between">
                <div className="p-3 sm:p-4 flex-1">
                {requests.length === 0 ? (
                    <div className="py-8 text-center">
                        <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2 opacity-50" />
                        <p className="text-xs text-slate-400 font-medium">All caught up! No pending approvals.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {requests.map(r => (
                            <div 
                                key={r.id} 
                                className="flex items-center gap-3 py-2.5 px-2 transition-all cursor-pointer group hover:bg-slate-50/30" 
                                onClick={() => router.push("/admin/resources")}
                            >
                                <div className="h-8 w-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                                    {r.type === "manpower" ? <Users className="h-4 w-4 text-amber-600" /> : <Wrench className="h-4 w-4 text-amber-600" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-slate-800 truncate group-hover:text-[#4B7BEC] transition-colors">{r.details}</p>
                                    <p className="text-[9px] text-slate-400 font-medium uppercase tracking-tight mt-0.5 truncate">
                                        {r.user?.full_name || `User #${r.user_id}`} · {r.project?.name || `Project #${r.project_id}`}
                                    </p>
                                </div>
                                <Badge variant="outline" className="text-[8px] font-black uppercase tracking-tighter rounded-full px-2 py-0 bg-amber-50 text-amber-600 border-none shrink-0">
                                    Pending
                                </Badge>
                            </div>
                        ))}
                    </div>
                )}
                </div>
            </CardContent>
        </Card>
    );
}
