import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Switch } from "@/shared/components/ui/switch";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { useToast } from "@/shared/hooks/use-toast";
import { LineChart, Loader2 } from "lucide-react";

export function TrackerTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Local state for the input
  const [unitSizeInput, setUnitSizeInput] = useState<string>("0");

  interface SettingsData {
    showBettingTracker: boolean;
    unitSize: number;
  }

  const { data: settings, isLoading } = useQuery<SettingsData>({
    queryKey: ["/api/me/settings"],
  });

  useEffect(() => {
    if (settings) {
      setUnitSizeInput(settings.unitSize?.toString() || "0");
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: { showBettingTracker?: boolean; unitSize?: number }) => {
      const response = await fetch("/api/me/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update settings");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/me/stats"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update tracking settings.", variant: "destructive" });
    }
  });

  const handleToggle = (checked: boolean) => {
    updateSettingsMutation.mutate({ showBettingTracker: checked });
    toast({
      title: checked ? "Tracker Enabled" : "Tracker Disabled",
      description: checked ? "Real stats widget will now appear on your dashboard." : "Real stats widget hidden.",
    });
  };

  const handleSaveUnitSize = () => {
    const val = parseInt(unitSizeInput, 10);
    if (isNaN(val) || val < 0) {
      toast({ title: "Invalid Input", description: "Unit size must be a positive number.", variant: "destructive" });
      return;
    }
    updateSettingsMutation.mutate({ unitSize: val });
    toast({
      title: "Unit Size Saved",
      description: `Your unit size has been updated to $${val}.`,
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const isEnabled = settings?.showBettingTracker ?? false;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LineChart className="w-5 h-5 text-green-500" />
          Real Betting Tracker
        </CardTitle>
        <CardDescription>
          A totally private tool to calculate your real money performance based on your fantasy picks. 
          This data is not shared on any leaderboards or public profiles.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
          <div className="space-y-0.5">
            <Label className="text-base">Enable Real Tracker</Label>
            <p className="text-sm text-muted-foreground">Show your real dollar stats explicitly on the Dashboard</p>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={handleToggle}
            data-testid="switch-betting-tracker"
            disabled={updateSettingsMutation.isPending}
          />
        </div>

        {isEnabled && (
          <div className="p-4 bg-muted/30 rounded-lg border border-border space-y-4 animate-fade-in">
            <div className="space-y-1">
              <Label className="text-base text-primary">Unit Size ($)</Label>
              <p className="text-sm text-muted-foreground">
                Set your standard bet amount per unit. For example, if you bet $100 per unit, enter 100.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative max-w-[200px]">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">$</span>
                <Input 
                  type="number"
                  min="0"
                  step="1"
                  className="pl-7 font-bold text-lg h-12"
                  value={unitSizeInput}
                  onChange={(e) => setUnitSizeInput(e.target.value)}
                  placeholder="100"
                />
              </div>
              <Button 
                onClick={handleSaveUnitSize} 
                disabled={
                  updateSettingsMutation.isPending || 
                  unitSizeInput === "" || 
                  parseInt(unitSizeInput, 10) === settings?.unitSize
                }
                className="h-12 px-6"
              >
                {updateSettingsMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Save
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
