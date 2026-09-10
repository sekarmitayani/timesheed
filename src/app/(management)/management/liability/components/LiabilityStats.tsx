import { Card, CardContent } from "@/components/ui/card";
import { formatRupiah } from "@/lib/utils";
import { Wallet, TrendingUp, Clock } from "lucide-react";

interface LiabilityStatsProps {
    totalLiability: number;
    totalReleasedAllTime: number;
    totalReleasedCurrentMonth: number;
}

export function LiabilityStats({
    totalLiability,
    totalReleasedAllTime,
    totalReleasedCurrentMonth,
}: LiabilityStatsProps) {
    const currentMonthName = new Date().toLocaleString("en-US", { month: "short" });

    const cardClass = "bg-white border border-slate-100 shadow-sm rounded-xl h-[78px] flex flex-col overflow-hidden hover:shadow-md transition-shadow p-0 py-0 gap-0";

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            {/* 1. Remaining Liability */}
            <Card className={cardClass}>
                <CardContent className="px-3.5 sm:px-4 py-2.5 flex flex-row items-center gap-3 sm:gap-3.5 h-full">
                    <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                        <Clock className="h-5 w-5 sm:h-5.5 sm:w-5.5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Remaining Liability</p>
                        <div className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-none truncate">
                            {formatRupiah(totalLiability)}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 2. Total Released (All Time) */}
            <Card className={cardClass}>
                <CardContent className="px-3.5 sm:px-4 py-2.5 flex flex-row items-center gap-3 sm:gap-3.5 h-full">
                    <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-blue-50 flex items-center justify-center text-[#4B7BEC] shrink-0">
                        <Wallet className="h-5 w-5 sm:h-5.5 sm:w-5.5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Total Released (All-Time)</p>
                        <div className="text-xl sm:text-2xl font-black text-[#4B7BEC] tracking-tight leading-none truncate">
                            {formatRupiah(totalReleasedAllTime)}
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            {/* 3. Total Released (Current Month) */}
            <Card className={cardClass}>
                <CardContent className="px-3.5 sm:px-4 py-2.5 flex flex-row items-center gap-3 sm:gap-3.5 h-full">
                    <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                        <TrendingUp className="h-5 w-5 sm:h-5.5 sm:w-5.5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Released ({currentMonthName})</p>
                        <div className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-none truncate">
                            {formatRupiah(totalReleasedCurrentMonth)}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

