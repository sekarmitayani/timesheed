"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { getDefaultRoute } from "@/lib/rbac";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user) {
      router.replace(getDefaultRoute(user.role));
    } else {
      router.replace("/login");
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse text-muted-foreground text-sm">Loading...</div>
    </div>
  );
}
