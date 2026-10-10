import { and, eq } from 'drizzle-orm';
import 'server-only';
import { db } from '@/server/db';
import { household, householdMember, category } from '@/server/db/schema';
import { DEFAULT_CATEGORIES } from '@/server/households/default-categories';

async function findPersonalId(userId: string) {
  const [row] = await db
    .select({ id: household.id })
    .from(household)
    .where(and(eq(household.createdBy, userId), eq(household.type, 'personal')))
    .limit(1);
  return row?.id ?? null;
}

export async function ensurePersonalHousehold(userId: string): Promise<string> {
  // 1. Уже есть: возвращаем
  const existing = await findPersonalId(userId);
  if (existing) return existing;

  // 2. Создаём household и участника одним batch (атомарно)
  const id = crypto.randomUUID();
  try {
    await db.batch([
      db.insert(household).values({
        id,
        name: 'Личный бюджет',
        type: 'personal',
        createdBy: userId,
      }),
      db.insert(householdMember).values({
        householdId: id,
        userId,
        role: 'owner',
      }),
      db.insert(category).values(
        DEFAULT_CATEGORIES.map((c, index) => ({
          ...c,
          householdId: id,
          sortOrder: index,
        }))
      ),
    ]);
    return id;
  } catch (error) {
    // 3. Гонка: параллельный вызов успел раньше, сработал уникальный индекс
    const created = await findPersonalId(userId);
    if (created) return created;
    throw error;
  }
}
