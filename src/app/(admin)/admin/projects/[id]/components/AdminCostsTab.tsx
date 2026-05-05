"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { CostEntry } from "../hooks/useAdminProjectDetailData";

interface AdminCostsTabProps {
    costs: CostEntry[];
    filterType: string;
    setFilterType: (v: any) => void;
    filterStart: string;
    setFilterStart: (v: string) => void;
    filterEnd: string;
    setFilterEnd: (v: string) => void;
}

export function AdminCostsTab({
    costs, filterType, setFilterType, filterStart, setFilterStart, filterEnd, setFilterEnd
}: AdminCostsTabProps) {
    const total = costs.reduce((sum, c) => sum + c.amount, 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h2 className="text-[15px] font-bold text-slate-800">Project Cost Breakdown</h2>
                    <p className="text-xs text-slate-500">Comprehensive log of salaries and approved resources.</p>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-[140px] h-9 text-xs bg-white border-slate-200 rounded-[6px] shadow-none"><SelectValue placeholder="Type" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Costs</SelectItem>
                            <SelectItem value="Gaji">Gaji</SelectItem>
                            <SelectItem value="Resource">Resource</SelectItem>
                        </SelectContent>
                    </Select>
                    <Input type="date" className="w-[140px] h-9 text-xs bg-white border-slate-200 rounded-[6px] shadow-none text-slate-600 font-medium" value={filterStart} onChange={e => setFilterStart(e.target.value)} />
                    <span className="text-slate-400 font-bold text-xs px-1">TO</span>
                    <Input type="date" className="w-[140px] h-9 text-xs bg-white border-slate-200 rounded-[6px] shadow-none text-slate-600 font-medium" value={filterEnd} onChange={e => setFilterEnd(e.target.value)} />
                </div>
            </div>

            <Card className="border-[#E2E8F0] shadow-sm rounded-xl overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="border-b border-slate-100 h-11">
                                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-500 w-12 text-center">No</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-500 w-28">Date</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-500 w-32 text-center">Type</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-500">Description</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-500 min-w-[150px]">User</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-500 text-right min-w-[120px] pr-6">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {costs.length === 0 ? (
                                    <TableRow><TableCell colSpan={6} className="h-32 text-center text-slate-400 font-medium text-sm">No records found for the selected filters.</TableCell></TableRow>
                                ) : (
                                    <>
                                        {costs.map((c, index) => (
                                            <TableRow key={c.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                <TableCell className="py-4 text-xs text-slate-500 font-bold text-center">{index + 1}</TableCell>
                                                <TableCell className="py-4 text-xs text-slate-600 font-bold">{c.date}</TableCell>
                                                <TableCell className="py-4 text-center">
                                                    <Badge variant="outline" className={`uppercase text-[9px] font-black px-2 py-0.5 tracking-tighter w-fit rounded-full border-none shadow-none ${c.type === 'Gaji' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'}`}>{c.type}</Badge>
                                                </TableCell>
                                                <TableCell className="py-4 font-bold text-sm text-slate-800">{c.name}</TableCell>
                                                <TableCell className="py-4 text-xs text-slate-500 font-bold">{c.user}</TableCell>
                                                <TableCell className="py-4 text-sm font-black text-slate-900 text-right pr-6">Rp {c.amount.toLocaleString("id-ID")}</TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow className="bg-slate-50/80">
                                            <TableCell colSpan={5} className="py-5 font-black text-right text-slate-400 uppercase tracking-widest text-[10px]">Grand Total Overview</TableCell>
                                            <TableCell className="py-5 font-black text-[#2568C1] text-right text-base pr-6">Rp {total.toLocaleString("id-ID")}</TableCell>
                                        </TableRow>
                                    </>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
