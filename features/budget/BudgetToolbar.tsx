'use client';

import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { ActionIcon, Flex, Group, SegmentedControl, Text } from '@mantine/core';
import type { TxType } from '@/shared/lib/budget';
import { PERIOD_OPTIONS, formatPeriodLabel, shiftDate, type Period } from '@/shared/lib/period';

type Props = {
  expenseOnly: boolean;
  type: TxType;
  period: Period;
  date: string;
  onTypeChange: (type: TxType) => void;
  onPeriodChange: (period: Period) => void;
  onDateChange: (date: string) => void;
};

// фильтры периодического бюджета: расходы/доходы, период и навигация по нему (живут внутри SummaryCard)
export function BudgetFilters({
  expenseOnly,
  type,
  period,
  date,
  onTypeChange,
  onPeriodChange,
  onDateChange,
}: Props) {
  return (
    // десктоп: слева тип и период, справа навигация по периоду (у правого края карточки);
    // мобильные: переключатели слева (справа запас 48px под кнопку «+» в углу карточки),
    // навигация по периоду отдельной строкой по центру
    <Flex gap="md" wrap="wrap" justify={{ base: 'center', sm: 'space-between' }} align="center">
      <Group gap="md" w={{ base: '100%', sm: 'auto' }} pr={{ base: 48, sm: 0 }}>
        {!expenseOnly && (
          <SegmentedControl
            radius="md"
            value={type}
            onChange={(v) => onTypeChange(v as TxType)}
            data={[
              { value: 'expense', label: 'Расходы' },
              { value: 'income', label: 'Доходы' },
            ]}
          />
        )}
        <SegmentedControl
          radius="md"
          value={period}
          onChange={(v) => onPeriodChange(v as Period)}
          data={PERIOD_OPTIONS}
        />
      </Group>
      <Group gap={4} wrap="nowrap">
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
    </Flex>
  );
}
