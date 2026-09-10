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
import { Eye, FolderKanban } from "lucide-react";

interface LiabilityAccordionProps {
    groups: LiabilityGroup[];
    onViewDetail: (contractId: number) => void;
}

export function LiabilityAccordion({ groups, onViewDetail }: LiabilityAccordionProps) {
    if (!groups || groups.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-2">
                <FolderKanban className="h-8 w-8 text-slate-300" />
                <p className="text-sm font-medium text-slate-500">No liability or contract records match the active criteria.</p>
            </div>
        );
    }

    // Filter out deleted projects and sort to ensure Base Contract (project_id null) is always on top
    const sortedGroups = groups
        .filter((g) => !g.project_name.toLowerCase().includes("(deleted)"))
        .sort((a, b) => {
            if (a.project_id === null) return -1;
            if (b.project_id === null) return 1;
            return 0;
        });

    return (
        <div className="space-y-3">
            <Accordion type="single" collapsible className="space-y-3">
                {sortedGroups.map((group) => {
                    const accordionValue = `item-${group.project_id !== null ? group.project_id : "base"}`;
                    
                    return (
                        <AccordionItem
                            key={accordionValue}
                            value={accordionValue}
                            className="border border-slate-100 rounded-xl overflow-hidden shadow-xs bg-white transition-all"
                        >
                            <AccordionTrigger className="px-5 py-4 hover:no-underline bg-white hover:bg-slate-50/60 transition-colors">
                                <div className="flex flex-col md:flex-row md:items-center justify-between w-full pr-4 text-left gap-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#4B7BEC] shrink-0 font-bold text-xs">
                                            {group.project_id === null ? "★" : "#"}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm text-slate-900">{group.project_name}</span>
                                                <Badge variant="outline" className="text-[9px] uppercase font-bold bg-slate-50 text-slate-600 border-slate-200 h-4.5 px-1.5 py-0 leading-none">
                                                    {group.members.length} {group.members.length === 1 ? "Personnel" : "Staff"}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4 mt-2 w-full md:w-auto md:flex md:flex-nowrap md:items-center md:gap-6 md:mt-0">
                                        <div className="text-left md:text-right border-r-0 md:border-r border-slate-100 md:pr-6">
                                            <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Released</p>
                                            <p className="text-xs font-bold text-emerald-600 font-mono">{formatRupiah(group.released)}</p>
                                        </div>
                                        <div className="text-left md:text-right">
                                            <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Pending Liability</p>
                                            <p className="text-xs font-bold text-slate-800 font-mono">{formatRupiah(group.liability)}</p>
                                        </div>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            
                            <AccordionContent className="bg-white p-0 border-t border-slate-100">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="hover:bg-transparent bg-slate-50/50 border-b border-slate-100">
                                                <TableHead className="pl-6 text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Personnel Name</TableHead>
                                                <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Contract Scheme</TableHead>
                                                <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10 text-right">Agreed Rate</TableHead>
                                                <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10 text-right">Released</TableHead>
                                                <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10 text-right">Liability</TableHead>
                                                <TableHead className="w-[80px] text-right pr-6 text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {group.members.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-6 text-slate-400 text-xs">
                                                        No matching personnel found for this contract scope.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                group.members.map((member) => (
                                                    <TableRow key={member.contract_id} className="hover:bg-[#f0f4fa]/50 transition-colors border-b border-slate-100 last:border-0">
                                                        <TableCell className="pl-6">
                                                            <div className="font-semibold text-slate-900 text-xs">{member.full_name}</div>
                                                            <div className="text-[10px] text-slate-400 font-normal">{member.email}</div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                <Badge variant="outline" className="text-[9px] uppercase font-bold bg-slate-50 text-slate-600 border-slate-200">
                                                                    {member.contract_type.replace(/_/g, " ")}
                                                                </Badge>
                                                                <Badge variant="outline" className="text-[9px] uppercase font-bold bg-blue-50/50 text-[#4B7BEC] border-blue-100">
                                                                    {member.payment_scheme.replace(/_/g, " ")}
                                                                </Badge>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium text-slate-700 text-xs font-mono">
                                                            {formatRupiah(member.rate_amount)}
                                                        </TableCell>
                                                        <TableCell className="text-right font-bold text-emerald-600 text-xs font-mono">
                                                            {formatRupiah(member.total_released)}
                                                        </TableCell>
                                                        <TableCell className="text-right font-bold text-slate-800 text-xs font-mono">
                                                            {formatRupiah(member.total_liability)}
                                                        </TableCell>
                                                        <TableCell className="text-right pr-6">
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon"
                                                                className="h-8 w-8 rounded-full text-[#4B7BEC] hover:bg-blue-50"
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

