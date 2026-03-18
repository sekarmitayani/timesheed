"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { roleMenus } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export function Sidebar() {
    const pathname = usePathname();
    const { user, sidebarCollapsed, toggleSidebar } = useAuthStore();

    if (!user) return null;

    const menuItems = roleMenus[user.role];

    return (
        <motion.aside
            initial={false}
            animate={{ width: sidebarCollapsed ? 72 : 260 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className={cn(
                "fixed left-0 top-0 z-40 h-screen border-r border-border bg-white flex flex-col",
                "shadow-[4px_0_24px_-2px_rgba(0,0,0,0.04)]"
            )}
        >
            {/* Logo / Brand + Hamburger Toggle */}
            <div className="flex h-16 items-center justify-between px-4 border-b border-border">
                <AnimatePresence mode="wait">
                    {!sidebarCollapsed && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-2"
                        >
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2568C1] shadow-lg shadow-[#2568C1]/20">
                                <span className="text-sm font-extrabold text-white tracking-tighter">H</span>
                            </div>
                            <span className="font-bold text-sm tracking-tight text-[#0f172a]">Haerarchy</span>
                        </motion.div>
                    )}
                </AnimatePresence>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    className={cn("h-8 w-8 text-muted-foreground hover:text-foreground", sidebarCollapsed && "mx-auto")}
                >
                    <Menu className="h-4 w-4" />
                </Button>
            </div>

            {/* Navigation */}
            <ScrollArea className="flex-1 py-3">
                <nav className="space-y-1 px-2">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                        const Icon = item.icon;
                        return (
                            <Link key={item.href} href={item.href}>
                                <div
                                    className={cn(
                                        "relative flex items-center rounded-lg text-sm font-medium transition-all duration-150",
                                        sidebarCollapsed ? "justify-center px-0 py-3" : "gap-3 px-3 py-2.5",
                                        isActive
                                            ? "bg-[#2568C1]/10 text-[#2568C1]"
                                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                                    )}
                                >
                                    {/* Active indicator bar on left edge */}
                                    {isActive && (
                                        <motion.div
                                            layoutId="sidebar-indicator"
                                            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-[#2568C1] rounded-r-full"
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                    <Icon className={cn(
                                        "shrink-0",
                                        sidebarCollapsed ? "h-5 w-5" : "h-4 w-4",
                                        isActive && "text-[#2568C1]"
                                    )} />
                                    <AnimatePresence mode="wait">
                                        {!sidebarCollapsed && (
                                            <motion.span
                                                initial={{ opacity: 0, width: 0 }}
                                                animate={{ opacity: 1, width: "auto" }}
                                                exit={{ opacity: 0, width: 0 }}
                                                className="whitespace-nowrap overflow-hidden"
                                            >
                                                {item.label}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                    {item.badge && !sidebarCollapsed && (
                                        <span className="ml-auto text-[10px] font-bold bg-[#2568C1] text-white px-1.5 py-0.5 rounded-full">
                                            {item.badge}
                                        </span>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </nav>
            </ScrollArea>
        </motion.aside>
    );
}

