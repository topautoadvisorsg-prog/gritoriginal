import { useState, useEffect } from "react";
import { cn } from "@/shared/lib/utils";
import { CountryFlag } from "@/shared/components/CountryFlag";
import { useAuth } from "@/shared/hooks/use-auth";
import { useToast } from "@/shared/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/shared/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { ArrowLeft, Camera, Loader2, Trophy, Bell, Sparkles, User2, BarChart3, BrainCircuit, AlertTriangle, LineChart, ImagePlus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { MyStatsTab } from "@/user/components/settings/MyStatsTab";
import type { UserProfile } from "./settings/types";
import { ProfileTab } from "./settings/ProfileTab";
import { PrivacyTab } from "./settings/PrivacyTab";
import { NotificationsTab } from "./settings/NotificationsTab";
import { GamificationTab } from "./settings/GamificationTab";
import { AccountTab } from "./settings/AccountTab";
import { TrackerTab } from "./settings/TrackerTab";
import { MySlipsTab } from "./settings/MySlipsTab";
import { normalizeCountryCode } from '@/shared/lib/countries';

function isChallenger(user: any) {
  return user?.tier === 'premium' || user?.subscriptionStatus === 'active';
}

export default function Settings() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [bio, setBio] = useState("");
  const [style, setStyle] = useState("");
  const [socialLinks, setSocialLinks] = useState({
    twitter: "",
    instagram: "",
    tiktok: "",
  });
  const [privacySettings, setPrivacySettings] = useState({
    showAvatar: true,
    showSocialLinks: true,
    showUsername: true,
  });
  const [country, setCountry] = useState("");
  const [activeTab, setActiveTab] = useState("profile");

  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ["/api/me"],
    enabled: isAuthenticated,
  });

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/me/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: "DELETE" }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete account");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Account Deleted", description: "Your account has been permanently deleted." });
      // Redirect to home/login and refresh to clear strict states
      window.location.href = "/";
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || "");
      setBio(profile.bio || "");
      setStyle(profile.style || "");
      setSocialLinks({
        twitter: profile.socialLinks?.twitter || "",
        instagram: profile.socialLinks?.instagram || "",
        tiktok: profile.socialLinks?.tiktok || "",
      });
      setPrivacySettings({
        showAvatar: profile.privacySettings?.showAvatar ?? true,
        showSocialLinks: profile.privacySettings?.showSocialLinks ?? true,
        showUsername: profile.privacySettings?.showUsername ?? true,
      });
      setCountry(normalizeCountryCode(profile.country) || "");
    }
  }, [profile]);

  const checkUsernameMutation = useMutation({
    mutationFn: async (usernameToCheck: string) => {
      const response = await fetch(`/api/users/check-username/${usernameToCheck}`);
      if (!response.ok) throw new Error("Failed to check username");
      return response.json();
    },
  });

  useEffect(() => {
    if (username.length < 3) {
      setUsernameError(username.length > 0 ? "Username must be at least 3 characters" : "");
      return;
    }
    if (username.length > 50) {
      setUsernameError("Username must be less than 50 characters");
      return;
    }

    const timer = setTimeout(async () => {
      if (username === profile?.username) {
        setUsernameError("");
        return;
      }
      try {
        const result = await checkUsernameMutation.mutateAsync(username);
        setUsernameError(result.available ? "" : "Username is already taken");
      } catch {
        setUsernameError("Error checking username");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username, profile, checkUsernameMutation]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<UserProfile>) => {
      const response = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update profile");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Profile updated", description: "Your settings have been saved." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const urlResponse = await fetch("/api/me/avatar/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ size: file.size, contentType: file.type }),
      });
      if (!urlResponse.ok) {
        const error = await urlResponse.json();
        throw new Error(error.message || "Failed to get upload URL");
      }
      const { uploadURL, objectPath } = await urlResponse.json();

      const uploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!uploadResponse.ok) throw new Error("Failed to upload file");

      const confirmResponse = await fetch("/api/me/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objectPath }),
      });
      if (!confirmResponse.ok) throw new Error("Failed to confirm upload");
      return confirmResponse.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Avatar updated", description: "Your profile picture has been updated." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Error", description: "Image must be less than 2MB", variant: "destructive" });
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast({ title: "Error", description: "Only JPG, PNG, and WebP are allowed", variant: "destructive" });
      return;
    }

    uploadAvatarMutation.mutate(file);
  };

  const handleSaveProfile = () => {
    if (usernameError) {
      toast({ title: "Error", description: usernameError, variant: "destructive" });
      return;
    }

    updateProfileMutation.mutate({
      username: username || undefined,
      bio,
      style,
      socialLinks,
      privacySettings,
      country,
    });
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/");
    }
  }, [authLoading, isAuthenticated, navigate]);

  if (authLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  if (!profile) return null;

  const avatarUrl = profile.avatarUrl || profile.profileImageUrl;
  const displayName = profile.username || `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || "User";

  return (
    <div className="min-h-screen bg-background p-4 pb-28 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/">
            <Button variant="ghost" size="icon" aria-label="Back" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        <Card className="mb-6">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="relative group">
                <Avatar className="w-16 h-16 sm:w-24 sm:h-24 border-2 border-white/10 group-hover:border-[#E8A020]/50 transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.4)]">
                  <AvatarImage src={avatarUrl || undefined} alt={displayName} className="object-cover" />
                  <AvatarFallback className="text-3xl font-black bg-[#0a0a0a] text-[#E8A020] border border-[#E8A020]/20 display-font italic">
                    {displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <label
                  className={cn(
                    "absolute inset-0 flex items-center justify-center bg-black/60 rounded-full cursor-pointer",
                    "opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[2px]",
                    uploadAvatarMutation.isPending && "opacity-100 bg-black/40"
                  )}
                  data-testid="button-upload-avatar"
                >
                  {uploadAvatarMutation.isPending ? (
                    <Loader2 className="w-6 h-6 animate-spin text-[#E8A020]" />
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <Camera className="w-6 h-6 text-white" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-white/80">Edit</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                    disabled={uploadAvatarMutation.isPending}
                  />
                </label>
                
                {/* Glow ring around avatar on hover */}
                <div className="absolute -inset-1 rounded-full border border-[#E8A020]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none blur-sm" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="min-w-0 break-all text-base leading-tight sm:text-2xl display-font italic tracking-tight">{displayName}</CardTitle>
                  <CountryFlag country={profile.country} className="shrink-0 text-xl" />
                </div>
                <CardDescription className="break-all text-sm leading-relaxed text-white/40 font-medium">{profile.email}</CardDescription>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                    <Trophy className="w-3.5 h-3.5 text-[#E8A020]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{profile.totalPoints} <span className="text-[#E8A020]/60">PTS</span></span>
                  </div>
                  {profile.aiPreferences?.enabled && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-[#7C3AED]/10 rounded-full border border-[#7C3AED]/30">
                      <BrainCircuit className="w-3.5 h-3.5 text-[#7C3AED]" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#7C3AED]">AI ACTIVE</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="md:hidden">
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="h-11 w-full" aria-label="Settings section">
                <SelectValue placeholder="Choose a settings section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="profile">Profile</SelectItem>
                <SelectItem value="my-stats">My Stats</SelectItem>
                <SelectItem value="privacy">Privacy</SelectItem>
                <SelectItem value="tracker">Real Tracker</SelectItem>
                <SelectItem value="notifications">Notifications</SelectItem>
                <SelectItem value="gamification">Gamification</SelectItem>
                {isChallenger(user) && <SelectItem value="my-slips">My Slips</SelectItem>}
                <SelectItem value="account">Account</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="hidden w-full overflow-x-auto pb-1 md:block">
          <TabsList className={`grid min-w-[760px] w-full ${isChallenger(user) ? 'grid-cols-8' : 'grid-cols-7'}`}>
            <TabsTrigger value="profile" data-testid="tab-profile">Profile</TabsTrigger>
            <TabsTrigger value="my-stats" data-testid="tab-my-stats">
              <BarChart3 className="w-4 h-4 mr-1" />
              My Stats
            </TabsTrigger>
            <TabsTrigger value="privacy" data-testid="tab-privacy">Privacy</TabsTrigger>
            <TabsTrigger value="tracker" data-testid="tab-tracker">
              <LineChart className="w-4 h-4 mr-1" />
              Real Tracker
            </TabsTrigger>
            <TabsTrigger value="notifications" data-testid="tab-notifications">
              <Bell className="w-4 h-4 mr-1" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="gamification" data-testid="tab-gamification">
              <Sparkles className="w-4 h-4 mr-1" />
              Gamification
            </TabsTrigger>
            {isChallenger(user) && (
              <TabsTrigger value="my-slips" data-testid="tab-my-slips">
                <ImagePlus className="w-4 h-4 mr-1" />
                My Slips
              </TabsTrigger>
            )}
            <TabsTrigger value="account" data-testid="tab-account">
              <User2 className="w-4 h-4 mr-1" />
              Account
            </TabsTrigger>
          </TabsList>
          </div>

          <TabsContent value="profile">
            <ProfileTab
              username={username}
              setUsername={setUsername}
              usernameError={usernameError}
              checkUsernameMutation={checkUsernameMutation}
              bio={bio}
              setBio={setBio}
              style={style}
              setStyle={setStyle}
              socialLinks={socialLinks}
              setSocialLinks={setSocialLinks}
              country={country}
              setCountry={setCountry}
            />
          </TabsContent>

          <TabsContent value="my-stats">
            <MyStatsTab />
          </TabsContent>

          <TabsContent value="privacy">
            <PrivacyTab
              privacySettings={privacySettings}
              setPrivacySettings={setPrivacySettings}
            />
          </TabsContent>

          <TabsContent value="tracker">
            <TrackerTab />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationsTab />
          </TabsContent>

          <TabsContent value="gamification">
            <GamificationTab />
          </TabsContent>

          {isChallenger(user) && (
            <TabsContent value="my-slips">
              <MySlipsTab />
            </TabsContent>
          )}

          <TabsContent value="account">
            <AccountTab
              profile={profile}
              onDeleteAccount={() => {
                setIsDeleteDialogOpen(true);
                setDeleteConfirmation("");
              }}
            />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveProfile}
            disabled={updateProfileMutation.isPending || !!usernameError}
            data-testid="button-save"
          >
            {updateProfileMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Save Changes
          </Button>
        </div>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-background border-border overflow-hidden">
          {/* Subtle dark arena backdrop feel */}
          <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 to-transparent pointer-events-none" />
          
          <DialogHeader className="relative z-10">
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription className="text-foreground pt-2">
              <span className="text-destructive font-bold">This action is permanent and cannot be undone.</span> GRIT will delete your active account and picks. Records that must be retained for security, legal, or financial reconciliation may be preserved under the applicable retention policy.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 relative z-10">
            <div className="space-y-2">
              <label htmlFor="confirmation" className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-[10px]">
                Type DELETE to confirm
              </label>
              <Input
                id="confirmation"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value.toUpperCase())}
                placeholder="DELETE"
                className="focus-visible:ring-destructive focus-visible:border-destructive uppercase bg-muted/50 transition-colors"
                autoComplete="off"
              />
            </div>
          </div>

          <DialogFooter className="relative z-10">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleteAccountMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteAccountMutation.mutate()}
              disabled={deleteConfirmation !== "DELETE" || deleteAccountMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white font-bold tracking-wide"
            >
              {deleteAccountMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              PERMANENTLY DELETE ACCOUNT
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
