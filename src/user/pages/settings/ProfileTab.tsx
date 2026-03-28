import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { COUNTRIES } from "@/shared/lib/countries";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Loader2, Check, X } from "lucide-react";

interface ProfileTabProps {
  username: string;
  setUsername: (value: string) => void;
  usernameError: string;
  checkUsernameMutation: { isPending: boolean };
  bio: string;
  setBio: (value: string) => void;
  style: string;
  setStyle: (value: string) => void;
  socialLinks: { twitter: string; instagram: string; tiktok: string };
  setSocialLinks: React.Dispatch<React.SetStateAction<{ twitter: string; instagram: string; tiktok: string }>>;
  country: string;
  setCountry: (value: string) => void;
}

export function ProfileTab({
  username,
  setUsername,
  usernameError,
  checkUsernameMutation,
  bio,
  setBio,
  style,
  setStyle,
  socialLinks,
  setSocialLinks,
  country,
  setCountry,
}: ProfileTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>Update your username and social links</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <div className="relative">
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              data-testid="input-username"
            />
            {username.length >= 3 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {checkUsernameMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                ) : usernameError ? (
                  <X className="w-4 h-4 text-red-500" />
                ) : (
                  <Check className="w-4 h-4 text-green-500" />
                )}
              </div>
            )}
          </div>
          {usernameError && (
            <p className="text-sm text-red-500">{usernameError}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="style">Fighting Style</Label>
          <select
            id="style"
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
          >
            <option value="">Select a style</option>
            <option value="Striker">Striker</option>
            <option value="Grappler">Grappler</option>
            <option value="Wrestler">Wrestler</option>
            <option value="Jiu-Jitsu">Jiu-Jitsu</option>
            <option value="Kickboxer">Kickboxer</option>
            <option value="Muay Thai">Muay Thai</option>
            <option value="Karate">Karate</option>
            <option value="Balanced">Balanced</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <select
            id="country"
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            <option value="">Select your country</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.name}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            placeholder="Tell us about yourself..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="twitter">Twitter/X URL</Label>
          <Input
            id="twitter"
            value={socialLinks.twitter}
            onChange={(e) => setSocialLinks(s => ({ ...s, twitter: e.target.value }))}
            placeholder="https://twitter.com/username"
            data-testid="input-twitter"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="instagram">Instagram URL</Label>
          <Input
            id="instagram"
            value={socialLinks.instagram}
            onChange={(e) => setSocialLinks(s => ({ ...s, instagram: e.target.value }))}
            placeholder="https://instagram.com/username"
            data-testid="input-instagram"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tiktok">TikTok URL</Label>
          <Input
            id="tiktok"
            value={socialLinks.tiktok}
            onChange={(e) => setSocialLinks(s => ({ ...s, tiktok: e.target.value }))}
            placeholder="https://tiktok.com/@username"
            data-testid="input-tiktok"
          />
        </div>
      </CardContent>
    </Card>
  );
}
