"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UserFiltersProps {
    search: string;
    setSearch: (v: string) => void;
    statusFilter: string;
    setStatusFilter: (v: string) => void;
    roleFilter: string;
    setRoleFilter: (v: string) => void;
    typeFilter: string;
    setTypeFilter: (v: string) => void;
    limit: number;
    setLimit: (v: number) => void;
    setPage: (v: number) => void;
}

export function UserFilters({
    search, setSearch,
    statusFilter, setStatusFilter,
    roleFilter, setRoleFilter,
    typeFilter, setTypeFilter,
    limit, setLimit, setPage
}: UserFiltersProps) {
    return (
        <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between pt-1">
            <div className="flex flex-wrap items-center gap-2 w-full">
                {/* Search Bar */}
                <div className="relative w-full sm:w-[240px] shrink-0 p-0.5">
                    <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                        placeholder="Search Users..."
                        className="pl-9 h-10 w-full bg-white border-slate-200 text-sm focus-visible:ring-2 focus-visible:ring-[#2568C1] focus-visible:border-[#2568C1]"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                    />
                </div>

                {/* 2-Column Grid on Mobile, Inline Flex on Tablet/Desktop */}
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
                    <Select 
                        value={statusFilter} 
                        onValueChange={(v) => { 
                            setStatusFilter(v); 
                            setPage(1); 
                        }}
                    >
                        <SelectTrigger className="h-10 w-full sm:w-[130px] bg-white text-sm border-slate-200">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select 
                        value={roleFilter} 
                        onValueChange={(v) => { 
                            setRoleFilter(v); 
                            setPage(1); 
                        }}
                    >
                        <SelectTrigger className="h-10 w-full sm:w-[155px] bg-white text-sm border-slate-200">
                            <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Roles</SelectItem>
                            <SelectItem value="employee">Employee</SelectItem>
                            <SelectItem value="projectmanager">Project Manager</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="management">Management</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select 
                        value={typeFilter} 
                        onValueChange={(v) => { 
                            setTypeFilter(v); 
                            setPage(1); 
                        }}
                    >
                        <SelectTrigger className="h-10 w-full sm:w-[135px] bg-white text-sm border-slate-200">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="fulltime">Full-time</SelectItem>
                            <SelectItem value="parttime">Part-time</SelectItem>
                            <SelectItem value="freelance">Freelance</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select 
                        value={String(limit)} 
                        onValueChange={(v) => { 
                            setLimit(Number(v)); 
                            setPage(1); 
                        }}
                    >
                        <SelectTrigger className="h-10 w-full sm:w-[75px] bg-white text-sm border-slate-200">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}
