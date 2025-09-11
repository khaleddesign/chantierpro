"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "lucide-react";

interface SelectContextValue {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = React.createContext<SelectContextValue | undefined>(undefined);

interface SelectProps {
  children: React.ReactNode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

const Select: React.FC<SelectProps> = ({ 
  children, 
  value, 
  defaultValue = "", 
  onValueChange 
}) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const [open, setOpen] = React.useState(false);
  
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;
  
  const handleValueChange = (newValue: string) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
    setOpen(false);
  };
  
  return (
    <SelectContext.Provider value={{ 
      value: currentValue, 
      onValueChange: handleValueChange,
      open,
      setOpen 
    }}>
      {children}
    </SelectContext.Provider>
  );
};

interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ children, className }, ref) => {
    const context = React.useContext(SelectContext);
    if (!context) {
      throw new Error("SelectTrigger must be used within a Select component");
    }
    
    return (
      <button
        ref={ref}
        type="button"
        onClick={() => context.setOpen(!context.open)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      >
        {children}
        <ChevronDownIcon className="h-4 w-4 opacity-50" />
      </button>
    );
  }
);
SelectTrigger.displayName = "SelectTrigger";

interface SelectValueProps {
  placeholder?: string;
  className?: string;
}

const SelectValue: React.FC<SelectValueProps> = ({ placeholder = "Select..." }) => {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error("SelectValue must be used within a Select component");
  }
  
  return <span>{context.value || placeholder}</span>;
};

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

const SelectContent: React.FC<SelectContentProps> = ({ children, className }) => {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error("SelectContent must be used within a Select component");
  }
  
  if (!context.open) {
    return null;
  }
  
  return (
    <div className="relative">
      <div
        className={cn(
          "absolute top-1 z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
};

interface SelectItemProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ children, value, className }, ref) => {
    const context = React.useContext(SelectContext);
    if (!context) {
      throw new Error("SelectItem must be used within a Select component");
    }
    
    return (
      <div
        ref={ref}
        onClick={() => context.onValueChange(value)}
        className={cn(
          "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
          className
        )}
      >
        {context.value === value && (
          <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
            ✓
          </span>
        )}
        {children}
      </div>
    );
  }
);
SelectItem.displayName = "SelectItem";

interface SelectLabelProps {
  children: React.ReactNode;
  className?: string;
}

const SelectLabel = React.forwardRef<HTMLDivElement, SelectLabelProps>(
  ({ children, className }, ref) => (
    <div
      ref={ref}
      className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    >
      {children}
    </div>
  )
);
SelectLabel.displayName = "SelectLabel";

interface SelectSeparatorProps {
  className?: string;
}

const SelectSeparator = React.forwardRef<HTMLDivElement, SelectSeparatorProps>(
  ({ className }, ref) => (
    <div
      ref={ref}
      className={cn("-mx-1 my-1 h-px bg-muted", className)}
    />
  )
);
SelectSeparator.displayName = "SelectSeparator";

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectSeparator,
};