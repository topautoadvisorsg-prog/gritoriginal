import * as React from "react";

import { cn } from "@/shared/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // base
          "flex h-10 w-full rounded-lg px-3 py-2 text-base md:text-sm",
          // surface — subtle inset for depth
          "bg-[hsl(220_25%_8%)] border border-input/80",
          "shadow-[inset_0_1px_0_rgba(0,0,0,0.4)]",
          // text + placeholder
          "text-foreground placeholder:text-muted-foreground/70",
          // file input button
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          // focus — refined branded ring (overrides global focus-visible)
          "outline-none transition-colors duration-150",
          "focus-visible:outline-none focus-visible:border-[hsl(190_90%_55%/0.6)]",
          "focus-visible:ring-[3px] focus-visible:ring-[hsl(190_90%_55%/0.15)]",
          // hover
          "hover:border-input",
          // disabled
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
