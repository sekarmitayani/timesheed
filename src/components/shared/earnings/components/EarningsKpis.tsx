import { TrendingUp, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface EarningsKpisProps {
  currentMonthReleased: number;
  totalLiability: number;
  totalEarned: number;
}

export function EarningsKpis({ currentMonthReleased, totalLiability, totalEarned }: EarningsKpisProps) {
  const formatCurrency = (amount: number | null | undefined) => {
    const val = Number(amount);
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(isNaN(val) ? 0 : val);
  };

  const currentMonthName = new Date().toLocaleString('en-US', { month: 'short' });

  const cardClass = "bg-white border border-slate-100 shadow-sm rounded-xl h-[78px] flex flex-col overflow-hidden hover:shadow-md transition-shadow p-0 py-0 gap-0";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
      <Card className={cardClass}>
        <CardContent className="px-3.5 sm:px-4 py-2.5 flex flex-row items-center gap-3 sm:gap-3.5 h-full">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-blue-50 flex items-center justify-center text-[#4B7BEC] shrink-0">
                <TrendingUp className="h-5 w-5 sm:h-5.5 sm:w-5.5" />
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Total Released ({currentMonthName})</p>
                <div className="text-lg sm:text-xl font-black text-slate-800 tracking-tight leading-none truncate">
                    {formatCurrency(currentMonthReleased)}
                </div>
            </div>
        </CardContent>
      </Card>

      <Card className={cardClass}>
        <CardContent className="px-3.5 sm:px-4 py-2.5 flex flex-row items-center gap-3 sm:gap-3.5 h-full">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                <Wallet className="h-5 w-5 sm:h-5.5 sm:w-5.5" />
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Remaining (Liability)</p>
                <div className="text-lg sm:text-xl font-black text-slate-800 tracking-tight leading-none truncate">
                    {formatCurrency(totalLiability)}
                </div>
            </div>
        </CardContent>
      </Card>

      <Card className={cardClass}>
        <CardContent className="px-3.5 sm:px-4 py-2.5 flex flex-row items-center gap-3 sm:gap-3.5 h-full">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-blue-50 flex items-center justify-center text-[#4B7BEC] shrink-0">
                <Wallet className="h-5 w-5 sm:h-5.5 sm:w-5.5" />
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Total Released</p>
                <div className="text-lg sm:text-xl font-black text-[#4B7BEC] tracking-tight leading-none truncate">
                    {formatCurrency(totalEarned)}
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
