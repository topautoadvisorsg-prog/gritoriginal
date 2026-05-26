import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(190_90%_55%/0.5)]",
  {
    variants: {
      variant: {
        // Brand gold pill — primary CTA / featured marker
        default:
          "border-[hsl(38_92%_55%/0.35)] bg-[hsl(38_92%_55%/0.12)] text-[hsl(38_92%_70%)] hover:bg-[hsl(38_92%_55%/0.18)]",
        // Neutral chip — meta info, counters, tags
        secondary:
          "border-border/40 bg-[hsl(220_25%_12%)] text-foreground/80 hover:bg-[hsl(220_25%_15%)]",
        // Danger / removal / loss
        destructive:
          "border-[hsl(355_85%_55%/0.4)] bg-[hsl(355_85%_55%/0.12)] text-[hsl(355_85%_72%)] hover:bg-[hsl(355_85%_55%/0.18)]",
        // Outline only — for subtle labels
        outline:
          "border-border/60 bg-transparent text-foreground/80 hover:bg-card",
        // Win / positive
        success:
          "border-[hsl(142_71%_45%/0.4)] bg-[hsl(142_71%_45%/0.12)] text-[hsl(142_71%_62%)] hover:bg-[hsl(142_71%_45%/0.18)]",
        // Live / accent (cyan)
        info:
          "border-[hsl(190_90%_55%/0.4)] bg-[hsl(190_90%_55%/0.12)] text-[hsl(190_90%_72%)] hover:bg-[hsl(190_90%_55%/0.18)]",
        // Premium / challenger
        premium:
          "border-[hsl(280_80%_65%/0.4)] bg-[hsl(280_80%_65%/0.12)] text-[hsl(280_80%_78%)] hover:bg-[hsl(280_80%_65%/0.18)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
