import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/shared/hooks/use-auth";
import { useToast } from "@/shared/hooks/use-toast";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/shared/components/ui/dialog";
import { Badge } from "@/shared/components/ui/badge";
import { ArrowLeft, Check, Loader2, Clock, CheckCircle } from "lucide-react";
import type { Fighter } from "@/shared/types/fighter";

interface EventData {
  id: string;
  name: string;
  date: string;
  venue: string;
  city: string;
  status: string;
}

interface FightWithResult {
  id: string;
  eventId: string;
  fighter1Id: string;
  fighter2Id: string;
  cardPlacement: string;
  boutOrder: number;
  weightClass: string;
  isTitleFight: boolean;
  rounds: number;
  status: string;
  result: {
    winnerId: string | null;
    method: string | null;
    round: number | null;
    time: string | null;
    referee: string | null;
  } | null;
}

interface FinalizeFormData {
  winnerId: string;
  method: string;
  methodDetail: string;
  round: string;
  time: string;
  referee: string;
}

const METHODS = [
  { value: "KO", label: "KO" },
  { value: "TKO", label: "TKO" },
  { value: "Submission", label: "Submission" },
  { value: "Decision - Unanimous", label: "Decision (Unanimous)" },
  { value: "Decision - Split", label: "Decision (Split)" },
  { value: "Decision - Majority", label: "Decision (Majority)" },
  { value: "No Contest", label: "No Contest" },
  { value: "Draw", label: "Draw" },
  { value: "DQ", label: "Disqualification" },
];

