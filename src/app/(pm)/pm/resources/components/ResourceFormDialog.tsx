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
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-[#e2e8f0] shadow-2xl rounded-md bg-white flex flex-col text-slate-900">
                <DialogDescription className="sr-only">Form to submit a new resource request.</DialogDescription>
                <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4">
                    <DialogTitle className="text-lg font-bold text-slate-900">New Resource Request</DialogTitle>
                    <DialogDescription className="text-xs">Submit a new request for project resources.</DialogDescription>
                </div>
                <div className="px-6 py-5 space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Project <span className="text-red-500">*</span></label>
                        <Select value={String(form.project_id || "")} onValueChange={v => setForm({ ...form, project_id: Number(v) })}>
                            <SelectTrigger className="border-slate-200 h-9 rounded-md text-sm font-semibold focus:ring-1 focus:ring-[#4B7BEC]">
                                <SelectValue placeholder="Choose a project" />
                            </SelectTrigger>
                            <SelectContent className="rounded-md">
                                {projects.map(p => <SelectItem key={p.id} value={String(p.id)} className="text-sm">{p.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Type <span className="text-red-500">*</span></label>
                        <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                            <SelectTrigger className="border-slate-200 h-9 rounded-md text-sm font-semibold focus:ring-1 focus:ring-[#4B7BEC]">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent className="rounded-md">
                                <SelectItem value="manpower" className="text-sm font-medium">Manpower</SelectItem>
                                <SelectItem value="tools" className="text-sm font-medium">Tools</SelectItem>
                                <SelectItem value="infrastructure" className="text-sm font-medium">Infrastructure</SelectItem>
                                <SelectItem value="accommodation" className="text-sm font-medium">Accommodation</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Details <span className="text-red-500">*</span></label>
                        <textarea
                            className="w-full min-h-[120px] p-3 rounded-md border border-slate-200 text-sm font-medium focus:ring-1 focus:ring-[#4B7BEC] focus:outline-none custom-scrollbar shadow-sm bg-white"
                            placeholder="Describe the resource needed, quantity, and reason..."
                            value={form.details}
                            onChange={e => setForm({ ...form, details: e.target.value })}
                            disabled={isProcessing}
                        />
                    </div>
                </div>
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2.5">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isProcessing} className="font-bold rounded-md px-5 text-xs text-slate-500 h-9">
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isProcessing} className="bg-[#4B7BEC] hover:bg-[#3b60c0] min-w-[100px] font-bold rounded-md uppercase tracking-widest text-[10px] h-9 shadow-md shadow-blue-100">
                        {isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
