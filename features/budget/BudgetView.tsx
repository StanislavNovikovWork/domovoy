'use client';

import { useState } from 'react';
import { ActionIcon, Group, Stack, Tabs, Text, ThemeIcon, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { DonutChart } from '@mantine/charts';
import { IconPlus } from '@tabler/icons-react';
import { CategoryIcon } from '@/shared/ui/CategoryIcon';
import { formatMoney } from '@/shared/lib/money';
import { AddTransactionModal, type CategoryOption } from './AddTransactionModal';

type Type = 'expense' | 'income';

type TransactionItem = {
  id: string;
  amount: number;
  occurredOn: string;
  note: string | null;
  categoryName: string;
  categoryType: Type;
  categoryIcon: string;
  categoryColor: string;
};

type CategoryTotal = {
  categoryId: string;
  name: string;
  type: Type;
  color: string;
  total: number;
};

type Props = {
  householdId: string;
  monthLabel: string;
  transactions: TransactionItem[];
  totals: CategoryTotal[];
  categories: CategoryOption[];
};

export function BudgetView({ householdId, monthLabel, transactions, totals, categories }: Props) {
  const [type, setType] = useState<Type>('expense');
  const [modalOpened, modal] = useDisclosure(false);

  const typeTotals = totals.filter((t) => t.type === type);
  const sum = typeTotals.reduce((acc, t) => acc + t.total, 0);
  const isEmpty = typeTotals.length === 0;

  // Пустое состояние: серое кольцо-заглушка
  const chartData = isEmpty
    ? [{ name: 'Нет данных', value: 1, color: 'gray.3' }]
    : typeTotals.map((t) => ({
        name: t.name,
        value: t.total / 100,
        color: `${t.color}.6`,
      }));

  const items = transactions.filter((t) => t.categoryType === type);

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>Бюджет</Title>
        <Text c="dimmed" tt="capitalize">
          {monthLabel}
        </Text>
      </div>

      <Tabs value={type} onChange={(v) => setType(v as Type)}>
        <Tabs.List grow>
          <Tabs.Tab value="expense">Расходы</Tabs.Tab>
          <Tabs.Tab value="income">Доходы</Tabs.Tab>
        </Tabs.List>
      </Tabs>

      <Group justify="center" align="center" gap="xl">
        <DonutChart
          data={chartData}
          size={180}
          thickness={22}
          withTooltip={!isEmpty}
          tooltipDataSource="segment"
          chartLabel={formatMoney(sum)}
          valueFormatter={(v) => formatMoney(v * 100)}
        />
        <ActionIcon size="xl" radius="xl" aria-label="Добавить операцию" onClick={modal.open}>
          <IconPlus />
        </ActionIcon>
      </Group>

      <Stack gap="sm">
        {items.length === 0 && (
          <Text c="dimmed" ta="center">
            Пока нет операций за этот месяц
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