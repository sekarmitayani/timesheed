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
    XLSX.writeFile(wb, "Timesheed_User_Import_Template.xlsx");
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
    XLSX.writeFile(wb, "Timesheed_Contract_Import_Template.xlsx");
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

