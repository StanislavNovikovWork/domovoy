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