export default function AdminFightCards() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedFight, setSelectedFight] = useState<FightWithResult | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [formData, setFormData] = useState<FinalizeFormData>({
    winnerId: "",
    method: "",
    methodDetail: "",
    round: "",
    time: "",
    referee: "",
  });

  // Fetch events
  const { data: events, isLoading: eventsLoading } = useQuery<EventData[]>({
    queryKey: ["/api/events"],
  });

  // Fetch admin fights
  const { data: fights, isLoading: fightsLoading } = useQuery<FightWithResult[]>({
    queryKey: ["/api/admin/fights"],
    enabled: !!user,
  });

  // Fetch fighters for display
  const { data: fighters } = useQuery<Fighter[]>({
    queryKey: ["/api/fighters"],
  });

  // Submit fight result
  const finalizeMutation = useMutation({
    mutationFn: async ({ fightId, data }: { fightId: string; data: FinalizeFormData }) => {
      // Handle draw/no contest - send the string as-is, backend handles it
      const isDrawOrNC = data.winnerId === "draw";
      
      const response = await fetch(`/api/fights/${fightId}/result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          winnerId: isDrawOrNC ? "draw" : (data.winnerId || null),
          method: data.method || null,
          methodDetail: data.methodDetail || null,
          round: data.round ? parseInt(data.round) : null,
          time: data.time || null,
          referee: data.referee || null,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to finalize fight");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/fights"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
      toast({ title: "Fight finalized", description: "Results saved and points calculated." });
      setSelectedFight(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const getFighter = (id: string) => fighters?.find(f => f.id === id);

  const openFinalizeDialog = (fight: FightWithResult, event: EventData) => {
    setSelectedFight(fight);
    setSelectedEvent(event);
    setFormData({
      winnerId: fight.result?.winnerId || "",
      method: fight.result?.method || "",
      methodDetail: "",
      round: fight.result?.round?.toString() || "",
      time: fight.result?.time || "",
      referee: fight.result?.referee || "",
    });
  };

  const handleFinalize = () => {
    if (!selectedFight) return;
    finalizeMutation.mutate({ fightId: selectedFight.id, data: formData });
  };

  // Check admin access
  const isAdmin = (user as any)?.role === "admin";

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-500">Access Denied</CardTitle>
            <CardDescription>You need admin privileges to access this page.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/">
              <Button>Go Back</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fightsLoaded = !fightsLoading && !eventsLoading && fights && events;

  // Group fights by event
  const fightsByEvent = fightsLoaded
    ? events.reduce((acc, event) => {
        const eventFights = fights.filter(f => f.eventId === event.id);
        if (eventFights.length > 0) {
          acc[event.id] = { event, fights: eventFights };
        }
        return acc;
      }, {} as Record<string, { event: EventData; fights: FightWithResult[] }>)
    : {};

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Fight Card Management</h1>
            <p className="text-muted-foreground">Finalize fights and enter results</p>
          </div>
        </div>

        {fightsLoading || eventsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : Object.keys(fightsByEvent).length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No fight cards found. Create an event first.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.values(fightsByEvent).map(({ event, fights }) => (
              <Card key={event.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{event.name}</CardTitle>
                      <CardDescription>
                        {new Date(event.date).toLocaleDateString()} - {event.venue}, {event.city}
                      </CardDescription>
                    </div>
                    <Badge variant={event.status === "Completed" ? "default" : "secondary"}>
                      {event.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {fights
                      .sort((a, b) => a.boutOrder - b.boutOrder)
                      .map((fight) => {
                        const fighter1 = getFighter(fight.fighter1Id);
                        const fighter2 = getFighter(fight.fighter2Id);
                        const isCompleted = fight.status === "Completed" || fight.result;

                        return (
                          <div
                            key={fight.id}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              isCompleted ? "bg-green-500/5 border-green-500/20" : "bg-muted/50"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {isCompleted ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              ) : (
                                <Clock className="w-5 h-5 text-muted-foreground" />
                              )}
                              <div>
                                <div className="font-medium">
                                  {fighter1 ? `${fighter1.firstName} ${fighter1.lastName}` : "TBD"} 
                                  {" vs "}
                                  {fighter2 ? `${fighter2.firstName} ${fighter2.lastName}` : "TBD"}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {fight.weightClass} - {fight.cardPlacement}
                                  {fight.isTitleFight && " (Title Fight)"}
                                </div>
                                {fight.result && (
                                  <div className="text-sm text-green-500">
                                    Winner: {getFighter(fight.result.winnerId || "")?.lastName || "TBD"} 
                                    {fight.result.method && ` by ${fight.result.method}`}
                                    {fight.result.round && ` R${fight.result.round}`}
                                  </div>
                                )}
                              </div>
                            </div>
                            <Button
                              variant={isCompleted ? "outline" : "default"}
                              size="sm"
                              onClick={() => openFinalizeDialog(fight, event)}
                              data-testid={`button-finalize-${fight.id}`}
                            >
                              {isCompleted ? "Edit Result" : "Finalize"}
                            </Button>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={!!selectedFight} onOpenChange={(open) => !open && setSelectedFight(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Finalize Fight Result</DialogTitle>
              <DialogDescription>
                {selectedFight && selectedEvent && (
                  <>
                    {getFighter(selectedFight.fighter1Id)?.lastName} vs{" "}
                    {getFighter(selectedFight.fighter2Id)?.lastName} - {selectedEvent.name}
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Winner</Label>
                <Select value={formData.winnerId} onValueChange={(v) => setFormData(d => ({ ...d, winnerId: v }))}>
                  <SelectTrigger data-testid="select-winner">
                    <SelectValue placeholder="Select winner" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedFight && (
                      <>
                        <SelectItem value={selectedFight.fighter1Id}>
                          {getFighter(selectedFight.fighter1Id)?.firstName}{" "}
                          {getFighter(selectedFight.fighter1Id)?.lastName}
                        </SelectItem>
                        <SelectItem value={selectedFight.fighter2Id}>
                          {getFighter(selectedFight.fighter2Id)?.firstName}{" "}
                          {getFighter(selectedFight.fighter2Id)?.lastName}
                        </SelectItem>
                        <SelectItem value="draw">Draw / No Contest</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Method</Label>
                <Select value={formData.method} onValueChange={(v) => setFormData(d => ({ ...d, method: v }))}>
                  <SelectTrigger data-testid="select-method">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    {METHODS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Round</Label>
                  <Select value={formData.round} onValueChange={(v) => setFormData(d => ({ ...d, round: v }))}>
                    <SelectTrigger data-testid="select-round">
                      <SelectValue placeholder="Round" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((r) => (
                        <SelectItem key={r} value={r.toString()}>Round {r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input
                    value={formData.time}
                    onChange={(e) => setFormData(d => ({ ...d, time: e.target.value }))}
                    placeholder="4:32"
                    data-testid="input-time"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Referee</Label>
                <Input
                  value={formData.referee}
                  onChange={(e) => setFormData(d => ({ ...d, referee: e.target.value }))}
                  placeholder="Herb Dean"
                  data-testid="input-referee"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedFight(null)}>
                Cancel
              </Button>
              <Button 
                onClick={handleFinalize}
                disabled={finalizeMutation.isPending}
                data-testid="button-save-result"
              >
                {finalizeMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Save Result
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
