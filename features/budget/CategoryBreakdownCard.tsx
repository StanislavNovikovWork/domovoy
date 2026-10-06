'use client';

import {
  ActionIcon,
  Box,
  ColorSwatch,
  Flex,
  Group,
  Paper,
  SegmentedControl,
  Stack,
  Tabs,
  Text,
} from '@mantine/core';
import { DonutChart } from '@mantine/charts';
import { IconChevronLeft, IconChevronRight, IconPlus } from '@tabler/icons-react';
import { formatMoney } from '@/shared/lib/money';
import type { CategoryTotal, TxType } from '@/shared/lib/budget';
import {
  PERIOD_OPTIONS,
  formatPeriodCaption,
  formatPeriodLabel,
  shiftDate,
  type Period,
} from '@/shared/lib/period';

type Props = {
  type: TxType;
  period: Period;
  date: string;
  totals: CategoryTotal[]; // уже за выбранный период и тип
  onTypeChange: (type: TxType) => void;
  onPeriodChange: (period: Period) => void;
  onDateChange: (date: string) => void;
  onAdd: () => void;
};

const CHART_SIZE = 200;

export function CategoryBreakdownCard({
  type,
  period,
  date,
  totals,
  onTypeChange,
  onPeriodChange,
  onDateChange,
  onAdd,
}: Props) {
  const sum = totals.reduce((acc, t) => acc + t.total, 0);
  const isEmpty = totals.length === 0;

  // Пустое состояние: серое кольцо-заглушка
  const chartData = isEmpty
    ? [{ name: 'Нет данных', value: 1, color: 'gray.3' }]
    : totals.map((t) => ({ name: t.name, value: t.total / 100, color: `${t.color}.6` }));

  return (
    <Paper withBorder radius="lg" p="lg">
      <Stack gap="md">
        <Tabs value={type} onChange={(v) => onTypeChange(v as TxType)}>
          <Tabs.List grow>
            <Tabs.Tab value="expense">Расходы</Tabs.Tab>
            <Tabs.Tab value="income">Доходы</Tabs.Tab>
          </Tabs.List>
        </Tabs>

        <SegmentedControl
          fullWidth
          radius="md"
          value={period}
          onChange={(v) => onPeriodChange(v as Period)}
          data={PERIOD_OPTIONS}
        />

        <Paper withBorder radius="md" px={6} py={4}>
          <Group justify="space-between" wrap="nowrap">
            <ActionIcon
              variant="subtle"
              color="gray"
              aria-label="Назад"
              onClick={() => onDateChange(shiftDate(period, date, -1))}
            >
              <IconChevronLeft size={18} />
            </ActionIcon>
            <Text size="sm" fw={500}>
              {formatPeriodLabel(period, date)}
            </Text>
            <ActionIcon
              variant="subtle"
              color="gray"
              aria-label="Вперёд"
              onClick={() => onDateChange(shiftDate(period, date, 1))}
            >
              <IconChevronRight size={18} />
            </ActionIcon>
          </Group>
        </Paper>

        <Flex direction={{ base: 'column', xs: 'row' }} align="center" gap="xl">
          <Box pos="relative" w={CHART_SIZE} h={CHART_SIZE} style={{ flexShrink: 0 }}>
            <DonutChart
              data={chartData}
              size={CHART_SIZE}
              thickness={26}
              withTooltip={!isEmpty}
              tooltipDataSource="segment"
              valueFormatter={(v) => formatMoney(v * 100)}
            />
            <Stack
              gap={0}
              align="center"
              justify="center"
              pos="absolute"
              inset={0}
              style={{ pointerEvents: 'none' }}
            >
              <Text fw={700} size="xl">
                {formatMoney(sum)}
              </Text>
              <Text size="xs" c="dimmed">
                {formatPeriodCaption(period, date)}
              </Text>
            </Stack>

            {/* привязана к правому нижнему углу самого графика */}
            <ActionIcon
              size={40}
              radius="xl"
              aria-label="Добавить операцию"
              onClick={onAdd}
              pos="absolute"
              bottom={-8}
              right={-8}
            >
              <IconPlus />
            </ActionIcon>
          </Box>

          <Stack gap="sm" style={{ flex: 1, width: '100%', minWidth: 0 }}>
            {isEmpty && (
              <Text c="dimmed" size="sm">
                Нет операций за этот период
              </Text>
            )}
            {totals.map((t) => (
              <Group key={t.categoryId} justify="space-between" wrap="nowrap" gap="md">
                <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
                  <ColorSwatch size={10} color={`var(--mantine-color-${t.color}-6)`} />
                  <Text size="sm" truncate>
                    {t.name}
                  </Text>
                </Group>
                <Group gap="md" wrap="nowrap">
                  <Text size="sm" c="dimmed" fw={600}>
                    {Math.round((t.total / sum) * 100)}%
                  </Text>
                  <Text size="sm" fw={600} ta="right" miw={80}>
                    {formatMoney(t.total)}
                  </Text>
                </Group>
              </Group>
            ))}
          </Stack>
        </Flex>
      </Stack>
    </Paper>
  );
}