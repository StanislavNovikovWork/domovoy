import { randomUUID } from 'node:crypto';
import { and, eq, isNotNull, ne, sql } from 'drizzle-orm';
import sharp from 'sharp';
import { z } from 'zod';
import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { recipe, upload, user } from '@/server/db/schema';
import { requireHouseholdAccess } from '@/server/households/access';
import { removeUpload, saveFile } from '@/server/uploads/storage';
import { HOUSEHOLD_UPLOAD_QUOTA, MAX_UPLOAD_INPUT } from '@/shared/config/uploads';

const fail = (error: string, status: number) => Response.json({ error }, { status });

const FILE_URL = /^\/api\/files\/([0-9a-f-]{36})$/;

// загрузка фото: kind=avatar (аватарка профиля) или kind=recipe (фото блюда, нужны householdId и recipeId)
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return fail('Нужно войти', 401);
  if (Number(req.headers.get('content-length') ?? 0) > MAX_UPLOAD_INPUT + 64 * 1024) {
    return fail('Файл больше 8 МБ', 413);
  }

  const form = await req.formData();
  const file = form.get('file');
  const kind = form.get('kind');
  if (!(file instanceof File) || (kind !== 'avatar' && kind !== 'recipe')) {
    return fail('Некорректный запрос', 400);
  }
  if (file.size > MAX_UPLOAD_INPUT) return fail('Файл больше 8 МБ', 413);

  let data: Buffer;
  try {
    const image = sharp(Buffer.from(await file.arrayBuffer())).rotate();
    data = await (
      kind === 'avatar'
        ? image.resize(256, 256, { fit: 'cover' })
        : image.resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
    )
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    return fail('Не удалось обработать изображение', 400);
  }

  const id = randomUUID();

  if (kind === 'avatar') {
    const [current] = await db
      .select({ image: user.image })
      .from(user)
      .where(eq(user.id, session.user.id));
    await saveFile(id, data);
    await db.insert(upload).values({ id, userId: session.user.id, kind, size: data.length });
    await db.update(user).set({ image: `/api/files/${id}` }).where(eq(user.id, session.user.id));
    const oldId = current?.image?.match(FILE_URL)?.[1];
    if (oldId) await removeUpload(oldId);
    return Response.json({ id });
  }

  const ids = z
    .object({ householdId: z.uuid(), recipeId: z.uuid() })
    .safeParse({ householdId: form.get('householdId'), recipeId: form.get('recipeId') });
  if (!ids.success) return fail('Некорректный запрос', 400);
  const { householdId, recipeId } = ids.data;

  try {
    await requireHouseholdAccess(householdId);
  } catch {
    return fail('Нет доступа', 403);
  }

  const [found] = await db
    .select({ photoId: recipe.photoId })
    .from(recipe)
    .where(and(eq(recipe.id, recipeId), eq(recipe.householdId, householdId)));
  if (!found) return fail('Рецепт не найден', 404);

  // место, которое освободится после замены старого фото, в квоту не входит
  const [{ used }] = await db
    .select({ used: sql<number>`coalesce(sum(${upload.size}), 0)::int` })
    .from(upload)
    .where(
      and(
        eq(upload.householdId, householdId),
        isNotNull(upload.householdId),
        found.photoId ? ne(upload.id, found.photoId) : undefined
      )
    );
  if (used + data.length > HOUSEHOLD_UPLOAD_QUOTA) {
    return fail('Хранилище пространства заполнено (лимит 20 МБ)', 413);
  }

  await saveFile(id, data);
  await db
    .insert(upload)
    .values({ id, householdId, userId: session.user.id, kind, size: data.length });
  await db.update(recipe).set({ photoId: id }).where(eq(recipe.id, recipeId));
  if (found.photoId) await removeUpload(found.photoId);
  return Response.json({ id });
}
