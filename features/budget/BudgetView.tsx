'use client';

import { useMemo, useState } from 'react';
import { Group, Paper, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { CategoryIcon } from '@/shared/ui/CategoryIcon';
import { formatMoney } from '@/shared/lib/money';
import { filterTransactions, groupByCategory, type TransactionItem, type TxType } from '@/shared/lib/budget';
import { getPeriodRange, type Period } from '@/shared/lib/period';
import { AddTransactionModal, type CategoryOption } from './AddTransactionModal';
import { CategoryBreakdownCard } from './CategoryBreakdownCard';

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
  const [modalOpened, modal] = useDisclosure(false);

  const items = useMemo(
    () => filterTransactions(transactions, type, getPeriodRange(period, date)),
    [transactions, type, period, date],
  );
  const totals = useMemo(() => groupByCategory(items), [items]);

  return (
    <Stack gap="lg">

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
            onAdd={modal.open}
          />

          <Paper withBorder radius="lg" p="lg">
            <Stack gap="md">
              {items.length === 0 && (
                <Text c="dimmed" ta="center" size="sm">
                  Пока нет операций за этот период
                </Text>
              )}

              {items.map((t) => (
                <Group key={t.id} justify="space-between" wrap="nowrap">
                  <Group gap="sm" wrap="nowrap">
                    <ThemeIcon variant="light" color={t.categoryColor} size="lg" radius="xl">
                      <CategoryIcon name={t.categoryIcon} />
                    </ThemeIcon>
                    <div>
                      <Text size="sm" fw={500}>
                        {t.categoryName}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {new Date(`${t.occurredOn}T00:00:00`).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'long',
                        })}
                        {t.note ? ` · ${t.note}` : ''}
                      </Text>
                    </div>
                  </Group>
                  <Text fw={600}>{formatMoney(t.amount)}</Text>
                </Group>
              ))}
            </Stack>
          </Paper>
        </Stack>
      </SimpleGrid>

      <AddTransactionModal
        opened={modalOpened}
        onClose={modal.close}
        householdId={householdId}
        categories={categories}
        defaultType={type}
      />
    </Stack>
  );
}