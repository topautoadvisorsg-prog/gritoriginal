import {
  Bell,
  Bot,
  CircleDollarSign,
  Flag,
  KeyRound,
  MessageSquare,
  Radio,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Star,
  Ticket,
  Trophy,
  Users,
} from "lucide-react";

export type RuleTone = "red" | "gold" | "cyan" | "green" | "purple";

export interface RuleItem {
  label: string;
  value: string;
}

export interface RuleSection {
  id: string;
  title: string;
  kicker: string;
  summary: string;
  tone: RuleTone;
  icon: typeof Trophy;
  items: RuleItem[];
}

export const participationRows = [
  { cardSize: "17 fights", minimumPicks: "13 picks", flagBudget: "4 flags" },
  { cardSize: "16 fights", minimumPicks: "12 picks", flagBudget: "4 flags" },
  { cardSize: "15 fights", minimumPicks: "11 picks", flagBudget: "4 flags" },
  { cardSize: "14 fights", minimumPicks: "11 picks", flagBudget: "3 flags" },
  { cardSize: "13 fights", minimumPicks: "10 picks", flagBudget: "3 flags" },
  { cardSize: "12 fights", minimumPicks: "9 picks", flagBudget: "3 flags" },
  { cardSize: "11 fights", minimumPicks: "8 picks", flagBudget: "3 flags" },
  { cardSize: "10 fights", minimumPicks: "8 picks", flagBudget: "2 flags" },
];

export const flagRows = [
  {
    label: "No flag",
    meaning: "Standard pick",
    result: "Counts for rankings, stars, and key eligibility.",
    tone: "green" as const,
  },
  {
    label: "Green",
    meaning: "High confidence",
    result: "Counts the same as no flag and does not use the flag budget.",
    tone: "green" as const,
  },
  {
    label: "Yellow",
    meaning: "Low confidence",
    result: "Still counts for rankings and stars, but uses the flag budget and is excluded from key eligibility.",
    tone: "gold" as const,
  },
  {
    label: "Red",
    meaning: "Off record",
    result: "Excluded from rankings and stars. Uses the flag budget.",
    tone: "red" as const,
  },
];

