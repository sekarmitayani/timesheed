import * as XLSX from "xlsx";

export interface ParsedUserRow {
    rowIndex: number;
    fullName: string;
    email: string;
    phoneNumber: string;
    role: string;
    employeeType: string;
    skillLevel: number;
    isValid: boolean;
    errors: string[];
}

export interface ParseResult {
    rows: ParsedUserRow[];
    validCount: number;
    errorCount: number;
    csvBlob: Blob;
}

/**
 * Generates and triggers browser download of the user migration Excel template
 */
export function downloadUserExcelTemplate() {
    // 1. Sample Data for Template
    const templateData = [
        {
            "full_name": "Budi Santoso",
            "email": "budi.santoso@company.com",
            "phone_number": "081234567890",
            "role": "employee",
            "employee_type": "fulltime",
            "skill_level": 2
        },
        {
            "full_name": "Siti Rahma",
            "email": "siti.rahma@company.com",
            "phone_number": "081234567891",
            "role": "projectmanager",
            "employee_type": "fulltime",
            "skill_level": 3
        },
        {
            "full_name": "Ahmad Fauzi",
            "email": "ahmad.fauzi@company.com",
            "phone_number": "081234567892",
            "role": "finance",
            "employee_type": "fulltime",
            "skill_level": 2
        },
        {
            "full_name": "Dewi Lestari",
            "email": "dewi.lestari@company.com",
            "phone_number": "081234567893",
            "role": "employee",
            "employee_type": "freelance",
            "skill_level": 1
        },
        {
            "full_name": "Super Admin",
            "email": "admin.system@company.com",
            "phone_number": "081234567894",
            "role": "admin",
            "employee_type": "",
            "skill_level": 3
        }
    ];

    // 2. Guidelines Data
    const guidelinesData = [
        {
            "Field": "full_name",
            "Required": "YES (Mandatory)",
            "Format / Type": "Text",
            "Valid Options / Example": "John Doe",
            "Description": "Full name of the user/employee"
        },
        {
            "Field": "email",
            "Required": "YES (Mandatory)",
            "Format / Type": "Valid Email",
            "Valid Options / Example": "user@company.com",
            "Description": "Login email address. Must be unique across the system."
        },
        {
            "Field": "phone_number",
            "Required": "YES (Mandatory)",
            "Format / Type": "Phone Digits",
            "Valid Options / Example": "081234567890",
            "Description": "Contact telephone or WhatsApp number. Must be unique."
        },
        {
            "Field": "role",
            "Required": "YES (Mandatory)",
            "Format / Type": "Enum",
            "Valid Options / Example": "admin, projectmanager, employee, finance",
            "Description": "System access role. Lowercase letters only."
        },
        {
            "Field": "employee_type",
            "Required": "YES (Except admin role)",
            "Format / Type": "Enum",
            "Valid Options / Example": "fulltime, parttime, freelance",
            "Description": "Required for employee, projectmanager, and finance roles. Leave empty for admin."
        },
        {
            "Field": "skill_level",
            "Required": "NO (Optional)",
            "Format / Type": "Integer (1 - 3)",
            "Valid Options / Example": "1, 2, or 3 (Default: 2)",
            "Description": "Skill rating used for AI task & timesheet calculations (1=Junior, 2=Mid, 3=Senior)."
        },
        {
            "Field": "[SECURITY NOTICE]",
            "Required": "NOTE",
            "Format / Type": "Default Password",
            "Valid Options / Example": "Timesheed@2026",
            "Description": "All newly imported accounts will be provisioned with this default password. Users can change it upon login."
        }
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Sheet 1: Template Data
    const wsTemplate = XLSX.utils.json_to_sheet(templateData);
    wsTemplate["!cols"] = [
        { wch: 25 }, // full_name
        { wch: 30 }, // email
        { wch: 18 }, // phone_number
        { wch: 18 }, // role
        { wch: 18 }, // employee_type
        { wch: 14 }  // skill_level
    ];
    XLSX.utils.book_append_sheet(wb, wsTemplate, "User Data Template");

    // Sheet 2: Guidelines
    const wsGuidelines = XLSX.utils.json_to_sheet(guidelinesData);
    wsGuidelines["!cols"] = [
        { wch: 20 }, // Field
        { wch: 24 }, // Required
        { wch: 20 }, // Type
        { wch: 45 }, // Example
        { wch: 60 }  // Description
    ];
    XLSX.utils.book_append_sheet(wb, wsGuidelines, "Field Guidelines");

    // Trigger download
    XLSX.writeFile(wb, "Template_Users.xlsx");
}

/**
 * Parses an uploaded Excel or CSV file in browser, validates each row, and converts to a CSV Blob
 */
export async function parseAndValidateUserFile(file: File): Promise<ParseResult> {
    const arrayBuffer = await file.arrayBuffer();
    const wb = XLSX.read(arrayBuffer, { type: "array" });

    // Read the first sheet
    const firstSheetName = wb.SheetNames[0];
    const ws = wb.Sheets[firstSheetName];

    // Convert sheet to JSON rows
    const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

    // Convert workbook sheet to standard CSV
    const csvString = XLSX.utils.sheet_to_csv(ws);
    const csvBlob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });

    const validRoles = ["admin", "projectmanager", "employee", "finance"];
    const validEmpTypes = ["fulltime", "parttime", "freelance"];

    const seenEmails = new Set<string>();
    const seenPhones = new Set<string>();

    const rows: ParsedUserRow[] = [];
    let validCount = 0;
    let errorCount = 0;

    rawRows.forEach((row, index) => {
        const rowIndex = index + 2; // Row 1 is header, data starts on row 2
        const errors: string[] = [];

        // Normalize keys (flexible casing / whitespace)
        const getField = (possibleKeys: string[]): string => {
            for (const key of Object.keys(row)) {
                const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
                for (const target of possibleKeys) {
                    if (cleanKey === target.toLowerCase()) {
                        return String(row[key] ?? "").trim();
                    }
                }
            }
            return "";
        };

        const fullName = getField(["full_name", "fullname", "name", "nama"]);
        const email = getField(["email", "mail", "email_address"]).toLowerCase();
        const phoneNumber = getField(["phone_number", "phone", "phonenumber", "telepon", "no_hp", "nohp"]);
        const role = getField(["role", "role_type"]).toLowerCase();
        const employeeType = getField(["employee_type", "employeetype", "type", "tipe"]).toLowerCase();
        const skillLevelRaw = getField(["skill_level", "skilllevel", "skill"]);

        let skillLevel = 2;
        if (skillLevelRaw) {
            const parsed = parseInt(skillLevelRaw, 10);
            if (!isNaN(parsed) && parsed >= 1 && parsed <= 3) {
                skillLevel = parsed;
            }
        }

        // Validate Full Name
        if (!fullName) {
            errors.push("Full name is required");
        }

        // Validate Email
        if (!email) {
            errors.push("Email address is required");
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.push("Invalid email format");
        } else if (seenEmails.has(email)) {
            errors.push("Duplicate email within this file");
        } else {
            seenEmails.add(email);
        }

        // Validate Phone Number
        if (!phoneNumber) {
            errors.push("Phone number is required");
        } else if (seenPhones.has(phoneNumber)) {
            errors.push("Duplicate phone number within this file");
        } else {
            seenPhones.add(phoneNumber);
        }

        // Validate Role
        if (!role) {
            errors.push("Role is required");
        } else if (!validRoles.includes(role)) {
            errors.push(`Invalid role '${role}' (options: ${validRoles.join(", ")})`);
        }

        // Validate Employee Type
        if (role && role !== "admin") {
            if (!employeeType) {
                errors.push(`Employee type is required for role '${role}'`);
            } else if (!validEmpTypes.includes(employeeType)) {
                errors.push(`Invalid employee type '${employeeType}' (options: ${validEmpTypes.join(", ")})`);
            }
        }

        const isValid = errors.length === 0;
        if (isValid) {
            validCount++;
        } else {
            errorCount++;
        }

        rows.push({
            rowIndex,
            fullName,
            email,
            phoneNumber,
            role,
            employeeType: role === "admin" ? "-" : employeeType,
            skillLevel,
            isValid,
            errors
        });
    });

    return {
        rows,
        validCount,
        errorCount,
        csvBlob
    };
}

// =========================================================================
// CONTRACT IMPORT UTILITIES
// =========================================================================

