import { z } from 'zod';
import { PLACE_KIND_VALUES } from '@/shared/config/place-kinds';

export const createPlaceSchema = z.object({
  // id, созданный на клиенте для мгновенного отображения
  id: z.uuid().optional(),
  householdId: z.uuid(),
  name: z.string().trim().min(1).max(80),
  kind: z.enum(PLACE_KIND_VALUES),
  // ссылка из карт и комментарий: необязательные, пустая строка = нет
  location: z.string().trim().max(500).optional(),
  comment: z.string().trim().max(500).optional(),
});

export const placeIdSchema = z.object({
  householdId: z.uuid(),
  id: z.uuid(),
});

export const updatePlaceSchema = createPlaceSchema.extend({
  id: z.uuid(),
});
