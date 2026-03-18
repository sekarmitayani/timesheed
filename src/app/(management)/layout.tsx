"use client";
import { AppShell } from "@/components/layout/app-shell";
export default function ManagementLayout({ children }: { children: React.ReactNode }) {
    return <AppShell requiredRole="finance">{children}</AppShell>;
}
