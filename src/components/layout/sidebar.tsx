"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { roleMenus } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export function Sidebar() {
    const pathname = usePathname();
    const { user, sidebarCollapsed, toggleSidebar, mobileSidebarOpen, closeMobileSidebar } = useAuthStore();

    if (!user) return null;

    const menuCategories = roleMenus[user.role];
    const allItems = menuCategories.flatMap(category => category.items);

    return (
        <>
            {/* Desktop Sidebar */}
            <motion.aside
                initial={false}
                animate={{ width: sidebarCollapsed ? 72 : 260 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className={cn(
                    "fixed left-0 top-0 z-40 h-screen border-r border-border bg-white flex-col",
                    "shadow-[4px_0_24px_-2px_rgba(0,0,0,0.04)]",
                    "hidden lg:flex"
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
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-lg shadow-blue-600/20">
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
                    <nav className={cn("px-3 pb-4 flex flex-col space-y-2", sidebarCollapsed ? "items-center" : "")}>
                        {allItems.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                            const Icon = item.icon;
                            return (
                                <Link key={item.href} href={item.href} className="w-full">
                                    <div
                                        className={cn(
                                            "relative flex items-center text-sm font-medium transition-all duration-200",
                                            sidebarCollapsed ? "justify-center px-0 py-2.5 rounded-[6px]" : "gap-3 px-3 py-2.5 rounded-[8px]",
                                            isActive
                                                ? "bg-[#4B7BEC]/[0.08] text-[#4B7BEC]"
                                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/60"
                                        )}
                                    >
                                        {/* Animated active indicator bar */}
                                        {isActive && !sidebarCollapsed && (
                                            <motion.div
                                                layoutId="sidebar-active-indicator"
                                                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] rounded-r-full bg-[#4B7BEC]"
                                                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                            />
                                        )}
                                        <Icon className={cn(
                                            "shrink-0 transition-colors duration-200",
                                            sidebarCollapsed ? "h-5 w-5" : "h-[18px] w-[18px]",
                                            isActive ? "text-[#4B7BEC]" : "text-slate-400"
                                        )} />
                                        <AnimatePresence mode="wait">
                                            {!sidebarCollapsed && (
                                                <motion.span
                                                    initial={{ opacity: 0, width: 0 }}
                                                    animate={{ opacity: 1, width: "auto" }}
                                                    exit={{ opacity: 0, width: 0 }}
                                                    className={cn("whitespace-nowrap overflow-hidden", isActive && "font-semibold")}
                                                >
                                                    {item.label}
                                                </motion.span>
                                            )}
                                        </AnimatePresence>
                                        {item.badge && !sidebarCollapsed && (
                                            <span className="ml-auto text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full shadow-sm">
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

            {/* Mobile Sidebar */}
            <AnimatePresence>
                {mobileSidebarOpen && (
                    <motion.aside
                        initial={{ x: -280 }}
                        animate={{ x: 0 }}
                        exit={{ x: -280 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="fixed left-0 top-0 z-50 h-screen w-[280px] border-r border-border bg-white flex flex-col shadow-2xl lg:hidden"
                    >
                        {/* Header */}
                        <div className="flex h-16 items-center justify-between px-4 border-b border-border">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-lg shadow-blue-600/20">
                                    <span className="text-sm font-extrabold text-white tracking-tighter">H</span>
                                </div>
                                <span className="font-bold text-sm tracking-tight text-[#0f172a]">Haerarchy</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={closeMobileSidebar}
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Navigation */}
                        <ScrollArea className="flex-1 py-3">
                            <nav className="flex flex-col space-y-2 px-4 pb-6">
                                {allItems.map((item) => {
                                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                                    const Icon = item.icon;
                                    return (
                                        <Link key={item.href} href={item.href} onClick={closeMobileSidebar}>
                                            <div
                                                className={cn(
                                                    "relative flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-sm font-medium transition-all duration-200",
                                                    isActive
                                                        ? "bg-[#4B7BEC]/[0.08] text-[#4B7BEC] font-semibold"
                                                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/60"
                                                )}
                                            >
                                                {/* Animated active indicator bar */}
                                                {isActive && (
                                                    <motion.div
                                                        layoutId="sidebar-mobile-active-indicator"
                                                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] rounded-r-full bg-[#4B7BEC]"
                                                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                                    />
                                                )}
                                                <Icon className={cn("shrink-0 h-[18px] w-[18px] transition-colors duration-200", isActive ? "text-[#4B7BEC]" : "text-slate-400")} />
                                                <span className="whitespace-nowrap">{item.label}</span>
                                                {item.badge && (
                                                    <span className="ml-auto text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full shadow-sm">
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
                )}
            </AnimatePresence>
        </>
    );
}
