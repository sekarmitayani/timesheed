"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated, sidebarCollapsed, mobileSidebarOpen, closeMobileSidebar } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && !isAuthenticated) {
            router.push("/login");
        }
    }, [isAuthenticated, router, mounted]);

    useEffect(() => {
        closeMobileSidebar();
    }, [pathname, closeMobileSidebar]);

    if (!mounted || !isAuthenticated || !user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Mobile overlay */}
            {mobileSidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
                    onClick={closeMobileSidebar}
                />
            )}

            <Sidebar />

            <div
                className="hidden lg:flex flex-col min-h-screen transition-[padding-left] duration-200 ease-in-out will-change-[padding-left]"
                style={{ paddingLeft: sidebarCollapsed ? 72 : 260 }}
            >
                <Topbar />
                <main className="flex-1 p-4 sm:p-6">
                    <motion.div
                        key={pathname}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {children}
                    </motion.div>
                </main>
            </div>

            {/* Mobile content area */}
            <div className="flex flex-col min-h-screen lg:hidden w-full">
                <Topbar />
                <main className="flex-1 p-3 sm:p-4">
                    <motion.div
                        key={pathname}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {children}
                    </motion.div>
                </main>
            </div>
        </div>
    );
}
