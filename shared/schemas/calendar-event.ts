import { z } from 'zod';

export const createEventSchema = z.object({
  // id, созданный на клиенте для мгновенного отображения
  id: z.uuid().optional(),
  householdId: z.uuid(),
  title: z.string().trim().min(1).max(120),
  // дата события YYYY-MM-DD
  eventDate: z.iso.date(),
  // необязательное время HH:MM
  eventTime: z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .optional(),
});

export const eventIdSchema = z.object({
  householdId: z.uuid(),
  id: z.uuid(),
});

export const updateEventSchema = createEventSchema.extend({
  id: z.uuid(),
});
