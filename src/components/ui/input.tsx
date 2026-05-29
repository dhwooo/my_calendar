import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      "flex h-9 w-full rounded-lg bg-bg-subtle px-3 py-1 text-sm",
      "hairline placeholder:text-fg-subtle",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/30",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[80px] w-full rounded-lg bg-bg-subtle px-3 py-2 text-sm",
      "hairline placeholder:text-fg-subtle",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/30",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
