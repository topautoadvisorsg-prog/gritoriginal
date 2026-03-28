import { useGamification } from "@/shared/context/GamificationContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Switch } from "@/shared/components/ui/switch";
import { Label } from "@/shared/components/ui/label";
import { Slider } from "@/shared/components/ui/slider";
import { Sparkles, Music } from "lucide-react";

export function GamificationTab() {
  const {
    gamificationSettings,
    updateGamificationSettings,
    musicEnabled,
    toggleMusic,
    musicVolume,
    setMusicVolume
  } = useGamification();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-400" />
          Gamification Settings
        </CardTitle>
        <CardDescription>Customize your experience with sounds and celebrations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Enable Sound Effects</Label>
            <p className="text-sm text-muted-foreground">Play sounds for actions and achievements</p>
          </div>
          <Switch
            checked={gamificationSettings.enableSounds}
            onCheckedChange={(checked) => updateGamificationSettings({ enableSounds: checked })}
            data-testid="switch-sounds"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Enable Celebrations</Label>
            <p className="text-sm text-muted-foreground">Show confetti and animations for achievements</p>
          </div>
          <Switch
            checked={gamificationSettings.enableCelebrations}
            onCheckedChange={(checked) => updateGamificationSettings({ enableCelebrations: checked })}
            data-testid="switch-celebrations"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Show Streaks Publicly</Label>
            <p className="text-sm text-muted-foreground">Display your winning streaks on leaderboard</p>
          </div>
          <Switch
            checked={gamificationSettings.showStreaksPublicly}
            onCheckedChange={(checked) => updateGamificationSettings({ showStreaksPublicly: checked })}
            data-testid="switch-show-streaks"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Show Badges Publicly</Label>
            <p className="text-sm text-muted-foreground">Display your earned badges on profile</p>
          </div>
          <Switch
            checked={gamificationSettings.showBadgesPublicly}
            onCheckedChange={(checked) => updateGamificationSettings({ showBadgesPublicly: checked })}
            data-testid="switch-show-badges"
          />
        </div>

        <div className="pt-6 border-t border-border">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Music className="w-4 h-4" />
                  Background Music
                </Label>
                <p className="text-sm text-muted-foreground">Play ambient music loop</p>
              </div>
              <Switch
                checked={musicEnabled}
                onCheckedChange={toggleMusic}
                data-testid="switch-music"
              />
            </div>

            {musicEnabled && (
              <div className="space-y-2 pt-2 animate-fade-in">
                <div className="flex items-center justify-between text-sm">
                  <Label>Volume</Label>
                  <span className="text-muted-foreground">{Math.round(musicVolume * 100)}%</span>
                </div>
                <Slider
                  value={[musicVolume]}
                  onValueChange={([val]) => setMusicVolume(val)}
                  max={1}
                  step={0.1}
                  className="w-full"
                  data-testid="slider-music-volume"
                />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
