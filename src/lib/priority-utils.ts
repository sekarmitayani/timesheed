/**
 * Returns Tailwind classes for priority badge styling.
 * - low: green
 * - medium: yellow/amber
 * - high: red
 * - urgent: glowing red with pulse animation
 */
export function getPriorityBadgeClasses(priority: string): string {
    switch (priority) {
        case "low":
            return "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30";
        case "medium":
            return "bg-amber-400/15 text-amber-600 border border-amber-400/30";
        case "high":
            return "bg-red-500/15 text-red-600 border border-red-500/30";
        case "urgent":
            return "bg-red-600 text-white border border-red-600 shadow-[0_0_8px_rgba(0,0,0,0.1)]";
        default:
            return "bg-muted text-muted-foreground";
    }
}
