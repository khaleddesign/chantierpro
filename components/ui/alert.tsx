"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";

const alertVariants = {
  default: "bg-background text-foreground",
  destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
  success: "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200 [&>svg]:text-green-600",
  warning: "border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200 [&>svg]:text-yellow-600",
  info: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200 [&>svg]:text-blue-600",
};

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof alertVariants;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(
        "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
        alertVariants[variant],
        className
      )}
      {...props}
    />
  )
);
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

// Helper components with icons
interface AlertWithIconProps extends AlertProps {
  title?: string;
  children: React.ReactNode;
}

const AlertError: React.FC<AlertWithIconProps> = ({ title, children, ...props }) => (
  <Alert variant="destructive" {...props}>
    <AlertCircle className="h-4 w-4" />
    {title && <AlertTitle>{title}</AlertTitle>}
    <AlertDescription>{children}</AlertDescription>
  </Alert>
);

const AlertSuccess: React.FC<AlertWithIconProps> = ({ title, children, ...props }) => (
  <Alert variant="success" {...props}>
    <CheckCircle className="h-4 w-4" />
    {title && <AlertTitle>{title}</AlertTitle>}
    <AlertDescription>{children}</AlertDescription>
  </Alert>
);

const AlertWarning: React.FC<AlertWithIconProps> = ({ title, children, ...props }) => (
  <Alert variant="warning" {...props}>
    <AlertTriangle className="h-4 w-4" />
    {title && <AlertTitle>{title}</AlertTitle>}
    <AlertDescription>{children}</AlertDescription>
  </Alert>
);

const AlertInfo: React.FC<AlertWithIconProps> = ({ title, children, ...props }) => (
  <Alert variant="info" {...props}>
    <Info className="h-4 w-4" />
    {title && <AlertTitle>{title}</AlertTitle>}
    <AlertDescription>{children}</AlertDescription>
  </Alert>
);

export { 
  Alert, 
  AlertTitle, 
  AlertDescription, 
  AlertError, 
  AlertSuccess, 
  AlertWarning, 
  AlertInfo 
};