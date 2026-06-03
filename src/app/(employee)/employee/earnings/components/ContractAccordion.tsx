import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ContractMetadata } from "./sections/ContractMetadata";
import { EarningTracker } from "./sections/EarningTracker";
import { PaymentHistoryTable } from "./sections/PaymentHistoryTable";
import { FileText, Briefcase } from "lucide-react";
import { EnrichedContract } from "../types";

interface ContractAccordionProps {
  contracts: EnrichedContract[];
}

export function ContractAccordion({ contracts }: ContractAccordionProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPastelBg = (index: number) => {
    const bgs = [
      "bg-slate-50/70 hover:bg-slate-50",
      "bg-blue-50/70 hover:bg-blue-50",
      "bg-indigo-50/70 hover:bg-indigo-50",
      "bg-emerald-50/70 hover:bg-emerald-50",
    ];
    return bgs[index % bgs.length];
  };

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h2 className="text-base font-bold text-slate-800">Project & Contract Details</h2>
      </div>

      <Accordion type="single" collapsible className="space-y-3">
        {contracts.map((contract, index) => {
          const liability = contract.total_liability ?? Math.max(0, contract.total_earned - contract.total_paid);

          return (
            <AccordionItem 
              key={contract.id} 
              value={`contract-${contract.id}`}
              className={`border border-[#E2E8F0] rounded-md overflow-hidden shadow-sm transition-all ${getPastelBg(index)}`}
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex flex-col md:flex-row md:items-center justify-between w-full pr-4 text-left gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-800">{contract.project_name}</span>
                      <Badge variant="outline" className="text-[9px] uppercase font-bold bg-white/80">
                        {contract.contract_type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-medium">
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3" /> {contract.payment_scheme.replace(/_/g, " ")}
                      </span>
                      {contract.contract_type === 'mandays' && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="text-[#4B7BEC] font-bold">{contract.approved_count || contract.all_time_days || 0} Days Approved</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4 w-full md:w-auto md:flex md:flex-nowrap md:items-center md:gap-6 md:mt-0">
                    {(contract.contract_type === 'timesheet' || contract.contract_type === 'hourly' || contract.contract_type === 'mandays') && (
                      <>
                        <div className="text-left md:text-right border-r-0 md:border-r border-[#E2E8F0] md:pr-6">
                          <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tight">Est. Pending</p>
                          <p className="text-xs font-bold text-slate-500">{formatCurrency(contract.estimated_earning || 0)}</p>
                        </div>
                        <div className="text-left md:text-right border-r-0 md:border-r border-[#E2E8F0] md:pr-6">
                          <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tight">Fixed (Apprv)</p>
                          <p className="text-xs font-bold text-slate-700">{formatCurrency(contract.total_earned)}</p>
                        </div>
                      </>
                    )}
                    <div className="text-left md:text-right border-r-0 md:border-r border-[#E2E8F0] md:pr-6">
                      <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tight">Released</p>
                      <p className="text-xs font-bold text-emerald-600">{formatCurrency(contract.total_paid)}</p>
                    </div>
                    <div className="text-left md:text-right">
                      <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tight">Liability</p>
                      <p className="text-xs font-bold text-slate-700">{formatCurrency(liability)}</p>
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="bg-white p-6 border-t border-[#E2E8F0]">
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <ContractMetadata 
                      type={contract.contract_type}
                      scheme={contract.payment_scheme}
                      rate={contract.rate_amount}
                      rateType={contract.contract_type === 'monthly' ? 'mo' : contract.contract_type === 'mandays' ? 'day' : contract.contract_type === 'yearly' ? 'yr' : 'hr'}
                      startDate={contract.start_date}
                      endDate={contract.end_date}
                      projectName={contract.project_id ? contract.project_name : "-"}
                    />
                    <EarningTracker 
                      contractType={contract.contract_type}
                      allTimeDuration={contract.all_time_duration}
                      monthDuration={contract.month_duration}
                      allTimeDays={contract.all_time_days}
                      monthDays={contract.month_days}
                      rate={contract.rate_amount}
                      scheme={contract.payment_scheme}
                      totalPaid={contract.total_paid}
                      liability={liability}
                      estimatedEarning={contract.estimated_earning}
                      submittedCount={contract.submitted_count}
                      approvedCount={contract.approved_count}
                      currentYearIndex={contract.current_year_index}
                      thisMonthLiability={contract.this_month_liability}
                      monthlyBreakdown={contract.monthly_breakdown}
                    />
                  </div>
                  <div className="border-t border-[#E2E8F0] pt-6">
                    <PaymentHistoryTable 
                      payments={contract.payments}
                      paymentStatus={contract.payment_status}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
