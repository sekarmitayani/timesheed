"use client";

import { Card, CardContent } from "@/components/ui/card";
import { 
    FolderKanban, 
    ListTodo, 
    ClipboardCheck, 
    Package 
} from "lucide-react";
import { useRouter } from "next/navigation";
import { PMDashboardData } from "../hooks/usePMDashboardData";

interface PMQuickStatsRowProps {
    stats: PMDashboardData["stats"];
}

export function PMQuickStatsRow({ stats }: PMQuickStatsRowProps) {
    const router = useRouter();

    const cardClass = "bg-white border border-slate-100 shadow-sm rounded-xl h-[100px] flex flex-col overflow-hidden hover:shadow-md transition-shadow cursor-pointer";

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Active Projects */}
            <Card className={cardClass} onClick={() => router.push("/pm/projects")}>
                <CardContent className="px-4 py-3 flex flex-row items-center gap-4 h-full">
                    <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-[#4B7BEC] shrink-0">
                        <FolderKanban className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Active Projects</p>
                        <div className="flex items-baseline gap-1.5 truncate">
                            <span className="text-2xl font-black text-slate-800 tracking-tight">{stats.activeProjectsCount}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 2. Total Tasks */}
            <Card className={cardClass} onClick={() => router.push("/pm/tasks")}>
                <CardContent className="px-4 py-3 flex flex-row items-center gap-4 h-full">
                    <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                        <ListTodo className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total Tasks</p>
                        <div className="flex items-baseline gap-1.5 truncate">
                            <span className="text-2xl font-black text-slate-800 tracking-tight">{stats.totalTasksCount}</span>
                            <span className="text-[10px] font-semibold text-slate-400">{stats.tasksDone} Done</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 3. Pending Timesheets */}
            <Card className={cardClass} onClick={() => router.push("/pm/approvals?status=pending")}>
                <CardContent className="px-4 py-3 flex flex-row items-center gap-4 h-full">
                    <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                        <ClipboardCheck className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Pending Approvals</p>
                        <div className="flex items-baseline gap-1.5 truncate">
                            <span className="text-2xl font-black text-slate-800 tracking-tight">{stats.pendingTimesheetsCount}</span>
                            <span className="text-[10px] font-semibold text-slate-400">Awaiting Review</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 4. Pending Resources */}
            <Card className={cardClass} onClick={() => router.push("/pm/resources")}>
                <CardContent className="px-4 py-3 flex flex-row items-center gap-4 h-full">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${stats.pendingResourcesCount > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'}`}>
                        <Package className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Pending Resources</p>
                        <div className={`text-2xl font-black tracking-tight truncate ${stats.pendingResourcesCount > 0 ? 'text-red-600' : 'text-[#4B7BEC]'}`}>
                            {stats.pendingResourcesCount}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
