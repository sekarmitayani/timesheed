import { create } from "zustand";
import { User, Notification } from "@/lib/types";
import { mockUsers, mockNotifications } from "@/lib/mock-data";

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    notifications: Notification[];
    sidebarCollapsed: boolean;
    login: (username: string, password: string) => { success: boolean; error?: string };
    logout: () => void;
    toggleSidebar: () => void;
    markNotificationRead: (id: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    notifications: mockNotifications,
    sidebarCollapsed: false,
    login: (username: string, password: string) => {
        const user = mockUsers.find(
            (u) => (u.username === username || u.email.toLowerCase() === username.toLowerCase()) && u.password === password
        );
        if (user) {
            set({ user, isAuthenticated: true });
            return { success: true };
        }
        // Check if username/email exists but wrong password
        const userExists = mockUsers.find((u) => u.username === username || u.email.toLowerCase() === username.toLowerCase());
        if (userExists) {
            return { success: false, error: "Incorrect password. Please try again." };
        }
        return { success: false, error: "Username or email not found. Please check your credentials." };
    },
    logout: () => set({ user: null, isAuthenticated: false }),
    toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    markNotificationRead: (id) =>
        set((s) => ({
            notifications: s.notifications.map((n) =>
                n.id === id ? { ...n, read: true } : n
            ),
        })),
}));
