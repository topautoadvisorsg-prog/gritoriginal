import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

import { cn } from "@/shared/lib/utils";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded transition-all duration-150",
      // unchecked surface
      "border border-input/80 bg-[hsl(220_25%_8%)]",
      "shadow-[inset_0_1px_0_rgba(0,0,0,0.3)]",
      "hover:border-[hsl(190_90%_55%/0.5)]",
      // checked surface — cyan with subtle glow
      "data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-[hsl(190_90%_55%)] data-[state=checked]:to-[hsl(190_90%_45%)]",
      "data-[state=checked]:border-[hsl(190_90%_55%)]",
      "data-[state=checked]:text-white",
      "data-[state=checked]:shadow-[0_0_10px_-2px_hsl(190_90%_55%/0.6)]",
      // focus + disabled
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(190_90%_55%/0.5)]",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className={cn("flex items-center justify-center text-current")}>
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