export interface ParsedContractRow {
    rowIndex: number;
    email: string;
    contractType: string;
    paymentScheme: string;
    rateAmount: number;
    startDate: string;
    endDate: string;
    projectName: string;
    isActive: boolean;
    isValid: boolean;
    errors: string[];
}

export interface ParseContractResult {
    rows: ParsedContractRow[];
    validCount: number;
    errorCount: number;
    csvBlob: Blob;
}

/**
 * Generates and triggers browser download of the contract migration Excel template
 */
export function downloadContractExcelTemplate() {
    // 1. Sample Data for Template
    const templateData = [
        {
            "email": "budi.santoso@company.com",
            "contract_type": "monthly",
            "payment_scheme": "monthly",
            "rate_amount": 5000000,
            "start_date": "2026-01-01",
            "end_date": "",
            "project_name": "",
            "is_active": "true"
        },
        {
            "email": "siti.rahma@company.com",
            "contract_type": "yearly",
            "payment_scheme": "monthly",
            "rate_amount": 120000000,
            "start_date": "2026-01-01",
            "end_date": "2026-12-31",
            "project_name": "",
            "is_active": "true"
        },
        {
            "email": "dewi.lestari@company.com",
            "contract_type": "mandays",
            "payment_scheme": "termin",
            "rate_amount": 350000,
            "start_date": "2026-02-01",
            "end_date": "2026-04-30",
            "project_name": "Fintech Core Banking",
            "is_active": "true"
        },
        {
            "email": "ahmad.fauzi@company.com",
            "contract_type": "timesheet",
            "payment_scheme": "back_to_back",
            "rate_amount": 50000,
            "start_date": "2026-03-01",
            "end_date": "",
            "project_name": "Mobile App Redesign",
            "is_active": "true"
        }
    ];

    // 2. Guidelines Data
    const guidelinesData = [
        {
            "Field": "email",
            "Required": "YES (Mandatory)",
            "Format / Type": "Valid Registered Email",
            "Valid Options / Example": "user@company.com",
            "Description": "Email of the registered user. The user account MUST already exist in the system."
        },
        {
            "Field": "contract_type",
            "Required": "YES (Mandatory)",
            "Format / Type": "Enum",
            "Valid Options / Example": "yearly, monthly, mandays, timesheet",
            "Description": "Type of remuneration agreement (yearly=Tahunan, monthly=Bulanan, mandays=Harian, timesheet=Per Jam)."
        },
        {
            "Field": "payment_scheme",
            "Required": "YES (Mandatory)",
            "Format / Type": "Enum",
            "Valid Options / Example": "monthly, termin, back_to_back",
            "Description": "Disbursement schedule (monthly=Rutin Bulanan, termin=Termin Project, back_to_back=Setelah Client Bayar)."
        },
        {
            "Field": "rate_amount",
            "Required": "YES (Mandatory)",
            "Format / Type": "Positive Integer",
            "Valid Options / Example": "5000000",
            "Description": "Compensation rate in IDR without currency symbols, commas, or periods."
        },
        {
            "Field": "start_date",
            "Required": "YES (Mandatory)",
            "Format / Type": "Date (YYYY-MM-DD)",
            "Valid Options / Example": "2026-01-01",
            "Description": "Effective contract start date in ISO format."
        },
        {
            "Field": "end_date",
            "Required": "NO (Optional)",
            "Format / Type": "Date (YYYY-MM-DD)",
            "Valid Options / Example": "2026-12-31",
            "Description": "Contract expiration date. Leave blank for ongoing / permanent engagements."
        },
        {
            "Field": "project_name",
            "Required": "NO (Optional)",
            "Format / Type": "Text (Project Title)",
            "Valid Options / Example": "Fintech Core Banking",
            "Description": "Assign to a specific project (must match project name in system). Leave blank for Global Base Rate contract."
        },
        {
            "Field": "is_active",
            "Required": "NO (Optional)",
            "Format / Type": "Boolean",
            "Valid Options / Example": "true / false (Default: true)",
            "Description": "Whether this contract is currently active."
        }
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Sheet 1: Template Data
    const wsTemplate = XLSX.utils.json_to_sheet(templateData);
    wsTemplate["!cols"] = [
        { wch: 30 }, // email
        { wch: 18 }, // contract_type
        { wch: 18 }, // payment_scheme
        { wch: 16 }, // rate_amount
        { wch: 14 }, // start_date
        { wch: 14 }, // end_date
        { wch: 26 }, // project_name
        { wch: 12 }  // is_active
    ];
    XLSX.utils.book_append_sheet(wb, wsTemplate, "Contract Data Template");

    // Sheet 2: Guidelines
    const wsGuidelines = XLSX.utils.json_to_sheet(guidelinesData);
    wsGuidelines["!cols"] = [
        { wch: 18 }, // Field
        { wch: 20 }, // Required
        { wch: 22 }, // Type
        { wch: 45 }, // Example
        { wch: 65 }  // Description
    ];
    XLSX.utils.book_append_sheet(wb, wsGuidelines, "Field Guidelines");

    // Trigger download
    XLSX.writeFile(wb, "Template_Contracts.xlsx");
}

/**
 * Parses an uploaded Excel or CSV contract file, validates each row, and converts to a CSV Blob
 */
export async function parseAndValidateContractFile(file: File): Promise<ParseContractResult> {
    const arrayBuffer = await file.arrayBuffer();
    const wb = XLSX.read(arrayBuffer, { type: "array" });

    // Read the first sheet
    const firstSheetName = wb.SheetNames[0];
    const ws = wb.Sheets[firstSheetName];

    // Convert sheet to JSON rows
    const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

    // Convert workbook sheet to standard CSV
    const csvString = XLSX.utils.sheet_to_csv(ws);
    const csvBlob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });

    const validContractTypes = ["yearly", "monthly", "mandays", "timesheet"];
    const validPaymentSchemes = ["monthly", "termin", "back_to_back"];

    const seenContracts = new Set<string>();

    const rows: ParsedContractRow[] = [];
    let validCount = 0;
    let errorCount = 0;

    rawRows.forEach((row, index) => {
        const rowIndex = index + 2; // Row 1 is header, data starts on row 2
        const errors: string[] = [];

        // Normalize keys
        const getField = (possibleKeys: string[]): string => {
            for (const key of Object.keys(row)) {
                const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
                for (const target of possibleKeys) {
                    if (cleanKey === target.toLowerCase()) {
                        return String(row[key] ?? "").trim();
                    }
                }
            }
            return "";
        };

        const email = getField(["email", "mail", "email_address", "user_email"]).toLowerCase();
        const contractType = getField(["contract_type", "contracttype", "type", "tipe"]).toLowerCase();
        const paymentScheme = getField(["payment_scheme", "paymentscheme", "scheme", "skema"]).toLowerCase();
        const rateAmountRaw = getField(["rate_amount", "rateamount", "rate", "gaji", "amount"]);
        const startDate = getField(["start_date", "startdate", "start", "tanggal_mulai"]);
        const endDate = getField(["end_date", "enddate", "end", "tanggal_selesai"]);
        const projectName = getField(["project_name", "projectname", "project", "proyek"]);
        const isActiveRaw = getField(["is_active", "isactive", "active", "status"]).toLowerCase();

        const isActive = isActiveRaw !== "false" && isActiveRaw !== "0" && isActiveRaw !== "no";

        // Validate Email
        if (!email) {
            errors.push("Email is required");
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.push("Invalid email format");
        }

        // Validate Contract Type
        if (!contractType) {
            errors.push("Contract type is required");
        } else if (!validContractTypes.includes(contractType)) {
            errors.push(`Invalid contract type '${contractType}' (options: ${validContractTypes.join(", ")})`);
        }

        // Validate Payment Scheme
        if (!paymentScheme) {
            errors.push("Payment scheme is required");
        } else if (!validPaymentSchemes.includes(paymentScheme)) {
            errors.push(`Invalid payment scheme '${paymentScheme}' (options: ${validPaymentSchemes.join(", ")})`);
        }

        // Validate Rate Amount
        const cleanRateStr = rateAmountRaw.replace(/\./g, "").replace(/,/g, "");
        const rateAmount = parseInt(cleanRateStr, 10);
        if (!rateAmountRaw) {
            errors.push("Rate amount is required");
        } else if (isNaN(rateAmount) || rateAmount <= 0) {
            errors.push("Rate amount must be a positive integer");
        }

        // Validate Start Date (YYYY-MM-DD)
        if (!startDate) {
            errors.push("Start date is required");
        } else if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || isNaN(Date.parse(startDate))) {
            errors.push("Invalid start date format (use YYYY-MM-DD)");
        }

        // Validate End Date (if provided)
        if (endDate) {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate) || isNaN(Date.parse(endDate))) {
                errors.push("Invalid end date format (use YYYY-MM-DD)");
            } else if (startDate && /^\d{4}-\d{2}-\d{2}$/.test(startDate) && new Date(endDate) < new Date(startDate)) {
                errors.push("End date cannot be earlier than start date");
            }
        }

        // Duplicate Check within this file (email + project)
        const duplicateKey = `${email}:::${projectName.toLowerCase()}`;
        if (email && seenContracts.has(duplicateKey)) {
            errors.push(`Duplicate contract for '${email}' ${projectName ? `in project '${projectName}'` : '(Base Rate)'} within this file`);
        } else if (email) {
            seenContracts.add(duplicateKey);
        }

        const isValid = errors.length === 0;
        if (isValid) {
            validCount++;
        } else {
            errorCount++;
        }

        rows.push({
            rowIndex,
            email,
            contractType,
            paymentScheme,
            rateAmount: isNaN(rateAmount) ? 0 : rateAmount,
            startDate,
            endDate,
            projectName,
            isActive,
            isValid,
            errors
        });
    });

    return {
        rows,
        validCount,
        errorCount,
        csvBlob
    };
}