export const rulesSections: RuleSection[] = [
  {
    id: "picks",
    title: "Picks",
    kicker: "What Counts",
    summary: "Moneyline picks decide rankings. Method and round picks are deeper predictions for the card experience.",
    tone: "red",
    icon: Trophy,
    items: [
      { label: "Moneyline", value: "Pick the fighter who wins. This is the scoring pick." },
      { label: "Method", value: "KO/TKO, submission, or decision. Tracked separately from ranking." },
      { label: "Round", value: "Optional precision call for how the fight ends." },
    ],
  },
  {
    id: "odds",
    title: "Odds and Units",
    kicker: "American Odds Math",
    summary: "GRIT uses real moneyline odds to calculate net units, but users never place wagers in the app.",
    tone: "red",
    icon: CircleDollarSign,
    items: [
      { label: "+150 underdog win", value: "Profit is +1.5 units on a 1-unit pick." },
      { label: "-200 favorite win", value: "Profit is +0.5 units on a 1-unit pick." },
      { label: "Any loss", value: "Loss is -1 unit. Net units sort the leaderboard." },
    ],
  },
  {
    id: "participation",
    title: "Participation",
    kicker: "Fixed Card Table",
    summary: "Every event has a minimum pick count. Miss it and the event does not move stars or rankings.",
    tone: "red",
    icon: ShieldCheck,
    items: [
      { label: "No percentage formula", value: "Fixed card sizes replace the old 70% rule." },
      { label: "Voids recompute", value: "Canceled fights lower the effective card size and qualification requirement." },
      { label: "Live banner", value: "Fight cards show how many more picks are needed to qualify." },
    ],
  },
  {
    id: "stars",
    title: "Stars and Badges",
    kicker: "Progression",
    summary: "Positive events build stars. Five stars convert into the next badge tier on the ladder.",
    tone: "gold",
    icon: Star,
    items: [
      { label: "Positive ROI", value: "+1 star up to 15% ROI, +2 stars above 15% ROI." },
      { label: "Tolerance zone", value: "Losing 0 to 1 unit is neutral. No star lost." },
      { label: "Badge tiers", value: "Ninja, Samurai, Master, Grandmaster, GOAT." },
      { label: "Floor", value: "Progression never drops below zero stars and zero badges." },
    ],
  },
  {
    id: "keys",
    title: "Keys",
    kicker: "Perfect Cards",
    summary: "Keys reward clean perfect cards and feed the Gold Key prize cycle.",
    tone: "gold",
    icon: KeyRound,
    items: [
      { label: "Eligibility", value: "Every no-flag and green-flag moneyline pick must be correct." },
      { label: "Excluded picks", value: "Yellow and red flags are removed from key eligibility." },
      { label: "Prize rule", value: "1 key = $100. 5 keys unlock Gold Key and a $1,000 prize cycle." },
    ],
  },
  {
    id: "founder",
    title: "Founder Badges",
    kicker: "Limited Slots",
    summary: "Founder badges are permanent status badges for the earliest subscribers. Slots never reopen.",
    tone: "gold",
    icon: Sparkles,
    items: [
      { label: "Founder I", value: "First 10 subscribers." },
      { label: "Founder II", value: "First 50 subscribers." },
      { label: "Founder III", value: "First 500 subscribers." },
      { label: "Founder IV", value: "First 1,000 subscribers." },
    ],
  },
  {
    id: "monthly-bonus",
    title: "Monthly Bonus",
    kicker: "$550 Pool",
    summary: "Monthly prizes reward both top ROI performance and qualified community participation.",
    tone: "gold",
    icon: Trophy,
    items: [
      { label: "ROI winners", value: "1st: $300, 2nd: $100, 3rd: $50." },
      { label: "Random winners", value: "Two random qualified Challengers win $50 each." },
      { label: "Eligibility", value: "ROI race requires 2+ qualified events. Random draw requires 1." },
    ],
  },
  {
    id: "raffle",
    title: "Raffle",
    kicker: "Event Prize",
    summary: "Subscribers become eligible for automatic event raffle entries after their first subscriber month.",
    tone: "cyan",
    icon: Ticket,
    items: [
      { label: "Pool", value: "$0.50 per subscriber per event." },
      { label: "Month 1", value: "Recognized, but not entered into the raffle." },
      { label: "Month 2+", value: "Automatic entry every event while subscribed." },
    ],
  },
  {
    id: "creator",
    title: "Creator Economy",
    kicker: "Paid Expertise",
    summary: "Creators can earn from subscriptions, donations, and 1-on-1 text sessions once eligible.",
    tone: "cyan",
    icon: Users,
    items: [
      { label: "Creator status", value: "Creator is a role, not a user tier." },
      { label: "Sessions", value: "Stripe escrow, default 30 minutes, text only." },
      { label: "Split", value: "Completed sessions release 80% to creator and 20% to platform." },
    ],
  },
  {
    id: "tokens",
    title: "AI Tokens",
    kicker: "Usage Meter",
    summary: "Challengers buy token packs for AI features. Tokens roll over while the subscription is active.",
    tone: "cyan",
    icon: Bot,
    items: [
      { label: "$5 pack", value: "100 tokens." },
      { label: "$10 pack", value: "220 tokens." },
      { label: "$20 pack", value: "500 tokens." },
      { label: "Lapse rule", value: "Tokens freeze at the end of the paid billing period and unfreeze on resubscribe." },
    ],
  },
  {
    id: "fighter-rating",
    title: "Live Fighter Rating",
    kicker: "During Fights",
    summary: "Users rate fighter traits during live fights to build a community intelligence layer.",
    tone: "cyan",
    icon: Radio,
    items: [
      { label: "Criteria", value: "Fight IQ, grappling, striking, cardio, aggressiveness." },
      { label: "Scale", value: "1 to 10 stars per category." },
      { label: "Anti-spam", value: "Rate limits, account-age gating, recency weighting, thresholds, and moderation exclusions." },
    ],
  },
  {
    id: "chat-slips",
    title: "Chat and Slips",
    kicker: "Community Layer",
    summary: "Chat and slip sharing keep the event conversation live while preserving moderation controls.",
    tone: "purple",
    icon: MessageSquare,
    items: [
      { label: "Chat", value: "Global, event, and country rooms." },
      { label: "Slips", value: "Challenger slip uploads enter moderation and expire after 7 days." },
      { label: "Controls", value: "Block, mute, report, and admin moderation rules apply." },
    ],
  },
  {
    id: "notifications",
    title: "Notifications",
    kicker: "User Control",
    summary: "Users can tune notification categories in settings as operational triggers come online.",
    tone: "green",
    icon: Bell,
    items: [
      { label: "Event reminders", value: "Fight card and pick-lock alerts." },
      { label: "Results", value: "Recaps, qualification changes, prizes, and progression updates." },
      { label: "Settings", value: "Notification preferences live in the user settings area." },
    ],
  },
  {
    id: "voids",
    title: "Void Rules",
    kicker: "Fight Changes",
    summary: "Canceled fights, draws, no contests, and whole-event cancellations are handled without punishing users unfairly.",
    tone: "purple",
    icon: ReceiptText,
    items: [
      { label: "Canceled fight", value: "Pick is voided and removed from card minimum calculations." },
      { label: "Opponent swap", value: "Pick stands only if the selected fighter still competes." },
      { label: "Whole event canceled", value: "Full void. No leaderboard, ROI, or star movement." },
    ],
  },
];

export const rulesSectionTitles = rulesSections.map((section) => section.title);

