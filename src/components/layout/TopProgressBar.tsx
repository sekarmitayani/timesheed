"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function TopProgressBarInner() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [progress, setProgress] = useState(0);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setVisible(true);
        setProgress(30);

        const timer1 = setTimeout(() => {
            setProgress(75);
        }, 120);

        const timer2 = setTimeout(() => {
            setProgress(100);
        }, 280);

        const timer3 = setTimeout(() => {
            setVisible(false);
            setProgress(0);
        }, 500);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, [pathname, searchParams]);

    if (!visible) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none">
            <div
                className="h-[2.5px] bg-[#4B7BEC] shadow-[0_0_8px_#4B7BEC] transition-all duration-200 ease-out"
                style={{
                    width: `${progress}%`,
                    opacity: progress === 100 ? 0 : 1,
                    transitionProperty: "width, opacity",
                }}
            />
        </div>
    );
}

export function TopProgressBar() {
    return (
        <React.Suspense fallback={null}>
            <TopProgressBarInner />
        </React.Suspense>
    );
}
