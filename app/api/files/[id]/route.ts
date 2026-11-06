import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { upload } from '@/server/db/schema';
import { requireHouseholdAccess } from '@/server/households/access';
import { readStoredFile } from '@/server/uploads/storage';

// отдача фото: аватарки видны любому вошедшему, фото блюд только участникам пространства
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return new Response(null, { status: 404 });

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return new Response(null, { status: 401 });

  const [row] = await db
    .select({ householdId: upload.householdId })
    .from(upload)
    .where(eq(upload.id, id));
  if (!row) return new Response(null, { status: 404 });

  if (row.householdId) {
    try {
      await requireHouseholdAccess(row.householdId);
    } catch {
      return new Response(null, { status: 403 });
    }
  }

  try {
    const data = await readStoredFile(id);
    return new Response(new Uint8Array(data), {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'private, max-age=31536000, immutable',
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
