# 🥊 GRIT — WEEK 2 IMPLEMENTATION STATUS

## ✅ COMPLETED ITEMS

---

### **4. PICK DISTRIBUTION PERCENTAGES** ✅ **BACKEND COMPLETE**

**Status:** Backend API ready, Frontend integration pending

**Files Created:**
- `server/routes/picksDistribution.ts` - API endpoint for pick aggregation

**What's Built:**

**Backend Endpoint:**
```typescript
GET /api/picks/distribution/:fightId
```

**Response Format:**
```json
{
  "fightId": "fight-123",
  "totalPicks": 247,
  "distribution": [
    {
      "fighterId": "fighter-456",
      "fighterName": "Pereira",
      "count": 168,
      "percentage": "68.0"
    },
    {
      "fighterId": "fighter-789", 
      "fighterName": "Hill",
      "count": 79,
      "percentage": "32.0"
    }
  ]
}
```

**Features:**
- Real-time aggregation of all user picks per fight
- Sorted by percentage (highest first)
- Includes fighter names
- Handles edge cases (no picks yet)

**Frontend Integration Needed:**

Add to `InlinePickModal.tsx`:

```tsx
// NEW HOOK
const { data: distribution } = useQuery({
  queryKey: ['/api/picks/distribution', fight.id],
  queryFn: async () => {
    const res = await fetch(`/api/picks/distribution/${fight.id}`);
    return res.json();
  },
});

// DISPLAY IN MODAL (after method selection)
{distribution && distribution.distribution.length > 0 && (
  <div className="social-proof mt-4 p-4 rounded-lg bg-white/[0.03] border border-white/10">
    <div className="flex items-center gap-2 mb-3">
      <Users className="w-4 h-4 text-white/40" />
      <span className="text-[9px] font-black uppercase tracking-widest text-white/50">
        Community Picks
      </span>
    </div>
    
    {distribution.distribution.map(dist => {
      const isLeading = dist.percentage > 50;
      return (
        <div key={dist.fighterId} className="flex items-center gap-3 mb-2 last:mb-0">
          <span className="text-xs font-bold text-white w-24">
            {dist.fighterName}
          </span>
          
          <div className="flex-1">
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full transition-all duration-700",
                  isLeading 
                    ? "bg-win shadow-[0_0_10px_rgba(34,197,94,0.3)]" 
                    : "bg-white/20"
                )}
                style={{ width: `${dist.percentage}%` }}
              />
            </div>
          </div>
          
          <span className={cn(
            "text-xs font-black w-12 text-right",
            isLeading ? "text-win" : "text-white/40"
          )}>
            {dist.percentage}%
          </span>
        </div>
      );
    })}
    
    {distribution.distribution[0]?.percentage && (
      <p className="text-[8px] text-white/30 mt-3 uppercase tracking-wider">
        🔥 {distribution.distribution[0].percentage}% of users picked {distribution.distribution[0].fighterName}
      </p>
    )}
  </div>
)}
```

**Estimated Frontend Effort:** 2-3 hours

---

## ⏳ PENDING ITEMS

---

### **5. FRIENDS ACTIVITY FEED** ⏳ **NOT STARTED**

**Status:** Requires backend query + dashboard widget

**What Needs to Be Built:**

**Backend Endpoint:**
```typescript
GET /api/activity/feed
```

