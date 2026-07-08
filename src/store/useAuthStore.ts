import { create } from "zustand";
import { User, Notification } from "@/lib/types";
import { fetchApi } from "@/lib/api";

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isImpersonating: boolean;
    notifications: Notification[];
    sidebarCollapsed: boolean;
    mobileSidebarOpen: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    impersonate: (token: string, userData: any) => void;
    exitImpersonation: () => void;
    logout: () => void;
    toggleSidebar: () => void;
    toggleMobileSidebar: () => void;
    closeMobileSidebar: () => void;
    fetchNotifications: () => Promise<void>;
    markNotificationRead: (id: number) => Promise<void>;
    markAllNotificationsRead: () => Promise<void>;
    deleteNotification: (id: number) => Promise<void>;
    clearAllNotifications: () => Promise<void>;
    isSessionExpired: boolean;
    setSessionExpired: (expired: boolean) => void;
    checkTokenExpiry: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "null") : null,
    isAuthenticated: typeof window !== "undefined" ? !!localStorage.getItem("token") : false,
    isImpersonating: typeof window !== "undefined" ? !!localStorage.getItem("admin_token") : false,
    isSessionExpired: false,
    notifications: [],
    sidebarCollapsed: false,
    mobileSidebarOpen: false,
    setSessionExpired: (expired: boolean) => set({ isSessionExpired: expired }),
    checkTokenExpiry: () => {
        if (typeof window === "undefined") return;
        const token = localStorage.getItem("token");
        if (!token) return;
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            if (payload.exp && payload.exp * 1000 < Date.now()) {
                set({ isSessionExpired: true });
            }
        } catch (e) {
            // Invalid token format
        }
    },
    login: async (email: string, password: string) => {
        try {
            const data = await fetchApi("/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password }),
            });

            if (data && data.token && data.user) {
                // Compatibility patch: the frontend expects strict properties not provided by API
                const apiUser = data.user;
                apiUser.id = String(apiUser.id);
                apiUser.name = apiUser.full_name;
                apiUser.username = apiUser.email.split("@")[0];
                apiUser.password = ""; // Frontend fallback
                apiUser.avatar = apiUser.avatar || "";
                apiUser.department = apiUser.department || "General";
                apiUser.position = apiUser.position || "Staff";
                apiUser.hourlyRate = apiUser.hourlyRate || 0;
                apiUser.joinDate = apiUser.joinDate || new Date().toISOString().split("T")[0];
                apiUser.status = apiUser.status || "active";

                if (typeof window !== "undefined") {
                    localStorage.setItem("token", data.token);
                    localStorage.setItem("user", JSON.stringify(apiUser));
                    // Clear any stale proxy session on fresh login
                    localStorage.removeItem("admin_token");
                    localStorage.removeItem("admin_user");
                }
                set({ user: apiUser, isAuthenticated: true, isImpersonating: false });
                return { success: true };
            }

            return { success: false, error: "Invalid response from server." };
        } catch (error: any) {
            return { success: false, error: error.message || "Failed to login. Please check your credentials." };
        }
    },
    impersonate: (token: string, userData: any) => {
        // Save current admin session BEFORE overwriting
        if (typeof window !== "undefined") {
            const currentToken = localStorage.getItem("token");
            const currentUser = localStorage.getItem("user");
            if (currentToken && currentUser) {
                localStorage.setItem("admin_token", currentToken);
                localStorage.setItem("admin_user", currentUser);
            }
        }

        const apiUser = { ...userData };
        apiUser.id = String(apiUser.id);
        apiUser.name = apiUser.full_name;
        apiUser.username = apiUser.email.split("@")[0];
        apiUser.password = "";
        apiUser.avatar = apiUser.avatar || "";
        apiUser.department = apiUser.department || "General";
        apiUser.position = apiUser.position || "Staff";
        apiUser.hourlyRate = apiUser.hourlyRate || 0;
        apiUser.joinDate = apiUser.joinDate || new Date().toISOString().split("T")[0];
        apiUser.status = apiUser.status || "active";

        if (typeof window !== "undefined") {
            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(apiUser));
        }
        set({ user: apiUser, isAuthenticated: true, isImpersonating: true });
    },
    exitImpersonation: async () => {
        try {
            const adminToken = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
            const headers: Record<string, string> = {};
            if (adminToken) {
                headers["Authorization"] = `Bearer ${adminToken}`;
            }

            await fetchApi("/admin/proxy-logout", { 
                method: "POST",
                headers 
            });
        } catch (e) {
            console.error("Proxy logout failed:", e);
        }

        if (typeof window !== "undefined") {
            const adminToken = localStorage.getItem("admin_token");
            const adminUser = localStorage.getItem("admin_user");

            if (adminToken && adminUser) {
                // Restore admin session
                localStorage.setItem("token", adminToken);
                localStorage.setItem("user", adminUser);
                localStorage.removeItem("admin_token");
                localStorage.removeItem("admin_user");

                const parsedUser = JSON.parse(adminUser);
                set({ user: parsedUser, isAuthenticated: true, isImpersonating: false });
            }
        }
    },
    logout: async () => {
        try {
            await fetchApi("/auth/logout", { method: "POST" });
        } catch (e) {
            console.error("Logout failed:", e);
        }

        if (typeof window !== "undefined") {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("admin_token");
            localStorage.removeItem("admin_user");
        }
        set({ user: null, isAuthenticated: false, isImpersonating: false, isSessionExpired: false });
    },
    toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    toggleMobileSidebar: () => set((s) => ({ mobileSidebarOpen: !s.mobileSidebarOpen })),
    closeMobileSidebar: () => set({ mobileSidebarOpen: false }),
    
    // Notifications Logic
    fetchNotifications: async () => {
        try {
            const data = await fetchApi("/notifications");
            if (Array.isArray(data)) {
                set({ notifications: data });
            }
        } catch (e) {
            console.error("Failed to fetch notifications:", e);
        }
    },
    markNotificationRead: async (id: number) => {
        try {
            await fetchApi(`/notifications/${id}/read`, { method: "PATCH" });
            set((s) => ({
                notifications: s.notifications.map((n) =>
                    n.id === id ? { ...n, is_read: true } : n
                ),
            }));
        } catch (e) {
            console.error("Failed to mark notification read:", e);
        }
    },
    markAllNotificationsRead: async () => {
        try {
            await fetchApi("/notifications/read-all", { method: "PATCH" });
            set((s) => ({
                notifications: s.notifications.map((n) => ({ ...n, is_read: true })),
            }));
        } catch (e) {
            console.error("Failed to mark all read:", e);
        }
    },
    deleteNotification: async (id: number) => {
        try {
            await fetchApi(`/notifications/${id}`, { method: "DELETE" });
            set((s) => ({
                notifications: s.notifications.filter((n) => n.id !== id),
            }));
        } catch (e) {
            console.error("Failed to delete notification:", e);
        }
    },
    clearAllNotifications: async () => {
        try {
            await fetchApi("/notifications/clear-all", { method: "DELETE" });
            set({ notifications: [] });
        } catch (e) {
            console.error("Failed to clear notifications:", e);
        }
    },
}));
