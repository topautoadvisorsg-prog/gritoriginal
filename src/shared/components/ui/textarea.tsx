import * as React from "react";

import { cn } from "@/shared/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-lg px-3 py-2 text-sm",
        "bg-[hsl(220_25%_8%)] border border-input/80",
        "shadow-[inset_0_1px_0_rgba(0,0,0,0.4)]",
        "text-foreground placeholder:text-muted-foreground/70",
        "outline-none transition-colors duration-150",
        "focus-visible:outline-none focus-visible:border-[hsl(190_90%_55%/0.6)]",
        "focus-visible:ring-[3px] focus-visible:ring-[hsl(190_90%_55%/0.15)]",
        "hover:border-input",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "resize-y",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
