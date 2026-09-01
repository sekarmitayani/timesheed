"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiProject } from "@/lib/types";
import { CustomDateRangePicker } from "@/app/(pm)/pm/approvals/components/CustomDateRangePicker";

interface TimesheetFiltersProps {
    dateFrom: string;
    setDateFrom: (val: string) => void;
    dateTo: string;
    setDateTo: (val: string) => void;
    filterProject: string;
    setFilterProject: (val: string) => void;
    filterStatus: string;
    setFilterStatus: (val: string) => void;
    limit: number;
    setLimit: (val: number) => void;
    projects: ApiProject[];
    resetFilters: () => void;
}

export function TimesheetFilters({
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    filterProject, setFilterProject,
    filterStatus, setFilterStatus,
    limit, setLimit,
    projects,
    resetFilters
}: TimesheetFiltersProps) {
    return (
        <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between pt-1">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
                {/* Unified Date Range & Frequency Picker */}
                <div className="w-full sm:w-auto shrink-0">
                    <CustomDateRangePicker 
                        dateFrom={dateFrom} 
                        dateTo={dateTo} 
                        onDateChange={(from, to) => {
                            setDateFrom(from);
                            setDateTo(to);
                        }} 
                    />
                </div>

                {/* 2-Column Grid on Mobile, Inline Flex on Tablet/Desktop */}
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
                    <Select value={filterProject} onValueChange={setFilterProject}>
                        <SelectTrigger className="w-full sm:w-[160px] h-10 bg-white text-sm border-slate-200 focus-visible:ring-[#2568C1]">
                            <SelectValue placeholder="All Projects" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Projects</SelectItem>
                            {projects.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-full sm:w-[130px] h-10 bg-white text-sm border-slate-200 focus-visible:ring-[#2568C1]">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
                        <SelectTrigger className="w-full sm:w-[75px] h-10 bg-white text-sm border-slate-200 focus-visible:ring-[#2568C1]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {[10, 20, 50, 100].map(v => (
                                <SelectItem key={v} value={String(v)} className="text-xs">{v}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}

