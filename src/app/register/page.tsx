"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { UserPlus, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchApi } from "@/lib/api";

export default function RegisterPage() {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!fullName.trim() || !email.trim() || !phoneNumber.trim() || !password.trim()) {
            setError("Please fill in all fields (including phone number).");
            return;
        }

        setIsLoading(true);

        try {
            const data = await fetchApi("/auth/register", {
                method: "POST",
                body: JSON.stringify({
                    email: email.trim(),
                    password: password,
                    full_name: fullName.trim(),
                    phone_number: phoneNumber.trim(),
                    role: "admin",
                    employee_type: null
                }),
            });

            if (data && data.token && data.user) {
                // If API returns token on register, we can automatically log them in
                if (typeof window !== "undefined") {
                    localStorage.setItem("token", data.token);
                    localStorage.setItem("user", JSON.stringify(data.user));
                }

                setSuccess("Admin account created successfully! Redirecting...");

                setTimeout(() => {
                    // Redirect to login or admin dashboard (hardcoded to admin dashboard since role is admin)
                    router.push("/admin/dashboard");
                }, 1500);
            } else {
                setError("Registration failed, invalid response.");
                setIsLoading(false);
            }
        } catch (err: any) {
            setError(err.message || "Registration failed. Endpoint might be closed.");
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
                    <h1 className="text-3xl font-bold tracking-tight text-[#0f172a]">Setup Admin</h1>
                    <p className="text-sm text-[#64748b] mt-2">
                        Initialize the master admin account for Haerarchy
                    </p>
                </div>

                {/* Register Form */}
                <Card className="border-[#e2e8f0] bg-white/90 backdrop-blur-xl shadow-2xl shadow-[#2568C1]/5">
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-lg text-[#0f172a]">Admin Registration</CardTitle>
                        <CardDescription>Create the first admin user</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <form onSubmit={handleRegister} className="space-y-4">
                            {/* Error / Success Messages */}
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

                            {success && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm"
                                >
                                    <UserPlus className="h-4 w-4 shrink-0" />
                                    <span>{success}</span>
                                </motion.div>
                            )}

                            {/* Full Name */}
                            <div className="space-y-2">
                                <Label htmlFor="fullName" className="text-sm font-medium text-[#0f172a]">
                                    Full Name
                                </Label>
                                <Input
                                    id="fullName"
                                    type="text"
                                    placeholder="Enter your full name"
                                    value={fullName}
                                    onChange={(e) => { setFullName(e.target.value); setError(null); }}
                                    className="bg-[#f8fafc] border-[#e2e8f0] focus-visible:ring-[#2568C1] h-11"
                                    disabled={isLoading || !!success}
                                />
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium text-[#0f172a]">
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@example.com"
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); setError(null); }}
                                    className="bg-[#f8fafc] border-[#e2e8f0] focus-visible:ring-[#2568C1] h-11"
                                    disabled={isLoading || !!success}
                                />
                            </div>

                            {/* Phone Number */}
                            <div className="space-y-2">
                                <Label htmlFor="phoneNumber" className="text-sm font-medium text-[#0f172a]">
                                    Phone Number
                                </Label>
                                <Input
                                    id="phoneNumber"
                                    type="tel"
                                    placeholder="08123456789"
                                    value={phoneNumber}
                                    onChange={(e) => { setPhoneNumber(e.target.value.replace(/\D/g, '')); setError(null); }}
                                    className="bg-[#f8fafc] border-[#e2e8f0] focus-visible:ring-[#2568C1] h-11"
                                    disabled={isLoading || !!success}
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
                                        placeholder="Create a strong password"
                                        value={password}
                                        onChange={(e) => { setPassword(e.target.value); setError(null); }}
                                        className="bg-[#f8fafc] border-[#e2e8f0] focus-visible:ring-[#2568C1] h-11 pr-10"
                                        disabled={isLoading || !!success}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#0f172a] transition-colors"
                                        tabIndex={-1}
                                        disabled={isLoading || !!success}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit */}
                            <Button
                                type="submit"
                                className="w-full h-11 bg-[#2568C1] hover:bg-[#1e56a6] text-white font-semibold shadow-lg shadow-[#2568C1]/20 transition-all duration-200"
                                disabled={isLoading || !!success}
                            >
                                {isLoading ? (
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        className="h-5 w-5 border-2 border-white border-t-transparent rounded-full"
                                    />
                                ) : (
                                    <>
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        Register Admin
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
