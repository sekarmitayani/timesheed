import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AuditLog } from "@/lib/services/audit-service";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface AuditDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    log: AuditLog | null;
}

const DataViewer = ({ data, emptyMessage, level = 0 }: { data: any, emptyMessage: string, level?: number }) => {
    if (!data) return <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">{emptyMessage}</div>;
    
    if (typeof data !== 'object') {
        return <div className="text-sm font-semibold text-slate-800">{String(data)}</div>;
    }

    return (
        <div className={cn("space-y-1", level > 0 && "ml-3 border-l-2 border-slate-100 pl-3 mt-1")}>
            {Object.entries(data).map(([key, value]) => (
                <div key={key} className="flex flex-col py-2 border-b border-black/5 last:border-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{key.replace(/_/g, ' ')}</span>
                    {typeof value === 'object' && value !== null ? (
                        <DataViewer data={value} emptyMessage="No data" level={level + 1} />
                    ) : (
                        <span className="text-sm font-semibold text-slate-800 break-words">
                            {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
};

export function AuditDetailDialog({ open, onOpenChange, log }: AuditDetailDialogProps) {
    if (!log) return null;

    // Use pre-parsed JSON from backend if available, fallback to manual parse if not
    const oldData = log.old_value_parsed || (log.old_value ? (() => { try { return JSON.parse(log.old_value); } catch { return log.old_value; } })() : null);
    const newData = log.new_value_parsed || (log.new_value ? (() => { try { return JSON.parse(log.new_value); } catch { return log.new_value; } })() : null);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-[#e2e8f0]">
                <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-[10px] uppercase font-bold bg-white text-[#2568C1] border-blue-100">
                            {log.target_table} #{log.record_id}
                        </Badge>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {log.action}
                        </span>
                    </div>
                    <DialogTitle className="text-lg font-bold text-slate-900 leading-tight">Audit Log Detail</DialogTitle>
                    <DialogDescription className="text-slate-500 font-medium text-xs">
                        Action performed by {log.performer?.full_name || `User #${log.user_id}`} on {format(new Date(log.created_at), "dd/MM/yyyy HH:mm")}
                    </DialogDescription>
                </div>

                <div className="px-6 py-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Old Value</h4>
                            <ScrollArea className="h-[300px] w-full rounded-xl border border-slate-100 bg-slate-50 p-4">
                                <DataViewer data={oldData} emptyMessage="No previous data" />
                            </ScrollArea>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">New Value</h4>
                            <ScrollArea className="h-[300px] w-full rounded-xl border border-blue-50/50 bg-blue-50/30 p-4">
                                <DataViewer data={newData} emptyMessage="Data was removed" />
                            </ScrollArea>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end">
                    <button 
                        onClick={() => onOpenChange(false)}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                    >
                        Close Detail
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
