"use client";

import React, { useState } from "react";
import { 
    UserCog, 
    ReceiptText, 
    FolderKanban, 
    Users, 
    ListTodo,
    Package,
    HandCoins,
    Download, 
    UploadCloud, 
    FileSpreadsheet, 
    Info, 
    CheckCircle2, 
    ArrowRight, 
    Database, 
    Layers,
    ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ai/ai-components";
import { useQueryClient } from "@tanstack/react-query";

// Import Templates
import { 
    downloadUserExcelTemplate, 
    downloadContractExcelTemplate, 
    downloadProjectExcelTemplate, 
    downloadProjectMemberExcelTemplate,
    downloadTaskAndTimesheetExcelTemplate,
    downloadResourceRequestExcelTemplate,
    downloadPayrollExcelTemplate
} from "@/lib/utils/excel-templates";

// Import Dialogs
import { ImportUsersDialog } from "./components/ImportUsersDialog";
import { ImportContractsDialog } from "./components/ImportContractsDialog";
import { ImportProjectsDialog } from "./components/ImportProjectsDialog";
import { ImportProjectMembersDialog } from "./components/ImportProjectMembersDialog";
import { ImportTasksDialog } from "./components/ImportTasksDialog";
import { ImportResourceRequestsDialog } from "./components/ImportResourceRequestsDialog";
import { ImportPayrollDialog } from "./components/ImportPayrollDialog";

export default function AdminImportHubPage() {
    const queryClient = useQueryClient();

    // Modal Visibility States
    const [usersImportOpen, setUsersImportOpen] = useState(false);
    const [contractsImportOpen, setContractsImportOpen] = useState(false);
    const [projectsImportOpen, setProjectsImportOpen] = useState(false);
    const [membersImportOpen, setMembersImportOpen] = useState(false);
    const [tasksImportOpen, setTasksImportOpen] = useState(false);
    const [resourceRequestsImportOpen, setResourceRequestsImportOpen] = useState(false);
    const [payrollImportOpen, setPayrollImportOpen] = useState(false);

    // Refresh handlers
    const handleUsersSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    };

    const handleContractsSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ["admin", "contracts"] });
    };

    const handleProjectsSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ["admin", "projects"] });
    };

    const handleMembersSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ["admin", "projects"] });
    };

    const handleTasksSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ["admin", "projects"] });
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
        queryClient.invalidateQueries({ queryKey: ["timesheets"] });
    };

    const handleResourceRequestsSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ["admin", "resources"] });
    };

    const handlePayrollSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ["admin", "payroll"] });
        queryClient.invalidateQueries({ queryKey: ["admin", "contracts"] });
    };

    const importModules = [
        {
            id: "users",
            step: 1,
            title: "User Accounts",
            subtitle: "Employees, PMs & Admins",
            description: "Bulk register employee profiles, corporate access roles, and classification types.",
            mandatoryFields: ["email", "full_name", "role"],
            optionalFields: ["phone_number", "password", "employee_type"],
            icon: UserCog,
            color: "#2568C1",
            bgSoft: "bg-blue-50/60",
            borderSoft: "border-blue-100",
            downloadFn: downloadUserExcelTemplate,
            openModal: () => setUsersImportOpen(true),
            guideline: "Users must be created first before assigning contracts or project memberships."
        },
        {
            id: "contracts",
            step: 2,
            title: "Global Contracts",
            subtitle: "Base Compensation & Schemes",
            description: "Bulk upload employee base compensation agreements, rates, and payment schemes.",
            mandatoryFields: ["email", "contract_type", "payment_scheme", "rate_amount"],
            optionalFields: ["start_date", "end_date", "is_active", "project_name"],
            icon: ReceiptText,
            color: "#2568C1",
            bgSoft: "bg-blue-50/60",
            borderSoft: "border-blue-100",
            downloadFn: downloadContractExcelTemplate,
            openModal: () => setContractsImportOpen(true),
            guideline: "Target user emails must already be registered in the system."
        },
        {
            id: "projects",
            step: 3,
            title: "Projects",
            subtitle: "Budgets & Client Agreements",
            description: "Bulk import project master data, client agreements, financial budgets, and PM assignment.",
            mandatoryFields: ["name", "client_name"],
            optionalFields: ["client_email", "budget_revenue", "budget_cost", "budget_cost_threshold", "deadline", "status", "pm_email"],
            icon: FolderKanban,
            color: "#2568C1",
            bgSoft: "bg-blue-50/60",
            borderSoft: "border-blue-100",
            downloadFn: downloadProjectExcelTemplate,
            openModal: () => setProjectsImportOpen(true),
            guideline: "Project names must be unique. Assigned PM email must have 'projectmanager' role."
        },
        {
            id: "members",
            step: 4,
            title: "Project Members",
            subtitle: "Team Allocation & Custom Rates",
            description: "Bulk assign registered staff to specific projects with titles and contract overrides.",
            mandatoryFields: ["project_name", "email", "role_in_project"],
            optionalFields: ["custom_rate", "contract_type", "payment_scheme", "start_date"],
            icon: Users,
            color: "#2568C1",
            bgSoft: "bg-blue-50/60",
            borderSoft: "border-blue-100",
            downloadFn: downloadProjectMemberExcelTemplate,
            openModal: () => setMembersImportOpen(true),
            guideline: "Both project name and user email must already exist in the database."
        },
        {
            id: "tasks",
            step: 5,
            title: "Tasks & Timesheets",
            subtitle: "Work Activity & Time Logs",
            description: "Bulk import project tasks and automatically bind employee timesheet work logs.",
            mandatoryFields: ["project_name", "assignee_email", "task_title"],
            optionalFields: ["created_at", "due_date", "task_description", "complexity", "task_status", "clock_in", "clock_out", "timesheet_status"],
            icon: ListTodo,
            color: "#2568C1",
            bgSoft: "bg-blue-50/60",
            borderSoft: "border-blue-100",
            downloadFn: downloadTaskAndTimesheetExcelTemplate,
            openModal: () => setTasksImportOpen(true),
            guideline: "Assignee email must be a project member. If clock_in is provided, timesheet is created."
        },
        {
            id: "resources",
            step: 6,
            title: "Resource Requests",
            subtitle: "Tools, Infrastructure & Expenses",
            description: "Bulk import resource and expense requests (tools, cloud infrastructure, and manpower).",
            mandatoryFields: ["project_name", "requester_email", "type", "details"],
            optionalFields: ["amount", "status"],
            icon: Package,
            color: "#2568C1",
            bgSoft: "bg-blue-50/60",
            borderSoft: "border-blue-100",
            downloadFn: downloadResourceRequestExcelTemplate,
            openModal: () => setResourceRequestsImportOpen(true),
            guideline: "Project name and requester email must exist in database. Type: tools, infrastructure, accommodation, manpower."
        },
        {
            id: "payroll",
            step: 7,
            title: "Payroll",
            subtitle: "Salaries",
            description: "Bulk record salary disbursements, project milestone payments, and honorariums.",
            mandatoryFields: ["email", "payment_name", "amount"],
            optionalFields: ["project_name", "paid_at", "description"],
            icon: HandCoins,
            color: "#2568C1",
            bgSoft: "bg-blue-50/60",
            borderSoft: "border-blue-100",
            downloadFn: downloadPayrollExcelTemplate,
            openModal: () => setPayrollImportOpen(true),
            guideline: "Recipient email must have an active contract. If project_name is omitted, payment attaches to global base contract."
        }
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Page Header */}
            <PageHeader 
                title="Data Import Center" 
                description="Universal hub for batch migrations, standardized spreadsheet templates, and automated database imports"
            />

            {/* Recommended Workflow Roadmap Banner */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3 mt-2">
                <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-[#2568C1]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Recommended Data Migration Sequence
                    </h3>
                </div>
                <p className="text-xs text-slate-500">
                    To maintain relational integrity, follow the sequential order below when bootstrapping or migrating new data:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-1">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-2">
                        <span className="h-5.5 w-5.5 rounded-full bg-[#2568C1] text-white flex items-center justify-center text-[11px] font-bold shrink-0">1</span>
                        <div>
                            <span className="text-xs font-bold text-slate-800">Users</span>
                            <p className="text-[10px] text-slate-500 leading-tight mt-0.5">Profiles & roles</p>
                        </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-2">
                        <span className="h-5.5 w-5.5 rounded-full bg-[#2568C1] text-white flex items-center justify-center text-[11px] font-bold shrink-0">2</span>
                        <div>
                            <span className="text-xs font-bold text-slate-800">Contracts</span>
                            <p className="text-[10px] text-slate-500 leading-tight mt-0.5">Salaries & terms</p>
                        </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-2">
                        <span className="h-5.5 w-5.5 rounded-full bg-[#2568C1] text-white flex items-center justify-center text-[11px] font-bold shrink-0">3</span>
                        <div>
                            <span className="text-xs font-bold text-slate-800">Projects</span>
                            <p className="text-[10px] text-slate-500 leading-tight mt-0.5">Portfolios & caps</p>
                        </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-2">
                        <span className="h-5.5 w-5.5 rounded-full bg-[#2568C1] text-white flex items-center justify-center text-[11px] font-bold shrink-0">4</span>
                        <div>
                            <span className="text-xs font-bold text-slate-800">Members</span>
                            <p className="text-[10px] text-slate-500 leading-tight mt-0.5">Team allocation</p>
                        </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-2">
                        <span className="h-5.5 w-5.5 rounded-full bg-[#2568C1] text-white flex items-center justify-center text-[11px] font-bold shrink-0">5</span>
                        <div>
                            <span className="text-xs font-bold text-slate-800">Tasks</span>
                            <p className="text-[10px] text-slate-500 leading-tight mt-0.5">Tasks & timesheets</p>
                        </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-2">
                        <span className="h-5.5 w-5.5 rounded-full bg-[#2568C1] text-white flex items-center justify-center text-[11px] font-bold shrink-0">6</span>
                        <div>
                            <span className="text-xs font-bold text-slate-800">Requests</span>
                            <p className="text-[10px] text-slate-500 leading-tight mt-0.5">Tools & expenses</p>
                        </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-2">
                        <span className="h-5.5 w-5.5 rounded-full bg-[#2568C1] text-white flex items-center justify-center text-[11px] font-bold shrink-0">7</span>
                        <div>
                            <span className="text-xs font-bold text-slate-800">Payroll</span>
                            <p className="text-[10px] text-slate-500 leading-tight mt-0.5">Disbursements</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid of 7 Import Modules */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {importModules.map((module) => {
                    const IconComponent = module.icon;
                    return (
                        <Card 
                            key={module.id} 
                            className="bg-white border-slate-200 shadow-sm rounded-xl overflow-hidden flex flex-col p-0 gap-0 transition-all duration-200 hover:border-slate-300 hover:shadow-md"
                        >
                            {/* Card Header */}
                            <CardHeader className="px-5 py-3.5 border-b border-slate-100 [&.border-b]:pb-3.5 flex flex-row items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${module.bgSoft} ${module.borderSoft} border`}>
                                        <IconComponent className="h-4.5 w-4.5 text-[#2568C1]" />
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <CardTitle className="text-sm font-bold text-slate-800">
                                                {module.title}
                                            </CardTitle>
                                            <Badge variant="outline" className="text-[10px] font-semibold text-slate-500 px-1.5 py-0">
                                                Step {module.step}
                                            </Badge>
                                        </div>
                                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                                            {module.subtitle}
                                        </p>
                                    </div>
                                </div>
                            </CardHeader>

                            {/* Card Body - Compact and Horizontally Aligned */}
                            <div className="p-4 sm:p-5 flex-1 flex flex-col gap-3">
                                <p className="text-xs text-slate-600 leading-relaxed h-[36px] line-clamp-2">
                                    {module.description}
                                </p>

                                {/* Column Schema Highlights */}
                                <div className="space-y-2.5 pt-0.5">
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            Mandatory Headers:
                                        </span>
                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                            {module.mandatoryFields.map((field) => (
                                                <Badge key={field} variant="outline" className="text-[10px] font-mono bg-rose-50/50 text-rose-700 border-rose-200">
                                                    {field}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            Optional Headers:
                                        </span>
                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                            {module.optionalFields.map((field) => (
                                                <Badge key={field} variant="outline" className="text-[10px] font-mono bg-slate-50 text-slate-600 border-slate-200">
                                                    {field}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Rule Note - Pushed cleanly to bottom before footer */}
                                <div className="mt-auto p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-500 flex items-start gap-2">
                                    <Info className="h-3.5 w-3.5 text-[#2568C1] shrink-0 mt-0.5" />
                                    <span className="leading-tight">{module.guideline}</span>
                                </div>
                            </div>

                            {/* Card Footer Actions */}
                            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between gap-3 shrink-0">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={module.downloadFn}
                                    className="gap-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold h-8 rounded-[6px] shadow-xs"
                                >
                                    <Download className="h-3.5 w-3.5 text-[#2568C1]" /> Template (.xlsx)
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={module.openModal}
                                    className="gap-2 bg-gradient-to-r from-[#2568C1] to-[#1a4f99] hover:from-[#1e56a6] hover:to-[#153f7a] text-white text-xs font-semibold h-8 rounded-[6px] shadow-md shadow-[#2568C1]/20"
                                >
                                    <UploadCloud className="h-3.5 w-3.5" /> Import Data <ArrowRight className="h-3 w-3" />
                                </Button>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Modal Dialogs */}
            <ImportUsersDialog 
                open={usersImportOpen} 
                onOpenChange={setUsersImportOpen} 
                onSuccess={handleUsersSuccess} 
            />

            <ImportContractsDialog 
                open={contractsImportOpen} 
                onOpenChange={setContractsImportOpen} 
                onSuccess={handleContractsSuccess} 
            />

            <ImportProjectsDialog 
                open={projectsImportOpen} 
                onOpenChange={setProjectsImportOpen} 
                onSuccess={handleProjectsSuccess} 
            />

            <ImportProjectMembersDialog 
                open={membersImportOpen} 
                onOpenChange={setMembersImportOpen} 
                onSuccess={handleMembersSuccess} 
            />

            <ImportTasksDialog 
                open={tasksImportOpen} 
                onOpenChange={setTasksImportOpen} 
                onSuccess={handleTasksSuccess} 
            />

            <ImportResourceRequestsDialog 
                open={resourceRequestsImportOpen} 
                onOpenChange={setResourceRequestsImportOpen} 
                onSuccess={handleResourceRequestsSuccess} 
            />

            <ImportPayrollDialog 
                open={payrollImportOpen} 
                onOpenChange={setPayrollImportOpen} 
                onSuccess={handlePayrollSuccess} 
            />
        </div>
    );
}
