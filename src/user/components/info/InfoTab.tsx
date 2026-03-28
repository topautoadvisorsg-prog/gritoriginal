
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import {
    HelpCircle,
    TrendingUp,
    Award,
    ShieldCheck,
    BadgeCheck,
    AlertTriangle,
    MessageSquare,
    LayoutDashboard,
    User,
    Trophy
} from "lucide-react";
import { Button } from '@/shared/components/ui/button';

export const InfoTab = () => {
    return (
        <div className="h-full flex flex-col gap-6 p-4 md:p-6 animate-fade-in max-w-7xl mx-auto w-full">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-display uppercase tracking-wide">App Guide & Information</h1>
                <p className="text-muted-foreground">Master the mechanics of Main MA League.</p>
            </div>

            <Tabs defaultValue="picks" className="w-full flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-[600px] mb-4">
                    <TabsTrigger value="picks">Picks & Odds</TabsTrigger>
                    <TabsTrigger value="badges">Badges</TabsTrigger>
                    <TabsTrigger value="guide">General Guide</TabsTrigger>
                    <TabsTrigger value="reporting">Reporting</TabsTrigger>
                </TabsList>

                <ScrollArea className="flex-1 w-full rounded-md border p-4 bg-background/50 h-[calc(100vh-250px)]">
                    <TabsContent value="picks" className="mt-0 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-primary" />
                                    Fantasy Picks & Betting Odds
                                </CardTitle>
                                <CardDescription>Understanding how fantasy scoring mirrors real-world betting.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                                    <h3 className="font-semibold mb-2 text-lg">The Metric System</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        Our fantasy system uses <strong>Implied Probability</strong> derived from betting odds.
                                        Instead of generic points, you earn points based on the risk/reward of the fight.
                                    </p>
                                    <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground">
                                        <li><strong>Underdogs</strong> yield higher returns (ROI) if they win.</li>
                                        <li><strong>Favorites</strong> act as safer picks but offer lower point multipliers.</li>
                                        <li>Odds are sourced from an average of major sportsbooks and locked before the event starts.</li>
                                    </ul>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="border rounded-lg p-4">
                                        <h4 className="flex items-center justify-between font-medium mb-2">
                                            <span>Example Favorite</span>
                                            <span className="text-red-500 font-mono">-250</span>
                                        </h4>
                                        <div className="text-xs text-muted-foreground space-y-2">
                                            <p>High win probability (approx. 71%).</p>
                                            <p>Fantasy Reward: Low (Standard points)</p>
                                        </div>
                                    </div>
                                    <div className="border rounded-lg p-4">
                                        <h4 className="flex items-center justify-between font-medium mb-2">
                                            <span>Example Underdog</span>
                                            <span className="text-green-500 font-mono">+185</span>
                                        </h4>
                                        <div className="text-xs text-muted-foreground space-y-2">
                                            <p>Lower win probability (approx. 35%).</p>
                                            <p>Fantasy Reward: <strong>High</strong> (Bonus multipliers apply)</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="badges" className="mt-0 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Award className="h-5 w-5 text-yellow-500" />
                                    Badges & Progression
                                </CardTitle>
                                <CardDescription>Earn recognition for your performance and status.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {/* Verification Badge */}
                                    <div className="flex flex-col gap-2 p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className="h-6 w-6 text-green-500" />
                                            <span className="font-semibold">Verified User</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Given to verified identities and community figures. Increases trust and visibility in chat.</p>
                                    </div>

                                    {/* Premium Badges */}
                                    <div className="flex flex-col gap-2 p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <BadgeCheck className="h-6 w-6 text-purple-500" />
                                            <span className="font-semibold">Plus / Pro</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Exclusive badges for supporters. Unlocks additional analytics and removal of ads.</p>
                                    </div>

                                    {/* Influencer Badges */}
                                    <div className="flex flex-col gap-2 p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <Award className="h-6 w-6 text-orange-500" />
                                            <span className="font-semibold">Influencer</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">For recognized content creators and analysts in the MMA space.</p>
                                    </div>

                                    {/* Coming Soon */}
                                    <div className="flex flex-col gap-2 p-4 border rounded-lg border-dashed opacity-70">
                                        <div className="flex items-center gap-2">
                                            <HelpCircle className="h-6 w-6 text-muted-foreground" />
                                            <span className="font-semibold">Performance Badges</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Coming Soon: Badges for win streaks, high ROI events, and leaderboard dominance.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="guide" className="mt-0 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <HelpCircle className="h-5 w-5" />
                                    General Guide
                                </CardTitle>
                                <CardDescription>Navigating the Main MA League ecosystem.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4">
                                    <div className="flex gap-4 items-start">
                                        <div className="p-2 rounded-md bg-muted">
                                            <LayoutDashboard className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium">Dashboard</h4>
                                            <p className="text-sm text-muted-foreground">Your central hub. View live events, your current rank, signals, and quick access to active fight cards.</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 items-start">
                                        <div className="p-2 rounded-md bg-muted">
                                            <Trophy className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium">Leaderboards</h4>
                                            <p className="text-sm text-muted-foreground">Rankings are updated after every event. We track Global Ranking (All time) and Event Ranking (Specific card).</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 items-start">
                                        <div className="p-2 rounded-md bg-muted">
                                            <User className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium">Fighter Profiles</h4>
                                            <p className="text-sm text-muted-foreground">Deep dive into stats, history, and AI insights. Use the Search or Filters to find any fighter in the database.</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 items-start">
                                        <div className="p-2 rounded-md bg-muted">
                                            <MessageSquare className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium">Community Chat</h4>
                                            <p className="text-sm text-muted-foreground">Join the conversation. Check out the Global Chat or Event-specific rooms. (Respect the community guidelines!).</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="reporting" className="mt-0 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-destructive" />
                                    Reporting & Feedback
                                </CardTitle>
                                <CardDescription>Found an error? Help us keep the database accurate.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Our database is vast, and occasionally stats or records may need an update. We rely on our community to help flag inconsistencies.
                                </p>

                                <div className="p-4 border rounded-lg bg-green-500/5 border-green-500/20">
                                    <h4 className="font-semibold mb-2">How to Report</h4>
                                    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                                        <li>Navigate to the <strong>Fighter Profile</strong> page.</li>
                                        <li>Scroll to the bottom of the profile or look for the "Actions" area.</li>
                                        <li>Click the <span className="inline-flex items-center gap-1 font-medium text-foreground mx-1"><AlertTriangle className="h-3 w-3" /> Report Issue</span> button.</li>
                                        <li>Fill out the form with the correct information (Source links are helpful!).</li>
                                    </ol>
                                </div>

                                <div className="flex justify-center pt-4">
                                    <Button variant="outline" className="gap-2">
                                        <MessageSquare className="h-4 w-4" />
                                        Contact Support Directly
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </ScrollArea>
            </Tabs>
        </div>
    );
};
