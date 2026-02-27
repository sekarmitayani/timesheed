"use client";
import { AppShell } from "@/components/layout/app-shell";
export default function PMLayout({ children }: { children: React.ReactNode }) {
    return <AppShell requiredRole="pm">{children}</AppShell>;
}
