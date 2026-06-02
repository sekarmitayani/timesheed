import { LiabilityGroup } from "@/lib/services/management-service";
import { formatRupiah } from "@/lib/utils";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { FolderKanban, Eye, FileText } from "lucide-react";

interface LiabilityAccordionProps {
    groups: LiabilityGroup[];
    onViewDetail: (contractId: number) => void;
}

export function LiabilityAccordion({ groups, onViewDetail }: LiabilityAccordionProps) {
    if (!groups || groups.length === 0) {
        return (
            <div className="text-center py-10 bg-white rounded-lg border border-slate-200">
                <p className="text-slate-500">No liability data available.</p>
            </div>
        );
    }

    const getPastelBg = (index: number) => {
        const bgs = [
            "bg-slate-50/70 hover:bg-slate-50",
            "bg-blue-50/70 hover:bg-blue-50",
            "bg-indigo-50/70 hover:bg-indigo-50",
            "bg-emerald-50/70 hover:bg-emerald-50",
        ];
        return bgs[index % bgs.length];
    };

    // Sort to ensure Base Contract (project_id null) is always on top
    const sortedGroups = [...groups].sort((a, b) => {
        if (a.project_id === null) return -1;
        if (b.project_id === null) return 1;
        return 0;
    });

    return (
        <div className="space-y-4">
            <Accordion type="single" collapsible className="space-y-3">
                {sortedGroups.map((group, index) => {
                    const accordionValue = `item-${group.project_id !== null ? group.project_id : 'base'}`;
                    
                    return (
                        <AccordionItem
                            key={accordionValue}
                            value={accordionValue}
                            className={`border border-[#E2E8F0] rounded-md overflow-hidden shadow-sm transition-all ${getPastelBg(index)}`}
                        >
                            <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                <div className="flex flex-col md:flex-row md:items-center justify-between w-full pr-4 text-left gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-sm text-slate-800">{group.project_name}</span>
                                            <Badge variant="outline" className="text-[9px] uppercase font-bold bg-white/80">
                                                {group.members.length} Users
                                            </Badge>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4 mt-4 w-full md:w-auto md:flex md:flex-nowrap md:items-center md:gap-6 md:mt-0">
                                        <div className="text-left md:text-right border-r-0 md:border-r border-[#E2E8F0] md:pr-6">
                                            <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tight">Released</p>
                                            <p className="text-xs font-bold text-emerald-600">{formatRupiah(group.released)}</p>
                                        </div>
                                        <div className="text-left md:text-right">
                                            <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tight">Liability</p>
                                            <p className="text-xs font-bold text-slate-700">{formatRupiah(group.liability)}</p>
                                        </div>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            
                            <AccordionContent className="bg-white p-0 border-t border-[#E2E8F0]">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="hover:bg-transparent bg-slate-50/50 border-b border-slate-200">
                                                <TableHead className="pl-6 text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">User Name</TableHead>
                                                <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Contract Type</TableHead>
                                                <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10 text-right">Rate</TableHead>
                                                <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10 text-right">Released</TableHead>
                                                <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10 text-right">Liability</TableHead>
                                                <TableHead className="w-[100px] text-right pr-6 text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {group.members.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-6 text-slate-500">
                                                        No users found.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                group.members.map((member) => (
                                                    <TableRow key={member.contract_id} className="hover:bg-[#f0f4fa]/50 transition-colors border-b border-slate-100 last:border-0">
                                                        <TableCell className="pl-6 font-semibold text-slate-900 text-sm">
                                                            {member.full_name}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex gap-2">
                                                                <Badge variant="outline" className="text-[9px] uppercase font-bold bg-slate-50 text-slate-600 border-slate-200">
                                                                    {member.contract_type.replace(/_/g, " ")}
                                                                </Badge>
                                                                <Badge variant="outline" className="text-[9px] uppercase font-bold bg-blue-50/50 text-blue-600 border-blue-100">
                                                                    {member.payment_scheme.replace(/_/g, " ")}
                                                                </Badge>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium text-slate-700 text-sm">
                                                            {formatRupiah(member.rate_amount)}
                                                        </TableCell>
                                                        <TableCell className="text-right font-bold text-emerald-600 text-sm">
                                                            {formatRupiah(member.total_released)}
                                                        </TableCell>
                                                        <TableCell className="text-right font-bold text-slate-700 text-sm">
                                                            {formatRupiah(member.total_liability)}
                                                        </TableCell>
                                                        <TableCell className="text-right pr-6">
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon"
                                                                className="h-8 w-8 rounded-full text-[#2568C1] hover:bg-blue-50"
                                                                onClick={() => onViewDetail(member.contract_id)}
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    );
                })}
            </Accordion>
        </div>
    );
}
