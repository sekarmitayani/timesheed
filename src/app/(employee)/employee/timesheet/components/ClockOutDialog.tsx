"use client";

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StopCircle, Loader2 } from "lucide-react";

interface ClockOutDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    isClocking: boolean;
    clockOutDesc: string;
    setClockOutDesc: (desc: string) => void;
    onClockOut: () => Promise<void>;
}

export function ClockOutDialog({
    open,
    onOpenChange,
    isClocking,
    clockOutDesc,
    setClockOutDesc,
    onClockOut
}: ClockOutDialogProps) {
    return (
        <Dialog open={open} onOpenChange={o => !isClocking && onOpenChange(o)}>
            <DialogContent 
               
                className="sm:max-w-[450px] p-0 overflow-hidden border-[#E2E8F0] rounded-[6px] gap-0 shadow-lg"
            >
                <div className="bg-white px-6 py-5 border-b border-[#F1F5F9]">
                    <div className="flex flex-col gap-1">
                        <p className="text-[10px] font-bold text-red-600 uppercase tracking-[0.15em]">End Session</p>
                        <DialogTitle className="text-xl font-bold text-[#0f172a] flex items-center gap-2">
                            <StopCircle className="h-5 w-5 text-red-600" /> 
                            Clock Out
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-muted-foreground text-xs mt-1.5">
                        Summarize your work accomplishments to complete this session.
                    </DialogDescription>
                </div>

                <div className="px-6 py-6 space-y-5 bg-white text-[#0f172a]">
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Session Summary</label>
                            <span className="text-[10px] text-red-500 font-bold uppercase">* Required</span>
                        </div>
                        <textarea 
                            value={clockOutDesc} 
                            onChange={e => setClockOutDesc(e.target.value)} 
                            placeholder="Describe what you have accomplished during this session..." 
                            disabled={isClocking}
                            className="w-full min-h-[120px] p-3.5 text-sm border border-[#E2E8F0] rounded-[4px] bg-slate-50/30 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#4B7BEC]/20 transition-all resize-none leading-relaxed custom-scrollbar"
                        />
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-[#F1F5F9] bg-[#F8FAFC] flex flex-col sm:flex-row items-center justify-end gap-3">
                    <Button 
                        variant="ghost" 
                        className="rounded-[4px] h-10 text-xs font-bold text-slate-500 hover:bg-slate-100 w-full sm:w-auto" 
                        onClick={() => onOpenChange(false)} 
                        disabled={isClocking}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={onClockOut} 
                        disabled={isClocking || !clockOutDesc.trim()} 
                        className="bg-red-600 hover:bg-red-700 min-w-[140px] h-10 rounded-[4px] text-xs font-bold shadow-sm w-full sm:w-auto"
                    >
                        {isClocking ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" /> 
                                Saving...
                            </>
                        ) : "Submit & Clock Out"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
