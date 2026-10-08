export type TxType = 'expense' | 'income';

export type TransactionItem = {
  id: string;
  amount: number; // копейки
  occurredOn: string; // YYYY-MM-DD
  note: string | null;
  categoryId: string;
  categoryName: string;
  categoryType: TxType;
  categoryIcon: string;
  categoryColor: string;
};

export type CategoryTotal = {
  categoryId: string;
  name: string;
  color: string;
  total: number;
};

// Операции нужного типа внутри [from, to)
export function filterTransactions(
  transactions: TransactionItem[],
  type: TxType,
  range: { from: string; to: string },
): TransactionItem[] {
  return transactions.filter(
    (t) => t.categoryType === type && t.occurredOn >= range.from && t.occurredOn < range.to,
  );
}

// Суммы по категориям, от большей к меньшей
export function groupByCategory(items: TransactionItem[]): CategoryTotal[] {
  const map = new Map<string, CategoryTotal>();
  for (const t of items) {
    const current = map.get(t.categoryId);
    if (current) {
      current.total += t.amount;
    } else {
      map.set(t.categoryId, {
        categoryId: t.categoryId,
        name: t.categoryName,
        color: t.categoryColor,
        total: t.amount,
      });
    }
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

export type PlanSubItem = {
  name: string;
  amount: number; // копейки
};

export type PlanItem = {
  categoryId: string;
  month: string; // YYYY-MM-01
  amount: number; // копейки; при наличии статей равна их сумме
  items: PlanSubItem[];
};

export type PlanRowItem = {
  name: string;
  planned: number;
  spent: number;
};

export type PlanRow = {
  categoryId: string;
  name: string;
  icon: string;
  color: string;
  planned: number;
  spent: number;
  items: PlanRowItem[];
  // операции категории за месяц, не попавшие ни в одну статью (новые сверху, как в списке операций)
  otherTransactions: TransactionItem[];
};

const normalizeNote = (s: string | null) => (s ?? '').trim().toLowerCase();

// Строки плана на месяц: цель + сколько уже потрачено. Категории без цели и архивные не попадают.
// Факт по статье = операции категории, у которых «Что конкретно» совпадает с названием статьи
export function buildPlanRows(
  plans: PlanItem[],
  categories: { id: string; name: string; type: TxType; icon: string; color: string }[],
  transactions: TransactionItem[],
  month: string,
  range: { from: string; to: string },
): PlanRow[] {
  const spent = new Map<string, number>();
  const spentByNote = new Map<string, number>();
  const byCategory = new Map<string, TransactionItem[]>();
  for (const t of transactions) {
    if (t.categoryType !== 'expense' || t.occurredOn < range.from || t.occurredOn >= range.to) continue;
    spent.set(t.categoryId, (spent.get(t.categoryId) ?? 0) + t.amount);
    const key = `${t.categoryId}|${normalizeNote(t.note)}`;
    spentByNote.set(key, (spentByNote.get(key) ?? 0) + t.amount);
    byCategory.set(t.categoryId, [...(byCategory.get(t.categoryId) ?? []), t]);
  }

  const byId = new Map(categories.map((c) => [c.id, c]));
  const rows: PlanRow[] = [];
  for (const p of plans) {
    const c = byId.get(p.categoryId);
    if (p.month !== month || !c || c.type !== 'expense') continue;

    const total = spent.get(c.id) ?? 0;
    const items = p.items.map((i) => ({
      name: i.name,
      planned: i.amount,
      spent: spentByNote.get(`${c.id}|${normalizeNote(i.name)}`) ?? 0,
    }));
    const itemNames = new Set(p.items.map((i) => normalizeNote(i.name)));

    rows.push({
      categoryId: c.id,
      name: c.name,
      icon: c.icon,
      color: c.color,
      planned: p.amount,
      spent: total,
      items,
      otherTransactions: (byCategory.get(c.id) ?? []).filter((t) => !itemNames.has(normalizeNote(t.note))),
    });
  }
  return rows.sort((a, b) => b.planned - a.planned);
}

export type CategoryGroup = {
  categoryId: string;
  name: string;
  icon: string;
  color: string;
  total: number;
  items: TransactionItem[];
};

// Группы по категориям: от большей суммы к меньшей, операции внутри сохраняют порядок (новые сверху)
export function groupTransactions(items: TransactionItem[]): CategoryGroup[] {
  const map = new Map<string, CategoryGroup>();
  for (const t of items) {
    const group = map.get(t.categoryId);
    if (group) {
      group.total += t.amount;
      group.items.push(t);
    } else {
      map.set(t.categoryId, {
        categoryId: t.categoryId,
        name: t.categoryName,
        icon: t.categoryIcon,
        color: t.categoryColor,
        total: t.amount,
        items: [t],
      });
    }
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}