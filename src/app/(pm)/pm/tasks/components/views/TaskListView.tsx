import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ApiTask } from "@/lib/services/task-service";
import { ProjectMember } from "@/lib/types";

interface TaskListViewProps {
    grouped: Record<string, ApiTask[]>;
    handleTaskClick: (task: ApiTask) => void;
    getProjectName: (pid: number) => string;
    allMembers: Record<number, ProjectMember[]>;
    currentUserId: number | undefined;
    currentUserFullName: string | undefined;
    statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode; border: string; badge: string }>;
}

export function TaskListView({
    grouped,
    handleTaskClick,
    getProjectName,
    allMembers,
    currentUserId,
    currentUserFullName,
    statusConfig
}: TaskListViewProps) {
    return (
        <div className="flex-1 overflow-y-auto pr-1 pb-10 custom-scrollbar">
            <div className="space-y-10">
                {(["todo", "in_progress", "done"] as const).map(status => (
                    <div key={status} className="space-y-4">
                        <div className="flex items-center gap-3 px-1">
                            <div className={cn("p-1.5 rounded-md", statusConfig[status].bg)}>
                                {statusConfig[status].icon}
                            </div>
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                                {statusConfig[status].label}
                                <span className="ml-2 text-xs font-medium text-slate-400 normal-case">
                                    ({grouped[status]?.length || 0} tasks)
                                </span>
                            </h3>
                        </div>
                        <div className="bg-white border border-slate-100 rounded-md overflow-hidden shadow-sm">
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow className="h-10 hover:bg-transparent border-b border-slate-100">
                                        <TableHead className="text-[10px] font-bold uppercase text-slate-400 px-6 w-[25%]">Task Name</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-slate-400 px-4 w-[25%]">Description</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-slate-400 px-4 w-[15%]">Reporter</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-slate-400 px-4 w-[15%]">Assignee</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-slate-400 px-4 w-[10%]">Due Date</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-slate-400 px-6 w-[10%] text-right">Project</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {!grouped[status] || grouped[status].length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-20 text-center text-slate-300 text-[10px] font-bold uppercase tracking-widest">
                                                No tasks in this stage
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        grouped[status].map(task => {
                                            const pMembers = allMembers[task.project_id] || [];
                                            const reporterName = pMembers.find(m => m.user_id === task.created_by_id)?.user?.full_name 
                                                || (task.created_by_id === currentUserId ? currentUserFullName : undefined) || "System";
                                            const assigneeName = pMembers.find(m => m.user_id === task.assigned_to_id)?.user?.full_name 
                                                || (task.assigned_to_id === currentUserId ? currentUserFullName : undefined) || "Unassigned";
                                                
                                            return (
                                                <TableRow key={task.id} className="cursor-pointer hover:bg-slate-50/80 group border-b border-slate-50 last:border-0" onClick={() => handleTaskClick(task)}>
                                                    <TableCell className="px-6 py-4 max-w-[200px]"><span className="text-sm font-bold text-slate-700 group-hover:text-[#4B7BEC] block truncate">{task.title}</span></TableCell>
                                                    <TableCell className="px-4 py-4 max-w-[250px]"><span className="text-xs font-medium text-slate-400 block truncate">{task.description || "—"}</span></TableCell>
                                                    <TableCell className="px-4 py-4"><div className="flex items-center gap-2"><Avatar className="h-6 w-6 rounded-full"><AvatarFallback className="text-[8px] font-bold bg-slate-100 text-slate-500">{reporterName.charAt(0)}</AvatarFallback></Avatar><span className="text-[11px] font-bold text-slate-600 truncate max-w-[100px]">{reporterName}</span></div></TableCell>
                                                    <TableCell className="px-4 py-4"><div className="flex items-center gap-2"><Avatar className="h-6 w-6 rounded-full border border-[#4B7BEC]/10"><AvatarFallback className="text-[8px] font-bold bg-blue-50 text-[#4B7BEC]">{assigneeName.charAt(0)}</AvatarFallback></Avatar><span className="text-[11px] font-bold text-slate-600 truncate max-w-[100px]">{assigneeName}</span></div></TableCell>
                                                    <TableCell className="px-4 py-4"><span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">{task.due_date ? format(new Date(task.due_date), "MMM d, yyyy") : "—"}</span></TableCell>
                                                    <TableCell className="px-6 py-4 text-right"><Badge className="bg-[#4B7BEC]/5 text-[#4B7BEC] border-none text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-tighter whitespace-nowrap">{getProjectName(task.project_id)}</Badge></TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
