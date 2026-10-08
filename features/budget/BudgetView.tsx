'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Box, Button, Group, SimpleGrid, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconSettings } from '@tabler/icons-react';
import { CategoriesModal } from '@/features/categories';
import {
  buildPlanRows,
  filterTransactions,
  groupByCategory,
  groupTransactions,
  type PlanItem,
  type TransactionItem,
  type TxType,
} from '@/shared/lib/budget';
import { getPeriodRange, monthStart, prevMonth, type Period } from '@/shared/lib/period';
import { AddTransactionModal, type CategoryOption } from './AddTransactionModal';
import { CategoryBreakdownCard } from './CategoryBreakdownCard';
import { PlanCard } from './PlanCard';
import { PlanModal } from './PlanModal';
import { TransactionGroups } from './TransactionGroups';

type Props = {
  householdId: string;
  initialDate: string;
  transactions: TransactionItem[];
  categories: CategoryOption[];
  plans: PlanItem[];
  /** дополнительные кнопки рядом с «Категории» (например, «Участники» в семейном бюджете) */
  actions?: ReactNode;
};

export function BudgetView({ householdId, initialDate, transactions, categories, plans, actions }: Props) {
  const [type, setType] = useState<TxType>('expense');
  const [period, setPeriod] = useState<Period>('month');
  const [date, setDate] = useState(initialDate);
  const [addOpened, addModal] = useDisclosure(false);
  const [catsOpened, catsModal] = useDisclosure(false);
  const [planOpened, planModal] = useDisclosure(false);
  // предзаполнение новой операции при оплате статьи плана
  const [prefill, setPrefill] = useState<{ categoryId: string; note: string; amount: number } | null>(null);

  const items = useMemo(
    () => filterTransactions(transactions, type, getPeriodRange(period, date)),
    [transactions, type, period, date],
  );
  const totals = useMemo(() => groupByCategory(items), [items]);
  const groups = useMemo(() => groupTransactions(items), [items]);

  // план всегда за месяц выбранной даты, независимо от периода сверху
  const planMonth = monthStart(date);
  const planRows = useMemo(
    () => buildPlanRows(plans, categories, transactions, planMonth, getPeriodRange('month', planMonth)),
    [plans, categories, transactions, planMonth],
  );
  const hasPrevPlan = useMemo(() => {
    const prev = prevMonth(planMonth);
    return buildPlanRows(plans, categories, [], prev, getPeriodRange('month', prev)).length > 0;
  }, [plans, categories, planMonth]);

  return (
    <Box pos="relative">
      <Group gap="xs" justify="flex-end" mb="md">
        {actions}
        <Button variant="default" leftSection={<IconSettings size={16} />} onClick={catsModal.open}>
          Категории
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
        <Stack gap="lg">
          <CategoryBreakdownCard
            type={type}
            period={period}
            date={date}
            totals={totals}
            onTypeChange={setType}
            onPeriodChange={setPeriod}
            onDateChange={setDate}
            onAdd={addModal.open}
          />

          <TransactionGroups groups={groups} />
        </Stack>

        <Box>
          <PlanCard
            householdId={householdId}
            month={planMonth}
            rows={planRows}
            canCopy={hasPrevPlan}
            onEdit={planModal.open}
            onPay={(categoryId, name, remaining) => {
              setPrefill({ categoryId, note: name, amount: remaining / 100 });
              addModal.open();
            }}
          />
        </Box>
      </SimpleGrid>

      <AddTransactionModal
        opened={addOpened}
        onClose={() => {
          addModal.close();
          setPrefill(null);
        }}
        householdId={householdId}
        categories={categories}
        defaultType={type}
        prefill={prefill}
      />

      <PlanModal
        opened={planOpened}
        onClose={planModal.close}
        householdId={householdId}
        month={planMonth}
        rows={planRows}
        categories={categories}
      />

      <CategoriesModal
        opened={catsOpened}
        onClose={catsModal.close}
        householdId={householdId}
        categories={categories}
      />
    </Box>
  );
}