// =========================================================================
// PROJECT IMPORT UTILITIES
// =========================================================================

export interface ParsedProjectRow {
    rowIndex: number;
    name: string;
    clientName: string;
    clientEmail: string;
    budgetRevenue: number;
    budgetCost: number;
    budgetCostThreshold: number;
    deadline: string;
    status: string;
    pmEmail: string;
    isValid: boolean;
    errors: string[];
}

export interface ParseProjectResult {
    rows: ParsedProjectRow[];
    validCount: number;
    errorCount: number;
    csvBlob: Blob;
}

/**
 * Generates and triggers browser download of the project migration Excel template
 */
export function downloadProjectExcelTemplate() {
    // 1. Sample Data for Template
    const templateData = [
        {
            "name": "Fintech Core Banking System",
            "client_name": "PT Bank Digital Asia",
            "client_email": "procurement@bankdigital.com",
            "budget_revenue": 500000000,
            "budget_cost": 300000000,
            "budget_cost_threshold": 270000000,
            "deadline": "2026-12-31",
            "status": "active",
            "pm_email": "siti.rahma@company.com"
        },
        {
            "name": "Mobile E-Commerce App Revamp",
            "client_name": "PT Mega Retail Nusantara",
            "client_email": "it@megaretail.co.id",
            "budget_revenue": 250000000,
            "budget_cost": 150000000,
            "budget_cost_threshold": 135000000,
            "deadline": "2026-08-31",
            "status": "active",
            "pm_email": "siti.rahma@company.com"
        },
        {
            "name": "Cloud Infrastructure Migration",
            "client_name": "Logistics Express Global",
            "client_email": "infra@logisticsexpress.com",
            "budget_revenue": 180000000,
            "budget_cost": 100000000,
            "budget_cost_threshold": 90000000,
            "deadline": "2026-06-30",
            "status": "completed",
            "pm_email": ""
        }
    ];

    // 2. Guidelines Data
    const guidelinesData = [
        {
            "Field": "name",
            "Required": "YES (Mandatory)",
            "Format / Type": "Text (Unique Name)",
            "Valid Options / Example": "Fintech Core Banking System",
            "Description": "Unique project title. Duplicate names in system or file will be skipped."
        },
        {
            "Field": "client_name",
            "Required": "YES (Mandatory)",
            "Format / Type": "Text",
            "Valid Options / Example": "PT Bank Digital Asia",
            "Description": "Name of the client institution or organization."
        },
        {
            "Field": "client_email",
            "Required": "NO (Optional)",
            "Format / Type": "Valid Email",
            "Valid Options / Example": "contact@client.com",
            "Description": "Official email address of the client representative."
        },
        {
            "Field": "budget_revenue",
            "Required": "NO (Optional)",
            "Format / Type": "Positive Integer",
            "Valid Options / Example": "500000000",
            "Description": "Total client contract revenue in IDR (without currency symbols/commas)."
        },
        {
            "Field": "budget_cost",
            "Required": "NO (Optional)",
            "Format / Type": "Positive Integer",
            "Valid Options / Example": "300000000",
            "Description": "Total planned project budget cap (modal/biaya rencana) in IDR."
        },
        {
            "Field": "budget_cost_threshold",
            "Required": "NO (Optional)",
            "Format / Type": "Positive Integer",
            "Valid Options / Example": "270000000",
            "Description": "Alert threshold for project spending warning in IDR."
        },
        {
            "Field": "deadline",
            "Required": "NO (Optional)",
            "Format / Type": "Date (YYYY-MM-DD)",
            "Valid Options / Example": "2026-12-31",
            "Description": "Project target completion date in ISO format."
        },
        {
            "Field": "status",
            "Required": "NO (Optional)",
            "Format / Type": "Enum",
            "Valid Options / Example": "active, completed, on_hold, cancelled (Default: active)",
            "Description": "Initial project status in lowercase."
        },
        {
            "Field": "pm_email",
            "Required": "NO (Optional)",
            "Format / Type": "Valid Registered PM Email",
            "Valid Options / Example": "siti.rahma@company.com",
            "Description": "Email of the assigned Project Manager. The user must be already registered with 'projectmanager' role. If blank or not found, project is created without PM."
        }
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Sheet 1: Template Data
    const wsTemplate = XLSX.utils.json_to_sheet(templateData);
    wsTemplate["!cols"] = [
        { wch: 32 }, // name
        { wch: 28 }, // client_name
        { wch: 30 }, // client_email
        { wch: 18 }, // budget_revenue
        { wch: 18 }, // budget_cost
        { wch: 22 }, // budget_cost_threshold
        { wch: 14 }, // deadline
        { wch: 14 }, // status
        { wch: 30 }  // pm_email
    ];
    XLSX.utils.book_append_sheet(wb, wsTemplate, "Project Data Template");

    // Sheet 2: Guidelines
    const wsGuidelines = XLSX.utils.json_to_sheet(guidelinesData);
    wsGuidelines["!cols"] = [
        { wch: 22 }, // Field
        { wch: 20 }, // Required
        { wch: 24 }, // Type
        { wch: 45 }, // Example
        { wch: 70 }  // Description
    ];
    XLSX.utils.book_append_sheet(wb, wsGuidelines, "Field Guidelines");

    // Trigger download
    XLSX.writeFile(wb, "Template_Projects.xlsx");
}

/**
 * Parses an uploaded Excel or CSV project file, validates each row, and converts to a CSV Blob
 */
export async function parseAndValidateProjectFile(file: File): Promise<ParseProjectResult> {
    const arrayBuffer = await file.arrayBuffer();
    const wb = XLSX.read(arrayBuffer, { type: "array" });

    // Read the first sheet
    const firstSheetName = wb.SheetNames[0];
    const ws = wb.Sheets[firstSheetName];

    // Convert sheet to JSON rows
    const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

    // Convert workbook sheet to standard CSV
    const csvString = XLSX.utils.sheet_to_csv(ws);
    const csvBlob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });

    const validStatuses = ["active", "completed", "on_hold", "cancelled"];
    const seenProjectNames = new Set<string>();

    const rows: ParsedProjectRow[] = [];
    let validCount = 0;
    let errorCount = 0;

    rawRows.forEach((row, index) => {
        const rowIndex = index + 2; // Row 1 is header, data starts on row 2
        const errors: string[] = [];

        // Normalize keys
        const getField = (possibleKeys: string[]): string => {
            for (const key of Object.keys(row)) {
                const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
                for (const target of possibleKeys) {
                    if (cleanKey === target.toLowerCase()) {
                        return String(row[key] ?? "").trim();
                    }
                }
            }
            return "";
        };

        const name = getField(["name", "project_name", "projectname", "nama_proyek", "nama_project", "judul"]);
        const clientName = getField(["client_name", "clientname", "client", "klien", "nama_klien"]);
        const clientEmail = getField(["client_email", "clientemail", "email_client", "email_klien"]).toLowerCase();
        const budgetRevenueRaw = getField(["budget_revenue", "budgetrevenue", "revenue", "nilai_kontrak", "kontrak"]);
        const budgetCostRaw = getField(["budget_cost", "budgetcost", "cost", "planned_cost", "modal", "budget"]);
        const budgetThresholdRaw = getField(["budget_cost_threshold", "budgetcostthreshold", "threshold", "cost_threshold", "batas_warning"]);
        const deadline = getField(["deadline", "due_date", "duedate", "target_selesai", "tanggal_selesai"]);
        const statusRaw = getField(["status", "project_status"]).toLowerCase();
        const pmEmail = getField(["pm_email", "pmemail", "project_manager_email", "pm", "project_manager"]).toLowerCase();

        const status = statusRaw || "active";

        // Validate Project Name
        if (!name) {
            errors.push("Project name is required");
        } else if (seenProjectNames.has(name.toLowerCase())) {
            errors.push("Duplicate project name within this file");
        } else {
            seenProjectNames.add(name.toLowerCase());
        }

        // Validate Client Name
        if (!clientName) {
            errors.push("Client name is required");
        }

        // Validate Client Email (if provided)
        if (clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
            errors.push("Invalid client email format");
        }

        // Validate Status
        if (status && !validStatuses.includes(status)) {
            errors.push(`Invalid status '${status}' (options: ${validStatuses.join(", ")})`);
        }

        // Parse & Validate Budgets
        const parseNumber = (rawStr: string, fieldLabel: string): number => {
            if (!rawStr) return 0;
            const cleanStr = rawStr.replace(/\./g, "").replace(/,/g, "");
            const val = parseInt(cleanStr, 10);
            if (isNaN(val) || val < 0) {
                errors.push(`${fieldLabel} must be a positive integer`);
                return 0;
            }
            return val;
        };

        const budgetRevenue = parseNumber(budgetRevenueRaw, "Budget revenue");
        const budgetCost = parseNumber(budgetCostRaw, "Budget cost");
        const budgetCostThreshold = parseNumber(budgetThresholdRaw, "Budget threshold");

        // Validate Deadline (if provided)
        if (deadline) {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline) || isNaN(Date.parse(deadline))) {
                errors.push("Invalid deadline format (use YYYY-MM-DD)");
            }
        }

        // Validate PM Email (if provided)
        if (pmEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pmEmail)) {
            errors.push("Invalid PM email format");
        }

        const isValid = errors.length === 0;
        if (isValid) {
            validCount++;
        } else {
            errorCount++;
        }

        rows.push({
            rowIndex,
            name,
            clientName,
            clientEmail,
            budgetRevenue,
            budgetCost,
            budgetCostThreshold,
            deadline,
            status,
            pmEmail,
            isValid,
            errors
        });
    });

    return {
        rows,
        validCount,
        errorCount,
        csvBlob
    };
}

