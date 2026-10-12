import { z } from 'zod';

export const createTransactionSchema = z.object({
  // id, созданный на клиенте для мгновенного отображения; настоящая запись приходит с тем же id
  id: z.uuid().optional(),
  householdId: z.uuid(),
  categoryId: z.uuid(),
  // сумма в копейках, целое положительное число (до 1 млрд рублей)
  amount: z.number().int().positive().max(100_000_000_000),
  occurredOn: z.iso.date(), // 'YYYY-MM-DD'
  note: z.string().trim().min(1).max(200),
  // кто платил (только у разовых бюджетов); по умолчанию автор
  paidBy: z
    .object({
      userId: z.string().min(1).nullable(),
      name: z.string().trim().min(1).max(40),
    })
    .optional(),
  // участники расхода (только у разовых бюджетов): член бюджета или вписанное имя
  shares: z
    .array(
      z.object({
        userId: z.string().min(1).nullable(),
        name: z.string().trim().min(1).max(40),
        amount: z.number().int().positive().max(100_000_000_000),
      })
    )
    .max(50)
    .optional(),
});

export const updateTransactionSchema = createTransactionSchema.extend({ id: z.uuid() });

export const deleteTransactionSchema = z.object({
  householdId: z.uuid(),
  id: z.uuid(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
