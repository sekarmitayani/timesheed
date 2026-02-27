"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, CheckCircle2, XCircle, Scan, Shield, Wifi, Clock, Timer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader, AIConfidence } from "@/components/ai/ai-components";
import { useAuthStore } from "@/store/useAuthStore";
import { useDataStore } from "@/store/useDataStore";
import { simulateFaceRecognition, getVerificationStatus } from "@/lib/ai/face";
import { FaceRecognitionResult } from "@/lib/types";
import { toast } from "sonner";

export default function AttendancePage() {
    const user = useAuthStore((s) => s.user);
    const clockedIn = useDataStore((s) => s.clockedIn);
    const clockInTime = useDataStore((s) => s.clockInTime);
    const clockInTimestamp = useDataStore((s) => s.clockInTimestamp);
    const clockInFaceResult = useDataStore((s) => s.clockInFaceResult);
    const clockInAction = useDataStore((s) => s.clockIn);
    const clockOutAction = useDataStore((s) => s.clockOut);
    const attendance = useDataStore((s) => s.attendance);

    const [result, setResult] = useState<FaceRecognitionResult | null>(null);
    const [step, setStep] = useState<"idle" | "scanning" | "processing" | "done">("idle");
    const [elapsed, setElapsed] = useState("00:00:00");

    // Live elapsed timer
    useEffect(() => {
        if (!clockedIn || !clockInTimestamp) return;
        const tick = () => {
            const diff = Date.now() - clockInTimestamp;
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setElapsed(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
        };
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [clockedIn, clockInTimestamp]);

    const handleScan = useCallback(async () => {
        setStep("scanning");
        setResult(null);
        await new Promise((r) => setTimeout(r, 800));
        setStep("processing");
        const faceResult = await simulateFaceRecognition();
        setResult(faceResult);
        setStep("done");
    }, []);

    const reset = () => { setStep("idle"); setResult(null); };

    const handleClockIn = () => {
        if (!result) return;
        clockInAction(result);
        setStep("idle");
        setResult(null);
        toast.success("Clock in successful!", { description: `Verified at ${new Date().toLocaleTimeString()}` });
    };

    const handleClockOut = () => {
        if (!user) return;
        clockOutAction(user.id);
        setStep("idle");
        setResult(null);
        toast.success("Clock out recorded", { description: `Signed out at ${new Date().toLocaleTimeString()} — added to attendance list` });
    };

    const status = result ? getVerificationStatus(result) : null;
    const userAttendance = attendance.filter((a) => a.userId === user?.id);

    return (
        <div className="space-y-6">
            <PageHeader title="Attendance" description="Clock in/out using Face Recognition" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2"><Camera className="h-4 w-4 text-[#FFBE18]" /> Face Recognition</CardTitle>
                        <CardDescription>{clockedIn ? "You are currently clocked in" : "Look at the camera to verify your identity"}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="relative aspect-video rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 overflow-hidden flex items-center justify-center">
                            <AnimatePresence mode="wait">
                                {step === "idle" && !clockedIn && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center space-y-2">
                                        <Camera className="h-12 w-12 text-muted-foreground mx-auto" />
                                        <p className="text-xs text-muted-foreground">Camera preview</p>
                                    </motion.div>
                                )}
                                {(step === "idle" && clockedIn) && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center space-y-3">
                                        <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto" />
                                        <p className="text-sm text-emerald-400 font-medium">Clocked In</p>
                                        <div className="flex items-center gap-2 justify-center text-muted-foreground">
                                            <Clock className="h-3.5 w-3.5" />
                                            <span className="text-xs">Since {clockInTime}</span>
                                        </div>
                                        <div className="bg-white/5 rounded-lg px-4 py-2 inline-block">
                                            <p className="text-2xl font-mono font-bold text-[#FFBE18] tracking-wider">{elapsed}</p>
                                        </div>
                                    </motion.div>
                                )}
                                {step === "scanning" && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative w-full h-full flex items-center justify-center">
                                        <div className="absolute inset-4 border-2 border-[#FFBE18]/50 rounded-2xl" />
                                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-center space-y-2">
                                            <Scan className="h-16 w-16 text-[#FFBE18] mx-auto" />
                                            <p className="text-xs text-[#FFBE18]">Detecting face...</p>
                                        </motion.div>
                                        <motion.div animate={{ y: [-100, 100, -100] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-[#FFBE18] to-transparent" />
                                    </motion.div>
                                )}
                                {step === "processing" && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center space-y-3">
                                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="h-12 w-12 border-3 border-[#FFBE18] border-t-transparent rounded-full mx-auto" />
                                        <p className="text-xs text-[#FFBE18]">Processing face recognition...</p>
                                    </motion.div>
                                )}
                                {step === "done" && result && (
                                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-3">
                                        {result.verified ? (
                                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}><CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto" /></motion.div>
                                        ) : (
                                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}><XCircle className="h-16 w-16 text-red-500 mx-auto" /></motion.div>
                                        )}
                                        <p className={`text-sm font-semibold ${result.verified ? "text-emerald-400" : "text-red-400"}`}>{status?.label}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {result && status && !clockedIn && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                                <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                                    <p className="text-sm">{status.description}</p>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="flex items-center gap-1.5"><Shield className={`h-3 w-3 ${result.antiSpoofCheck ? "text-emerald-500" : "text-red-500"}`} /> Anti-Spoof: {result.antiSpoofCheck ? "Passed" : "Failed"}</div>
                                        <div className="flex items-center gap-1.5"><Wifi className="h-3 w-3 text-muted-foreground" /> {result.ipAddress}</div>
                                    </div>
                                    <AIConfidence confidence={result.confidence} />
                                </div>
                            </motion.div>
                        )}

                        <div className="flex gap-3">
                            {step === "idle" && !clockedIn && (
                                <Button onClick={handleScan} className="flex-1 bg-gradient-to-r from-[#2568C1] to-[#1a4f99] hover:from-[#1a4f99] hover:to-[#14407a]">
                                    <Scan className="h-4 w-4 mr-2" /> Scan Face
                                </Button>
                            )}
                            {step === "done" && !clockedIn && (
                                <>
                                    <Button onClick={reset} variant="outline" className="flex-1">Try Again</Button>
                                    {result?.verified && (
                                        <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={handleClockIn}>
                                            <CheckCircle2 className="h-4 w-4 mr-2" /> Confirm Clock In
                                        </Button>
                                    )}
                                </>
                            )}
                            {clockedIn && step === "idle" && (
                                <Button onClick={handleClockOut} variant="outline" className="flex-1 border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-400">
                                    <Timer className="h-4 w-4 mr-2" /> Clock Out ({elapsed})
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Recent Attendance</CardTitle>
                        <CardDescription>{userAttendance.length} records</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 max-h-[500px] overflow-y-auto">
                            {userAttendance.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-4">No attendance records yet. Clock in to start.</p>
                            )}
                            {userAttendance.map((record) => (
                                <div key={record.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium ${record.status === "present" ? "bg-emerald-500/10 text-emerald-500" : record.status === "late" ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500"}`}>
                                        {record.status === "present" ? "✓" : record.status === "late" ? "!" : "✗"}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{record.date}</p>
                                        <p className="text-xs text-muted-foreground">{record.clockIn || "--:--"} → {record.clockOut || "--:--"} • {record.method}</p>
                                    </div>
                                    <Badge variant={record.status === "present" ? "secondary" : record.status === "late" ? "outline" : "destructive"} className="text-[10px]">{record.status}</Badge>
                                    {record.faceResult && <span className="text-[10px] text-muted-foreground">{(record.faceResult.confidence * 100).toFixed(0)}%</span>}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