// =========================================================================
// PROJECT MEMBER IMPORT UTILITIES
// =========================================================================

export interface ParsedProjectMemberRow {
    rowIndex: number;
    projectName: string;
    email: string;
    roleInProject: string;
    customRate: number;
    contractType: string;
    paymentScheme: string;
    startDate: string;
    isValid: boolean;
    errors: string[];
}

export interface ParseProjectMemberResult {
    rows: ParsedProjectMemberRow[];
    validCount: number;
    errorCount: number;
    csvBlob: Blob;
}

/**
 * Generates and triggers browser download of the project member assignment Excel template
 */
export function downloadProjectMemberExcelTemplate() {
    // 1. Sample Data for Template
    const templateData = [
        {
            "project_name": "Fintech Core Banking System",
            "email": "budi.santoso@company.com",
            "role_in_project": "Lead Frontend Engineer",
            "custom_rate": 6500000,
            "contract_type": "monthly",
            "payment_scheme": "monthly",
            "start_date": "2026-03-01"
        },
        {
            "project_name": "Fintech Core Banking System",
            "email": "dewi.lestari@company.com",
            "role_in_project": "UI/UX Designer",
            "custom_rate": "",
            "contract_type": "",
            "payment_scheme": "",
            "start_date": ""
        },
        {
            "project_name": "Mobile E-Commerce App Revamp",
            "email": "budi.santoso@company.com",
            "role_in_project": "Fullstack Developer",
            "custom_rate": 350000,
            "contract_type": "mandays",
            "payment_scheme": "termin",
            "start_date": "2026-04-01"
        },
        {
            "project_name": "Cloud Infrastructure Migration",
            "email": "ahmad.fauzi@company.com",
            "role_in_project": "DevOps Engineer",
            "custom_rate": "",
            "contract_type": "",
            "payment_scheme": "",
            "start_date": ""
        }
    ];

    // 2. Guidelines Data
    const guidelinesData = [
        {
            "Field": "project_name",
            "Required": "YES (Mandatory)",
            "Format / Type": "Text (Must exist in system)",
            "Valid Options / Example": "Fintech Core Banking System",
            "Description": "Exact name of an existing project in the database (case-insensitive)."
        },
        {
            "Field": "email",
            "Required": "YES (Mandatory)",
            "Format / Type": "Valid Registered User Email",
            "Valid Options / Example": "budi.santoso@company.com",
            "Description": "Email of an existing registered user to assign to the project."
        },
        {
            "Field": "role_in_project",
            "Required": "YES (Mandatory)",
            "Format / Type": "Text",
            "Valid Options / Example": "Lead Frontend Engineer, Backend Developer, QA Specialist",
            "Description": "Designated role, title, or responsibility for this specific project."
        },
        {
            "Field": "custom_rate",
            "Required": "NO (Optional)",
            "Format / Type": "Positive Integer (IDR)",
            "Valid Options / Example": "6500000",
            "Description": "Project-specific override rate in IDR. If left blank, the user will inherit their default global contract rate."
        },
        {
            "Field": "contract_type",
            "Required": "YES IF custom_rate is filled",
            "Format / Type": "Enum",
            "Valid Options / Example": "yearly, monthly, mandays, timesheet",
            "Description": "Type of project-specific contract. Mandatory if custom_rate is provided."
        },
        {
            "Field": "payment_scheme",
            "Required": "YES IF custom_rate is filled",
            "Format / Type": "Enum",
            "Valid Options / Example": "monthly, termin, back_to_back",
            "Description": "Disbursement schedule for this project contract. Mandatory if custom_rate is provided."
        },
        {
            "Field": "start_date",
            "Required": "NO (Optional)",
            "Format / Type": "Date (YYYY-MM-DD)",
            "Valid Options / Example": "2026-03-01",
            "Description": "Effective start date for the custom project contract. Defaults to current date if blank."
        }
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Sheet 1: Template Data
    const wsTemplate = XLSX.utils.json_to_sheet(templateData);
    wsTemplate["!cols"] = [
        { wch: 32 }, // project_name
        { wch: 30 }, // email
        { wch: 26 }, // role_in_project
        { wch: 16 }, // custom_rate
        { wch: 16 }, // contract_type
        { wch: 18 }, // payment_scheme
        { wch: 14 }  // start_date
    ];
    XLSX.utils.book_append_sheet(wb, wsTemplate, "Member Assignment Template");

    // Sheet 2: Guidelines
    const wsGuidelines = XLSX.utils.json_to_sheet(guidelinesData);
    wsGuidelines["!cols"] = [
        { wch: 20 }, // Field
        { wch: 28 }, // Required
        { wch: 30 }, // Type
        { wch: 35 }, // Example
        { wch: 70 }  // Description
    ];
    XLSX.utils.book_append_sheet(wb, wsGuidelines, "Field Guidelines");

    // Trigger download
    XLSX.writeFile(wb, "Template_Project_Members.xlsx");
}

/**
 * Parses an uploaded Excel or CSV project member file, validates each row, and converts to a CSV Blob
 */
export async function parseAndValidateProjectMemberFile(file: File): Promise<ParseProjectMemberResult> {
    const arrayBuffer = await file.arrayBuffer();
    const wb = XLSX.read(arrayBuffer, { type: "array" });

    // Read the first sheet
    const firstSheetName = wb.SheetNames[0];
    const ws = wb.Sheets[firstSheetName];

    // Convert sheet to JSON rows
    const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

    // Convert workbook sheet to standard CSV
    const csvString = XLSX.utils.sheet_to_csv(ws);
    const csvBlob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });

    const validContractTypes = ["yearly", "monthly", "mandays", "timesheet"];
    const validPaymentSchemes = ["monthly", "termin", "back_to_back"];
    const seenAssignments = new Set<string>();

    const rows: ParsedProjectMemberRow[] = [];
    let validCount = 0;
    let errorCount = 0;

    rawRows.forEach((row, index) => {
        const rowIndex = index + 2; // Row 1 is header, data starts on row 2
        const errors: string[] = [];

        // Normalize keys
        const getField = (possibleKeys: string[]): string => {
            for (const key of Object.keys(row)) {
                const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
                for (const target of possibleKeys) {
                    if (cleanKey === target.toLowerCase()) {
                        return String(row[key] ?? "").trim();
                    }
                }
            }
            return "";
        };

        const projectName = getField(["project_name", "projectname", "project", "nama_proyek", "nama_project"]);
        const email = getField(["email", "user_email", "useremail", "member_email", "email_user"]).toLowerCase();
        const roleInProject = getField(["role_in_project", "roleinproject", "role", "peran", "posisi", "jabatan"]);
        const customRateRaw = getField(["custom_rate", "customrate", "rate", "rate_amount", "gaji_project"]);
        const contractType = getField(["contract_type", "contracttype", "tipe_kontrak"]).toLowerCase();
        const paymentScheme = getField(["payment_scheme", "paymentscheme", "skema_pembayaran", "skema"]).toLowerCase();
        const startDate = getField(["start_date", "startdate", "tanggal_mulai"]);

        // Validate Project Name
        if (!projectName) {
            errors.push("Project name is required");
        }

        // Validate Email
        if (!email) {
            errors.push("User email is required");
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.push("Invalid email format");
        }

        // Validate Role
        if (!roleInProject) {
            errors.push("Role in project is required");
        }

        // Check Duplicate Assignment in File
        if (projectName && email) {
            const assignmentKey = `${projectName.toLowerCase()}::${email}`;
            if (seenAssignments.has(assignmentKey)) {
                errors.push("Duplicate assignment in this file for the same project and user");
            } else {
                seenAssignments.add(assignmentKey);
            }
        }

        // Parse Custom Rate
        let customRate = 0;
        if (customRateRaw) {
            const cleanStr = customRateRaw.replace(/\./g, "").replace(/,/g, "");
            const val = parseInt(cleanStr, 10);
            if (isNaN(val) || val <= 0) {
                errors.push("Custom rate must be a positive integer");
            } else {
                customRate = val;
            }

            // If custom rate is provided, contract_type and payment_scheme are required
            if (!contractType) {
                errors.push("Contract type is required when custom rate is specified");
            } else if (!validContractTypes.includes(contractType)) {
                errors.push(`Invalid contract type '${contractType}' (options: ${validContractTypes.join(", ")})`);
            }

            if (!paymentScheme) {
                errors.push("Payment scheme is required when custom rate is specified");
            } else if (!validPaymentSchemes.includes(paymentScheme)) {
                errors.push(`Invalid payment scheme '${paymentScheme}' (options: ${validPaymentSchemes.join(", ")})`);
            }
        }

        // Validate Start Date (if provided)
        if (startDate) {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || isNaN(Date.parse(startDate))) {
                errors.push("Invalid start date format (use YYYY-MM-DD)");
            }
        }

        const isValid = errors.length === 0;
        if (isValid) {
            validCount++;
        } else {
            errorCount++;
        }

        rows.push({
            rowIndex,
            projectName,
            email,
            roleInProject,
            customRate,
            contractType,
            paymentScheme,
            startDate,
            isValid,
            errors
        });
    });

    return {
        rows,
        validCount,
        errorCount,
        csvBlob
    };
}

