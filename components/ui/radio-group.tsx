"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface RadioGroupContextValue {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

const RadioGroupContext = React.createContext<RadioGroupContextValue>({
  value: "",
  onValueChange: () => {},
});

interface RadioGroupProps {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ value = "", onValueChange = () => {}, disabled, className, children }, ref) => {
    return (
      <RadioGroupContext.Provider value={{ value, onValueChange, disabled }}>
        <div
          ref={ref}
          role="radiogroup"
          className={cn("grid gap-2", className)}
        >
          {children}
        </div>
      </RadioGroupContext.Provider>
    );
  }
);
RadioGroup.displayName = "RadioGroup";

interface RadioGroupItemProps {
  value: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}

const RadioGroupItem = React.forwardRef<HTMLButtonElement, RadioGroupItemProps>(
  ({ value, id, disabled, className }, ref) => {
    const ctx = React.useContext(RadioGroupContext);
    const isChecked = ctx.value === value;
    const isDisabled = disabled || ctx.disabled;

    return (
      <button
        ref={ref}
        id={id}
        type="button"
        role="radio"
        aria-checked={isChecked}
        disabled={isDisabled}
        onClick={() => !isDisabled && ctx.onValueChange(value)}
        className={cn(
          "aspect-square h-4 w-4 rounded-full border border-zinc-300 dark:border-zinc-600",
          "ring-offset-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "flex items-center justify-center transition-colors",
          isChecked && "border-blue-600 bg-blue-600",
          !isChecked && "bg-white dark:bg-zinc-900",
          className
        )}
      >
        {isChecked && (
          <span className="block w-2 h-2 rounded-full bg-white" />
        )}
      </button>
    );
  }
);
RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup, RadioGroupItem };
