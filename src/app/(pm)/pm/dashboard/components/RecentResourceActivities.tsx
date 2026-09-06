"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, XCircle, Package, Calendar } from "lucide-react";
import { ResourceRequest } from "@/lib/services/resource-service";

interface RecentResourceActivitiesProps {
    activities: ResourceRequest[];
}

export function RecentResourceActivities({ activities }: RecentResourceActivitiesProps) {
    // Limit to exactly 5 items
    const displayActivities = activities.slice(0, 5);

    return (
        <Card className="bg-white border-slate-100 shadow-sm rounded-xl h-full overflow-hidden flex flex-col hover:shadow-md transition-shadow p-0 py-0 gap-0">
            <CardHeader className="px-5 py-5 border-b border-slate-100 [&.border-b]:pb-5 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <Package className="h-5 w-5 text-[#4B7BEC] shrink-0" />
                    <div className="flex flex-col">
                        <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
                            Recent Resource Activity
                        </CardTitle>
                        <p className="text-[10px] text-slate-400 font-medium leading-none mt-1">
                            Latest updates on resource requests
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col justify-between">
                <div className="p-3 sm:p-4 flex-1">
                {displayActivities.length === 0 ? (
                    <p className="text-xs text-slate-500 py-6 text-center">No recent activity.</p>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {displayActivities.map(r => (
                            <div key={r.id} className="flex items-center gap-3 py-2.5 px-2 transition-all cursor-pointer group hover:bg-slate-50/30">
                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border ${
                                    r.status === "approved" ? "bg-emerald-50 border-emerald-100" :
                                    r.status === "rejected" ? "bg-red-50 border-red-100" :
                                    "bg-slate-100 border-slate-200"
                                }`}>
                                    {r.status === "approved" ? (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                    ) : r.status === "rejected" ? (
                                        <XCircle className="h-4 w-4 text-red-600" />
                                    ) : (
                                        <Clock className="h-4 w-4 text-slate-500" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-slate-800 truncate group-hover:text-[#4B7BEC] transition-colors">{r.details}</p>
                                    <div className="flex items-center gap-2 text-[9px] font-medium text-slate-400 uppercase tracking-tight mt-0.5">
                                        <span className="truncate">{r.user?.full_name || `User #${r.user_id}`}</span>
                                        <span className="shrink-0">·</span>
                                        <span className="shrink-0">{r.type}</span>
                                        <span className="shrink-0">·</span>
                                        <span className="flex items-center gap-1 shrink-0">
                                            <Calendar className="h-2.5 w-2.5" />
                                            {new Date(r.updated_at || r.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                </div>
                                <Badge variant="outline" className={`text-[8px] font-black uppercase tracking-tighter shrink-0 rounded-full px-2 py-0 border-none ${
                                    r.status === "approved" ? "bg-emerald-50 text-emerald-600" :
                                    r.status === "rejected" ? "bg-red-50 text-red-600" :
                                    "bg-slate-100 text-slate-500"
                                }`}>{r.status}</Badge>
                            </div>
                        ))}
                    </div>
                )}
                </div>
            </CardContent>
        </Card>
    );
}
