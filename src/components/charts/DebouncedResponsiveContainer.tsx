"use client";

import { useRef, useState, useEffect, useCallback, ReactNode } from "react";

interface DebouncedResponsiveContainerProps {
    width?: string | number;
    height?: string | number;
    debounceMs?: number;
    className?: string;
    children: ReactNode;
}

/**
 * A lightweight replacement for Recharts' <ResponsiveContainer> that debounces
 * resize events. This prevents layout thrashing during CSS transitions
 * (e.g. sidebar collapse/expand) by only updating chart dimensions after the
 * resize has settled.
 */
export function DebouncedResponsiveContainer({
    width = "100%",
    height = "100%",
    debounceMs = 250,
    className,
    children,
}: DebouncedResponsiveContainerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const updateDimensions = useCallback(() => {
        if (containerRef.current) {
            const { width: w, height: h } = containerRef.current.getBoundingClientRect();
            if (w > 0 && h > 0) {
                setDimensions({ width: Math.floor(w), height: Math.floor(h) });
            }
        }
    }, []);

    useEffect(() => {
        // Measure immediately on mount
        updateDimensions();

        const node = containerRef.current;
        if (!node) return;

        const observer = new ResizeObserver(() => {
            // Debounce: clear previous timer and set a new one
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(updateDimensions, debounceMs);
        });

        observer.observe(node);

        return () => {
            observer.disconnect();
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [updateDimensions, debounceMs]);

    return (
        <div
            ref={containerRef}
            className={className}
            style={{
                width,
                height,
                contain: "layout style paint",
                position: "relative",
            }}
        >
            {dimensions && (
                <svg
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: 0,
                        height: 0,
                        overflow: "hidden",
                    }}
                >
                    {/* Hidden SVG to satisfy Recharts' parent SVG requirement */}
                </svg>
            )}
            {dimensions && (
                <div
                    style={{
                        width: dimensions.width,
                        height: dimensions.height,
                        position: "absolute",
                        top: 0,
                        left: 0,
                    }}
                >
                    {/* Clone children and inject width/height — Recharts charts
                        accept these as props when not wrapped in ResponsiveContainer */}
                    {injectDimensions(children, dimensions.width, dimensions.height)}
                </div>
            )}
        </div>
    );
}

/**
 * Recursively inject width & height into the first Recharts chart element found.
 */
function injectDimensions(children: ReactNode, width: number, height: number): ReactNode {
    const { Children, cloneElement, isValidElement } = require("react");
    return Children.map(children, (child: any) => {
        if (!isValidElement(child)) return child;
        // Recharts chart components (PieChart, BarChart, etc.) accept width/height
        return cloneElement(child as React.ReactElement<any>, { width, height });
    });
}
