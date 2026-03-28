# Fix Zod v3/v4 Schema Mismatch Blocking All DB Inserts

## What & Why

**This is the root cause of fighters never persisting after import.**

`drizzle-zod` v0.8.3 internally imports from `zod/v4` (confirmed: its source uses `require('zod/v4')`). However, `shared/schema.ts` imports `z` from the classic `'zod'` (v3) entry point and passes v3 schema objects as overrides to `createInsertSchema`:

```typescript
import { z } from "zod"; // v3

export const insertFighterSchema = createInsertSchema(fighters, {
  dateOfBirth: z.coerce.date().optional() as any,   // v3 schema object
  campStartDate: z.coerce.date().optional() as any, // v3 schema object
  ...
```

When `insertFighterSchema.safeParse(fighterData)` is called at import time on the server, Zod v4's internal parser encounters the v3 schema object and throws a hard `Error: "Invalid element at key 'dateOfBirth': expected a Zod schema"`. This is NOT a Zod validation failure — it is an uncaught exception. The bulk route's per-item `catch (err)` block catches it, pushes every fighter to the `errors[]` array, and returns `{ created: 0, errors: N }`. The safety-net fallback then updates only local React state. Fighters appear in the UI but are never written to PostgreSQL. Page refresh fetches the empty DB and they vanish.

**All four drizzle schemas with v3 date overrides are broken the same way:**
- `insertFighterSchema` (dateOfBirth, campStartDate)
- `insertFightHistorySchema` (eventDate)
- `insertEventSchema` (date)
- `insertNewsArticleSchema` (publishedAt)

**The fix is one import line.** Changing `import { z } from "zod"` to `import { z } from "zod/v4"` in `shared/schema.ts` makes all override schemas v4-compatible. All APIs used in the file (`z.string()`, `z.number()`, `z.boolean()`, `z.coerce.date()`, `.optional()`, `.omit()`, `.partial()`, `.extend()`, `z.infer<>`) exist identically in Zod v4 — confirmed by direct test.

## Done looks like

- `insertFighterSchema.safeParse({ firstName: 'Piera', dateOfBirth: '1992-11-11T00:00:00.000Z', ... })` returns `{ success: true }` with no thrown exceptions
- Importing the fighter CSV saves rows to PostgreSQL; `SELECT COUNT(*) FROM fighters` returns > 0 after import
- Page refresh shows all imported fighters (no disappearing)
- No TypeScript errors from the import change (Zod v4 exports all the same type utilities)

## Out of scope

- Changing any route handlers or transform functions (only schema.ts changes)
- Migrating other files that use `z` from `'zod'` — they are standalone and don't interact with drizzle schemas

## Tasks

1. **Change the Zod import in `shared/schema.ts`** — Replace `import { z } from "zod"` with `import { z } from "zod/v4"` on line 4. Remove the `as any` type casts on the four date override fields since the types now align correctly with drizzle-zod's expectations.

2. **Restart the workflow and verify** — After the change, restart the server and run `npx tsx -e "import {insertFighterSchema} from './shared/schema'; const r = insertFighterSchema.safeParse({firstName:'Test',lastName:'F',nationality:'USA',gender:'Male',weightClass:'Lightweight',stance:'Orthodox',gym:'G',imageUrl:'/p.svg',organization:'UFC',dateOfBirth:'1992-01-01T00:00:00.000Z'}); console.log(r.success)"` — should print `true`. Then confirm a fighter import writes rows to the DB via `SELECT COUNT(*) FROM fighters`.

## Relevant files

- `shared/schema.ts:4,600-618`
- `server/admin/routes/adminFighterRoutes.ts:86`
