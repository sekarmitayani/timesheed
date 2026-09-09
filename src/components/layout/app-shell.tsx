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

    // Close mobile sidebar on route change
    useEffect(() => {
        closeMobileSidebar();
    }, [pathname, closeMobileSidebar]);

    // Move role redirect into useEffect to avoid setState-during-render error
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
        <div className={cn("bg-background w-full", isFixedPage ? "lg:h-screen lg:overflow-hidden min-h-screen" : "min-h-screen")}>
            {/* Mobile overlay */}
            {mobileSidebarOpen && (
                <div
                    className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm lg:hidden"
                    onClick={closeMobileSidebar}
                />
            )}

            <Sidebar />

            <motion.div
                initial={false}
                animate={{ paddingLeft: sidebarCollapsed ? 72 : 260 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className={cn(
                    "hidden lg:flex flex-col will-change-[padding-left] w-full min-w-0",
                    isFixedPage ? "h-screen overflow-hidden" : "min-h-screen"
                )}
            >
                <Topbar />
                <main className={cn("flex-1 w-full min-w-0", isFixedPage ? "p-4 sm:px-6 sm:pt-5 sm:pb-3 overflow-hidden flex flex-col min-h-0" : "px-4 sm:px-6 pt-4 sm:pt-6 pb-6 sm:pb-8")}>
                    <motion.div
                        key={pathname}
                        initial={isFixedPage ? { opacity: 0 } : { opacity: 0, y: 8 }}
                        animate={isFixedPage ? { opacity: 1 } : { opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={cn("w-full min-w-0", isFixedPage ? "h-full flex-1 flex flex-col min-h-0" : "")}
                    >
                        {children}
                    </motion.div>
                </main>
            </motion.div>

            {/* Mobile / Tablet content area - always scrollable so content never gets cut off */}
            <div className="flex flex-col lg:hidden w-full min-w-0 min-h-screen">
                <Topbar />
                <main className="flex-1 w-full min-w-0 px-3 sm:px-4 pt-3 sm:pt-4 pb-6 sm:pb-8">
                    <motion.div
                        key={pathname}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="w-full min-w-0"
                    >
                        {children}
                    </motion.div>
                </main>
            </div>

            {(user.role === "admin" || user.role === "finance") && (
                <ChatbotWidget />
            )}
        </div>
    );
}
