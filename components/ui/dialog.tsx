"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface DialogContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextValue | undefined>(undefined);

interface DialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const Dialog: React.FC<DialogProps> = ({ children, open = false, onOpenChange }) => {
  const [internalOpen, setInternalOpen] = React.useState(open);
  
  const isControlled = onOpenChange !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setOpen = isControlled ? onOpenChange : setInternalOpen;
  
  return (
    <DialogContext.Provider value={{ open: isOpen, setOpen }}>
      {children}
    </DialogContext.Provider>
  );
};

interface DialogTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

const DialogTrigger: React.FC<DialogTriggerProps> = ({ children }) => {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error("DialogTrigger must be used within a Dialog component");
  }
  
  return (
    <div onClick={() => context.setOpen(true)}>
      {children}
    </div>
  );
};

interface DialogOverlayProps {
  className?: string;
}

const DialogOverlay = React.forwardRef<HTMLDivElement, DialogOverlayProps>(
  ({ className }, ref) => (
    <div
      ref={ref}
      className={cn(
        "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className
      )}
    />
  )
);
DialogOverlay.displayName = "DialogOverlay";

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ children, className }, ref) => {
    const context = React.useContext(DialogContext);
    if (!context) {
      throw new Error("DialogContent must be used within a Dialog component");
    }
    
    if (!context.open) {
      return null;
    }
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <DialogOverlay onClick={() => context.setOpen(false)} />
        <div
          ref={ref}
          className={cn(
            "relative z-50 grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
            className
          )}
        >
          {children}
        </div>
      </div>
    );
  }
);
DialogContent.displayName = "DialogContent";

interface DialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

const DialogHeader: React.FC<DialogHeaderProps> = ({ children, className }) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}>
    {children}
  </div>
);

interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

const DialogTitle = React.forwardRef<HTMLHeadingElement, DialogTitleProps>(
  ({ children, className }, ref) => (
    <h2
      ref={ref}
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    >
      {children}
    </h2>
  )
);
DialogTitle.displayName = "DialogTitle";

interface DialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

const DialogDescription = React.forwardRef<HTMLParagraphElement, DialogDescriptionProps>(
  ({ children, className }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
    >
      {children}
    </p>
  )
);
DialogDescription.displayName = "DialogDescription";

interface DialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

const DialogFooter: React.FC<DialogFooterProps> = ({ children, className }) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}>
    {children}
  </div>
);

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogOverlay,
};