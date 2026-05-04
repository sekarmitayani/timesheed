import { Info, CheckCircle2, Clock, Calendar } from "lucide-react";

interface EarningTrackerProps {
  contractType: string;
  approvedMinutes: number;
  pendingMinutes: number;
  approvedDays: number;
  rate: number;
  scheme: string;
  totalPaid: number;
  liability: number;
}

export function EarningTracker({ 
  contractType, 
  approvedMinutes, 
  pendingMinutes, 
  approvedDays, 
  rate, 
  scheme,
  totalPaid,
  liability
}: EarningTrackerProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const approvedHours = approvedMinutes / 60;
  const pendingHours = pendingMinutes / 60;
  
  let mainValue = "";
  let mainLabel = "";
  let MainIcon = Clock;
  let estimatedIncome = 0;

  if (contractType === 'timesheet') {
    mainValue = `${approvedHours.toFixed(1)} Hours`;
    mainLabel = "Total Approved Hours";
    MainIcon = Clock;
    estimatedIncome = approvedHours * rate;
  } else if (contractType === 'mandays') {
    mainValue = `${approvedDays} Days`;
    mainLabel = "Total Approved Days";
    MainIcon = Calendar;
    estimatedIncome = approvedDays * rate;
  } else {
    // monthly or yearly
    mainValue = formatCurrency(rate);
    mainLabel = "Fixed Contract Value";
    MainIcon = CheckCircle2;
    estimatedIncome = rate;
  }

  const showPotential = (contractType === 'timesheet' || contractType === 'mandays') && pendingMinutes > 0;
  const potentialEarnings = (pendingHours) * rate;

  const isTerminOrB2B = scheme === 'termin' || scheme === 'back_to_back';

  return (
    <div className="space-y-4">
      <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Earning Tracker</h4>
      <div className="space-y-4">
        <div className="p-4 rounded-md bg-blue-50/50 border border-blue-100 flex items-start gap-3">
          <div className="mt-1 p-2 bg-white rounded-md border border-blue-100 shadow-sm">
            <MainIcon className="h-4 w-4 text-[#4B7BEC]" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-blue-600 uppercase font-bold mb-1">{mainLabel}</p>
            <p className="text-xl font-bold text-slate-800">{mainValue}</p>
            
            <div className="mt-2 pt-2 border-t border-blue-100/50">
              {isTerminOrB2B ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-blue-600 uppercase font-medium">Amount Paid</p>
                    <p className="text-sm font-bold text-emerald-600">{formatCurrency(totalPaid)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-blue-600 uppercase font-medium">Remaining</p>
                    <p className="text-sm font-bold text-slate-700">{formatCurrency(liability)}</p>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-[10px] text-blue-600 uppercase font-medium">Estimated Income</p>
                  <p className="text-sm font-bold text-[#4B7BEC]">{formatCurrency(estimatedIncome)}</p>
                </>
              )}
            </div>
          </div>
        </div>

        {showPotential && (
          <div className="p-3 rounded-md bg-amber-50/50 border border-amber-100 flex items-start gap-2">
            <Info className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] text-amber-700 font-bold uppercase">Potential Earnings</p>
              <p className="text-xs font-bold text-amber-700">{formatCurrency(potentialEarnings)}</p>
              <p className="text-[10px] text-amber-600 mt-0.5">Awaiting PM approval for {contractType === 'timesheet' ? `${pendingHours.toFixed(1)} hours` : 'pending logs'}.</p>
            </div>
          </div>
        )}

        {(scheme === 'termin' || scheme === 'back_to_back') && (
          <div className="flex items-start gap-2 p-3 bg-slate-50 rounded border border-[#E2E8F0]">
            <Info className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
            <p className="text-[10px] font-medium text-slate-500 leading-relaxed">
              Payment is processed based on terms. Unpaid amounts are held as liability until disbursed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
