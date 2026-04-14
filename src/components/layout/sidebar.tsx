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
                    <nav className="space-y-4 px-3 pb-4">
                        {menuCategories.map((category, catIdx) => (
                            <div key={catIdx} className={cn("flex flex-col", sidebarCollapsed ? "items-center" : "")}>
                                {!sidebarCollapsed && (
                                    <h4 className="mb-2 px-3 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                                        {category.title}
                                    </h4>
                                )}
                                <div className="space-y-4 w-full">
                                    {category.items.map((item) => {
                                        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                                        const Icon = item.icon;
                                        return (
                                            <Link key={item.href} href={item.href}>
                                                <div
                                                    className={cn(
                                                        "relative flex items-center rounded-sm text-sm font-medium transition-colors duration-150",
                                                        sidebarCollapsed ? "justify-center px-0 py-2.5 mb-1" : "gap-3 px-3 py-2",
                                                        isActive
                                                            ? "bg-blue-50/80 text-blue-600 border-l-[3px] border-blue-500"
                                                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-50/60"
                                                    )}
                                                >
                                                    <Icon className={cn(
                                                        "shrink-0 transition-colors",
                                                        sidebarCollapsed ? "h-5 w-5" : "h-[18px] w-[18px]",
                                                        isActive ? "text-blue-600" : "text-slate-400"
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
                                </div>
                            </div>
                        ))}
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
                            <nav className="space-y-5 px-4 pb-6">
                                {menuCategories.map((category, catIdx) => (
                                    <div key={catIdx} className="flex flex-col">
                                        <h4 className="mb-2 px-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                                            {category.title}
                                        </h4>
                                        <div className="space-y-4">
                                            {category.items.map((item) => {
                                                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                                                const Icon = item.icon;
                                                return (
                                                    <Link key={item.href} href={item.href} onClick={closeMobileSidebar}>
                                                        <div
                                                            className={cn(
                                                                "relative flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium transition-colors duration-150",
                                                                isActive
                                                                    ? "bg-blue-50/80 text-blue-600 border-l-[3px] border-blue-500 font-semibold"
                                                                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50/60"
                                                            )}
                                                        >
                                                            <Icon className={cn("shrink-0 h-[18px] w-[18px]", isActive ? "text-blue-600" : "text-slate-400")} />
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
                                        </div>
                                    </div>
                                ))}
                            </nav>
                        </ScrollArea>
                    </motion.aside>
                )}
            </AnimatePresence>
        </>
    );
}
