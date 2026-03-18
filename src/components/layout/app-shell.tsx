"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { Role } from "@/lib/types";
import { getDefaultRoute } from "@/lib/rbac";

interface AppShellProps {
    children: React.ReactNode;
    requiredRole: Role;
}

export function AppShell({ children, requiredRole }: AppShellProps) {
    const { user, isAuthenticated, sidebarCollapsed, isImpersonating } = useAuthStore();
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

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <motion.div
                initial={false}
                animate={{ marginLeft: sidebarCollapsed ? 72 : 260 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="flex flex-col min-h-screen"
            >
                <Topbar />
                <main className="flex-1 p-6">
                    <motion.div
                        key={pathname}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {children}
                    </motion.div>
                </main>
            </motion.div>
        </div>
    );
}
