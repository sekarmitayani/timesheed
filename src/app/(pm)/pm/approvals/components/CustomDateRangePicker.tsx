"use client";

import * as React from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, isWithinInterval, parse, isAfter, isBefore, subWeeks, subYears, startOfDay, endOfDay } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface CustomDateRangePickerProps {
    dateFrom?: string;
    dateTo?: string;
    align?: "center" | "end" | "start";
    onDateChange: (from: string, to: string) => void;
}

type Preset = "All Records" | "Daily" | "Weekly" | "Monthly" | "Custom";

export function CustomDateRangePicker({ dateFrom, dateTo, onDateChange, align = "start" }: CustomDateRangePickerProps) {
    const [open, setOpen] = React.useState(false);
    
    // Internal state for the calendar
    const [currentMonth, setCurrentMonth] = React.useState<Date>(
        dateFrom ? new Date(dateFrom) : new Date()
    );
    const [tempFrom, setTempFrom] = React.useState<Date | undefined>(
        dateFrom ? new Date(dateFrom) : undefined
    );
    const [tempTo, setTempTo] = React.useState<Date | undefined>(
        dateTo ? new Date(dateTo) : undefined
    );
    const [activePreset, setActivePreset] = React.useState<Preset>("Custom");
    const [showMonthYearPicker, setShowMonthYearPicker] = React.useState(false);
    const [expandedYear, setExpandedYear] = React.useState<number>(new Date().getFullYear());

    // Sync with external props when opened
    React.useEffect(() => {
        if (open) {
            setTempFrom(dateFrom ? new Date(dateFrom) : undefined);
            setTempTo(dateTo ? new Date(dateTo) : undefined);
            if (dateFrom) {
                setCurrentMonth(new Date(dateFrom));
                setExpandedYear(new Date(dateFrom).getFullYear());
            } else {
                setCurrentMonth(new Date());
                setExpandedYear(new Date().getFullYear());
            }
            setActivePreset("Custom");
            setShowMonthYearPicker(false);
        }
    }, [open, dateFrom, dateTo]);

    const activeYearRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (showMonthYearPicker && activeYearRef.current) {
            activeYearRef.current.scrollIntoView({ block: "center", behavior: "smooth" });
        }
    }, [showMonthYearPicker]);

    const handlePresetClick = (preset: Preset) => {
        setActivePreset(preset);
        const today = new Date();
        let newFrom, newTo;

        if (preset === "All Records") {
            setTempFrom(undefined);
            setTempTo(undefined);
            return;
        } else if (preset === "Daily") {
            newFrom = today;
            newTo = today;
        } else if (preset === "Weekly") {
            const start = new Date(today);
            start.setDate(today.getDate() - 6); // Last 7 days including today
            newFrom = start;
            newTo = today;
        } else if (preset === "Monthly") {
            const start = new Date(today);
            start.setMonth(today.getMonth() - 1);
            newFrom = start;
            newTo = today;
        }

        if (preset !== "Custom" && newFrom && newTo) {
            setTempFrom(newFrom);
            setTempTo(newTo);
            setCurrentMonth(newTo);
        }
    };

    const handleDayClick = (day: Date) => {
        setActivePreset("Custom");
        if (!tempFrom || (tempFrom && tempTo)) {
            setTempFrom(day);
            setTempTo(undefined);
        } else {
            if (isBefore(day, tempFrom)) {
                setTempTo(tempFrom);
                setTempFrom(day);
            } else {
                setTempTo(day);
            }
        }
    };

    const handleApply = () => {
        const fromStr = tempFrom ? format(tempFrom, "yyyy-MM-dd") : "";
        const toStr = tempTo ? format(tempTo, "yyyy-MM-dd") : (tempFrom ? format(tempFrom, "yyyy-MM-dd") : "");
        onDateChange(fromStr, toStr);
        setOpen(false);
    };

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    // Generate days for current month view
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const formatDateRange = () => {
        if (dateFrom && dateTo) {
            if (dateFrom === dateTo) {
                return format(new Date(dateFrom), "MMM d, yyyy");
            }
            return `${format(new Date(dateFrom), "MMM d, yyyy")} - ${format(new Date(dateTo), "MMM d, yyyy")}`;
        }
        if (dateFrom) {
            return `${format(new Date(dateFrom), "MMM d, yyyy")} - ...`;
        }
        return "Select Date Range";
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "h-10 justify-start text-left font-normal bg-white border-slate-200 min-w-[200px]",
                        !dateFrom && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatDateRange()}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-2xl shadow-lg border-slate-100" align={align}>
                <div className="flex flex-col sm:flex-row">
                    {/* Sidebar */}
                    <div className="flex flex-col p-4 border-r border-slate-100 w-full sm:w-[160px] bg-white rounded-l-2xl shrink-0">
                        <div className="space-y-2">
                            {(["All Records", "Daily", "Weekly", "Monthly", "Custom"] as Preset[]).map((preset) => (
                                <button
                                    key={preset}
                                    onClick={() => handlePresetClick(preset)}
                                    className={cn(
                                        "w-full text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                                        activePreset === preset 
                                            ? "bg-slate-100 text-slate-900" 
                                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                    )}
                                >
                                    {preset}
                                </button>
                            ))}
                        </div>
                        <Button 
                            onClick={handleApply} 
                            className="w-full mt-4 bg-[#111424] hover:bg-[#1C2033] text-white rounded-lg"
                        >
                            Apply
                        </Button>
                    </div>

                    {/* Calendar */}
                    <div className="relative p-4 bg-white rounded-r-2xl w-[280px] shrink-0 flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <button 
                                onClick={prevMonth}
                                className="p-1 hover:bg-slate-100 rounded-md text-slate-500 transition-colors"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <button 
                                onClick={() => {
                                    setShowMonthYearPicker(!showMonthYearPicker);
                                    if (!showMonthYearPicker) setExpandedYear(currentMonth.getFullYear());
                                }}
                                className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors"
                            >
                                {format(currentMonth, "MMMM yyyy")}
                                <ChevronDown className={cn("h-4 w-4 transition-transform text-slate-400", showMonthYearPicker ? "rotate-180" : "")} />
                            </button>
                            <button 
                                onClick={nextMonth}
                                className="p-1 hover:bg-slate-100 rounded-md text-slate-500 transition-colors"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Days of week */}
                        <div className="grid grid-cols-7 gap-y-2 mb-2">
                            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                                <div key={day} className="text-center text-[11px] font-medium text-slate-400">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-y-1">
                            {days.map((day, idx) => {
                                const isCurrentMonth = isSameMonth(day, currentMonth);
                                const isSelectedStart = tempFrom && isSameDay(day, tempFrom);
                                const isSelectedEnd = tempTo && isSameDay(day, tempTo);
                                const isSelected = isSelectedStart || isSelectedEnd;
                                const isWithinRange = tempFrom && tempTo && isWithinInterval(day, { start: tempFrom, end: tempTo });
                                
                                return (
                                    <div key={day.toISOString()} className="relative flex items-center justify-center h-9">
                                        {/* Range background */}
                                        {isWithinRange && (
                                            <div 
                                                className={cn(
                                                    "absolute inset-y-0 bg-slate-100",
                                                    isSelectedStart ? "left-1/2 right-0 rounded-l-none" : "",
                                                    isSelectedEnd ? "right-1/2 left-0 rounded-r-none" : "",
                                                    !isSelectedStart && !isSelectedEnd ? "inset-x-0" : "",
                                                    isSelectedStart && isSelectedEnd ? "inset-x-1/2 opacity-0" : "" // if same day, no range bg
                                                )} 
                                            />
                                        )}
                                        {/* Highlight circle/pill for start/end or just the button itself */}
                                        <button
                                            onClick={() => handleDayClick(day)}
                                            className={cn(
                                                "relative z-10 w-9 h-9 flex items-center justify-center text-sm transition-colors",
                                                !isCurrentMonth ? "text-slate-300" : "text-slate-700 hover:bg-slate-200",
                                                (isSelectedStart || isSelectedEnd) ? "rounded-full bg-slate-100 font-bold text-slate-900" : "rounded-full",
                                                isWithinRange && !isSelectedStart && !isSelectedEnd && "font-bold text-slate-900 bg-slate-100 rounded-none",
                                            )}
                                        >
                                            {format(day, "d")}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Year Picker Overlay */}
                        {showMonthYearPicker && (
                            <div className="absolute inset-x-4 top-[64px] bottom-4 bg-white z-20">
                                <div className="h-full overflow-y-auto pr-2 space-y-1 custom-scrollbar">
                                    {Array.from({ length: 31 }, (_, i) => new Date().getFullYear() - 15 + i).map(year => (
                                        <div 
                                            key={year} 
                                            ref={year === currentMonth.getFullYear() ? activeYearRef : null}
                                            className="border border-slate-100 rounded-md overflow-hidden"
                                        >
                                            <button 
                                                onClick={() => setExpandedYear(expandedYear === year ? -1 : year)}
                                                className={cn(
                                                    "w-full text-left px-3 py-2.5 text-sm font-semibold transition-colors flex items-center justify-between",
                                                    expandedYear === year ? "bg-slate-100 text-slate-900" : "bg-slate-50 hover:bg-slate-100 text-slate-700"
                                                )}
                                            >
                                                {year}
                                            </button>
                                            {expandedYear === year && (
                                                <div className="grid grid-cols-4 gap-2 p-3 bg-white">
                                                    {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => {
                                                        const isSelected = currentMonth.getFullYear() === year && currentMonth.getMonth() === i;
                                                        return (
                                                            <button
                                                                key={m}
                                                                onClick={() => {
                                                                    setCurrentMonth(new Date(year, i, 1));
                                                                    setShowMonthYearPicker(false);
                                                                }}
                                                                className={cn(
                                                                    "px-2 py-2 text-xs font-semibold rounded-md transition-all text-center border",
                                                                    isSelected
                                                                        ? "bg-[#4B7BEC] text-white border-[#4B7BEC] shadow-sm"
                                                                        : "border-transparent hover:border-slate-200 hover:bg-slate-50 text-slate-700"
                                                                )}
                                                            >
                                                                {m}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

// Helpers for year preset
function startOfYear(date: Date) {
    const d = new Date(date);
    d.setMonth(0, 1);
    d.setHours(0, 0, 0, 0);
    return d;
}

function endOfYear(date: Date) {
    const d = new Date(date);
    d.setMonth(11, 31);
    d.setHours(23, 59, 59, 999);
    return d;
}
