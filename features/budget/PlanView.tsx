'use client';

import { useMemo, useOptimistic, useState, useTransition } from 'react';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { ActionIcon, Group, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { PageTopBar } from '@/features/app-shell';
import { CategoriesModal } from '@/features/categories';
import { createTransaction, updateTransaction } from '@/server/transactions/actions';
import {
  buildPlanRows,
  type PlanItem,
  type TransactionItem,
} from '@/shared/lib/budget';
import {
  ALL_TIME_RANGE,
  ONE_TIME_MONTH,
  getPeriodRange,
  monthStart,
  prevMonth,
  shiftDate,
} from '@/shared/lib/period';
import {
  AddTransactionModal,
  type CategoryOption,
  type SaveTransactionRequest,
  type ShareParticipant,
} from './AddTransactionModal';
import { MonthPlan } from './MonthPlan';
import { PlanModal } from './PlanModal';

type OptimisticAction =
  | { type: 'add'; item: TransactionItem }
  | { type: 'update'; item: TransactionItem }
  | { type: 'delete'; id: string };

type Props = {
  householdId: string;
  initialDate: string;
  transactions: TransactionItem[];
  categories: CategoryOption[];
  plans: PlanItem[];
  /** false: разовый бюджет — единый план без переключения месяцев */
  periodic: boolean;
  members?: ShareParticipant[];
  guestNames?: string[];
  currentUserId?: string;
  /** у разового бюджета план меняет только владелец; участнику — список для чтения */
  role: 'owner' | 'member';
};

// страница «План затрат»: тот же план, что на вкладке «План» бюджета, но отдельным разделом
export function PlanView({
  householdId,
  initialDate,
  transactions: serverTransactions,
  categories,
  plans,
  periodic,
  members,
  guestNames,
  currentUserId,
  role,
}: Props) {
  const [transactions, applyOptimistic] = useOptimistic(
    serverTransactions,
    (state, action: OptimisticAction): TransactionItem[] => {
      switch (action.type) {
        case 'add':
          return [action.item, ...state].sort((a, b) =>
            a.occurredOn < b.occurredOn ? 1 : a.occurredOn > b.occurredOn ? -1 : 0
          );
        case 'update':
          return state.map((t) => (t.id === action.item.id ? action.item : t));
        case 'delete':
          return state.filter((t) => t.id !== action.id);
      }
    }
  );
  const [, startTransition] = useTransition();

  const [date, setDate] = useState(initialDate);
  const [addOpened, addModal] = useDisclosure(false);
  const [planOpened, planModal] = useDisclosure(false);
  const [catsOpened, catsModal] = useDisclosure(false);
  // предзаполнение новой операции при оплате статьи плана
  const [prefill, setPrefill] = useState<{
    categoryId: string;
    note: string;
    amount: number;
  } | null>(null);

  const planMonth = periodic ? monthStart(date) : ONE_TIME_MONTH;
  const planRange = periodic ? getPeriodRange('month', planMonth) : ALL_TIME_RANGE;
  const planRows = useMemo(
    () => buildPlanRows(plans, categories, transactions, planMonth, planRange),
    [plans, categories, transactions, planMonth, planRange]
  );
  const hasPrevPlan = useMemo(() => {
    if (!periodic) return false;
    const prev = prevMonth(planMonth);
    return buildPlanRows(plans, categories, [], prev, getPeriodRange('month', prev)).length > 0;
  }, [plans, categories, planMonth, periodic]);

  const pay = (categoryId: string, name: string, remaining: number) => {
    setPrefill({ categoryId, note: name, amount: remaining / 100 });
    addModal.open();
  };

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
    <Stack gap="lg" maw={560}>
      <PageTopBar
        backHref={`/budgets/${householdId}`}
        backLabel="К пространству"
        title="План затрат"
        right={
          periodic ? (
            <Group gap={4} wrap="nowrap">
              <ActionIcon
                variant="subtle"
                color="gray"
                aria-label="Прошлый месяц"
                onClick={() => setDate(shiftDate('month', date, -1))}
              >
                <IconChevronLeft size={18} />
              </ActionIcon>
              <ActionIcon
                variant="subtle"
                color="gray"
                aria-label="Следующий месяц"
                onClick={() => setDate(shiftDate('month', date, 1))}
              >
                <IconChevronRight size={18} />
              </ActionIcon>
            </Group>
          ) : undefined
        }
      />

      <MonthPlan
        householdId={householdId}
        month={planMonth}
        rows={planRows}
        canCopy={hasPrevPlan}
        onEdit={planModal.open}
        onPay={periodic ? pay : undefined}
        bare
        periodic={periodic}
        canEdit={periodic || role === 'owner'}
        onEditCategories={catsModal.open}
      />

      <AddTransactionModal
        opened={addOpened}
        onClose={() => {
          addModal.close();
          setPrefill(null);
        }}
        onSave={saveTransaction}
        householdId={householdId}
        categories={categories}
        members={periodic ? undefined : members}
        guestNames={guestNames}
        currentUserId={currentUserId}
        expenseOnly={!periodic}
        defaultType="expense"
        prefill={prefill}
      />

      <PlanModal
        opened={planOpened}
        onClose={planModal.close}
        householdId={householdId}
        periodic={periodic}
        month={planMonth}
        rows={planRows}
        categories={categories}
      />

      <CategoriesModal
        opened={catsOpened}
        onClose={catsModal.close}
        householdId={householdId}
        categories={categories}
        expenseOnly={!periodic}
      />
    </Stack>
  );
}

