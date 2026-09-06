"use client";

import * as React from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface CustomDatePickerProps {
    date?: string;
    onDateChange: (date: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

export function CustomDatePicker({ date, onDateChange, placeholder = "Select Date", disabled, className }: CustomDatePickerProps) {
    const [open, setOpen] = React.useState(false);
    
    // Internal state for the calendar
    const [currentMonth, setCurrentMonth] = React.useState<Date>(
        date ? new Date(date) : new Date()
    );
    const [showMonthYearPicker, setShowMonthYearPicker] = React.useState(false);
    const [expandedYear, setExpandedYear] = React.useState<number>(new Date().getFullYear());

    React.useEffect(() => {
        if (open) {
            if (date) {
                setCurrentMonth(new Date(date));
                setExpandedYear(new Date(date).getFullYear());
            } else {
                setCurrentMonth(new Date());
                setExpandedYear(new Date().getFullYear());
            }
            setShowMonthYearPicker(false);
        }
    }, [open, date]);

    const activeYearRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (showMonthYearPicker && activeYearRef.current) {
            activeYearRef.current.scrollIntoView({ block: "center", behavior: "smooth" });
        }
    }, [showMonthYearPicker]);

    const handleDayClick = (day: Date) => {
        onDateChange(format(day, "yyyy-MM-dd"));
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

    const formatDate = () => {
        if (date) {
            return format(new Date(date), "dd MMM yyyy");
        }
        return placeholder;
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "w-full justify-start text-left font-normal bg-white border-slate-300",
                        !date && "text-muted-foreground",
                        className
                    )}
                    disabled={disabled}
                >
                    {formatDate()}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-2xl shadow-lg border-slate-100" align="start">
                {/* Calendar */}
                <div className="relative p-4 bg-white rounded-2xl w-[280px] flex flex-col">
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
                        {days.map((day) => {
                            const isCurrentMonth = isSameMonth(day, currentMonth);
                            const isSelected = date && isSameDay(day, new Date(date));
                            
                            return (
                                <div key={day.toISOString()} className="relative flex items-center justify-center h-9">
                                    <button
                                        onClick={() => handleDayClick(day)}
                                        className={cn(
                                            "relative z-10 w-9 h-9 flex items-center justify-center text-sm transition-colors",
                                            !isCurrentMonth ? "text-slate-300" : "text-slate-700 hover:bg-slate-200",
                                            isSelected ? "rounded-full bg-slate-100 font-bold text-slate-900" : "rounded-full",
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
                                                    const isSelectedMonth = currentMonth.getFullYear() === year && currentMonth.getMonth() === i;
                                                    return (
                                                        <button
                                                            key={m}
                                                            onClick={() => {
                                                                setCurrentMonth(new Date(year, i, 1));
                                                                setShowMonthYearPicker(false);
                                                            }}
                                                            className={cn(
                                                                "px-2 py-2 text-xs font-semibold rounded-md transition-all text-center border",
                                                                isSelectedMonth
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
            </PopoverContent>
        </Popover>
    );
}
