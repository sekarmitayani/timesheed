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

    const cardClass = "bg-white border border-slate-100 shadow-sm rounded-xl h-[100px] flex flex-col overflow-hidden";

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Remaining Liability */}
            <Card className={cardClass}>
                <CardContent className="px-4 py-3 flex flex-row items-center gap-4 h-full">
                    <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                        <Clock className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Remaining Liability</p>
                        <div className="text-2xl font-black text-slate-800 tracking-tight truncate">
                            {formatRupiah(totalLiability)}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 2. Total Released (All Time) */}
            <Card className={cardClass}>
                <CardContent className="px-4 py-3 flex flex-row items-center gap-4 h-full">
                    <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-[#4B7BEC] shrink-0">
                        <Wallet className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total Released (All-Time)</p>
                        <div className="text-2xl font-black text-[#4B7BEC] tracking-tight truncate">
                            {formatRupiah(totalReleasedAllTime)}
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            {/* 3. Total Released (Current Month) */}
            <Card className={cardClass}>
                <CardContent className="px-4 py-3 flex flex-row items-center gap-4 h-full">
                    <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                        <TrendingUp className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Released ({currentMonthName})</p>
                        <div className="text-2xl font-black text-slate-800 tracking-tight truncate">
                            {formatRupiah(totalReleasedCurrentMonth)}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

