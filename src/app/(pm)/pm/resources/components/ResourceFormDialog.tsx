import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { ApiProject } from "@/lib/types";

interface ResourceFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projects: ApiProject[];
    form: { project_id: number; type: string; details: string };
    setForm: (form: any) => void;
    onSubmit: (payload: { project_id: number; type: string; details: string }) => void;
    isProcessing: boolean;
}

export function ResourceFormDialog({
    open, onOpenChange, projects, form, setForm, onSubmit, isProcessing
}: ResourceFormDialogProps) {
    const handleSave = () => {
        if (!form.project_id || !form.details) return;
        onSubmit({
            project_id: Number(form.project_id),
            type: form.type,
            details: form.details
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-[#e2e8f0]">
                <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4">
                    <DialogTitle className="text-lg font-bold text-slate-900">New Resource Request</DialogTitle>
                    <DialogDescription className="text-xs">Submit a new request for project resources.</DialogDescription>
                </div>
                <div className="px-6 py-5 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Select Project <span className="text-red-500">*</span></label>
                        <Select value={String(form.project_id || "")} onValueChange={v => setForm({ ...form, project_id: Number(v) })}>
                            <SelectTrigger className="h-11"><SelectValue placeholder="Choose a project" /></SelectTrigger>
                            <SelectContent>
                                {projects.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Type</label>
                        <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                            <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="manpower">Manpower</SelectItem>
                                <SelectItem value="tools">Tools</SelectItem>
                                <SelectItem value="infrastructure">Infrastructure</SelectItem>
                                <SelectItem value="accommodation">Accommodation</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Details <span className="text-red-500">*</span></label>
                        <textarea
                            className="w-full min-h-[120px] p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                            placeholder="Describe the resource needed, quantity, and reason..."
                            value={form.details}
                            onChange={e => setForm({ ...form, details: e.target.value })}
                        />
                    </div>
                </div>
                <div className="px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc] flex gap-3">
                    <Button variant="ghost" className="flex-1" onClick={() => onOpenChange(false)} disabled={isProcessing}>Cancel</Button>
                    <Button className="flex-1 bg-[#2568C1] hover:bg-[#1e56a6] text-white" onClick={handleSave} disabled={isProcessing || !form.project_id || !form.details}>
                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Request"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
