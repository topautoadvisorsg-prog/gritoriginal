import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * GRIT-branded toast. Glass surface + premium shadow + branded success/error.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "dark" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      richColors={false}
      closeButton
      toastOptions={{
        classNames: {
          // Base toast: glass surface, layered shadow, subtle inner highlight
          toast: [
            "group toast",
            "group-[.toaster]:bg-card/85 group-[.toaster]:backdrop-blur-xl",
            "group-[.toaster]:text-foreground",
            "group-[.toaster]:border group-[.toaster]:border-border/60",
            "group-[.toaster]:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.04)]",
            "group-[.toaster]:rounded-xl",
          ].join(" "),
          title: "group-[.toast]:font-semibold group-[.toast]:tracking-tight",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-xs",
          actionButton: [
            "group-[.toast]:bg-[#E8A020]",
            "group-[.toast]:text-black",
            "group-[.toast]:font-bold",
            "group-[.toast]:rounded-lg",
          ].join(" "),
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-lg",
          closeButton: [
            "group-[.toast]:bg-transparent",
            "group-[.toast]:border group-[.toast]:border-border/40",
            "group-[.toast]:text-muted-foreground",
            "group-[.toast]:hover:bg-card",
          ].join(" "),
          // Variant accent colors — left-border + tinted background
          success: [
            "group-[.toaster]:border-l-4 group-[.toaster]:border-l-[hsl(142_71%_45%)]",
            "group-[.toaster]:bg-[hsl(142_71%_45%/0.08)]",
          ].join(" "),
          error: [
            "group-[.toaster]:border-l-4 group-[.toaster]:border-l-[hsl(355_85%_55%)]",
            "group-[.toaster]:bg-[hsl(355_85%_55%/0.08)]",
          ].join(" "),
          warning: [
            "group-[.toaster]:border-l-4 group-[.toaster]:border-l-[hsl(38_92%_55%)]",
            "group-[.toaster]:bg-[hsl(38_92%_55%/0.08)]",
          ].join(" "),
          info: [
            "group-[.toaster]:border-l-4 group-[.toaster]:border-l-[hsl(190_90%_55%)]",
            "group-[.toaster]:bg-[hsl(190_90%_55%/0.08)]",
          ].join(" "),
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
