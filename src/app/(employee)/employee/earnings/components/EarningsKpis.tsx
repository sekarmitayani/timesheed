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

  const cardClass = "bg-white border border-slate-100 shadow-sm rounded-xl h-[100px] flex flex-col overflow-hidden";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card className={cardClass}>
        <CardContent className="px-4 py-3 flex flex-row items-center gap-4 h-full">
            <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-[#4B7BEC] shrink-0">
                <TrendingUp className="h-6 w-6" />
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total Released ({currentMonthName})</p>
                <div className="text-xl font-black text-slate-800 tracking-tight truncate">
                    {formatCurrency(currentMonthReleased)}
                </div>
            </div>
        </CardContent>
      </Card>

      <Card className={cardClass}>
        <CardContent className="px-4 py-3 flex flex-row items-center gap-4 h-full">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                <Wallet className="h-6 w-6" />
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Remaining (Liability)</p>
                <div className="text-xl font-black text-slate-800 tracking-tight truncate">
                    {formatCurrency(totalLiability)}
                </div>
            </div>
        </CardContent>
      </Card>

      <Card className={cardClass}>
        <CardContent className="px-4 py-3 flex flex-row items-center gap-4 h-full">
            <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-[#4B7BEC] shrink-0">
                <Wallet className="h-6 w-6" />
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total Released</p>
                <div className="text-xl font-black text-[#4B7BEC] tracking-tight truncate">
                    {formatCurrency(totalEarned)}
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
