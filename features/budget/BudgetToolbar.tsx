'use client';

import { SegmentedControl } from '@mantine/core';
import type { Period } from '@/shared/lib/period';

// табы периода в деталях типа: без «Дня»
const PERIOD_TABS: { value: Period; label: string }[] = [
  { value: 'week', label: 'Нед' },
  { value: 'month', label: 'Мес' },
  { value: 'year', label: 'Год' },
];

type Props = {
  period: Period;
  onPeriodChange: (period: Period) => void;
};

// фильтр периодического бюджета внутри сводки: компактный таббар слева,
// листание дат — свайпом по кольцевой диаграмме
export function BudgetFilters({ period, onPeriodChange }: Props) {
  return (
    <SegmentedControl
      size="sm"
      radius="xl"
      p={0}
      w="fit-content"
      withItemsBorders={false}
      // каждый таб на 10px шире: +5px бокового паддинга с двух сторон
      styles={{ label: { paddingInline: 'calc(var(--mantine-spacing-md) + 5px)' } }}
      value={period}
      onChange={(v) => onPeriodChange(v as Period)}
      data={PERIOD_TABS}
    />
  );
}
