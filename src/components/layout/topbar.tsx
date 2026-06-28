"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Bell, LogOut, User as UserIcon, Shield, ArrowLeft, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { roleLabels, roleColors } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SearchResults, useSearchResults } from "@/components/layout/search-results";

export function Topbar() {
    const { user, notifications, logout, markNotificationRead, isImpersonating, exitImpersonation, toggleMobileSidebar } = useAuthStore();
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeIndex, setActiveIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const unreadCount = notifications.filter((n) => !n.read).length;
    const router = useRouter();

    const results = useSearchResults(searchQuery, user?.role ?? "employee");

    const closeSearch = useCallback(() => {
        setShowSearch(false);
        setSearchQuery("");
        setActiveIndex(-1);
    }, []);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape" && showSearch) {
                closeSearch();
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [showSearch, closeSearch]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((i) => Math.min(i + 1, results.results.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter" && activeIndex >= 0 && results.results[activeIndex]) {
            e.preventDefault();
            router.push(results.results[activeIndex].href);
            closeSearch();
        } else if (e.key === "Escape") {
            closeSearch();
        }
    };

    if (!user) return null;

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    const handleExitProxy = () => {
        exitImpersonation();
        router.push("/admin/proxy-login");
    };

    return (
        <div className="sticky top-0 z-50 flex flex-col w-full">
            {/* Proxy Session Banner */}
            <AnimatePresence>
                {isImpersonating && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-amber-500 text-white shadow-lg relative z-50"
                    >
                        <div className="flex items-center justify-between px-6 py-2.5">
                            <div className="flex items-center gap-2.5">
                                <div className="p-1 bg-white/20 rounded-md">
                                    <Shield className="h-4 w-4" />
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold uppercase tracking-wider">Proxy Session Active</span>
                                    <span className="text-xs font-medium opacity-90">— Viewing as <span className="font-bold">{user.name}</span></span>
                                </div>
                            </div>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold h-7 rounded-md px-3 border border-white/30"
                                onClick={handleExitProxy}
                            >
                                <ArrowLeft className="h-3 w-3" />
                                Back to Admin
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <header className="flex h-14 sm:h-16 items-center justify-between border-b border-border bg-white/80 backdrop-blur-xl px-3 sm:px-6 relative z-40">
                {/* Left: Mobile Hamburger + Search */}
                <div className="flex items-center gap-2 sm:gap-3 flex-1">
                    <Button variant="ghost" size="icon" className="h-9 w-9 lg:hidden" onClick={toggleMobileSidebar}>
                        <Menu className="h-5 w-5" />
                    </Button>
                    <AnimatePresence mode="wait">
                        {showSearch ? (
                            <motion.div
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: 380, opacity: 1 }}
                                exit={{ width: 0, opacity: 0 }}
                                className="relative"
                            >
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                                <Input
                                    ref={inputRef}
                                    placeholder="Search projects, tasks, users..."
                                    className="pl-9 h-9 rounded-full bg-slate-100 border-none shadow-none focus-visible:ring-1 focus-visible:ring-blue-500"
                                    autoFocus
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setActiveIndex(-1); }}
                                    onKeyDown={handleKeyDown}
                                    onBlur={() => {
                                        // Small delay to allow click on results
                                        setTimeout(closeSearch, 150);
                                    }}
                                />
                                <AnimatePresence>
                                    {searchQuery.trim().length >= 2 && (
                                        <SearchResults
                                            query={searchQuery}
                                            role={user.role}
                                            activeIndex={activeIndex}
                                            onSelect={closeSearch}
                                        />
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ) : (
                            <Button variant="ghost" size="sm" onClick={() => setShowSearch(true)} className="gap-2 text-slate-500 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded-full h-9 px-4 w-48 sm:w-64 justify-start">
                                <Search className="h-4 w-4" />
                                <span className="text-xs">Search...</span>
                            </Button>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                    {/* Role indicator */}
                    <div className={cn(
                        "hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium",
                        isImpersonating
                            ? "bg-amber-50 text-amber-700"
                            : "bg-[#f1f5f9] text-[#64748b]"
                    )}>
                        <div className={cn("h-2 w-2 rounded-full", isImpersonating ? "bg-amber-500 animate-pulse" : roleColors[user.role])} />
                        {isImpersonating ? "Proxy Mode" : roleLabels[user.role]}
                    </div>

                    {/* Notifications */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative h-9 w-9">
                                <Bell className="h-4 w-4" />
                                {unreadCount > 0 && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold"
                                    >
                                        {unreadCount}
                                    </motion.span>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80">
                            <DropdownMenuLabel className="flex items-center justify-between">
                                <span>Notifications</span>
                                <Badge variant="secondary" className="text-xs">{unreadCount} new</Badge>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <ScrollArea className="h-64">
                                {notifications.map((notif) => (
                                    <DropdownMenuItem
                                        key={notif.id}
                                        onClick={() => markNotificationRead(notif.id)}
                                        className={cn("flex flex-col items-start gap-1 py-3 px-3 cursor-pointer transition-colors", !notif.read && "bg-blue-50/50 hover:bg-blue-50")}
                                    >
                                        <div className="flex items-center gap-2 w-full">
                                            <span className={cn(
                                                "h-2 w-2 rounded-full shrink-0",
                                                notif.type === "ai" && "bg-blue-600",
                                                notif.type === "warning" && "bg-amber-500",
                                                notif.type === "error" && "bg-red-500",
                                                notif.type === "success" && "bg-emerald-500",
                                                notif.type === "info" && "bg-blue-500",
                                            )} />
                                            <span className={cn("text-xs truncate", !notif.read ? "font-semibold text-slate-900" : "font-medium text-slate-600")}>{notif.title}</span>
                                            {!notif.read && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-600" />}
                                        </div>
                                        <span className="text-[11px] text-muted-foreground pl-4">{notif.message}</span>
                                    </DropdownMenuItem>
                                ))}
                            </ScrollArea>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* User Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-2 ml-1">
                                <Avatar className="h-7 w-7">
                                    <AvatarFallback className={cn(
                                        "text-xs font-semibold text-white",
                                        isImpersonating
                                            ? "bg-amber-500"
                                            : "bg-gradient-to-br from-[#2568C1] to-[#1a4f99]"
                                    )}>
                                        {user.name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="hidden md:inline text-xs font-medium">{user.name}</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel className="text-xs">
                                <div>{user.name}</div>
                                <div className="text-muted-foreground font-normal">{user.email}</div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {isImpersonating && (
                                <>
                                    <DropdownMenuItem className="gap-2 text-amber-600" onClick={handleExitProxy}>
                                        <ArrowLeft className="h-3 w-3" /> Back to Admin
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                </>
                            )}
                            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => router.push("/profile")}>
                                <UserIcon className="h-3 w-3 text-blue-600" /> Profile
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="gap-2 text-red-500" onClick={handleLogout}>
                                <LogOut className="h-3 w-3" /> Log Out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>
        </div>
    );
}
