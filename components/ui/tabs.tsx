"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

interface TabsProps {
  children: React.ReactNode;
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ children, value, onValueChange, className }, ref) => {
    return (
      <TabsContext.Provider value={{ value, onValueChange }}>
        <div ref={ref} className={cn("w-full", className)}>
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);
Tabs.displayName = "Tabs";

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ children, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
          className
        )}
      >
        {children}
      </div>
    );
  }
);
TabsList.displayName = "TabsList";

interface TabsTriggerProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ children, value, className }, ref) => {
    const context = React.useContext(TabsContext);
    if (!context) {
      throw new Error("TabsTrigger must be used within a Tabs component");
    }
    
    const isActive = context.value === value;
    
    return (
      <button
        ref={ref}
        type="button"
        onClick={() => context.onValueChange(value)}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          isActive
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:bg-background/80",
          className
        )}
      >
        {children}
      </button>
    );
  }
);
TabsTrigger.displayName = "TabsTrigger";

interface TabsContentProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ children, value, className }, ref) => {
    const context = React.useContext(TabsContext);
    if (!context) {
      throw new Error("TabsContent must be used within a Tabs component");
    }
    
    if (context.value !== value) {
      return null;
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          className
        )}
      >
        {children}
      </div>
    );
  }
);
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };