import { and, asc, eq, sql } from 'drizzle-orm';
import 'server-only';
import { db } from '@/server/db';
import { checklist, checklistItem, shoppingPreset } from '@/server/db/schema';

export type ChecklistItem = Awaited<ReturnType<typeof listChecklists>>[number];
export type ChecklistItemRow = Awaited<ReturnType<typeof listItems>>[number];

// списки пространства в порядке создания
export async function listChecklists(householdId: string) {
  const rows = await db
    .select({
      id: checklist.id,
      title: checklist.title,
      kind: checklist.kind,
      createdBy: checklist.createdBy,
      // невыполненные пункты (для плашек на мобильном)
      pendingCount: sql<number>`(select count(*)::int from checklist_item where checklist_item.list_id = checklist.id and checklist_item.done = false)`,
    })
    .from(checklist)
    .where(eq(checklist.householdId, householdId))
    .orderBy(asc(checklist.createdAt));
  return rows;
}

// список с проверкой принадлежности пространству
export async function getChecklist(householdId: string, listId: string) {
  const rows = await db
    .select({
      id: checklist.id,
      title: checklist.title,
      kind: checklist.kind,
    })
    .from(checklist)
    .where(and(eq(checklist.id, listId), eq(checklist.householdId, householdId)))
    .limit(1);
  return rows[0] ?? null;
}

// пункты списка: сначала невыполненные, потом выполненные
export async function listItems(listId: string) {
  return db
    .select({
      id: checklistItem.id,
      title: checklistItem.title,
      done: checklistItem.done,
      quantity: checklistItem.quantity,
      dueDate: checklistItem.dueDate,
      createdBy: checklistItem.createdBy,
    })
    .from(checklistItem)
    .where(eq(checklistItem.listId, listId))
    .orderBy(asc(checklistItem.done), asc(checklistItem.createdAt));
}

export type ShoppingPresetRow = Awaited<ReturnType<typeof listPresets>>[number];

// заготовки покупок пространства
export async function listPresets(householdId: string) {
  return db
    .select({
      id: shoppingPreset.id,
      title: shoppingPreset.title,
      quantity: shoppingPreset.quantity,
    })
    .from(shoppingPreset)
    .where(eq(shoppingPreset.householdId, householdId))
    .orderBy(asc(shoppingPreset.createdAt));
}

export type ShoppingWidgetData = Awaited<ReturnType<typeof getShoppingWidget>>;

// виджет «Рабочего стола»: первый список покупок и до 5 невыполненных пунктов
export async function getShoppingWidget(householdId: string) {
  const [list] = await db
    .select({ id: checklist.id, title: checklist.title })
    .from(checklist)
    .where(and(eq(checklist.householdId, householdId), eq(checklist.kind, 'shopping')))
    .orderBy(asc(checklist.createdAt))
    .limit(1);
  if (!list) return null;

  const items = await db
    .select({ id: checklistItem.id, title: checklistItem.title, quantity: checklistItem.quantity })
    .from(checklistItem)
    .where(and(eq(checklistItem.listId, list.id), eq(checklistItem.done, false)))
    .orderBy(asc(checklistItem.createdAt))
    .limit(5);
  return { list, items };
}
