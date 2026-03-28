import type { Express, Request, Response } from "express";
import { isAuthenticated } from '../../auth/guards';
import { storage } from "../../storage";
import { insertEventSchema, insertEventFightSchema, CARD_PLACEMENTS } from "../../../shared/schema";
import { v4 as uuidv4 } from "uuid";
import { logger } from '../../utils/logger';
import { parsePagination, paginatedResponse } from '../../utils/pagination';
import { eventCache } from '../../utils/eventCache';

interface CreateEventRequest {
  name: string;
  date: string;
  venue: string;
  city: string;
  state?: string;
  country: string;
  organization: string;
  description?: string;
  fights: {
    fighter1Id: string;
    fighter2Id: string;
    cardPlacement: string;
    boutOrder: number;
    weightClass: string;
    isTitleFight: boolean;
    rounds: number;
  }[];
}

export function registerEventRoutes(app: Express) {
  app.get("/api/events", async (req: Request, res: Response) => {
    try {
      const events = await storage.getAllEvents();
      if (req.query.page) {
        const params = parsePagination(req);
        const paginated = events.slice(params.offset, params.offset + params.limit);
        return res.json(paginatedResponse(paginated, events.length, params));
      }
      res.json(events);
    } catch (error) {
      logger.error("Error fetching events:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.get("/api/events/completed", async (req: Request, res: Response) => {
    try {
      const events = await storage.getAllEvents();
      const completedEvents = events.filter(e => e.status === 'Completed');
      const eventsWithFights = await Promise.all(
        completedEvents.map(async (event) => {
          const fights = await storage.getEventFights(event.id);
          return { ...event, fights };
        })
      );
      if (req.query.page) {
        const params = parsePagination(req);
        const paginated = eventsWithFights.slice(params.offset, params.offset + params.limit);
        return res.json(paginatedResponse(paginated, eventsWithFights.length, params));
      }
      res.json(eventsWithFights);
    } catch (error) {
      logger.error("Error fetching completed events:", error);
      res.status(500).json({ error: "Failed to fetch completed events" });
    }
  });

  app.get("/api/events/:id", async (req: Request, res: Response) => {
    try {
      const eventId = req.params.id as string;
      const cached = eventCache.get(eventId);
      if (cached) return res.json(cached);

      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      const fights = await storage.getEventFights(eventId);
      const payload = { ...event, fights };
      
      eventCache.set(eventId, payload);
      res.json(payload);
    } catch (error) {
      logger.error("Error fetching event:", error);
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });
}
