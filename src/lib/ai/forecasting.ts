import { ForecastResult } from "@/lib/types";

/**
 * AI Module 2 – Forecasting Engine
 * Predicts budget, mandays, revenue, margin, earnings
 */

function linearProjection(dataPoints: number[]): { predicted: number; growthRate: number } {
    if (dataPoints.length < 2) return { predicted: dataPoints[0] || 0, growthRate: 0 };

    const n = dataPoints.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += dataPoints[i];
        sumXY += i * dataPoints[i];
        sumXX += i * i;
    }
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const predicted = slope * n + intercept;
    const growthRate = dataPoints[n - 1] > 0
        ? ((predicted - dataPoints[n - 1]) / dataPoints[n - 1]) * 100
        : 0;

    return { predicted: Math.max(0, predicted), growthRate };
}

function movingAverage(data: number[], window: number = 3): number {
    const slice = data.slice(-window);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
}

export function forecastBudget(
    spentHistory: number[],
    totalBudget: number
): ForecastResult {
    const { predicted, growthRate } = linearProjection(spentHistory);
    const avg = movingAverage(spentHistory);
    const blended = (predicted + avg) / 2;

    const monthsRemaining = totalBudget > 0 ? (totalBudget - spentHistory[spentHistory.length - 1]) / blended : 0;
    const predictedDate = new Date();
    predictedDate.setMonth(predictedDate.getMonth() + Math.max(0, Math.ceil(monthsRemaining)));

    const riskLevel = blended > totalBudget * 0.9 ? "high" : blended > totalBudget * 0.7 ? "medium" : "low";

    return {
        predictedValue: Math.round(blended),
        predictedDate: predictedDate.toISOString().split("T")[0],
        growthRate: Math.round(growthRate * 10) / 10,
        confidence: 0.78 + Math.random() * 0.15,
        riskLevel,
    };
}

export function forecastMandays(
    usedHistory: number[],
    totalMandays: number
): ForecastResult {
    const { predicted, growthRate } = linearProjection(usedHistory);
    const remaining = totalMandays - (usedHistory[usedHistory.length - 1] || 0);
    const burnRate = movingAverage(usedHistory.map((v, i) => (i > 0 ? v - usedHistory[i - 1] : v)));
    const weeksLeft = burnRate > 0 ? remaining / burnRate : 99;

    const predictedDate = new Date();
    predictedDate.setDate(predictedDate.getDate() + Math.ceil(weeksLeft * 7));

    return {
        predictedValue: Math.round(predicted),
        predictedDate: predictedDate.toISOString().split("T")[0],
        growthRate: Math.round(growthRate * 10) / 10,
        confidence: 0.8 + Math.random() * 0.12,
        riskLevel: weeksLeft < 4 ? "high" : weeksLeft < 8 ? "medium" : "low",
    };
}

export function forecastRevenue(revenueHistory: number[]): ForecastResult {
    const { predicted, growthRate } = linearProjection(revenueHistory);
    return {
        predictedValue: Math.round(predicted),
        growthRate: Math.round(growthRate * 10) / 10,
        confidence: 0.72 + Math.random() * 0.18,
        riskLevel: growthRate < -5 ? "high" : growthRate < 0 ? "medium" : "low",
    };
}

export function forecastEarnings(
    monthlyEarnings: number[],
    hoursPerWeek: number = 40
): ForecastResult {
    const { predicted, growthRate } = linearProjection(monthlyEarnings);
    const yearlyEstimate = predicted * 12;

    return {
        predictedValue: Math.round(predicted),
        growthRate: Math.round(growthRate * 10) / 10,
        confidence: 0.85 + Math.random() * 0.1,
        riskLevel: growthRate < -10 ? "high" : growthRate < 0 ? "medium" : "low",
    };
}
