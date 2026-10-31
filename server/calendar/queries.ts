import { asc, eq } from 'drizzle-orm';
import 'server-only';
import { db } from '@/server/db';
import { calendarEvent } from '@/server/db/schema';

export type CalendarEventItem = {
  id: string;
  title: string;
  eventDate: string; // YYYY-MM-DD
  eventTime: string | null; // HH:MM:SS
  createdBy: string | null;
};

// события пространства по дате: ранние выше
export async function listEvents(householdId: string): Promise<CalendarEventItem[]> {
  return db
    .select({
      id: calendarEvent.id,
      title: calendarEvent.title,
      eventDate: calendarEvent.eventDate,
      eventTime: calendarEvent.eventTime,
      createdBy: calendarEvent.createdBy,
    })
    .from(calendarEvent)
    .where(eq(calendarEvent.householdId, householdId))
    .orderBy(asc(calendarEvent.eventDate), asc(calendarEvent.eventTime), asc(calendarEvent.createdAt));
}
