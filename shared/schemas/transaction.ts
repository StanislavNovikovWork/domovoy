import { z } from 'zod';

export const createTransactionSchema = z.object({
  householdId: z.uuid(),
  categoryId: z.uuid(),
  // сумма в копейках, целое положительное число (до 1 млрд рублей)
  amount: z.number().int().positive().max(100_000_000_000),
  occurredOn: z.iso.date(), // 'YYYY-MM-DD'
  note: z.string().trim().min(1).max(200),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
