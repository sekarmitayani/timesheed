import { Info, CheckCircle2, Clock, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { MonthlyBreakdown } from "../../types";

interface EarningTrackerProps {
  contractType: string;
  allTimeDuration?: number;
  monthDuration?: number;
  allTimeDays?: number;
  monthDays?: number;
  rate: number;
  scheme: string;
  totalPaid: number;
  liability: number;
  estimatedEarning?: number;
  submittedCount?: number;
  approvedCount?: number;
  currentYearIndex?: number;
  thisMonthLiability?: number;
  monthlyBreakdown?: MonthlyBreakdown[];
}

export function EarningTracker({
  contractType,
  allTimeDuration = 0,
  monthDuration = 0,
  allTimeDays = 0,
  monthDays = 0,
  rate,
  scheme,
  totalPaid,
  liability,
  estimatedEarning = 0,
  submittedCount = 0,
  approvedCount = 0,
  currentYearIndex = 0,
  thisMonthLiability = 0,
  monthlyBreakdown = []
}: EarningTrackerProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const formatCurrency = (amount: number | null | undefined) => {
    const val = Number(amount);
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(isNaN(val) ? 0 : val);
  };

  const currentMonthName = new Date().toLocaleString('en-US', { month: 'long' });

  let mainValue = "";
  let mainLabel = "";
  let MainIcon = Clock;

  if (contractType === 'timesheet') {
    mainValue = currentMonthName;
    mainLabel = "Timesheet Tracking";
    MainIcon = Calendar;
  } else if (contractType === 'mandays') {
    mainValue = currentMonthName;
    mainLabel = "Mandays Tracking";
    MainIcon = Calendar;
  } else if (contractType === 'yearly') {
    mainValue = `Year ${currentYearIndex}`;
    mainLabel = "Contract Progress";
    MainIcon = CheckCircle2;
  } else {
    // monthly
    mainValue = currentMonthName;
    mainLabel = "Current Billing Month";
    MainIcon = Calendar;
  }

  const isTerminOrB2B = scheme === 'termin' || scheme === 'back_to_back';

  return (
    <div className="space-y-4">
      <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Earning Tracker</h4>
      <div className="space-y-4">
        {/* Main Stat Card */}
        <div className="p-4 rounded-md bg-blue-50/50 border border-blue-100 flex items-start gap-3">
          <div className="mt-1 p-2 bg-white rounded-md border border-blue-100 shadow-sm">
            <MainIcon className="h-4 w-4 text-[#4B7BEC]" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-blue-600 uppercase font-bold mb-1">{mainLabel}</p>
            <p className="text-xl font-bold text-slate-800">{mainValue}</p>

            <div className="mt-3 pt-3 border-t border-blue-100/50 space-y-2">
              {(contractType === 'timesheet' || contractType === 'mandays') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-blue-600 uppercase font-medium">Approved (Fixed)</p>
                    <p className="text-xs font-bold text-emerald-600">
                      {contractType === 'timesheet' ? `${(allTimeDuration || 0).toFixed(1)} Hours` : `${allTimeDays || 0} Days`}
                    </p>
                    <p className="text-[9px] text-emerald-500 font-medium">
                      {approvedCount || (contractType === 'mandays' ? allTimeDays : 0)} {contractType === 'timesheet' ? 'Logs' : 'Days'} Approved
                    </p>
                    <p className="text-[9px] text-emerald-600 font-bold">{formatCurrency(Number(totalPaid || 0) + Number(liability || 0))}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-blue-600 uppercase font-medium">Pending (Est)</p>
                    <p className="text-xs font-bold text-slate-600">
                      {/* Backend should ideally provide pending stats */}
                      {estimatedEarning > 0 ? formatCurrency(estimatedEarning) : "0"}
                    </p>
                    <p className="text-[9px] text-slate-400 font-medium">
                      {Math.max(0, (submittedCount || 0) - (approvedCount || 0))} Pending
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-blue-600 uppercase font-medium">This Month Liability</p>
                  <p className="text-xs font-bold text-[#4B7BEC]">{formatCurrency(thisMonthLiability)}</p>
                  <p className="text-[9px] text-slate-400 font-medium">For {currentMonthName}</p>
                </div>
                <div>
                  <p className="text-[10px] text-blue-600 uppercase font-medium">Total Liability</p>
                  <p className="text-xs font-bold text-slate-700">{formatCurrency(liability)}</p>
                  <p className="text-[9px] text-slate-400 font-medium">Inc. previous unpaid</p>
                </div>
              </div>

              {contractType === 'yearly' && (
                <div className="pt-2">
                  <p className="text-[10px] text-blue-600 uppercase font-medium">Accumulated Earnings</p>
                  <p className="text-sm font-bold text-[#4B7BEC]">{formatCurrency(Number(totalPaid || 0) + Number(liability || 0))}</p>
                  <p className="text-[9px] text-slate-400 font-medium">Fixed income grows every year of contract</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Breakdown Toggle (Enabled for all schemes) */}
        {monthlyBreakdown.length > 0 && (
          <div className="space-y-2">
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="w-full flex items-center justify-between p-3 rounded-md border border-[#E2E8F0] bg-white hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-700">View Payment Breakdown</span>
              </div>
              {showBreakdown ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
            </button>

            {showBreakdown && (
              <div className="rounded-md border border-[#E2E8F0] bg-white overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-[#E2E8F0]">
                        <th className="px-3 py-2 text-[9px] font-bold text-slate-500 uppercase">Period</th>
                        <th className="px-3 py-2 text-[9px] font-bold text-slate-500 uppercase">Earned</th>
                        <th className="px-3 py-2 text-[9px] font-bold text-slate-500 uppercase">Paid</th>
                        <th className="px-3 py-2 text-[9px] font-bold text-slate-500 uppercase text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyBreakdown.map((m, idx) => (
                        <tr key={idx} className="border-b border-[#E2E8F0] last:border-0 hover:bg-slate-50/50">
                          <td className="px-3 py-2.5">
                            <p className="text-[10px] font-bold text-slate-700">{m.period_name}</p>
                            <p className="text-[9px] text-slate-400">{m.year}</p>
                          </td>
                          <td className="px-3 py-2.5 text-[10px] font-medium text-slate-600">
                            {formatCurrency(m.earned)}
                          </td>
                          <td className="px-3 py-2.5 text-[10px] font-medium text-emerald-600">
                            {formatCurrency(m.paid)}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <Badge
                              variant="outline"
                              className={`text-[8px] uppercase px-1.5 h-4 leading-none font-black ${m.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                m.status === 'partially_paid' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                  'bg-slate-50 text-slate-400 border-slate-200'
                                }`}
                            >
                              {m.status.replace('_', ' ')}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info Box for Termin/B2B */}
        {isTerminOrB2B && (
          <div className="flex items-start gap-2 p-3 bg-slate-50 rounded border border-[#E2E8F0]">
            <Info className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
            <p className="text-[10px] font-medium text-slate-500 leading-relaxed">
              This contract follows a <span className="text-slate-700 font-bold uppercase">{scheme.replace(/_/g, ' ')}</span> payment scheme.
              Earnings are accrued as <span className="text-slate-700 font-bold">Total Liability</span> until terms are met.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
