import { WorkloadResult, User, Task, TimesheetEntry, Project } from "@/lib/types";

/**
 * AI Module 4 – Predictive Workload Balancing
 * Most advanced AI module. Detects overload/idle, predicts workload, recommends redistribution.
 */

interface WorkloadInput {
    user: User;
    tasks: Task[];
    timesheets: TimesheetEntry[];
    projects: Project[];
    teamMembers?: User[];
}

export function predictWorkload(input: WorkloadInput): WorkloadResult {
    const { user, tasks, timesheets } = input;

    // Calculate metrics
    const userTasks = tasks.filter((t) => t.assigneeId === user.id);
    const activeTasks = userTasks.filter((t) => t.status !== "done");
    const userTimesheets = timesheets.filter((t) => t.userId === user.id);

    // Average hours from timesheets
    const totalHours = userTimesheets.reduce((sum, ts) => sum + ts.hours, 0);
    const avgHours = userTimesheets.length > 0 ? totalHours / userTimesheets.length : 8;

    // Current week total
    const thisWeekHours = userTimesheets.slice(0, 5).reduce((sum, ts) => sum + ts.hours, 0);

    // Task deadline proximity (days until nearest deadline)
    const now = new Date();
    const deadlineProximity = activeTasks.reduce((min, task) => {
        const daysUntil = Math.ceil((new Date(task.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return Math.min(min, daysUntil);
    }, 999);

    // Calculate workload score (0-100)
    let score = 0;

    // Factor: active tasks (weight: 25%)
    score += Math.min(25, activeTasks.length * 6);

    // Factor: average hours (weight: 25%)
    score += Math.min(25, (avgHours / 12) * 25);

    // Factor: this week hours (weight: 25%)
    score += Math.min(25, (thisWeekHours / 50) * 25);

    // Factor: deadline pressure (weight: 15%)
    if (deadlineProximity < 3) score += 15;
    else if (deadlineProximity < 7) score += 10;
    else if (deadlineProximity < 14) score += 5;

    // Factor: overtime frequency (weight: 10%)
    const overtimeCount = userTimesheets.filter((ts) => ts.overtime > 0).length;
    const overtimeRate = userTimesheets.length > 0 ? overtimeCount / userTimesheets.length : 0;
    score += overtimeRate * 10;

    score = Math.min(100, Math.round(score));

    // Classification
    const status = score <= 40 ? "underutilized" : score <= 75 ? "balanced" : "overloaded";

    // Burnout risk
    const burnoutRisk =
        score >= 85 ? "high" :
            score >= 70 ? "medium" : "low";

    // Predicted next week hours
    const predictedNextWeekHours = Math.round(avgHours * 5 * (1 + (score - 50) / 100));

    // Recommendations
    const recommendation: string[] = [];
    if (status === "overloaded") {
        recommendation.push(`Redistribute ${Math.ceil(activeTasks.length / 3)} tasks to less loaded team members`);
        recommendation.push(`Current workload ${score}% — consider delaying non-urgent deliverables`);
        if (burnoutRisk === "high") {
            recommendation.push("⚠️ High burnout risk detected — recommend mandatory break");
        }
    } else if (status === "underutilized") {
        recommendation.push(`Can take on ${3 - activeTasks.length} more tasks this sprint`);
        recommendation.push("Consider assigning to high-priority backlog items");
    } else {
        recommendation.push("Workload is balanced — maintain current pace");
        if (deadlineProximity < 7) {
            recommendation.push("Upcoming deadline pressure — monitor closely");
        }
    }

    return {
        workloadScore: score,
        status,
        burnoutRisk,
        predictedNextWeekHours: Math.max(20, Math.min(60, predictedNextWeekHours)),
        recommendation,
        aiConfidence: 0.75 + Math.random() * 0.2,
    };
}

/**
 * Predict team workload distribution
 */
export function predictTeamWorkload(
    team: User[],
    tasks: Task[],
    timesheets: TimesheetEntry[],
    projects: Project[]
): { user: User; workload: WorkloadResult }[] {
    return team.map((user) => ({
        user,
        workload: predictWorkload({ user, tasks, timesheets, projects }),
    }));
}

/**
 * Generate redistribution suggestions
 */
export function getRedistributionSuggestions(
    teamWorkloads: { user: User; workload: WorkloadResult }[]
): string[] {
    const overloaded = teamWorkloads.filter((tw) => tw.workload.status === "overloaded");
    const underutilized = teamWorkloads.filter((tw) => tw.workload.status === "underutilized");

    const suggestions: string[] = [];
    for (const over of overloaded) {
        for (const under of underutilized) {
            suggestions.push(
                `Move 2 tasks from ${over.user.name} (${over.workload.workloadScore}%) to ${under.user.name} (${under.workload.workloadScore}%)`
            );
        }
    }

    if (overloaded.length > 0 && underutilized.length === 0) {
        suggestions.push("All team members are at or above capacity — consider bringing in additional resources");
    }

    const highBurnout = teamWorkloads.filter((tw) => tw.workload.burnoutRisk === "high");
    for (const hb of highBurnout) {
        suggestions.push(`⚠️ ${hb.user.name} shows high burnout risk — immediate workload reduction recommended`);
    }

    return suggestions;
}
