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
  // операции, совпавшие со статьёй по «Что конкретно» (новые сверху)
  transactions: TransactionItem[];
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
  const byCategory = new Map<string, TransactionItem[]>();
  for (const t of transactions) {
    if (t.categoryType !== 'expense' || t.occurredOn < range.from || t.occurredOn >= range.to) continue;
    spent.set(t.categoryId, (spent.get(t.categoryId) ?? 0) + t.amount);
    byCategory.set(t.categoryId, [...(byCategory.get(t.categoryId) ?? []), t]);
  }

  const byId = new Map(categories.map((c) => [c.id, c]));
  const rows: PlanRow[] = [];
  for (const p of plans) {
    const c = byId.get(p.categoryId);
    if (p.month !== month || !c || c.type !== 'expense') continue;

    const total = spent.get(c.id) ?? 0;
    const categoryTransactions = byCategory.get(c.id) ?? [];
    const items = p.items.map((i) => {
      const matched = categoryTransactions.filter((t) => normalizeNote(t.note) === normalizeNote(i.name));
      return {
        name: i.name,
        planned: i.amount,
        spent: matched.reduce((acc, t) => acc + t.amount, 0),
        transactions: matched,
      };
    });
    const itemNames = new Set(p.items.map((i) => normalizeNote(i.name)));

    rows.push({
      categoryId: c.id,
      name: c.name,
      icon: c.icon,
      color: c.color,
      planned: p.amount,
      spent: total,
      items,
      otherTransactions: categoryTransactions.filter((t) => !itemNames.has(normalizeNote(t.note))),
    });
  }
  return rows.sort((a, b) => b.planned - a.planned);
}

export type PlanSummary = {
  planned: number; // сумма планов по категориям
  spentInPlan: number; // потрачено по запланированным категориям
  remaining: number; // planned - spentInPlan, может быть отрицательным
  pendingAmount: number; // остатки неоплаченных и частично оплаченных статей
  pendingCount: number;
};

export function summarizePlan(rows: PlanRow[]): PlanSummary {
  const planned = rows.reduce((acc, r) => acc + r.planned, 0);
  const spentInPlan = rows.reduce((acc, r) => acc + r.spent, 0);
  let pendingAmount = 0;
  let pendingCount = 0;
  for (const r of rows) {
    for (const i of r.items) {
      if (i.spent < i.planned) {
        pendingAmount += i.planned - i.spent;
        pendingCount += 1;
      }
    }
  }
  return { planned, spentInPlan, remaining: planned - spentInPlan, pendingAmount, pendingCount };
}

export type PendingPayment = {
  categoryId: string;
  categoryName: string;
  name: string;
  remaining: number; // копейки: план статьи минус уже потрачено
  partial: boolean;
};

// Неоплаченные и частично оплаченные статьи плана, от большего остатка к меньшему
export function listPendingPayments(rows: PlanRow[]): PendingPayment[] {
  return rows
    .flatMap((r) =>
      r.items
        .filter((i) => i.spent < i.planned)
        .map((i) => ({
          categoryId: r.categoryId,
          categoryName: r.name,
          name: i.name,
          remaining: i.planned - i.spent,
          partial: i.spent > 0,
        })),
    )
    .sort((a, b) => b.remaining - a.remaining);
}

// Строка единого списка категорий: траты, лимит (если есть), статьи плана и операции вне статей
export type CategoryRow = {
  categoryId: string;
  name: string;
  icon: string;
  color: string;
  spent: number;
  planned: number | null; // null: лимит не задан (или список вне режима плана)
  items: PlanRowItem[];
  transactions: TransactionItem[]; // все операции категории, а при наличии статей только не вошедшие в них
};

// Режим плана (расходы за месяц): категории с лимитом в порядке категорий, затем траты без лимита
export function buildCategoryRows(
  planRows: PlanRow[],
  monthItems: TransactionItem[],
  categoryOrder: string[],
): CategoryRow[] {
  const order = new Map(categoryOrder.map((id, index) => [id, index]));
  const planned: CategoryRow[] = planRows
    .map((r) => ({
      categoryId: r.categoryId,
      name: r.name,
      icon: r.icon,
      color: r.color,
      spent: r.spent,
      planned: r.planned,
      items: r.items,
      transactions: r.otherTransactions,
    }))
    .sort((a, b) => (order.get(a.categoryId) ?? 0) - (order.get(b.categoryId) ?? 0));

  const plannedIds = new Set(planRows.map((r) => r.categoryId));
  const unlimited: CategoryRow[] = groupTransactions(monthItems)
    .filter((g) => !plannedIds.has(g.categoryId))
    .map((g) => ({
      categoryId: g.categoryId,
      name: g.name,
      icon: g.icon,
      color: g.color,
      spent: g.total,
      planned: null,
      items: [],
      transactions: g.items,
    }));

  return [...planned, ...unlimited];
}

// Обычный режим (доходы или период не «Месяц»): категории с тратами за период
export function buildPlainRows(items: TransactionItem[]): CategoryRow[] {
  return groupTransactions(items).map((g) => ({
    categoryId: g.categoryId,
    name: g.name,
    icon: g.icon,
    color: g.color,
    spent: g.total,
    planned: null,
    items: [],
    transactions: g.items,
  }));
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