import * as React from "react";
import { Input } from "@/components/ui/input";

export interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "type"> {
    value: number | "";
    onChange: (value: number | "") => void;
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
    ({ value, onChange, placeholder = "0", ...props }, ref) => {
        // Internal state to handle the formatted string
        const [displayValue, setDisplayValue] = React.useState("");

        // Sync display value when incoming number drops changes (e.g. initial load or reset)
        React.useEffect(() => {
            if (value === "" || value === 0) {
                setDisplayValue("");
            } else if (value) {
                // Ensure the display string matches the formatted value without losing cursor position usually,
                // but for simple sync we just stringify.
                const formatted = value.toLocaleString("id-ID");
                if (displayValue.replace(/\D/g, "") !== String(value)) {
                    setDisplayValue(formatted);
                }
            }
        }, [value, displayValue]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const raw = e.target.value.replace(/\D/g, ""); // strip non-digits
            if (raw === "") {
                setDisplayValue("");
                onChange("");
            } else {
                const numeric = parseInt(raw, 10);
                setDisplayValue(numeric.toLocaleString("id-ID"));
                onChange(numeric);
            }
        };

        return (
            <Input
                {...props}
                ref={ref}
                type="text"
                value={displayValue}
                onChange={handleChange}
                placeholder={placeholder}
            />
        );
    }
);
CurrencyInput.displayName = "CurrencyInput";