**Query Logic:**
1. Find all groups user belongs to
2. Get recent picks from all group members (excluding user's own picks)
3. Return last 10 picks with fighter info and correctness

**Expected Response:**
```json
[
  {
    "id": "pick-123",
    "userId": "user-456",
    "username": "ShadowWarrior",
    "avatarUrl": "...",
    "fightId": "fight-789",
    "pickedFighterName": "Pereira",
    "pickedMethod": "KO/TKO",
    "correct": true,
    "pointsAwarded": 150,
    "createdAt": "2024-03-25T14:30:00Z"
  }
]
```

**Frontend Widget:**
- Dashboard component showing feed
- Avatar + username + timestamp
- Fighter picked + method
- Green highlight if correct
- Points earned display
- Scrollable (max-height: 320px)
- "View All Group Activity" link at bottom

**Estimated Effort:** 4-5 hours total

---

### **6. SLIP SOCIAL SHARING** ⏳ **NOT STARTED**

**Status:** Core slip system exists, social export missing

**What Needs to Be Built:**

**Image Card Generation:**
- Use `html2canvas` or similar library
- Generate 1080×1080px styled image
- Include:
  - Fighter photos
  - User's pick (fighter, method, round)
  - GRIT branding
  - Deep link QR code

**Share Flow:**
```typescript
1. User clicks "Share" button on slip
2. Generate image card (hidden div → canvas → data URL)
3. Download image locally
4. Open native share dialog (navigator.share)
5. Pre-populate text: "I just picked {Fighter} to win!"
6. Share to Instagram Stories / X / etc.
```

**Files Needed:**
- `src/user/components/slip/SlipShareCard.tsx` - Hidden card component
- Integration into existing `SlipPicker.tsx` or `MySlipsTab.tsx`

**Dependencies:**
```bash
npm install html2canvas
```

**Estimated Effort:** 6-8 hours total

---

## 📊 CURRENT SPRINT PROGRESS

| Item | Backend | Frontend | Status |
|------|---------|----------|--------|
| 1. Mobile Bottom Nav | N/A | ✅ Complete | ✅ DONE |
| 2. Push Notifications | ✅ Complete | ✅ Complete | ✅ DONE |
| 3. Pick Flow (3-4 taps) | N/A | ✅ Complete | ✅ DONE |
| 4. Pick Distribution % | ✅ Complete | ⏳ Pending | 🟡 50% |
| 5. Friends Activity Feed | ⏳ Pending | ⏳ Pending | ❌ 0% |
| 6. Slip Social Sharing | ⏳ Pending | ⏳ Pending | ❌ 0% |

---

## 🎯 NEXT STEPS

**Immediate (This Week):**

1. **Integrate Pick Distribution into Modal** (2-3 hours)
   - Add query hook to `InlinePickModal.tsx`
   - Display progress bars
   - Test with real data

2. **Build Friends Activity Feed** (4-5 hours)
   - Create backend endpoint
   - Build dashboard widget
   - Wire into Dashboard.tsx

3. **Implement Slip Social Sharing** (6-8 hours)
   - Install html2canvas
   - Create share card component
   - Integrate native share dialog

**Total Estimated Time:** 12-16 hours

---

## 🔧 TESTING NOTES

### **Pick Distribution Testing:**

**Test Cases:**
- Fight with 100+ picks (should show clear leader)
- Fight with 50/50 split (should show close percentages)
- Fight with no picks yet (should show empty state gracefully)
- Live event (percentages should update in real-time)

**Manual Test:**
```bash
# Call API directly
curl http://localhost:3001/api/picks/distribution/{fightId}

# Expected output:
{
  "fightId": "xxx",
  "totalPicks": 42,
  "distribution": [...]
}
```

---

## 📝 DEPLOYMENT CHECKLIST

Before deploying Week 2 features:

☐ Pick distribution API returns correct data  
☐ Modal displays percentages without errors  
☐ Loading states work (show skeleton while fetching)  
☐ Empty states handled (no picks yet message)  
☐ Mobile responsive (progress bars readable on small screens)  
☐ No console errors in browser  
☐ TypeScript compiles without errors  

---

## 🚀 SUCCESS METRICS

After Week 2 deployment, track:

**Pick Distribution Impact:**
- Time-to-pick (should decrease as users follow crowd)
- Pick confidence scores (survey users)
- Social engagement (chat mentions of "community picks")

**Friends Activity Feed Impact:**
- Dashboard time-on-page (should increase)
- Group check-in frequency (should increase)
- Viral coefficient (invites sent per user)

**Slip Sharing Impact:**
- Slips shared per week (baseline: 0 → target: 50+)
- Social media mentions (@gritmma on Twitter/IG)
- New signups from shared links (track UTM parameters)

---

**Questions?** All backend code is documented. Frontend components need implementation based on specs above.

Let's finish Week 2 strong! 🥊
