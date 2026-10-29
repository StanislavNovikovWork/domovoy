'use client';

import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { ActionIcon, Group, SegmentedControl, Stack, Text } from '@mantine/core';
import { formatPeriodLabel, shiftDate, type Period } from '@/shared/lib/period';

// табы периода в деталях типа: без «Дня»
const PERIOD_TABS: { value: Period; label: string }[] = [
  { value: 'week', label: 'Нед' },
  { value: 'month', label: 'Мес' },
  { value: 'year', label: 'Год' },
];

type Props = {
  period: Period;
  date: string;
  onPeriodChange: (period: Period) => void;
  onDateChange: (date: string) => void;
};

// фильтры периодического бюджета внутри сводки: табы периода и навигация по нему
export function BudgetFilters({ period, date, onPeriodChange, onDateChange }: Props) {
  return (
    <Stack gap="md">
      <SegmentedControl
        fullWidth
        radius="md"
        value={period}
        onChange={(v) => onPeriodChange(v as Period)}
        data={PERIOD_TABS}
      />
      <Group gap={4} wrap="nowrap" justify="center">
        <ActionIcon
          variant="subtle"
          color="gray"
          aria-label="Назад"
          onClick={() => onDateChange(shiftDate(period, date, -1))}
        >
          <IconChevronLeft size={18} />
        </ActionIcon>
        <Text size="sm" fw={500} ta="center" miw={140}>
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
    </Stack>
  );
}
