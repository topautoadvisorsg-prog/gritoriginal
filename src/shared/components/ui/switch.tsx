import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/shared/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200",
      // unchecked: inset dark surface (looks pressed-in)
      "data-[state=unchecked]:bg-[hsl(220_25%_10%)]",
      "data-[state=unchecked]:shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]",
      // checked: gradient gold with glow
      "data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[hsl(38_92%_55%)] data-[state=checked]:to-[hsl(38_92%_45%)]",
      "data-[state=checked]:shadow-[0_0_12px_-2px_hsl(38_92%_55%/0.6)]",
      // focus + disabled
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(190_90%_55%/0.5)] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full ring-0 transition-transform duration-200",
        "bg-white",
        "shadow-[0_2px_6px_rgba(0,0,0,0.4),inset_0_-1px_0_rgba(0,0,0,0.08)]",
        "data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
