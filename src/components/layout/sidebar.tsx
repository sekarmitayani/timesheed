"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { roleMenus, roleLabels, roleColors } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";

export function Sidebar() {
    const pathname = usePathname();
    const { user, sidebarCollapsed, toggleSidebar } = useAuthStore();

    if (!user) return null;

    const menuItems = roleMenus[user.role];

    return (
        <TooltipProvider delayDuration={0}>
            <motion.aside
                initial={false}
                animate={{ width: sidebarCollapsed ? 72 : 260 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className={cn(
                    "fixed left-0 top-0 z-40 h-screen border-r border-border bg-white flex flex-col",
                    "shadow-[4px_0_24px_-2px_rgba(0,0,0,0.04)]"
                )}
            >
                {/* Logo / Brand */}
                <div className="flex h-16 items-center justify-between px-4 border-b border-border">
                    <AnimatePresence mode="wait">
                        {!sidebarCollapsed && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-2"
                            >
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#2568C1] to-[#1a4f99] shadow-lg shadow-[#2568C1]/20">
                                    <span className="text-sm font-extrabold text-white tracking-tighter">H</span>
                                </div>
                                <span className="font-bold text-sm tracking-tight text-[#0f172a]">Haerarchy</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    {sidebarCollapsed && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#2568C1] to-[#1a4f99] shadow-lg shadow-[#2568C1]/20 mx-auto">
                            <span className="text-sm font-extrabold text-white tracking-tighter">H</span>
                        </div>
                    )}
                </div>

                {/* Role Badge */}
                <div className="px-3 py-3 border-b border-border">
                    {!sidebarCollapsed ? (
                        <div className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-white", roleColors[user.role])}>
                            <div className="h-2 w-2 rounded-full bg-white/80 animate-pulse" />
                            {roleLabels[user.role]}
                        </div>
                    ) : (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className={cn("mx-auto h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white", roleColors[user.role])}>
                                    {roleLabels[user.role][0]}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="right">{roleLabels[user.role]}</TooltipContent>
                        </Tooltip>
                    )}
                </div>

                {/* Navigation */}
                <ScrollArea className="flex-1 py-3">
                    <nav className="space-y-1 px-2">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                            const Icon = item.icon;
                            return (
                                <Tooltip key={item.href}>
                                    <TooltipTrigger asChild>
                                        <Link href={item.href}>
                                            <motion.div
                                                whileHover={{ x: 2 }}
                                                whileTap={{ scale: 0.98 }}
                                                className={cn(
                                                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                                                    isActive
                                                        ? "bg-[#2568C1]/8 text-[#2568C1] shadow-sm"
                                                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                                                )}
                                            >
                                                <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-[#2568C1]")} />
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
                                                    <span className="ml-auto text-[10px] font-bold bg-gradient-to-r from-[#2568C1] to-[#1a4f99] text-white px-1.5 py-0.5 rounded-full">
                                                        {item.badge}
                                                    </span>
                                                )}
                                                {isActive && (
                                                    <motion.div
                                                        layoutId="sidebar-indicator"
                                                        className="absolute left-0 w-[3px] h-6 bg-gradient-to-b from-[#2568C1] to-[#1a4f99] rounded-r-full"
                                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                    />
                                                )}
                                            </motion.div>
                                        </Link>
                                    </TooltipTrigger>
                                    {sidebarCollapsed && (
                                        <TooltipContent side="right">
                                            {item.label}
                                            {item.badge && <span className="ml-1 text-[#2568C1]">({item.badge})</span>}
                                        </TooltipContent>
                                    )}
                                </Tooltip>
                            );
                        })}
                    </nav>
                </ScrollArea>

                {/* Collapse Toggle */}
                <div className="border-t border-border p-3">
                    <Button variant="ghost" size="sm" onClick={toggleSidebar} className="w-full justify-center">
                        <motion.div animate={{ rotate: sidebarCollapsed ? 180 : 0 }} transition={{ duration: 0.2 }}>
                            <ChevronLeft className="h-4 w-4" />
                        </motion.div>
                    </Button>
                </div>
            </motion.aside>
        </TooltipProvider>
    );
}
