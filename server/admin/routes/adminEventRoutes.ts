import { isAuthenticated, requireAdmin } from '../../auth/guards';
import { storage } from "../../storage";
import { syncEventToSupabase } from '../../services/outboundSyncService';
import { insertEventSchema, CARD_PLACEMENTS } from "../../../shared/schema";
import { v4 as uuidv4 } from "uuid";
import { createLeaderboardSnapshot } from "../../services/leaderboardService";
import { logger } from '../../utils/logger';
import { validate } from '../../middleware/validate';
import { updateEventSchema, updateEventStatusSchema } from '../../schemas';
import { archiveEventFightCaches } from '../../ai/fightQaCache';
import fs from 'fs';
import path from 'path';
import multer from 'multer';

const EVENTS_UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'events');

const eventImageUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      if (!fs.existsSync(EVENTS_UPLOAD_DIR)) {
        fs.mkdirSync(EVENTS_UPLOAD_DIR, { recursive: true });
      }
      cb(null, EVENTS_UPLOAD_DIR);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${uuidv4()}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Only JPG and PNG files are allowed'));
    }
  },
});

export function registerAdminEventRoutes(app: Express) {

  app.post("/api/admin/events/upload-image", isAuthenticated, requireAdmin,
    eventImageUpload.single('image'),
    (req: Request, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: 'No file uploaded' });
        }
        const url = `/objects/events/${req.file.filename}`;
        res.json({ url });
      } catch (error: any) {
        logger.error('Event image upload error:', error);
        res.status(400).json({ error: error.message || 'Upload failed' });
      }
    }
  );

  // Create a new event (Admin only)
  app.post("/api/admin/events", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const body = req.body;

      const eventValidation = insertEventSchema.safeParse({
        name: body.name,
        date: body.date,
        venue: body.venue,
        city: body.city,
        state: body.state,
        country: body.country,
        organization: body.organization,
        description: body.description,
        imageUrl: body.imageUrl || null,
      });

      if (!eventValidation.success) {
        return res.status(400).json({
          error: "Invalid event data",
          details: (eventValidation.error as any).errors,
        });
      }

      if (!body.fights || !Array.isArray(body.fights) || body.fights.length === 0) {
        return res.status(400).json({ error: "Event must have at least one fight" });
      }

      for (const fight of body.fights) {
        if (!CARD_PLACEMENTS.includes(fight.cardPlacement as any)) {
          return res.status(400).json({
            error: `Invalid card placement: ${fight.cardPlacement}. Must be one of: ${CARD_PLACEMENTS.join(", ")}`,
          });
        }
        const fighter1 = await storage.getFighter(fight.fighter1Id);
        const fighter2 = await storage.getFighter(fight.fighter2Id);
        if (!fighter1 || !fighter2) {
          return res.status(400).json({ error: "One or more fighters not found" });
        }
        if (fight.fighter1Id === fight.fighter2Id) {
          return res.status(400).json({ error: "Fighter cannot fight themselves" });
        }
      }

      const eventId = uuidv4();
      const createdEvent = await storage.createEvent({
        ...eventValidation.data,
        id: eventId,
        createdAt: new Date(),
      });

      const fightsToCreate = body.fights.map((fight: any) => ({
        id: uuidv4(),
        eventId,
        fighter1Id: fight.fighter1Id,
        fighter2Id: fight.fighter2Id,
        cardPlacement: fight.cardPlacement,
        boutOrder: fight.boutOrder,
        weightClass: fight.weightClass,
        isTitleFight: fight.isTitleFight,
        rounds: fight.rounds,
        scheduledTime: fight.scheduledTime || null,
      }));

      const createdFights = await storage.createEventFights(fightsToCreate);

      // Outbound sync to data engine (non-blocking)
      setImmediate(() => syncEventToSupabase(createdEvent as any, 'create').catch((e) =>
        logger.error('[OutboundSync] Event create sync failed:', e)
      ));

      res.status(201).json({
        ...createdEvent,
        fights: createdFights,
      });
    } catch (error) {
      logger.error("Error creating event:", error);
      res.status(500).json({ error: "Failed to create event" });
    }
  });
  app.put("/api/admin/events/:id", isAuthenticated, requireAdmin, validate(updateEventSchema), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const body = req.body;

      const existingEvent = await storage.getEvent(id as string);
      if (!existingEvent) {
        return res.status(404).json({ error: "Event not found" });
      }

      const updateData: Partial<typeof body> = {};
      if (body.name !== undefined) updateData.name = body.name;
      if (body.date !== undefined) updateData.date = body.date;
      if (body.venue !== undefined) updateData.venue = body.venue;
      if (body.city !== undefined) updateData.city = body.city;
      if (body.state !== undefined) updateData.state = body.state;
      if (body.country !== undefined) updateData.country = body.country;
      if (body.organization !== undefined) updateData.organization = body.organization;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
      if (body.status !== undefined) updateData.status = body.status;

      const updatedEvent = await storage.updateEvent(id as string, updateData);
      if (!updatedEvent) {
        return res.status(500).json({ error: "Failed to update event" });
      }

      // Outbound sync to data engine (non-blocking)
      setImmediate(() => syncEventToSupabase(updatedEvent as any).catch((e) =>
        logger.error('[OutboundSync] Event update sync failed:', e)
      ));

      const fights = await storage.getEventFights(id as string);
      res.json({ ...updatedEvent, fights });
    } catch (error) {
      logger.error("Error updating event:", error);
      res.status(500).json({ error: "Failed to update event" });
    }
  });

  app.put("/api/admin/events/:id/status", isAuthenticated, requireAdmin, validate(updateEventStatusSchema), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const VALID_TRANSITIONS: Record<string, string[]> = {
        'Upcoming': ['Live', 'Cancelled', 'Postponed'],
        'Live': ['Completed', 'Cancelled'],
        'Completed': ['Closed'],
        'Closed': ['Archived'],
        'Postponed': ['Upcoming', 'Cancelled'],
      };

      const event = await storage.getEvent(id as string);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      const allowed = VALID_TRANSITIONS[event.status];
      if (!allowed || !allowed.includes(status)) {
        return res.status(400).json({
          error: `Invalid transition: ${event.status} → ${status}. Allowed: ${(allowed || []).join(', ') || 'none'}`,
        });
      }

      if (status === 'Live' && event.status !== 'Live') {
        await storage.lockPicksForEvent(id as string);
      }

      if (status === 'Completed' && event.status !== 'Completed') {
        archiveEventFightCaches(id as string).catch(() => {}); // non-blocking
      }

      if (status === 'Closed' && event.status !== 'Closed') {
        await createLeaderboardSnapshot('event', id as string);
        
        // Trigger raffle draw
        const { drawRaffleWinner } = await import('../../services/raffleService');
        const winner = await drawRaffleWinner(id as string);
        if (winner) {
          logger.info(`[Event Close] Raffle winner drawn: User ${winner.winnerId}, Pool: $${(winner.poolTotal / 100).toFixed(2)}`);
        }
        
        // Trigger user progression calculations
        const { runEventProgression } = await import('../../services/progressionService');
        await runEventProgression(id as string);
        logger.info(`[Event Close] Progression calculations completed for event ${id}`);
      }

      const updated = await storage.updateEvent(id as string, { status });
      res.json(updated);
    } catch (error) {
      logger.error("Error updating event status:", error);
      res.status(500).json({ error: "Failed to update event status" });
    }
  });

  app.put("/api/admin/events/:eventId/fights/:fightId", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { eventId, fightId } = req.params;
      const body = req.body;

      const existingFight = await storage.getEventFight(fightId as string);
      if (!existingFight || existingFight.eventId !== eventId) {
        return res.status(404).json({ error: "Fight not found for this event" });
      }

      const updateData: Record<string, any> = {};
      if (body.status !== undefined) updateData.status = body.status;
      if (body.cardPlacement !== undefined) updateData.cardPlacement = body.cardPlacement;
      if (body.boutOrder !== undefined) updateData.boutOrder = body.boutOrder;
      if (body.rounds !== undefined) updateData.rounds = body.rounds;
      if (body.isTitleFight !== undefined) updateData.isTitleFight = body.isTitleFight;
      if (body.scheduledTime !== undefined) updateData.scheduledTime = body.scheduledTime;

      const updated = await storage.updateEventFight(fightId as string, updateData);
      if (!updated) {
        return res.status(404).json({ error: "Fight not found" });
      }
      res.json(updated);
    } catch (error) {
      logger.error("Error updating fight:", error);
      res.status(500).json({ error: "Failed to update fight" });
    }
  });

  app.delete("/api/admin/events/:eventId/fights/:fightId", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { eventId, fightId } = req.params;

      const existingFight = await storage.getEventFight(fightId as string);
      if (!existingFight || existingFight.eventId !== eventId) {
        return res.status(404).json({ error: "Fight not found for this event" });
      }

      const deleted = await storage.deleteEventFight(fightId as string);
      if (!deleted) {
        return res.status(404).json({ error: "Fight not found" });
      }
      res.json({ success: true, message: "Fight removed" });
    } catch (error) {
      logger.error("Error deleting fight:", error);
      res.status(500).json({ error: "Failed to delete fight" });
    }
  });

  app.delete("/api/admin/events/:id", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const existingEvent = await storage.getEvent(id as string);
      if (!existingEvent) {
        return res.status(404).json({ error: "Event not found" });
      }

      await storage.deleteEventFights(id as string);
      await storage.deleteEvent(id as string);

      res.json({ success: true, message: "Event deleted successfully" });
    } catch (error) {
      logger.error("Error deleting event:", error);
      res.status(500).json({ error: "Failed to delete event" });
    }
  });
}
