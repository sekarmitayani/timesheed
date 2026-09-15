"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LogIn, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/useAuthStore";
import { getDefaultRoute } from "@/lib/rbac";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { login } = useAuthStore();
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!email.trim() || !password.trim()) {
            setError("Please enter your email and password.");
            return;
        }

        setIsLoading(true);

        const result = await login(email.trim(), password);
        if (result.success) {
            const user = useAuthStore.getState().user;
            if (user) {
                router.push(getDefaultRoute(user.role));
            }
        } else {
            setError(result.error || "Login failed. Please try again.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#f0f4fa] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-x-hidden overflow-y-auto">
            {/* Background effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-[#2568C1]/8 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-[#FFBE18]/10 blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-[#2568C1]/4 blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full max-w-sm sm:max-w-md my-auto py-6 sm:py-8 flex flex-col items-center"
            >
                {/* Branding & Logo */}
                <div className="text-center mb-5 sm:mb-6 w-full flex flex-col items-center">
                    <motion.div
                        initial={{ opacity: 0, y: -24, scale: 0.88, filter: "blur(4px)" }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                        transition={{ 
                            duration: 0.8, 
                            ease: [0.16, 1, 0.3, 1] 
                        }}
                        className="flex items-center justify-center mb-3"
                    >
                        <img 
                            src="/logo.png" 
                            alt="Haerarchy Logo" 
                            className="h-10 sm:h-12 md:h-14 w-auto object-contain select-none" 
                        />
                    </motion.div>
                    <motion.p 
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
                        className="text-xs sm:text-sm text-[#64748b] font-medium tracking-tight text-center"
                    >
                        Enterprise Project & Workforce Management
                    </motion.p>
                </div>

                {/* Login Form */}
                <Card className="w-full border-[#e2e8f0] bg-white/95 backdrop-blur-xl shadow-xl sm:shadow-2xl shadow-[#2568C1]/5 rounded-2xl overflow-hidden p-0 py-0 gap-0">
                    <CardHeader className="text-center px-6 pt-5 pb-2 gap-1 flex flex-col items-center">
                        <CardTitle className="text-lg sm:text-xl font-bold text-[#0f172a] tracking-tight">Sign In</CardTitle>
                        <CardDescription className="text-xs sm:text-sm text-[#64748b]">Enter your credentials to continue</CardDescription>
                    </CardHeader>
                    <CardContent className="px-6 pb-6 pt-2">
                        <form onSubmit={handleLogin} className="space-y-4">
                            {/* Error Message */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"
                                >
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    <span>{error}</span>
                                </motion.div>
                            )}

                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium text-[#0f172a]">
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); setError(null); }}
                                    className="bg-[#f8fafc] border-[#e2e8f0] focus-visible:ring-[#2568C1] h-11"
                                    disabled={isLoading}
                                    autoComplete="email"
                                />
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-medium text-[#0f172a]">
                                    Password
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => { setPassword(e.target.value); setError(null); }}
                                        className="bg-[#f8fafc] border-[#e2e8f0] focus-visible:ring-[#2568C1] h-11 pr-10"
                                        disabled={isLoading}
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#0f172a] transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit */}
                            <Button
                                type="submit"
                                className="w-full h-11 bg-[#2568C1] hover:bg-[#1e56a6] text-white font-semibold shadow-lg shadow-[#2568C1]/20 transition-all duration-200"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        className="h-5 w-5 border-2 border-white border-t-transparent rounded-full"
                                    />
                                ) : (
                                    <>
                                        <LogIn className="h-4 w-4 mr-2" />
                                        Sign In
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <p className="text-center text-[11px] text-[#94a3b8] mt-6">
                    © 2026 Haerarchy. All rights reserved.
                </p>
            </motion.div>
        </div>
    );
}
