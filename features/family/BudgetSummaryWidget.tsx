'use client';

import { useMemo, useOptimistic, useState, useTransition } from 'react';
import { useDisclosure } from '@mantine/hooks';
import {
  AddTransactionModal,
  type CategoryOption,
  type SaveTransactionRequest,
  type ShareParticipant,
} from '@/features/budget/AddTransactionModal';
import { BudgetFilters } from '@/features/budget/BudgetToolbar';
import { SummaryCard } from '@/features/budget/SummaryCard';
import {
  createTransaction,
  updateTransaction,
} from '@/server/transactions/actions';
import {
  filterTransactions,
  groupTransactions,
  type TransactionItem,
  type TxType,
} from '@/shared/lib/budget';
import {
  ALL_TIME_RANGE,
  getPeriodRange,
  shiftDate,
  type Period,
} from '@/shared/lib/period';

// фактическая трата пользователя по операции: его доля, а не сумма, которую он платил
function mySpend(t: TransactionItem, userId?: string) {
  const share = t.shares?.find((s) => s.userId === userId);
  if (share) return share.amount;
  if (!t.shares?.length && t.paidByUserId === userId) return t.amount;
  return 0;
}

type OptimisticAction =
  | { type: 'add'; item: TransactionItem }
  | { type: 'update'; item: TransactionItem }
  | { type: 'delete'; id: string };

export type BudgetWidgetData = {
  periodic: boolean;
  initialDate: string;
  transactions: TransactionItem[];
  categories: CategoryOption[];
  members: ShareParticipant[];
  guestNames: string[];
  currentUserId: string;
  role: 'owner' | 'member';
};

// виджет «Рабочего стола»: та же сводка расходов и доходов, что вверху страницы бюджета
export function BudgetSummaryWidget({
  householdId,
  data,
}: {
  householdId: string;
  data: BudgetWidgetData;
}) {
  const { periodic, initialDate, categories, members, guestNames, currentUserId } = data;

  const [transactions, applyOptimistic] = useOptimistic(
    data.transactions,
    (state, action: OptimisticAction): TransactionItem[] => {
      switch (action.type) {
        case 'add':
          return [action.item, ...state].sort((a, b) =>
            a.occurredOn < b.occurredOn ? 1 : a.occurredOn > b.occurredOn ? -1 : 0
          );
        case 'update':
          return state
            .map((t) => (t.id === action.item.id ? action.item : t))
            .sort((a, b) =>
              a.occurredOn < b.occurredOn ? 1 : a.occurredOn > b.occurredOn ? -1 : 0
            );
        case 'delete':
          return state.filter((t) => t.id !== action.id);
      }
    }
  );
  const [, startTransition] = useTransition();

  const [selected, setSelected] = useState<TxType | null>(null);
  const [period, setPeriod] = useState<Period>('month');
  const [date, setDate] = useState(initialDate);
  const [addOpened, addModal] = useDisclosure(false);

  const range = useMemo(
    () => (periodic ? getPeriodRange(period, date) : ALL_TIME_RANGE),
    [periodic, period, date]
  );

  const items = useMemo(
    () =>
      periodic && !selected
        ? transactions.filter((t) => t.occurredOn >= range.from && t.occurredOn < range.to)
        : filterTransactions(transactions, selected ?? 'expense', range),
    [transactions, selected, range, periodic]
  );

  // плитки обзора и сектора диаграммы в деталях: итог и доли категорий по каждому типу
  const tile = useMemo(
    () => (t: TxType) => {
      const list = filterTransactions(transactions, t, range);
      return {
        total: list.reduce((acc, x) => acc + x.amount, 0),
        slices: groupTransactions(list).map((g) => ({
          name: g.name,
          value: g.total,
          color: `${g.color}.6`,
          icon: g.icon,
        })),
      };
    },
    [transactions, range]
  );
  const expenseTile = useMemo(() => tile('expense'), [tile]);
  const incomeTile = useMemo(() => tile('income'), [tile]);

  // слайды свайпера: доли категорий выбранного типа за 7 периодов вокруг текущего
  const chartSlides = useMemo(() => {
    if (!periodic || !selected) return undefined;
    return [-3, -2, -1, 0, 1, 2, 3].map((off) =>
      groupTransactions(
        filterTransactions(transactions, selected, getPeriodRange(period, shiftDate(period, date, off)))
      ).map((g) => ({ name: g.name, value: g.total, color: `${g.color}.6`, icon: g.icon }))
    );
  }, [periodic, selected, period, date, transactions]);

  const shareTotals = useMemo(() => {
    if (periodic) return [];
    const map = new Map<string, number>();
    for (const t of transactions) {
      for (const s of t.shares ?? []) map.set(s.name, (map.get(s.name) ?? 0) + s.amount);
    }
    return [...map.entries()]
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [transactions, periodic]);

  const total = useMemo(() => items.reduce((acc, t) => acc + t.amount, 0), [items]);

  const saveTransaction = ({ item, payload, editingId }: SaveTransactionRequest) => {
    startTransition(async () => {
      applyOptimistic({ type: editingId ? 'update' : 'add', item });
      try {
        if (editingId) await updateTransaction({ ...payload, id: editingId });
        else await createTransaction({ ...payload, id: item.id });
      } catch {
        // сеть недоступна: оптимистичная запись откатится сама
      }
    });
  };

  return (
    <>
      <SummaryCard
        periodic={periodic}
        period={period}
        date={date}
        selected={selected}
        onSelectType={setSelected}
        expense={expenseTile}
        income={incomeTile}
        slides={chartSlides}
        onShiftDate={(dir) => setDate(shiftDate(period, date, dir))}
        total={total}
        shareTotals={shareTotals}
        onAdd={addModal.open}
        filters={
          periodic ? (
            <BudgetFilters
              period={period}
              onPeriodChange={(p) => {
                setPeriod(p);
                setDate(initialDate);
              }}
            />
          ) : undefined
        }
      />
      <AddTransactionModal
        opened={addOpened}
        onClose={addModal.close}
        onSave={saveTransaction}
        householdId={householdId}
        categories={categories}
        members={periodic ? undefined : members}
        guestNames={guestNames}
        currentUserId={currentUserId}
        expenseOnly={!periodic}
        defaultType={selected ?? 'expense'}
      />
    </>
  );
}
