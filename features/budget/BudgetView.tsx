'use client';

import { useMemo, useState } from 'react';
import { Button, Group, SimpleGrid, Stack, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconSettings } from '@tabler/icons-react';
import { CategoriesModal } from '@/features/categories';
import {
  filterTransactions,
  groupByCategory,
  groupTransactions,
  type TransactionItem,
  type TxType,
} from '@/shared/lib/budget';
import { getPeriodRange, type Period } from '@/shared/lib/period';
import { AddTransactionModal, type CategoryOption } from './AddTransactionModal';
import { CategoryBreakdownCard } from './CategoryBreakdownCard';
import { TransactionGroups } from './TransactionGroups';

type Props = {
  householdId: string;
  initialDate: string;
  transactions: TransactionItem[];
  categories: CategoryOption[];
};

export function BudgetView({ householdId, initialDate, transactions, categories }: Props) {
  const [type, setType] = useState<TxType>('expense');
  const [period, setPeriod] = useState<Period>('month');
  const [date, setDate] = useState(initialDate);
  const [addOpened, addModal] = useDisclosure(false);
  const [catsOpened, catsModal] = useDisclosure(false);

  const items = useMemo(
    () => filterTransactions(transactions, type, getPeriodRange(period, date)),
    [transactions, type, period, date],
  );
  const totals = useMemo(() => groupByCategory(items), [items]);
  const groups = useMemo(() => groupTransactions(items), [items]);

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2}>Бюджет</Title>
        <Button variant="default" leftSection={<IconSettings size={16} />} onClick={catsModal.open}>
          Категории
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
        {/* левая колонка; правая пока пустая, туда пойдут сводка баланса и лимиты */}
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
      </SimpleGrid>

      <AddTransactionModal
        opened={addOpened}
        onClose={addModal.close}
        householdId={householdId}
        categories={categories}
        defaultType={type}
      />

      <CategoriesModal
        opened={catsOpened}
        onClose={catsModal.close}
        householdId={householdId}
        categories={categories}
      />
    </Stack>
  );
}