// =========================================================================
// RESOURCE REQUEST IMPORT UTILITIES
// =========================================================================

export interface ParsedResourceRequestRow {
    rowIndex: number;
    projectName: string;
    requesterEmail: string;
    type: string;
    details: string;
    amount: number;
    status: string;
    isValid: boolean;
    errors: string[];
}

export interface ParseResourceRequestResult {
    rows: ParsedResourceRequestRow[];
    validCount: number;
    errorCount: number;
    csvBlob: Blob;
}

/**
 * Generates and triggers browser download of the resource request migration Excel template
 */
export function downloadResourceRequestExcelTemplate() {
    // 1. Sample Data for Template
    const templateData = [
        {
            "project_name": "Fintech Core Banking System",
            "requester_email": "siti.rahma@company.com",
            "type": "tools",
            "details": "MacBook Pro M4 for frontend development team lead",
            "amount": 35000000,
            "status": "pending"
        },
        {
            "project_name": "Mobile E-Commerce App Revamp",
            "requester_email": "siti.rahma@company.com",
            "type": "infrastructure",
            "details": "AWS EC2 t3.xlarge for staging environment server",
            "amount": 5000000,
            "status": "pending"
        },
        {
            "project_name": "Fintech Core Banking System",
            "requester_email": "siti.rahma@company.com",
            "type": "accommodation",
            "details": "Hotel & Transport for 3-day onsite client integration testing",
            "amount": 4500000,
            "status": "pending"
        },
        {
            "project_name": "Cloud Infrastructure Migration",
            "requester_email": "siti.rahma@company.com",
            "type": "manpower",
            "details": "Request for additional DevOps Engineer for 2 months",
            "amount": "",
            "status": "pending"
        }
    ];

    // 2. Guidelines Data
    const guidelinesData = [
        {
            "Field": "project_name",
            "Required": "YES (Mandatory)",
            "Format / Type": "Text (Must exist in system)",
            "Valid Options / Example": "Fintech Core Banking System",
            "Description": "Exact name of an existing project in the database (case-insensitive)."
        },
        {
            "Field": "requester_email",
            "Required": "YES (Mandatory)",
            "Format / Type": "Valid Registered User Email",
            "Valid Options / Example": "siti.rahma@company.com",
            "Description": "Email of the registered user submitting the resource request (Project Manager or Team Member)."
        },
        {
            "Field": "type",
            "Required": "YES (Mandatory)",
            "Format / Type": "Enum",
            "Valid Options / Example": "tools, infrastructure, accommodation, manpower",
            "Description": "Category of the resource. Must be one of the four allowed enum values (lowercase)."
        },
        {
            "Field": "details",
            "Required": "YES (Mandatory)",
            "Format / Type": "Text",
            "Valid Options / Example": "MacBook Pro M4 for frontend team",
            "Description": "Clear description and justification of the requested asset or service."
        },
        {
            "Field": "amount",
            "Required": "NO (Optional)",
            "Format / Type": "Positive Number (IDR)",
            "Valid Options / Example": "35000000",
            "Description": "Estimated or actual monetary cost in IDR (leave empty or 0 for manpower without agency fees)."
        },
        {
            "Field": "status",
            "Required": "NO (Optional)",
            "Format / Type": "Enum",
            "Valid Options / Example": "pending, approved, rejected (Default: pending)",
            "Description": "Initial approval status. Defaults to 'pending' if left blank."
        }
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Sheet 1: Template Data
    const wsTemplate = XLSX.utils.json_to_sheet(templateData);
    wsTemplate["!cols"] = [
        { wch: 32 }, // project_name
        { wch: 30 }, // requester_email
        { wch: 18 }, // type
        { wch: 45 }, // details
        { wch: 16 }, // amount
        { wch: 14 }  // status
    ];
    XLSX.utils.book_append_sheet(wb, wsTemplate, "Resource Request Template");

    // Sheet 2: Guidelines
    const wsGuidelines = XLSX.utils.json_to_sheet(guidelinesData);
    wsGuidelines["!cols"] = [
        { wch: 20 }, // Field
        { wch: 28 }, // Required
        { wch: 28 }, // Type
        { wch: 45 }, // Example
        { wch: 70 }  // Description
    ];
    XLSX.utils.book_append_sheet(wb, wsGuidelines, "Field Guidelines");

    // Trigger download
    XLSX.writeFile(wb, "Template_Resource_Requests.xlsx");
}

/**
 * Parses an uploaded Excel or CSV resource request file, validates each row, and converts to a CSV Blob
 */
export async function parseAndValidateResourceRequestFile(file: File): Promise<ParseResourceRequestResult> {
    const arrayBuffer = await file.arrayBuffer();
    const wb = XLSX.read(arrayBuffer, { type: "array" });

    // Read the first sheet
    const firstSheetName = wb.SheetNames[0];
    const ws = wb.Sheets[firstSheetName];

    // Convert sheet to JSON rows
    const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

    // Convert workbook sheet to standard CSV
    const csvString = XLSX.utils.sheet_to_csv(ws);
    const csvBlob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });

    const validTypes = ["tools", "infrastructure", "accommodation", "manpower"];
    const validStatuses = ["pending", "approved", "rejected"];
    const seenRequests = new Set<string>();

    const rows: ParsedResourceRequestRow[] = [];
    let validCount = 0;
    let errorCount = 0;

    rawRows.forEach((row, index) => {
        const rowIndex = index + 2; // Row 1 is header, data starts on row 2
        const errors: string[] = [];

        // Normalize keys
        const getField = (possibleKeys: string[]): string => {
            for (const key of Object.keys(row)) {
                const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
                for (const target of possibleKeys) {
                    if (cleanKey === target.toLowerCase()) {
                        return String(row[key] ?? "").trim();
                    }
                }
            }
            return "";
        };

        const projectName = getField(["project_name", "projectname", "project", "nama_proyek", "nama_project"]);
        const requesterEmail = getField(["requester_email", "requesteremail", "email", "user_email", "pemohon"]).toLowerCase();
        const type = getField(["type", "resource_type", "resourcetype", "tipe", "kategori", "category"]).toLowerCase();
        const details = getField(["details", "detail", "description", "deskripsi", "keterangan"]);
        const amountRaw = getField(["amount", "nominal", "biaya", "cost", "harga"]);
        const statusRaw = getField(["status", "request_status", "status_pengajuan"]).toLowerCase();

        const status = statusRaw || "pending";

        // Validate Project Name
        if (!projectName) {
            errors.push("Project name is required");
        }

        // Validate Requester Email
        if (!requesterEmail) {
            errors.push("Requester email is required");
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requesterEmail)) {
            errors.push("Invalid requester email format");
        }

        // Validate Type Enum
        if (!type) {
            errors.push("Resource type is required");
        } else if (!validTypes.includes(type)) {
            errors.push(`Invalid resource type '${type}' (options: ${validTypes.join(", ")})`);
        }

        // Validate Details
        if (!details) {
            errors.push("Request details are required");
        }

        // Parse & Validate Amount
        let amount = 0;
        if (amountRaw) {
            const cleanStr = amountRaw.replace(/\./g, "").replace(/,/g, "");
            const val = parseFloat(cleanStr);
            if (isNaN(val) || val < 0) {
                errors.push("Amount must be a non-negative number");
            } else {
                amount = val;
            }
        }

        // Validate Status Enum
        if (status && !validStatuses.includes(status)) {
            errors.push(`Invalid status '${status}' (options: ${validStatuses.join(", ")})`);
        }

        // Duplicate Check in File
        if (projectName && requesterEmail && type && details) {
            const dedupKey = `${projectName.toLowerCase()}::${requesterEmail}::${type}::${details.toLowerCase()}`;
            if (seenRequests.has(dedupKey)) {
                errors.push("Duplicate resource request within this file");
            } else {
                seenRequests.add(dedupKey);
            }
        }

        const isValid = errors.length === 0;
        if (isValid) {
            validCount++;
        } else {
            errorCount++;
        }

        rows.push({
            rowIndex,
            projectName,
            requesterEmail,
            type,
            details,
            amount,
            status,
            isValid,
            errors
        });
    });

    return {
        rows,
        validCount,
        errorCount,
        csvBlob
    };
}

