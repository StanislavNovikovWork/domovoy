import { and, asc, eq, isNull } from 'drizzle-orm';
import 'server-only';
import { db } from '@/server/db';
import { category } from '@/server/db/schema';

export async function listActiveCategories(householdId: string) {
  return db
    .select({
      id: category.id,
      name: category.name,
      type: category.type,
      icon: category.icon,
      color: category.color,
      suggestions: category.suggestions,
    })
    .from(category)
    .where(and(eq(category.householdId, householdId), isNull(category.archivedAt)))
    .orderBy(asc(category.sortOrder));
}
