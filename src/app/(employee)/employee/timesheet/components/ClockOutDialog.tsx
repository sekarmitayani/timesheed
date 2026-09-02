"use client";

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StopCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
                className="sm:max-w-[480px] p-0 overflow-hidden border-[#e2e8f0]"
            >
                <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4">
                    <div className="flex flex-col gap-0.5">
                        <p className="text-[10px] font-bold text-red-600 uppercase tracking-[0.15em]">End Session</p>
                        <DialogTitle className="text-xl font-bold text-[#0f172a] flex items-center gap-2">
                            <StopCircle className="h-5 w-5 text-red-600" /> 
                            Clock Out
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-xs text-slate-500 mt-1">
                        Summarize your work accomplishments to complete this session.
                    </DialogDescription>
                </div>

                <div className="px-6 py-5 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
                            Session Summary <span className="text-red-500">*</span>
                        </label>
                        <textarea 
                            value={clockOutDesc} 
                            onChange={e => setClockOutDesc(e.target.value)} 
                            placeholder="Describe what you have accomplished during this session..." 
                            disabled={isClocking}
                            className="w-full min-h-[120px] p-3.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all resize-none leading-relaxed"
                        />
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end gap-3">
                    <Button 
                        variant="ghost" 
                        className="text-[#64748b]" 
                        onClick={() => onOpenChange(false)} 
                        disabled={isClocking}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={() => {
                            if (!clockOutDesc.trim()) {
                                toast.error("Please fill in all required fields (Session Summary)");
                                return;
                            }
                            onClockOut();
                        }} 
                        disabled={isClocking} 
                        className="bg-red-600 hover:bg-red-700 text-white min-w-[140px] shadow-md shadow-red-500/20"
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
