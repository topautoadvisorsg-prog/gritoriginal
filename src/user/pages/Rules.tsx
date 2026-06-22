import React from "react";
import { Flag, Info, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/lib/utils";
import { flagRows, participationRows, rulesSections, type RuleTone } from "./rulesContent";

const toneStyles: Record<RuleTone, { border: string; bg: string; text: string; dot: string }> = {
  red: {
    border: "border-red-500/25",
    bg: "bg-red-500/10",
    text: "text-red-300",
    dot: "bg-red-400",
  },
  gold: {
    border: "border-[#E8A020]/35",
    bg: "bg-[#E8A020]/10",
    text: "text-[#F5C842]",
    dot: "bg-[#E8A020]",
  },
  cyan: {
    border: "border-cyan-400/25",
    bg: "bg-cyan-400/10",
    text: "text-cyan-200",
    dot: "bg-cyan-300",
  },
  green: {
    border: "border-green-400/25",
    bg: "bg-green-400/10",
    text: "text-green-300",
    dot: "bg-green-300",
  },
  purple: {
    border: "border-violet-400/25",
    bg: "bg-violet-400/10",
    text: "text-violet-200",
    dot: "bg-violet-300",
  },
};

export default function Rules() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-16">
      <section className="relative overflow-hidden border border-white/10 bg-[#0b0b0d] px-5 py-7 sm:px-8">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#E8A020] to-transparent" />
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 flex items-center gap-2">
              <Badge className="rounded border border-[#E8A020]/30 bg-[#E8A020]/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#F5C842] hover:bg-[#E8A020]/10">
                Always Available
              </Badge>
              <Badge className="rounded border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/50 hover:bg-white/5">
                No Sportsbook
              </Badge>
            </div>
            <h1 className="display-font text-4xl font-black uppercase tracking-normal text-white sm:text-6xl">
              GRIT Rules
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
              A quick reference for picks, odds, flags, qualification, progression, prizes, AI tokens, and community rules.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[360px]">
            <QuickStat label="Systems" value={String(rulesSections.length)} />
            <QuickStat label="Badge Tiers" value="5" />
            <QuickStat label="Unit Floor" value="0" />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded border-white/10 bg-[#111] shadow-none">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-[#E8A020]" />
              <CardTitle className="text-sm font-black uppercase tracking-[0.16em] text-white">
                Flag Rules
              </CardTitle>
            </div>
            <p className="text-sm leading-6 text-white/55">
              Flags let users mark confidence without changing the core moneyline math. Only red flags come off record.
            </p>
          </CardHeader>
          <CardContent className="grid gap-3">
            {flagRows.map((flag) => {
              const tone = toneStyles[flag.tone];
              return (
                <div
                  key={flag.label}
                  className={cn("grid gap-3 rounded border p-4 sm:grid-cols-[140px_1fr]", tone.border, tone.bg)}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2.5 w-2.5 rounded-full", tone.dot)} />
                      <span className={cn("text-xs font-black uppercase tracking-[0.14em]", tone.text)}>
                        {flag.label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-bold text-white/45">{flag.meaning}</p>
                  </div>
                  <p className="text-sm leading-6 text-white/70">{flag.result}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="rounded border-white/10 bg-[#111] shadow-none">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-[#E8A020]" />
              <CardTitle className="text-sm font-black uppercase tracking-[0.16em] text-white">
                Participation Minimums
              </CardTitle>
            </div>
            <p className="text-sm leading-6 text-white/55">
              Fixed card sizes replace percentage math. Missing the minimum means no stars and no ranking movement.
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded border border-white/10">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.04] text-[10px] uppercase tracking-[0.14em] text-white/40">
                  <tr>
                    <th className="px-3 py-3 font-black">Card</th>
                    <th className="px-3 py-3 font-black">Minimum</th>
                    <th className="px-3 py-3 font-black">Flags</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {participationRows.map((row) => (
                    <tr key={row.cardSize} className="text-white/70">
                      <td className="px-3 py-3 font-mono">{row.cardSize}</td>
                      <td className="px-3 py-3 font-mono text-white">{row.minimumPicks}</td>
                      <td className="px-3 py-3 font-mono text-[#F5C842]">{row.flagBudget}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rulesSections.map((section) => {
          const Icon = section.icon;
          const tone = toneStyles[section.tone];
          return (
            <Card
              key={section.id}
              className={cn("rounded border bg-[#111] shadow-none transition-colors hover:border-white/20", tone.border)}
            >
              <CardHeader className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded border", tone.border, tone.bg)}>
                    <Icon className={cn("h-5 w-5", tone.text)} />
                  </div>
                  <span className={cn("text-[10px] font-black uppercase tracking-[0.16em]", tone.text)}>
                    {section.kicker}
                  </span>
                </div>
                <div>
                  <CardTitle className="text-xl font-black uppercase tracking-normal text-white">
                    {section.title}
                  </CardTitle>
                  <p className="mt-2 min-h-[72px] text-sm leading-6 text-white/55">{section.summary}</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {section.items.map((item) => (
                  <div key={item.label} className="border-t border-white/10 pt-3">
                    <div className="mb-1 flex items-center gap-2">
                      <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} />
                      <span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/45">
                        {item.label}
                      </span>
                    </div>
                    <p className="text-sm leading-6 text-white/75">{item.value}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="flex items-start gap-3 border border-cyan-400/20 bg-cyan-400/10 p-4">
        <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-cyan-200" />
        <p className="text-sm leading-6 text-cyan-50/75">
          GRIT is a competitive analytics platform. These rules explain fantasy scoring, community features, and prize eligibility; they do not create wagering inside the app.
        </p>
      </section>
    </div>
  );
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/10 bg-white/[0.03] px-3 py-4">
      <div className="text-2xl font-black text-white">{value}</div>
      <div className="mt-1 text-[9px] font-black uppercase tracking-[0.16em] text-white/35">{label}</div>
    </div>
  );
}
