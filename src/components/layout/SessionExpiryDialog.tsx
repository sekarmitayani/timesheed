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
            <DialogContent className="sm:max-w-md p-0 overflow-hidden border-[#e2e8f0] gap-0 rounded-md shadow-xl">
                <div className="bg-red-50/60 border-b border-red-100 px-6 py-4 pr-12 flex items-center gap-3.5">
                    <div className="p-2 bg-white rounded-md shadow-sm border border-red-200 text-red-600">
                        <AlertCircle className="h-5 w-5" />
                    </div>
                    <div>
                        <DialogTitle className="text-base font-semibold text-[#0f172a]">Session Expired</DialogTitle>
                        <p className="text-xs text-red-600/80">Authentication required</p>
                    </div>
                </div>
                <div className="px-6 pt-3.5 pb-5 text-sm text-slate-600 leading-relaxed">
                    Your session has expired or is invalid. Please log in again to continue.
                </div>
                <DialogFooter className="px-6 py-3.5 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end gap-2.5">
                    <Button type="button" onClick={handleLoginAgain} className="rounded-md bg-[#2568C1] hover:bg-[#1e56a6] text-white">
                        Log In Again
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
