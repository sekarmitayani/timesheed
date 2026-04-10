"use client";

import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, Sparkles, ChevronDown, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AnomalyResult, WorkloadResult, RiskLevel } from "@/lib/types";
import { useState } from "react";

// ── Risk Badge ──────────────────────────────────────────
export function RiskBadge({ level, score, className }: { level: RiskLevel; score?: number; className?: string }) {
    const config = {
        low: { label: "Low Risk", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", glow: "" },
        medium: { label: "Medium Risk", color: "bg-amber-500/10 text-amber-500 border-amber-500/20", glow: "" },
        high: { label: "High Risk", color: "bg-red-500/10 text-red-500 border-red-500/20", glow: "shadow-[0_0_15px_rgba(0,0,0,0.08)]" },
    };
    const c = config[level];
    return (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <Badge variant="outline" className={cn("gap-1.5 font-medium", c.color, c.glow, className)}>
                {level === "high" ? <ShieldAlert className="h-3 w-3" /> : level === "medium" ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                {c.label}
                {score !== undefined && <span className="ml-1 opacity-70">({score}%)</span>}
            </Badge>
        </motion.div>
    );
}

// ── AI Confidence Indicator ─────────────────────────────
export function AIConfidence({ confidence, className }: { confidence: number; className?: string }) {
    const pct = Math.round(confidence * 100);
    return (
        <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
            <Sparkles className="h-3 w-3 text-[#FFBE18]" />
            <span>AI Confidence</span>
            <Progress value={pct} className="h-1.5 w-16" />
            <span className="font-medium text-foreground">{pct}%</span>
        </div>
    );
}

// ── AI Insight Panel (Expandable) ───────────────────────
export function AIInsightPanel({ anomaly, title }: { anomaly: AnomalyResult; title?: string }) {
    const [expanded, setExpanded] = useState(false);
    if (anomaly.reasons.length === 0) return null;

    return (
        <Card className={cn(
            "border transition-all",
            anomaly.riskLevel === "high" && "border-red-500/30 shadow-[0_0_20px_rgba(0,0,0,0.06)]",
            anomaly.riskLevel === "medium" && "border-amber-500/30",
        )}>
            <CardHeader className="py-3 px-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-[#FFBE18] to-[#E5A800]">
                            <Sparkles className="h-3 w-3 text-white" />
                        </div>
                        <CardTitle className="text-sm">{title || "AI Anomaly Detection"}</CardTitle>
                        <RiskBadge level={anomaly.riskLevel} score={anomaly.riskScore} />
                    </div>
                    <motion.div animate={{ rotate: expanded ? 180 : 0 }}>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </motion.div>
                </div>
            </CardHeader>
            {expanded && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0 }}>
                    <CardContent className="pt-0 pb-4 px-4 space-y-3">
                        <div className="space-y-2">
                            {anomaly.reasons.map((reason, i) => (
                                <div key={i} className="flex items-start gap-2 text-sm">
                                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                                    <span className="text-muted-foreground">{reason}</span>
                                </div>
                            ))}
                        </div>
                        <AIConfidence confidence={anomaly.aiConfidence} />
                    </CardContent>
                </motion.div>
            )}
        </Card>
    );
}

// ── Workload Status Badge ───────────────────────────────
export function WorkloadBadge({ workload }: { workload: WorkloadResult }) {
    const config = {
        overloaded: { label: "Overloaded", color: "bg-red-500/10 text-red-500 border-red-500/20", glow: "shadow-[0_0_12px_rgba(0,0,0,0.08)]" },
        balanced: { label: "Balanced", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", glow: "" },
        underutilized: { label: "Underutilized", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", glow: "" },
    };
    const c = config[workload.status];
    return (
        <Badge variant="outline" className={cn("gap-1", c.color, c.glow)}>
            {c.label} ({workload.workloadScore}%)
        </Badge>
    );
}

// ── AI Suggestion Card ──────────────────────────────────
export function AISuggestionCard({ suggestions, title }: { suggestions: string[]; title?: string }) {
    return (
        <Card className="border-[#FFBE18]/20 bg-gradient-to-br from-[#FFBE18]/5 to-[#E5A800]/5">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-[#FFBE18] to-[#E5A800]">
                        <Sparkles className="h-3 w-3 text-white" />
                    </div>
                    {title || "AI Recommendations"}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {suggestions.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                        <Info className="h-3.5 w-3.5 text-[#FFBE18] mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{s}</span>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

// ── Stat Card ───────────────────────────────────────────
export function StatCard({
    title, value, subtitle, icon: Icon, trend, trendUp, className, glow, theme = "primary"
}: {
    title: string; value: string | number; subtitle?: string;
    icon?: React.ComponentType<{ className?: string }>;
    trend?: string; trendUp?: boolean; className?: string; glow?: boolean;
    theme?: "primary" | "secondary" | "destructive" | "ai";
}) {
    const themeConfig = {
        primary: { bg: "bg-primary/10", text: "text-primary", glowClass: "shadow-[0_0_20px_rgba(59,130,246,0.15)]" },
        secondary: { bg: "bg-secondary/15", text: "text-secondary", glowClass: "shadow-[0_0_20px_rgba(245,158,11,0.15)]" },
        destructive: { bg: "bg-destructive/10", text: "text-destructive", glowClass: "shadow-[0_0_20px_rgba(239,68,68,0.15)]" },
        ai: { bg: "bg-gradient-to-br from-[#FFBE18]/10 to-[#E5A800]/10", text: "text-[#FFBE18]", glowClass: "shadow-[0_0_20px_rgba(255,190,24,0.15)]" },
    };
    const t = themeConfig[theme] || themeConfig.primary;

    return (
        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }} className="h-full">
            <Card className={cn("relative overflow-hidden h-full", glow && t.glowClass, className)}>
                <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
                            <p className="text-2xl font-bold tracking-tight">{value}</p>
                            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
                            {trend && (
                                <p className={cn("text-xs font-medium", trendUp ? "text-emerald-500" : "text-red-500")}>
                                    {trendUp ? "↑" : "↓"} {trend}
                                </p>
                            )}
                        </div>
                        {Icon && (
                            <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", t.bg)}>
                                <Icon className={cn("h-5 w-5", t.text)} />
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

// ── Page Header ─────────────────────────────────────────
export function PageHeader({ title, description, children }: { title: string; description?: string; children?: React.ReactNode }) {
    return (
        <div className="sticky top-0 z-20 bg-[#F8FAFC]/80 backdrop-blur-md -mx-6 px-6 pt-2 pb-4 mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-transparent transition-all">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
            </div>
            {children && <div className="flex items-center gap-2">{children}</div>}
        </div>
    );
}

// ── Empty State ─────────────────────────────────────────
export function EmptyState({ title, description, icon: Icon }: { title: string; description: string; icon?: React.ComponentType<{ className?: string }> }) {
    const Ic = Icon || Info;
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                <Ic className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-medium">{title}</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">{description}</p>
        </div>
    );
}
