
import { events, type Event, type InsertEvent, eventFights, type EventFight, type InsertEventFight } from "../../shared/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";

export interface IEventStorage {
    getAllEvents(): Promise<Event[]>;
    getEvent(id: string): Promise<Event | undefined>;
    createEvent(event: InsertEvent & { id: string; createdAt: Date }): Promise<Event>;
    updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event | undefined>;
    deleteEvent(id: string): Promise<boolean>;
    deleteEventFights(eventId: string): Promise<boolean>;

    getEventFight(id: string): Promise<EventFight | undefined>;
    getEventFights(eventId: string): Promise<EventFight[]>;
    createEventFight(fight: InsertEventFight & { id: string }): Promise<EventFight>;
    createEventFights(fights: (InsertEventFight & { id: string })[]): Promise<EventFight[]>;
    updateEventFight(id: string, data: Partial<InsertEventFight>): Promise<EventFight | undefined>;
    deleteEventFight(id: string): Promise<boolean>;
}

export class EventStorage implements IEventStorage {
    async getAllEvents(): Promise<Event[]> {
        return await db.select().from(events);
    }

    async getEvent(id: string): Promise<Event | undefined> {
        const [event] = await db.select().from(events).where(eq(events.id, id));
        return event || undefined;
    }

    async createEvent(event: InsertEvent & { id: string; createdAt: Date }): Promise<Event> {
        const [created] = await db.insert(events).values(event).returning();
        return created;
    }

    async updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event | undefined> {
        const [updated] = await db.update(events).set(event).where(eq(events.id, id)).returning();
        return updated || undefined;
    }

    async deleteEvent(id: string): Promise<boolean> {
        await db.delete(events).where(eq(events.id, id));
        return true;
    }

    async deleteEventFights(eventId: string): Promise<boolean> {
        await db.delete(eventFights).where(eq(eventFights.eventId, eventId));
        return true;
    }

    async getEventFight(id: string): Promise<EventFight | undefined> {
        const [fight] = await db.select().from(eventFights).where(eq(eventFights.id, id));
        return fight || undefined;
    }

    async getEventFights(eventId: string): Promise<EventFight[]> {
        return await db.select().from(eventFights).where(eq(eventFights.eventId, eventId));
    }

    async createEventFight(fight: InsertEventFight & { id: string }): Promise<EventFight> {
        const [created] = await db.insert(eventFights).values(fight).returning();
        return created;
    }

    async createEventFights(fights: (InsertEventFight & { id: string })[]): Promise<EventFight[]> {
        if (fights.length === 0) return [];
        const created = await db.insert(eventFights).values(fights).returning();
        return created;
    }

    async updateEventFight(id: string, data: Partial<InsertEventFight>): Promise<EventFight | undefined> {
        const [updated] = await db.update(eventFights).set(data).where(eq(eventFights.id, id)).returning();
        return updated || undefined;
    }

    async deleteEventFight(id: string): Promise<boolean> {
        const result = await db.delete(eventFights).where(eq(eventFights.id, id)).returning();
        return result.length > 0;
    }
}
