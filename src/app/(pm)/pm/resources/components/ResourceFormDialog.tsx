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
import { toast } from "sonner";
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
        if (!form.project_id || !form.type || !form.details?.trim()) {
            toast.error("Please fill in all required fields");
            return;
        }
        onSubmit({
            project_id: Number(form.project_id),
            type: form.type,
            details: form.details
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-[#e2e8f0] gap-0 rounded-md">
                <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4 pr-12">
                    <DialogTitle className="text-lg font-bold text-slate-900">New Resource Request</DialogTitle>
                    <DialogDescription className="text-xs text-slate-500 mt-0.5">Submit a new request for project resources.</DialogDescription>
                </div>
                <div className="px-6 pt-3.5 pb-5 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-[#0f172a]">Select Project <span className="text-red-500">*</span></label>
                        <Select value={form.project_id ? String(form.project_id) : undefined} onValueChange={v => setForm({ ...form, project_id: Number(v) })}>
                            <SelectTrigger className="h-10 bg-white rounded-md"><SelectValue placeholder="Choose a project" /></SelectTrigger>
                            <SelectContent className="rounded-md">
                                {projects.map(p => <SelectItem key={p.id} value={String(p.id)} className="text-sm">{p.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-[#0f172a]">Type</label>
                        <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                            <SelectTrigger className="h-10 bg-white rounded-md"><SelectValue placeholder="Select type" /></SelectTrigger>
                            <SelectContent className="rounded-md">
                                <SelectItem value="manpower" className="text-sm">Manpower</SelectItem>
                                <SelectItem value="tools" className="text-sm">Tools</SelectItem>
                                <SelectItem value="infrastructure" className="text-sm">Infrastructure</SelectItem>
                                <SelectItem value="accommodation" className="text-sm">Accommodation</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-[#0f172a]">Details <span className="text-red-500">*</span></label>
                        <textarea
                            className="w-full min-h-[120px] p-3 rounded-md border border-input text-sm bg-white focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none transition-[color,box-shadow]"
                            placeholder="Describe the resource needed, quantity, and reason..."
                            value={form.details}
                            onChange={e => setForm({ ...form, details: e.target.value })}
                            disabled={isProcessing}
                        />
                    </div>
                </div>
                <div className="px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end gap-3">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isProcessing} className="text-[#64748b] hover:text-[#0f172a] rounded-md">
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isProcessing} className="bg-[#2568C1] hover:bg-[#1e56a6] min-w-[120px] text-white font-semibold rounded-md shadow-sm">
                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Submit Request"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
