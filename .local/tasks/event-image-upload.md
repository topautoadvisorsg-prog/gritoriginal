## Goal
Add an Event Image field to the Create Event admin form. The uploaded image represents the event's main fight and is displayed in the Event Carousel and Event Card page header.

## Existing Upload Infrastructure
The project already has an upload system:
- `PUT /api/uploads/*` — streams file body to disk under `uploads/` directory
- Files served at `/uploads/*` static path
- `server/services/storageService.ts` — returns upload URL for a given path
- `server/user/routes/uploadRoutes.ts` — handles the PUT and streams to filesystem

The event image upload will follow the same pattern.

## Database Change

### `shared/schema.ts`
Add `imageUrl` column to the `events` table:
```ts
export const events = pgTable("events", {
  // ... existing fields ...
  imageUrl: text("image_url"),  // nullable — not all events need a custom image
});
```
After adding, run `npm run db:push` to sync the schema.

## Backend Changes

### `server/admin/routes/adminEventRoutes.ts`
1. Accept `imageUrl` (optional string) in the event creation payload — pass it to `storage.createEvent()`
2. Accept `imageUrl` in the event update payload too
3. Add a dedicated admin image upload endpoint:
```
POST /api/admin/events/upload-image
```
- Accepts `multipart/form-data` with a single `image` field
- Validates: file type must be `image/jpeg` or `image/png`; max size 5 MB
- Saves to `uploads/events/{uuid}.{ext}`
- Returns `{ url: '/uploads/events/{uuid}.{ext}' }`
- Protected with `isAuthenticated + requireAdmin`

> **Why a separate endpoint vs. PUT /api/uploads/?**
> The existing PUT route is user-accessible and doesn't validate file type or size. A dedicated admin endpoint adds proper validation and keeps event images in a structured path.

### `server/storage.ts` (or equivalent storage layer)
Update `createEvent` and `updateEvent` methods to accept and persist `imageUrl`.

## Frontend Changes

### `src/admin/components/CreateEvent.tsx`
Add an "Event Image" section below the Description field:

```
┌─────────────────────────────────────────────────┐
│  Event Image (optional)                         │
│  ┌─────────────────────┐   ┌─────────────────┐  │
│  │  [Choose File]      │   │  [Preview 80px] │  │
│  │  JPG/PNG, max 5 MB  │   │  thumbnail here │  │
│  └─────────────────────┘   └─────────────────┘  │
└─────────────────────────────────────────────────┘
```

Behavior:
1. User picks a file — immediately validate type and size client-side; show error toast if invalid
2. Upload the file to `POST /api/admin/events/upload-image` as `multipart/form-data`
3. On success, store the returned URL in form state (`eventData.imageUrl`)
4. Show a 80×80px thumbnail preview next to the picker
5. "Remove" button clears the preview and sets `imageUrl` to null
6. The `imageUrl` is included in the final event creation payload

## Files
- `shared/schema.ts` — add `imageUrl` to events table
- `server/admin/routes/adminEventRoutes.ts` — upload endpoint + pass imageUrl through
- `server/storage.ts` — update createEvent/updateEvent
- `src/admin/components/CreateEvent.tsx` — image picker UI

## Notes
- Use `multer` for multipart parsing on the upload endpoint (check if already installed; if not, use `npm install multer`)
- Images are stored on the container's disk — fine for Closed Beta. For production scale, swap `StorageService` to use Replit Object Storage (already installed as `javascript_object_storage==2.0.0`).
- Missing image fallback: when `imageUrl` is null, carousel cards and event card header show a dark gradient with the org name/event name as text — no broken image icon.

## Done looks like
- Admin can upload a JPG/PNG (≤5 MB) in the Create Event form and sees a live thumbnail preview
- The image URL is saved to the `events.image_url` column in PostgreSQL
- Invalid file type or oversized files are rejected with a clear error message
- Events without an image work fine — carousel and event card show a graceful placeholder
