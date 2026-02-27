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
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { login } = useAuthStore();
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!username.trim() || !password.trim()) {
            setError("Please enter your username or email and password.");
            return;
        }

        setIsLoading(true);
        await new Promise((r) => setTimeout(r, 600));

        const result = login(username.trim(), password);
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
        <div className="min-h-screen bg-[#f0f4fa] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-[#2568C1]/8 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-[#FFBE18]/10 blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-[#2568C1]/4 blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative w-full max-w-md"
            >
                {/* Logo */}
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                        className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2568C1] to-[#1a4f99] shadow-2xl shadow-[#2568C1]/25 mb-4"
                    >
                        <span className="text-2xl font-extrabold text-white tracking-tighter">H</span>
                    </motion.div>
                    <h1 className="text-3xl font-bold tracking-tight text-[#0f172a]">Haerarchy</h1>
                    <p className="text-sm text-[#64748b] mt-2">
                        Enterprise Project & Workforce Management
                    </p>
                </div>

                {/* Login Form */}
                <Card className="border-[#e2e8f0] bg-white/90 backdrop-blur-xl shadow-2xl shadow-[#2568C1]/5">
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-lg text-[#0f172a]">Sign In</CardTitle>
                        <CardDescription>Enter your credentials to continue</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
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

                            {/* Username */}
                            <div className="space-y-2">
                                <Label htmlFor="username" className="text-sm font-medium text-[#0f172a]">
                                    Username or Email
                                </Label>
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="Enter your username or email"
                                    value={username}
                                    onChange={(e) => { setUsername(e.target.value); setError(null); }}
                                    className="bg-[#f8fafc] border-[#e2e8f0] focus-visible:ring-[#2568C1] h-11"
                                    disabled={isLoading}
                                    autoComplete="username"
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
