import { AnomalyResult, TimesheetEntry } from "@/lib/types";

/**
 * AI Module 1 – Anomaly Detection
 * Detects abnormal work hours, timesheet manipulation, budget spikes
 */

export function detectAnomaly(entry: TimesheetEntry): AnomalyResult {
    const reasons: string[] = [];
    let riskScore = 0;

    // Rule: > 12 hours work
    if (entry.hours > 12) {
        reasons.push(`Unusually long work hours: ${entry.hours}h (threshold: 12h)`);
        riskScore += 30;
    }

    // Rule: Clock in < 05:00
    const clockInHour = parseInt(entry.clockIn.split(":")[0]);
    if (clockInHour < 5) {
        reasons.push(`Very early clock-in at ${entry.clockIn} (before 05:00)`);
        riskScore += 25;
    }

    // Rule: Clock out > 23:00
    const clockOutHour = parseInt(entry.clockOut.split(":")[0]);
    if (clockOutHour >= 23) {
        reasons.push(`Very late clock-out at ${entry.clockOut} (after 23:00)`);
        riskScore += 20;
    }

    // Rule: Overtime > 4 hours
    if (entry.overtime > 4) {
        reasons.push(`Excessive overtime: ${entry.overtime}h (threshold: 4h)`);
        riskScore += 15;
    }

    // Rule: Weekend work detection
    const dayOfWeek = new Date(entry.date).getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        reasons.push("Work logged on weekend");
        riskScore += 10;
    }

    // Normalize score to 0-100
    riskScore = Math.min(100, riskScore);

    const riskLevel = riskScore >= 60 ? "high" : riskScore >= 30 ? "medium" : "low";
    const aiConfidence = 0.75 + Math.random() * 0.2; // 75-95%

    return { riskScore, riskLevel, reasons, aiConfidence: Math.round(aiConfidence * 100) / 100 };
}

/**
 * Detect weekly anomaly: spike > 40% from previous week
 */
export function detectWeeklyAnomaly(
    currentWeekHours: number,
    previousWeekHours: number
): AnomalyResult {
    const reasons: string[] = [];
    let riskScore = 0;

    if (previousWeekHours > 0) {
        const spike = ((currentWeekHours - previousWeekHours) / previousWeekHours) * 100;
        if (spike > 40) {
            reasons.push(`Weekly hours spiked by ${spike.toFixed(0)}% (${previousWeekHours}h → ${currentWeekHours}h)`);
            riskScore += 40;
        }
    }

    if (currentWeekHours > 50) {
        reasons.push(`Total weekly hours exceed 50h: ${currentWeekHours}h`);
        riskScore += 25;
    }

    riskScore = Math.min(100, riskScore);
    const riskLevel = riskScore >= 60 ? "high" : riskScore >= 30 ? "medium" : "low";

    return { riskScore, riskLevel, reasons, aiConfidence: 0.82 };
}

/**
 * Detect budget anomaly: spike > 25%
 */
export function detectBudgetAnomaly(
    currentSpend: number,
    previousSpend: number,
    totalBudget: number
): AnomalyResult {
    const reasons: string[] = [];
    let riskScore = 0;

    if (previousSpend > 0) {
        const spike = ((currentSpend - previousSpend) / previousSpend) * 100;
        if (spike > 25) {
            reasons.push(`Budget spending spiked by ${spike.toFixed(0)}% this period`);
            riskScore += 35;
        }
    }

    const utilization = (currentSpend / totalBudget) * 100;
    if (utilization > 85) {
        reasons.push(`Budget utilization at ${utilization.toFixed(0)}% — approaching exhaustion`);
        riskScore += 30;
    }

    if (utilization > 95) {
        reasons.push("CRITICAL: Budget nearly exhausted");
        riskScore += 25;
    }

    riskScore = Math.min(100, riskScore);
    const riskLevel = riskScore >= 60 ? "high" : riskScore >= 30 ? "medium" : "low";

    return { riskScore, riskLevel, reasons, aiConfidence: 0.88 };
}
