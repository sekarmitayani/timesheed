import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRupiah(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(amount);
}

/**
 * Format date as "DD Mon YYYY" (e.g. "06 Sep 2026")
 */
export function formatDate(date: string | Date | null | undefined): string {
    if (!date) return "-";
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/**
 * Format date & time as "DD Mon YYYY, HH:mm" (e.g. "06 Sep 2026, 14:30")
 */
export function formatDateTime(date: string | Date | null | undefined): string {
    if (!date) return "-";
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "-";
    const datePart = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const timePart = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
    return `${datePart}, ${timePart}`;
}

/**
 * Format time as 24-hour "HH:mm" (e.g. "14:30")
 */
export function formatTime24(date: string | Date | null | undefined): string {
    if (!date) return "--:--";
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "--:--";
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
}