// =========================================================================
// PAYROLL DISBURSEMENT IMPORT UTILITIES
// =========================================================================

export interface ParsedPayrollRow {
    rowIndex: number;
    email: string;
    projectName: string;
    paymentName: string;
    amount: number;
    paidAt: string;
    description: string;
    isValid: boolean;
    errors: string[];
}

export interface ParsePayrollResult {
    rows: ParsedPayrollRow[];
    validCount: number;
    errorCount: number;
    csvBlob: Blob;
}

/**
 * Generates and triggers browser download of the payroll disbursement migration Excel template
 */
export function downloadPayrollExcelTemplate() {
    // 1. Sample Data for Template
    const templateData = [
        {
            "email": "budi.santoso@company.com",
            "project_name": "",
            "payment_name": "Gaji Pokok Periode Januari 2026",
            "amount": 5000000,
            "paid_at": "2026-01-25 09:30",
            "description": "BCA Payroll Transfer Ref #PY202601-01"
        },
        {
            "email": "siti.rahma@company.com",
            "project_name": "",
            "payment_name": "Gaji Pokok Periode Januari 2026",
            "amount": 10000000,
            "paid_at": "2026-01-25",
            "description": "BCA Payroll Transfer Ref #PY202601-02"
        },
        {
            "email": "dewi.lestari@company.com",
            "project_name": "Fintech Core Banking System",
            "payment_name": "Disbursement Termin 1 - Desain UI/UX",
            "amount": 3500000,
            "paid_at": "2026-02-10 14:15",
            "description": "Pembayaran progress milestone desain tahap 1"
        },
        {
            "email": "ahmad.fauzi@company.com",
            "project_name": "Cloud Infrastructure Migration",
            "payment_name": "Honorarium Timesheet DevOps Jan 2026",
            "amount": 4250000,
            "paid_at": "2026-02-01",
            "description": "85 jam approved timesheet @ Rp 50.000/jam"
        }
    ];

    // 2. Guidelines Data
    const guidelinesData = [
        {
            "Field": "email",
            "Required": "YES (Mandatory)",
            "Format / Type": "Valid Registered User Email",
            "Valid Options / Example": "budi.santoso@company.com",
            "Description": "Email of the employee receiving payment (must be registered in the system)."
        },
        {
            "Field": "project_name",
            "Required": "NO (Optional)",
            "Format / Type": "Text (Project Title)",
            "Valid Options / Example": "Fintech Core Banking System",
            "Description": "Assign payment to a project-specific contract. Leave empty for Global Base Rate contract."
        },
        {
            "Field": "payment_name",
            "Required": "YES (Mandatory)",
            "Format / Type": "Text",
            "Valid Options / Example": "Gaji Pokok Januari 2026 / Termin 1",
            "Description": "Title or milestone description for this payment disbursement."
        },
        {
            "Field": "amount",
            "Required": "YES (Mandatory)",
            "Format / Type": "Positive Integer (IDR)",
            "Valid Options / Example": "5000000",
            "Description": "Disbursement amount in IDR (must be greater than 0, without commas/dots)."
        },
        {
            "Field": "paid_at",
            "Required": "NO (Optional)",
            "Format / Type": "Date / DateTime (YYYY-MM-DD or YYYY-MM-DD HH:mm)",
            "Valid Options / Example": "2026-01-25 or 2026-01-25 09:30",
            "Description": "Payment settlement date and optional time. Defaults to current date/time if left blank."
        },
        {
            "Field": "description",
            "Required": "NO (Optional)",
            "Format / Type": "Text",
            "Valid Options / Example": "Bank Transfer Ref #9921",
            "Description": "Additional notes, bank references, or voucher number."
        }
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Sheet 1: Template Data
    const wsTemplate = XLSX.utils.json_to_sheet(templateData);
    wsTemplate["!cols"] = [
        { wch: 30 }, // email
        { wch: 32 }, // project_name
        { wch: 36 }, // payment_name
        { wch: 16 }, // amount
        { wch: 20 }, // paid_at
        { wch: 45 }  // description
    ];
    XLSX.utils.book_append_sheet(wb, wsTemplate, "Payroll Data Template");

    // Sheet 2: Guidelines
    const wsGuidelines = XLSX.utils.json_to_sheet(guidelinesData);
    wsGuidelines["!cols"] = [
        { wch: 20 }, // Field
        { wch: 28 }, // Required
        { wch: 36 }, // Type
        { wch: 45 }, // Example
        { wch: 70 }  // Description
    ];
    XLSX.utils.book_append_sheet(wb, wsGuidelines, "Field Guidelines");

    // Trigger download
    XLSX.writeFile(wb, "Template_Payroll.xlsx");
}

/**
 * Parses an uploaded Excel or CSV payroll file, validates each row, and converts to a CSV Blob
 */
export async function parseAndValidatePayrollFile(file: File): Promise<ParsePayrollResult> {
    const arrayBuffer = await file.arrayBuffer();
    const wb = XLSX.read(arrayBuffer, { type: "array" });

    // Read the first sheet
    const firstSheetName = wb.SheetNames[0];
    const ws = wb.Sheets[firstSheetName];

    // Convert sheet to JSON rows
    const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

    // Convert workbook sheet to standard CSV
    const csvString = XLSX.utils.sheet_to_csv(ws);
    const csvBlob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });

    const seenPayments = new Set<string>();

    const rows: ParsedPayrollRow[] = [];
    let validCount = 0;
    let errorCount = 0;

    rawRows.forEach((row, index) => {
        const rowIndex = index + 2; // Row 1 is header, data starts on row 2
        const errors: string[] = [];

        // Normalize keys
        const getField = (possibleKeys: string[]): string => {
            for (const key of Object.keys(row)) {
                const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
                for (const target of possibleKeys) {
                    if (cleanKey === target.toLowerCase()) {
                        return String(row[key] ?? "").trim();
                    }
                }
            }
            return "";
        };

        const email = getField(["email", "user_email", "useremail", "penerima", "karyawan"]).toLowerCase();
        const projectName = getField(["project_name", "projectname", "project", "nama_proyek", "nama_project"]);
        const paymentName = getField(["payment_name", "paymentname", "name", "judul_pembayaran", "keterangan_pembayaran", "title"]);
        const amountRaw = getField(["amount", "nominal", "jumlah", "gaji", "nilai", "total"]);
        const paidAt = getField(["paid_at", "paidat", "tanggal_bayar", "tgl_bayar", "date"]);
        const description = getField(["description", "desc", "catatan", "keterangan", "notes"]);

        // Validate Email
        if (!email) {
            errors.push("Recipient email is required");
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.push("Invalid email format");
        }

        // Validate Payment Name
        if (!paymentName) {
            errors.push("Payment title / name is required");
        }

        // Parse & Validate Amount
        let amount = 0;
        if (!amountRaw) {
            errors.push("Payment amount is required");
        } else {
            const cleanStr = amountRaw.replace(/\./g, "").replace(/,/g, "");
            const val = parseFloat(cleanStr);
            if (isNaN(val) || val <= 0) {
                errors.push("Amount must be a positive number greater than 0");
            } else {
                amount = val;
            }
        }

        // Validate Paid At (if provided, supports date and optional time)
        if (paidAt) {
            const isDateValid = /^\d{4}-\d{2}-\d{2}(([ T])\d{2}:\d{2}(:\d{2})?)?$/.test(paidAt) || /^\d{2}\/\d{2}\/\d{4}( \d{2}:\d{2}(:\d{2})?)?$/.test(paidAt);
            if (!isDateValid || isNaN(Date.parse(paidAt.replace(" ", "T")))) {
                errors.push("Invalid paid_at format (use YYYY-MM-DD or YYYY-MM-DD HH:mm)");
            }
        }

        // Duplicate Check in File
        if (email && paymentName && amount > 0) {
            const dateKey = paidAt || "today";
            const projectKey = projectName ? projectName.toLowerCase() : "global";
            const dedupKey = `${email}::${projectKey}::${paymentName.toLowerCase()}::${amount}::${dateKey}`;
            if (seenPayments.has(dedupKey)) {
                errors.push("Duplicate payment transaction within this file");
            } else {
                seenPayments.add(dedupKey);
            }
        }

        const isValid = errors.length === 0;
        if (isValid) {
            validCount++;
        } else {
            errorCount++;
        }

        rows.push({
            rowIndex,
            email,
            projectName,
            paymentName,
            amount,
            paidAt,
            description,
            isValid,
            errors
        });
    });

    return {
        rows,
        validCount,
        errorCount,
        csvBlob
    };
}

