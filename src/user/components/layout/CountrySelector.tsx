import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/shared/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Globe, Languages, LogIn } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

const COUNTRIES = [
    { code: "US", name: "United States", flag: "🇺🇸" },
    { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
    { code: "BR", name: "Brazil", flag: "🇧🇷" },
    { code: "FR", name: "France", flag: "🇫🇷" },
    { code: "ES", name: "Spain", flag: "🇪🇸" },
    { code: "JP", name: "Japan", flag: "🇯🇵" },
    { code: "KR", name: "South Korea", flag: "🇰🇷" },
    { code: "RU", name: "Russia", flag: "🇷🇺" },
    { code: "MX", name: "Mexico", flag: "🇲🇽" },
    { code: "CN", name: "China", flag: "🇨🇳" },
];

const LANGUAGES = [
    { code: "en", name: "English" },
    { code: "pt", name: "Português" },
    { code: "es", name: "Español" },
    { code: "fr", name: "Français" },
    { code: "ja", name: "日本語" },
    { code: "ko", name: "한국어" },
    { code: "ru", name: "Русский" },
];

export const CountrySelector = () => {
    const { user, isAuthenticated } = useAuth();
    const queryClient = useQueryClient();
    const { i18n } = useTranslation();

    const [country, setCountry] = useState(user?.country || "United States");
    const [language, setLanguage] = useState(user?.language || "en");

    // Sync local state with user data
    useEffect(() => {
        if (user) {
            if (user.country) setCountry(user.country);
            if (user.language) {
                setLanguage(user.language);
                i18n.changeLanguage(user.language); // Sync i18n with user profile on load
            }
        }
    }, [user, i18n]);

    // Mutation to update user profile
    const updateProfile = useMutation({
        mutationFn: async (data: { country: string; language: string }) => {
            const res = await fetch("/api/me", { // Using /api/me as confirmed in userRoutes.ts
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to update profile");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
            toast.success("Preferences updated");
        },
        onError: () => toast.error("Failed to update preferences"),
    });

    const handleUpdate = (type: 'country' | 'language', value: string) => {
        if (type === 'country') setCountry(value);
        if (type === 'language') {
            setLanguage(value);
            i18n.changeLanguage(value); // Change language immediately
        }

        // Auto-save on change if logged in
        if (isAuthenticated) {
            updateProfile.mutate({
                country: type === 'country' ? value : country,
                language: type === 'language' ? value : language,
            });
        }
    };

    if (!isAuthenticated) return (
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={() => window.location.href = "/api/login"}>
            <LogIn className="w-4 h-4" />
            <span className="hidden md:inline">Log in to set preferences</span>
        </Button>
    );

    return (
        <div className="flex items-center gap-2">
            <Select value={country} onValueChange={(v) => handleUpdate('country', v)}>
                <SelectTrigger className="w-[140px] h-8 text-xs bg-muted/50 border-border/50">
                    <Globe className="w-3 h-3 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                    {COUNTRIES.map(c => (
                        <SelectItem key={c.code} value={c.name}>
                            <span className="mr-2">{c.flag}</span> {c.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={language} onValueChange={(v) => handleUpdate('language', v)}>
                <SelectTrigger className="w-[110px] h-8 text-xs bg-muted/50 border-border/50">
                    <Languages className="w-3 h-3 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                    {LANGUAGES.map(l => (
                        <SelectItem key={l.code} value={l.code}>
                            {l.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};
