import { z } from 'zod';

// первое число месяца: 'YYYY-MM-01'
const month = z.iso.date().refine((v) => v.endsWith('-01'), 'month must be the first day');

export const setPlanSchema = z.object({
  householdId: z.uuid(),
  categoryId: z.uuid(),
  month,
  // копейки, целое неотрицательное число (до 1 млрд рублей); 0 = сумма ещё не задана
  amount: z.number().int().nonnegative().max(100_000_000_000),
});

export const setPlanItemSchema = z.object({
  householdId: z.uuid(),
  categoryId: z.uuid(),
  month,
  name: z.string().trim().min(1).max(40),
  amount: z.number().int().positive().max(100_000_000_000),
});

export const removePlanItemSchema = z.object({
  householdId: z.uuid(),
  categoryId: z.uuid(),
  month,
  name: z.string().trim().min(1).max(40),
});

export const removePlanSchema = z.object({
  householdId: z.uuid(),
  categoryId: z.uuid(),
  month,
});

export const copyPlanSchema = z.object({
  householdId: z.uuid(),
  fromMonth: month,
  toMonth: month,
});
