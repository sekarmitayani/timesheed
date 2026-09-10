"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { Role } from "@/lib/types";
import { getDefaultRoute } from "@/lib/rbac";
import { ChatbotWidget } from "@/components/chat/ChatbotWidget";
import { cn } from "@/lib/utils";

interface AppShellProps {
    children: React.ReactNode;
    requiredRole: Role;
}

export function AppShell({ children, requiredRole }: AppShellProps) {
    const { user, isAuthenticated, sidebarCollapsed, mobileSidebarOpen, closeMobileSidebar, isImpersonating } = useAuthStore();
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

    useEffect(() => {
        if (!mounted || !isAuthenticated || !user || isImpersonating) return;

        const allowedPath = user.role === "projectmanager" ? "/pm" : user.role === "finance" ? "/management" : `/${user.role}`;
        if (user.role !== requiredRole && !pathname.startsWith(allowedPath)) {
            router.push(getDefaultRoute(user.role as Role));
        }
    }, [mounted, isAuthenticated, user, isImpersonating, requiredRole, pathname, router]);

    if (!mounted) {
        return null;
    }

    if (!isAuthenticated || !user) {
        return null;
    }

    const isFixedPage = Boolean(
        pathname?.endsWith("/tasks") ||
        pathname?.match(/\/(admin|pm|employee)\/projects\/[^/]+$/)
    );

    return (
        /* 1. ROOT ABSOLUTE: Kunci mati ke batas layar perangkat */
        <div className="fixed inset-0 w-full h-full bg-background overflow-hidden">
            {mobileSidebarOpen && (
                <div
                    className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm xl:hidden"
                    onClick={closeMobileSidebar}
                />
            )}

            <Sidebar />

            {/* 2. DESKTOP WRAPPER */}
            <motion.div
                initial={false}
                animate={{ paddingLeft: sidebarCollapsed ? 72 : 260 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="hidden xl:flex flex-col absolute inset-0 w-full h-full overflow-hidden"
            >
                <div className="w-full shrink-0 z-30">
                    <Topbar />
                </div>
                <main className={cn(
                    "flex-1 w-full min-w-0 min-h-0",
                    isFixedPage
                        ? "p-4 sm:px-6 sm:pt-5 sm:pb-3 overflow-hidden flex flex-col"
                        : "px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-3.5 overflow-y-auto"
                )}>
                    <motion.div
                        key={pathname}
                        initial={isFixedPage ? { opacity: 0 } : { opacity: 0, y: 8 }}
                        animate={isFixedPage ? { opacity: 1 } : { opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={cn("w-full", isFixedPage ? "h-full flex-1 flex flex-col min-h-0" : "")}
                    >
                        {children}
                    </motion.div>
                </main>
            </motion.div>

            {/* 3. MOBILE & TABLET WRAPPER */}
            <div className="flex flex-col xl:hidden absolute inset-0 w-full h-full overflow-hidden">
                <div className="w-full shrink-0 z-30">
                    <Topbar />
                </div>
                <main className={cn(
                    "flex-1 w-full min-w-0 min-h-0",
                    isFixedPage
                        ? "p-3 sm:px-4 sm:pt-4 sm:pb-3 lg:p-4 lg:pt-5 lg:pb-3 flex flex-col overflow-y-auto lg:overflow-hidden"
                        : "px-3 sm:px-4 pt-3 sm:pt-4 pb-4 sm:pb-4.5 overflow-y-auto"
                )}>
                    <motion.div
                        key={pathname}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={cn("w-full", isFixedPage ? "min-h-0 flex-1 flex flex-col lg:h-full" : "")}
                    >
                        {children}
                    </motion.div>
                </main>
            </div>

            {(user.role === "admin" || user.role === "management") && (
                <ChatbotWidget />
            )}
        </div>
    );
}