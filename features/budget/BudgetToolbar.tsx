'use client';

import { ActionIcon, Button, Group, SegmentedControl, Text } from '@mantine/core';
import { IconChevronLeft, IconChevronRight, IconPlus } from '@tabler/icons-react';
import type { TxType } from '@/shared/lib/budget';
import { PERIOD_OPTIONS, formatPeriodLabel, shiftDate, type Period } from '@/shared/lib/period';

type Props = {
  type: TxType;
  period: Period;
  date: string;
  onTypeChange: (type: TxType) => void;
  onPeriodChange: (period: Period) => void;
  onDateChange: (date: string) => void;
  onAdd: () => void;
};

export function BudgetToolbar({ type, period, date, onTypeChange, onPeriodChange, onDateChange, onAdd }: Props) {
  return (
    <Group justify="space-between" gap="md">
      <Group gap="md">
        <SegmentedControl
          radius="md"
          value={type}
          onChange={(v) => onTypeChange(v as TxType)}
          data={[
            { value: 'expense', label: 'Расходы' },
            { value: 'income', label: 'Доходы' },
          ]}
        />
        <SegmentedControl
          radius="md"
          value={period}
          onChange={(v) => onPeriodChange(v as Period)}
          data={PERIOD_OPTIONS}
        />
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
      </Group>

      <Button leftSection={<IconPlus size={16} />} onClick={onAdd}>
        Добавить операцию
      </Button>
    </Group>
  );
}
