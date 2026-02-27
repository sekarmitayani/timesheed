"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { Role } from "@/lib/types";

interface AppShellProps {
    children: React.ReactNode;
    requiredRole: Role;
}

export function AppShell({ children, requiredRole }: AppShellProps) {
    const { user, isAuthenticated, sidebarCollapsed } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login");
        }
    }, [isAuthenticated, router]);

    if (!isAuthenticated || !user) {
        return null;
    }

    // Redirect if wrong role accessed
    if (user.role !== requiredRole && !pathname.startsWith(`/${user.role}`)) {
        router.push(`/${user.role}/dashboard`);
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
