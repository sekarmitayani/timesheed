"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { usePathname } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export function SessionExpiryDialog() {
    const { isSessionExpired, logout, checkTokenExpiry } = useAuthStore();
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Do not check token expiry if on login page
        if (pathname === "/login") return;

        // Initial check on mount
        checkTokenExpiry();

        // Check token expiry periodically every minute
        const interval = setInterval(() => {
            checkTokenExpiry();
        }, 60000);

        // Also check when the user returns to the tab
        const handleFocus = () => {
            checkTokenExpiry();
        };
        window.addEventListener("focus", handleFocus);

        return () => {
            clearInterval(interval);
            window.removeEventListener("focus", handleFocus);
        };
    }, [checkTokenExpiry, pathname]);

    if (!mounted || pathname === "/login") return null;

    const handleLoginAgain = () => {
        logout();
        window.location.href = "/login";
    };

    return (
        <Dialog open={isSessionExpired} onOpenChange={() => {}}>
            <DialogContent className="sm:max-w-md [&>button]:hidden">
                <DialogHeader className="flex flex-col items-center gap-2 pt-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <DialogTitle className="text-xl font-bold">Session Expired</DialogTitle>
                </DialogHeader>
                <div className="text-center pb-4">
                    <DialogDescription className="text-slate-500 text-sm">
                        Your session has expired or is invalid. Please log in again to continue.
                    </DialogDescription>
                </div>
                <DialogFooter className="sm:justify-center">
                    <Button type="button" onClick={handleLoginAgain} className="w-full sm:w-auto bg-[#2568C1] hover:bg-[#1e56a6]">
                        Log In Again
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
