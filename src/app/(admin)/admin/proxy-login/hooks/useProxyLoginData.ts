"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminUserService } from "@/lib/services/admin-users";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { User } from "@/lib/types";

export function useProxyLoginData() {
    const router = useRouter();
    const currentUser = useAuthStore((s) => s.user);
    const impersonate = useAuthStore((s) => s.impersonate);

    // --- UI State (Filters & Pagination) ---
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");

    // --- Modal State ---
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [targetUser, setTargetUser] = useState<User | null>(null);
    const [isProxying, setIsProxying] = useState<string | null>(null);

    // --- Queries ---
    const { data: usersResponse, isLoading } = useQuery({
        queryKey: ['admin', 'proxy', 'users'],
        queryFn: () => adminUserService.getUsers(1, 1000), // Fetch a larger set to filter locally or implement server-side search if available
        staleTime: 5 * 60 * 1000,
    });
    const allUsers = usersResponse?.data || [];

    // --- Computed ---
    const filteredUsers = useMemo(() => {
        return allUsers
            .filter((u) => u.id !== currentUser?.id)
            .filter((u) => {
                const q = search.toLowerCase();
                const matchSearch = !search || 
                    (u.full_name || u.name || "").toLowerCase().includes(q) ||
                    u.email.toLowerCase().includes(q) ||
                    u.role.toLowerCase().includes(q);
                
                const matchRole = roleFilter === "all" || u.role === roleFilter;

                return matchSearch && matchRole;
            });
    }, [allUsers, currentUser?.id, search, roleFilter]);

    const paginatedUsers = useMemo(() => {
        return filteredUsers.slice((page - 1) * limit, page * limit);
    }, [filteredUsers, page, limit]);

    const totalPages = Math.ceil(filteredUsers.length / limit);

    // --- Actions ---
    const handleProxy = async () => {
        if (!targetUser) return;
        const name = targetUser.full_name || targetUser.name || "Unknown User";
        setIsProxying(String(targetUser.id));
        setConfirmOpen(false);
        try {
            const res = await adminUserService.proxyLogin(targetUser.id);
            if (res.token && res.user) {
                impersonate(res.token, res.user);
                toast.success(`Logged in as ${name}`, { 
                    description: "You are now securely impersonating this user." 
                });
                
                // Route based on role
                const route = targetUser.role === "projectmanager" 
                    ? "/pm/dashboard" 
                    : (targetUser.role === "management" || targetUser.role === "finance")
                        ? "/management/dashboard" 
                        : `/${targetUser.role}/dashboard`;
                
                router.push(route);
            } else {
                toast.error("Invalid proxy token received");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to impersonate user");
        } finally {
            setIsProxying(null);
            setTargetUser(null);
        }
    };

    const openConfirm = (user: User) => {
        setTargetUser(user);
        setConfirmOpen(true);
    };

    return {
        state: {
            users: paginatedUsers,
            totalCount: filteredUsers.length,
            pagination: { page, limit, totalPages },
            isLoading,
            isProxying,
            search,
            roleFilter,
            confirmOpen,
            targetUser
        },
        actions: {
            setSearch,
            setRoleFilter,
            setPage,
            setLimit,
            setConfirmOpen,
            setTargetUser,
            openConfirm,
            handleProxy
        }
    };
}
