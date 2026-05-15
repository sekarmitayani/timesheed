import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EnrichedContract } from "../types";
import { FileText, Briefcase, Calendar, Info, Clock, CheckCircle2 } from "lucide-react";

interface ContractOverviewProps {
  contracts: EnrichedContract[];
}

export function ContractOverview({ contracts }: ContractOverviewProps) {
  const baseContracts = contracts.filter((c) => !c.project_id && c.is_active);
  const projectContracts = contracts.filter((c) => c.project_id && c.is_active);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const renderContractList = (title: string, items: EnrichedContract[], icon: React.ReactNode) => (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
        {icon} {title} ({items.length})
      </h3>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground italic pl-6">No active {title.toLowerCase()}.</p>
      ) : (
        <div className="grid gap-4">
          {items.map((contract) => (
            <div
              key={contract.id}
              className="group relative flex flex-col md:flex-row md:items-start justify-between p-4 rounded-lg border border-[#E2E8F0] bg-white hover:border-[#4B7BEC]/30 transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">
                    {contract.project_name}
                  </span>
                  <Badge variant="outline" className="text-[10px] uppercase bg-slate-50 font-semibold border-[#E2E8F0]">
                    {contract.contract_type}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(contract.start_date).toLocaleDateString("en-US", { month: 'short', year: 'numeric' })} - 
                    {contract.end_date ? new Date(contract.end_date).toLocaleDateString("en-US", { month: 'short', year: 'numeric' }) : "Present"}
                  </span>
                  <span className="flex items-center gap-1 uppercase">
                    <Info className="h-3 w-3" />
                    {contract.payment_scheme.replace(/_/g, " ")}
                  </span>
                </div>

                {/* Specific Stats */}
                <div className="mt-2 pt-2 border-t border-slate-50 flex gap-4">
                  {(contract.contract_type === 'timesheet' || contract.contract_type === 'hourly') && (
                    <>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span className="text-[10px] font-medium text-slate-500">
                          {((contract.submitted_count || 0) > 0 ? (contract.submitted_count || 0) : (contract.all_time_duration || 0)).toFixed(1)}h Submitted
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                        <span className="text-[10px] font-medium text-emerald-600">
                          {(contract.all_time_duration || 0).toFixed(1)}h Approved
                        </span>
                      </div>
                    </>
                  )}
                  {contract.contract_type === 'mandays' && (
                    <>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span className="text-[10px] font-medium text-slate-500">
                          {contract.submitted_count} Days Submitted
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                        <span className="text-[10px] font-medium text-emerald-600">
                          {contract.all_time_days || contract.approved_count} Days Approved
                        </span>
                      </div>
                    </>
                  )}
                  {contract.contract_type === 'yearly' && (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3 w-3 text-blue-400" />
                      <span className="text-[10px] font-medium text-blue-600 uppercase">
                        Year {contract.current_year_index}
                      </span>
                    </div>
                  )}
                  {contract.contract_type === 'monthly' && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-blue-400" />
                      <span className="text-[10px] font-medium text-blue-600 uppercase">
                        Month {contract.monthly_breakdown?.length}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 md:mt-0 text-left md:text-right border-t md:border-t-0 pt-4 md:pt-0 border-[#E2E8F0]">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Rate</p>
                <p className="text-sm font-bold text-[#4B7BEC]">
                  {formatCurrency(contract.rate_amount)}
                  <span className="text-[10px] text-muted-foreground font-normal ml-1">
                    / {contract.contract_type === 'monthly' ? 'mo' : contract.contract_type === 'mandays' ? 'day' : contract.contract_type === 'yearly' ? 'yr' : 'hr'}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Card className="border-[#E2E8F0] shadow-none rounded-md">
      <CardHeader className="pb-3 border-b border-[#E2E8F0]">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <FileText className="h-4 w-4 text-[#4B7BEC]" /> Contract Details
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-8">
        {renderContractList("Base Contract", baseContracts, <Briefcase className="h-4 w-4 text-[#4B7BEC]" />)}
        {renderContractList("Project-based Contracts", projectContracts, <Briefcase className="h-4 w-4 text-[#4B7BEC]" />)}
      </CardContent>
    </Card>
  );
}
