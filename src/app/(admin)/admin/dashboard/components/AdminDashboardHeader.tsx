"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";

interface AdminDashboardHeaderProps {
    userName: string;
    pendingCount: number;
}

export function AdminDashboardHeader({ userName, pendingCount }: AdminDashboardHeaderProps) {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const hour = currentTime.getHours();
    let greeting = "Good evening";
    if (hour >= 0 && hour < 12) greeting = "Good morning";
    else if (hour >= 12 && hour < 17) greeting = "Good afternoon";

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                    {greeting}, {userName}
                </h1>
                <p className="text-sm font-medium text-slate-500">
                    You have <span className="font-bold text-[#4B7BEC]">{pendingCount}</span> pending resource requests.
                </p>
            </div>
            
            <div className="bg-white border border-slate-100 shadow-sm rounded-xl px-5 py-2.5 flex items-center gap-4 shrink-0 w-fit">
                <div className="text-2xl font-black text-slate-800 tracking-tight">
                    {format(currentTime, "HH:mm")}
                </div>
                <div className="w-px h-8 bg-slate-200" />
                <div className="flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {format(currentTime, "EEEE")}
                    </span>
                    <span className="text-sm font-bold text-slate-700 leading-none mt-0.5">
                        {format(currentTime, "d MMM yyyy")}
                    </span>
                </div>
            </div>
        </div>
    );
}