// =========================================================================
// 7. TASK & TIMESHEET EXCEL TEMPLATE & PARSER (Combined Work Activity)
// =========================================================================

export interface ParsedTaskAndTimesheetRow {
    rowIndex: number;
    projectName: string;
    assigneeEmail: string;
    taskTitle: string;
    taskDescription: string;
    complexity: number;
    taskStatus: "todo" | "in_progress" | "done";
    dueDate: string;
    createdAt: string;
    clockIn: string;
    clockOut: string;
    timesheetDescription: string;
    timesheetStatus: "pending" | "approved" | "rejected";
    isValid: boolean;
    errors: string[];
}

export interface ParseTaskAndTimesheetResult {
    rows: ParsedTaskAndTimesheetRow[];
    validCount: number;
    errorCount: number;
    csvBlob: Blob;
}

/**
 * Generates and triggers browser download of the Tasks & Timesheets migration Excel template
 */
export function downloadTaskAndTimesheetExcelTemplate() {
    // 1. Sample Data for Template
    const templateData = [
        {
            "project_name": "Sistem Informasi Manajemen Rumah Sakit",
            "assignee_email": "budi.santoso@company.com",
            "task_title": "Slicing UI Dashboard Rawat Inap",
            "task_description": "Membuat komponen responsif untuk manajemen kamar dan tempat tidur pasien.",
            "complexity": 3,
            "task_status": "in_progress",
            "created_at": "2026-02-20",
            "due_date": "2026-03-15",
            "clock_in": "2026-02-25 09:00:00",
            "clock_out": "2026-02-25 17:30:00",
            "timesheet_description": "Slicing kartu statistik kamar dan tabel pasien rawat inap.",
            "timesheet_status": "pending"
        },
        {
            "project_name": "Sistem Informasi Manajemen Rumah Sakit",
            "assignee_email": "siti.rahma@company.com",
            "task_title": "Implementasi API Otentikasi JWT & Role Gate",
            "task_description": "Setup middleware auth dan RBAC untuk admin, dokter, dan perawat.",
            "complexity": 4,
            "task_status": "done",
            "created_at": "2026-02-18",
            "due_date": "2026-02-28",
            "clock_in": "2026-02-24 08:30:00",
            "clock_out": "2026-02-24 16:00:00",
            "timesheet_description": "Pembuatan endpoint login, refresh token, dan permission check.",
            "timesheet_status": "approved"
        },
        {
            "project_name": "E-Commerce Mobile App",
            "assignee_email": "budi.santoso@company.com",
            "task_title": "Integrasi Payment Gateway Midtrans Snap",
            "task_description": "Integrasi webhook callback dan status order checkout.",
            "complexity": 5,
            "task_status": "todo",
            "created_at": "2026-02-22",
            "due_date": "2026-03-30",
            "clock_in": "",
            "clock_out": "",
            "timesheet_description": "",
            "timesheet_status": ""
        }
    ];

    // 2. Instructions & Column Rules
    const instructionData = [
        { "PANDUAN": "PANDUAN PENGISIAN TEMPLATE BULK IMPORT TASK & TIMESHEET (WORK ACTIVITY)", "KETERANGAN": "" },
        { "PANDUAN": "1. project_name (Wajib)", "KETERANGAN": "Nama project yang persis sama dengan yang ada di database." },
        { "PANDUAN": "2. assignee_email (Wajib)", "KETERANGAN": "Email karyawan yang ditugaskan. User ini WAJIB sudah menjadi member di project tersebut." },
        { "PANDUAN": "3. task_title (Wajib)", "KETERANGAN": "Judul pekerjaan / tugas." },
        { "PANDUAN": "4. task_description (Opsional)", "KETERANGAN": "Deskripsi atau rincian requirement task." },
        { "PANDUAN": "5. complexity (Opsional)", "KETERANGAN": "Skala kesulitan 1 sampai 5. Default: 3." },
        { "PANDUAN": "6. task_status (Opsional)", "KETERANGAN": "Status task: todo, in_progress, done. Default: todo." },
        { "PANDUAN": "7. created_at (Opsional)", "KETERANGAN": "Tanggal historis pembuatan task/timesheet (format: YYYY-MM-DD atau YYYY-MM-DD HH:MM:SS). Default: waktu import saat ini." },
        { "PANDUAN": "8. due_date (Opsional)", "KETERANGAN": "Batas akhir pengerjaan dengan format YYYY-MM-DD (contoh: 2026-03-15)." },
        { "PANDUAN": "9. clock_in (Opsional)", "KETERANGAN": "Waktu mulai kerja format YYYY-MM-DD HH:MM:SS atau YYYY-MM-DD HH:MM. Jika diisi, sistem akan mencatat timesheet." },
        { "PANDUAN": "10. clock_out (Opsional)", "KETERANGAN": "Waktu selesai kerja. Wajib lebih besar dari clock_in." },
        { "PANDUAN": "11. timesheet_description (Opsional)", "KETERANGAN": "Catatan khusus hasil kerja pada sesi timesheet tersebut." },
        { "PANDUAN": "12. timesheet_status (Opsional)", "KETERANGAN": "Status timesheet: pending, approved, rejected. Default: pending jika dikosongkan." }
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();

    const wsData = XLSX.utils.json_to_sheet(templateData);
    wsData["!cols"] = [
        { wch: 38 }, // project_name
        { wch: 30 }, // assignee_email
        { wch: 42 }, // task_title
        { wch: 45 }, // task_description
        { wch: 12 }, // complexity
        { wch: 15 }, // task_status
        { wch: 18 }, // created_at
        { wch: 15 }, // due_date
        { wch: 22 }, // clock_in
        { wch: 22 }, // clock_out
        { wch: 45 }, // timesheet_description
        { wch: 18 }  // timesheet_status
    ];

    const wsGuide = XLSX.utils.json_to_sheet(instructionData);
    wsGuide["!cols"] = [
        { wch: 32 },
        { wch: 75 }
    ];

    XLSX.utils.book_append_sheet(wb, wsData, "Tasks & Timesheets");
    XLSX.utils.book_append_sheet(wb, wsGuide, "Panduan Kolom");

    XLSX.writeFile(wb, "Template_Tasks_Timesheets.xlsx");
}

/**
 * Parses and validates an uploaded Task & Timesheet Excel / CSV file on the client-side
 */
export async function parseAndValidateTaskAndTimesheetFile(file: File): Promise<ParseTaskAndTimesheetResult> {
    const arrayBuffer = await file.arrayBuffer();
    const wb = XLSX.read(arrayBuffer, { type: "array" });

    // Use the first worksheet
    const firstSheetName = wb.SheetNames[0];
    const ws = wb.Sheets[firstSheetName];

    // Convert sheet to JSON rows
    const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

    // Convert workbook sheet to standard CSV
    const csvString = XLSX.utils.sheet_to_csv(ws);
    const csvBlob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });

    const seenTimesheets = new Set<string>();

    const rows: ParsedTaskAndTimesheetRow[] = [];
    let validCount = 0;
    let errorCount = 0;

    rawRows.forEach((row, index) => {
        const rowIndex = index + 2; // Row 1 is header, data starts on row 2
        const errors: string[] = [];

        // Normalize keys
        const getField = (possibleKeys: string[]): string => {
            for (const key of Object.keys(row)) {
                const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
                for (const target of possibleKeys) {
                    if (cleanKey === target.toLowerCase()) {
                        return String(row[key] ?? "").trim();
                    }
                }
            }
            return "";
        };

        const projectName = getField(["project_name", "projectname", "project", "nama_proyek", "nama_project"]);
        const assigneeEmail = getField(["assignee_email", "assigneeemail", "email", "user_email", "assignee", "karyawan"]).toLowerCase();
        const taskTitle = getField(["task_title", "tasktitle", "title", "task", "nama_tugas", "judul_task", "pekerjaan"]);
        const taskDescription = getField(["task_description", "taskdescription", "description", "desc", "deskripsi", "rincian"]);
        const complexityRaw = getField(["complexity", "tingkat_kesulitan", "level", "bobot"]);
        const taskStatusRaw = getField(["task_status", "taskstatus", "status", "status_task"]).toLowerCase();
        const createdAt = getField(["created_at", "createdat", "task_created_at", "created_date", "tanggal_buat", "tgl_buat"]);
        const dueDate = getField(["due_date", "duedate", "deadline", "tenggat_waktu", "tgl_deadline"]);
        const clockIn = getField(["clock_in", "clockin", "start_time", "jam_mulai", "mulai"]);
        const clockOut = getField(["clock_out", "clockout", "end_time", "jam_selesai", "selesai"]);
        const timesheetDescription = getField(["timesheet_description", "timesheetdescription", "catatan_timesheet", "keterangan_kerja", "log_description"]);
        const timesheetStatusRaw = getField(["timesheet_status", "timesheetstatus", "status_timesheet", "approval_status"]).toLowerCase();

        // 1. Validate Project Name
        if (!projectName) {
            errors.push("Project name is required");
        }

        // 2. Validate Assignee Email
        if (!assigneeEmail) {
            errors.push("Assignee email is required");
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(assigneeEmail)) {
            errors.push("Invalid email format for assignee");
        }

        // 3. Validate Task Title
        if (!taskTitle) {
            errors.push("Task title is required");
        }

        // 4. Validate Complexity
        let complexity = 3;
        if (complexityRaw) {
            const comp = parseInt(complexityRaw, 10);
            if (isNaN(comp) || comp < 1 || comp > 5) {
                errors.push("Complexity must be an integer between 1 and 5");
            } else {
                complexity = comp;
            }
        }

        // 5. Validate Task Status (default 'todo')
        let taskStatus: "todo" | "in_progress" | "done" = "todo";
        if (taskStatusRaw) {
            const normalizedTaskStatus = taskStatusRaw.replace(/[-\s]/g, "_");
            if (["todo", "in_progress", "done"].includes(normalizedTaskStatus)) {
                taskStatus = normalizedTaskStatus as "todo" | "in_progress" | "done";
            } else {
                errors.push(`Invalid task_status '${taskStatusRaw}'. Allowed: todo, in_progress, done`);
            }
        }

        // 6. Validate Created At (if provided)
        if (createdAt) {
            const parsedCreated = Date.parse(createdAt);
            if (isNaN(parsedCreated)) {
                errors.push("Invalid created_at format (use YYYY-MM-DD or YYYY-MM-DD HH:MM:SS)");
            }
        }

        // 7. Validate Due Date
        if (dueDate) {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate) || isNaN(Date.parse(dueDate))) {
                errors.push("Invalid due_date format (use YYYY-MM-DD)");
            }
        }

        // 8. Validate Clock In & Clock Out
        let timesheetStatus: "pending" | "approved" | "rejected" = "pending";

        if (clockIn) {
            const parsedIn = Date.parse(clockIn);
            if (isNaN(parsedIn)) {
                errors.push("Invalid clock_in datetime format (use YYYY-MM-DD HH:MM:SS or YYYY-MM-DD HH:MM)");
            }

            if (clockOut) {
                const parsedOut = Date.parse(clockOut);
                if (isNaN(parsedOut)) {
                    errors.push("Invalid clock_out datetime format (use YYYY-MM-DD HH:MM:SS or YYYY-MM-DD HH:MM)");
                } else if (parsedOut < parsedIn) {
                    errors.push("clock_out cannot be earlier than clock_in");
                }
            }

            // User Rule: jika status kosong, maka secara auto dia pending
            if (timesheetStatusRaw) {
                if (["pending", "approved", "rejected"].includes(timesheetStatusRaw)) {
                    timesheetStatus = timesheetStatusRaw as "pending" | "approved" | "rejected";
                } else {
                    errors.push(`Invalid timesheet_status '${timesheetStatusRaw}'. Allowed: pending, approved, rejected`);
                }
            } else {
                timesheetStatus = "pending";
            }

            // Batch dedup check
            if (assigneeEmail && taskTitle) {
                const dedupKey = `${assigneeEmail}::${taskTitle.toLowerCase()}::${clockIn}`;
                if (seenTimesheets.has(dedupKey)) {
                    errors.push("Duplicate timesheet for this user and task timestamp within file");
                } else {
                    seenTimesheets.add(dedupKey);
                }
            }
        }

        const isValid = errors.length === 0;
        if (isValid) {
            validCount++;
        } else {
            errorCount++;
        }

        rows.push({
            rowIndex,
            projectName,
            assigneeEmail,
            taskTitle,
            taskDescription,
            complexity,
            taskStatus,
            createdAt,
            dueDate,
            clockIn,
            clockOut,
            timesheetDescription,
            timesheetStatus,
            isValid,
            errors
        });
    });

    return {
        rows,
        validCount,
        errorCount,
        csvBlob
    };
}



