"use client";

import React from "react";
import { Search, RotateCcw, PackageX, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrashResource } from "@/lib/services/trash-service";
import { RestoreItem } from "../hooks/useTrashData";
import { formatRupiah, formatDate } from "@/lib/utils";

interface DeletedResourcesTabProps {
    resources: TrashResource[];
    totalResources: number;
    page: number;
    setPage: (p: number) => void;
    limit: number;
    setLimit: (l: number) => void;
    totalPages: number;
    searchQuery: string;
    onSearchChange: (q: string) => void;
    onRestore: (item: RestoreItem) => void;
    isLoading: boolean;
}

export function DeletedResourcesTab({
    resources,
    totalResources,
    page,
    setPage,
    limit,
    setLimit,
    totalPages,
    searchQuery,
    onSearchChange,
    onRestore,
    isLoading
}: DeletedResourcesTabProps) {
    return (
        <div className="bg-white border border-slate-100 shadow-sm rounded-xl overflow-hidden flex flex-col">
            {/* Table Header Filter */}
            <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Deleted Resource Requests ({totalResources})
                    </span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="w-full sm:w-72">
                        <div className="p-0.5 rounded-lg">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                                <Input
                                    placeholder="Search deleted requests..."
                                    value={searchQuery}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                    className="pl-9 h-9 text-xs bg-slate-50/50 border-slate-200 focus-visible:ring-2 focus-visible:ring-[#2568C1] focus-visible:border-[#2568C1] rounded-lg"
                                />
                            </div>
                        </div>
                    </div>
                    {/* Rows per page selector: 10, 20, 50, 100 */}
                    <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
                        <SelectTrigger className="h-9 w-[75px] bg-white text-xs border-slate-200 shrink-0">
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

            {/* Table Content */}
            {isLoading ? (
                <div className="p-12 text-center text-xs text-slate-400">Loading deleted requests...</div>
            ) : totalResources === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center">
                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                        <PackageX className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">No deleted requests found</p>
                    <p className="text-xs text-slate-400 mt-1">
                        {searchQuery ? "No results match your search query." : "Trash is currently empty for resource requests."}
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                <th className="py-3 px-5">Request Details</th>
                                <th className="py-3 px-4">Requestor / Project</th>
                                <th className="py-3 px-4">Type &amp; Amount</th>
                                <th className="py-3 px-4">Deleted At</th>
                                <th className="py-3 px-5 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                            {resources.map((req) => (
                                <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                                    <td className="py-3 px-5">
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-semibold text-slate-900 truncate">
                                                {req.details || `Request #${req.id}`}
                                            </span>
                                            <span className="text-[10px] text-slate-400">
                                                ID: #{req.id}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-medium text-slate-800">
                                                {req.user_name || `User #${req.user_id}`}
                                            </span>
                                            <span className="text-[11px] text-slate-400">
                                                {req.project_name || `Project #${req.project_id}`}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex flex-col gap-1 items-start">
                                            <Badge variant="outline" className="text-[10px] font-semibold border-slate-200 capitalize">
                                                {req.type}
                                            </Badge>
                                            <span className="font-mono font-medium text-slate-800 text-[11px]">
                                                {formatRupiah(req.amount)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                                        {req.deleted_at ? formatDate(req.deleted_at) : "—"}
                                    </td>
                                    <td className="py-3 px-5 text-right">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onRestore({
                                                type: "resources",
                                                id: req.id,
                                                title: `Request #${req.id}: ${req.details}`,
                                                subtitle: `${req.project_name || "Project"} • ${formatRupiah(req.amount)}`
                                            })}
                                            className="h-7 px-2.5 text-xs text-[#2568C1] border-blue-200 hover:bg-blue-50 hover:text-[#1e56a6] rounded-md gap-1.5 font-medium"
                                        >
                                            <RotateCcw className="h-3.5 w-3.5" />
                                            Restore
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination Footer */}
            {!isLoading && totalPages > 0 && totalResources > 0 && (
                <div className="border-t border-[#e2e8f0] bg-slate-50/30 px-5 py-3.5 flex items-center justify-between">
                    <div className="text-xs text-slate-500 font-medium">
                        Showing <span className="text-slate-900">{(page - 1) * limit + 1}</span> to <span className="text-slate-900">{Math.min(page * limit, totalResources)}</span> of <span className="text-slate-900">{totalResources}</span> requests
                    </div>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-8 p-0 border-slate-200 rounded-md" 
                            disabled={page <= 1} 
                            onClick={() => setPage(page - 1)}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="text-xs font-semibold px-2 text-slate-700">
                            Page {page} of {totalPages}
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-8 p-0 border-slate-200 rounded-md" 
                            disabled={page >= totalPages} 
                            onClick={() => setPage(page + 1)}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
