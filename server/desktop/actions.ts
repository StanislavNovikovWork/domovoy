'use server';

import { and, eq } from 'drizzle-orm';
import 'server-only';
import { z } from 'zod';
import { db } from '@/server/db';
import { householdMember } from '@/server/db/schema';
import { requireHouseholdAccess, revalidateBudgetPages } from '@/server/households/access';
import { DESKTOP_TILE_KEYS } from '@/shared/config/desktop-tiles';

const schema = z.object({
  householdId: z.uuid(),
  hidden: z.array(z.enum(DESKTOP_TILE_KEYS as [string, ...string[]])),
});

// скрытые плитки: настройка каждого участника отдельно
export async function setHiddenTiles(input: unknown): Promise<{ ok: boolean }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false };
  const { householdId, hidden } = parsed.data;

  try {
    const { session } = await requireHouseholdAccess(householdId);
    await db
      .update(householdMember)
      .set({ hiddenTiles: [...new Set(hidden)] })
      .where(
        and(eq(householdMember.householdId, householdId), eq(householdMember.userId, session.user.id))
      );
    revalidateBudgetPages();
    return { ok: true };
  } catch (error) {
    console.error('setHiddenTiles failed', error);
    return { ok: false };
  }
}
