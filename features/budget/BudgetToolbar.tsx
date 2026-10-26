'use client';

import { IconChevronLeft, IconChevronRight, IconFilter } from '@tabler/icons-react';
import { ActionIcon, Box, Flex, Group, SegmentedControl, Text } from '@mantine/core';
import type { TxType } from '@/shared/lib/budget';
import { PERIOD_OPTIONS, formatPeriodLabel, shiftDate, type Period } from '@/shared/lib/period';

type PeriodProps = {
  period: Period;
  date: string;
  onPeriodChange: (period: Period) => void;
  onDateChange: (date: string) => void;
};

// навигация по периоду: стрелки и подпись выбранного диапазона
function PeriodNav({ period, date, onDateChange }: Omit<PeriodProps, 'onPeriodChange'>) {
  return (
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
  );
}

function PeriodSwitch({ period, onPeriodChange }: Pick<PeriodProps, 'period' | 'onPeriodChange'>) {
  return (
    <SegmentedControl
      radius="md"
      value={period}
      onChange={(v) => onPeriodChange(v as Period)}
      data={PERIOD_OPTIONS}
    />
  );
}

// раскрываемая на мобильных панель: табы периода и навигация по нему
export function PeriodFilters({ period, date, onPeriodChange, onDateChange }: PeriodProps) {
  return (
    <Flex gap="md" wrap="wrap" justify="center" align="center">
      <PeriodSwitch period={period} onPeriodChange={onPeriodChange} />
      <PeriodNav period={period} date={date} onDateChange={onDateChange} />
    </Flex>
  );
}

type Props = PeriodProps & {
  expenseOnly: boolean;
  type: TxType;
  onTypeChange: (type: TxType) => void;
  // мобильные: иконка фильтра показывает/прячет панель с периодом
  periodFiltersOpened: boolean;
  onTogglePeriodFilters: () => void;
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
  periodFiltersOpened,
  onTogglePeriodFilters,
}: Props) {
  return (
    // десктоп: слева тип и период, справа навигация по периоду (у правого края карточки);
    // мобильные: только тип и иконка фильтра периода (справа запас 48px под кнопку «+»),
    // период и навигация выезжают отдельной панелью под сводкой (PeriodFilters)
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
        <Box visibleFrom="sm">
          <PeriodSwitch period={period} onPeriodChange={onPeriodChange} />
        </Box>
        {/* мобильные: кнопка фильтра у правого края, перед запасом под «+» */}
        <ActionIcon
          hiddenFrom="sm"
          variant={periodFiltersOpened ? 'filled' : 'default'}
          radius="xl"
          aria-label="Фильтр периода"
          aria-expanded={periodFiltersOpened}
          onClick={onTogglePeriodFilters}
          ml="auto"
        >
          <IconFilter size={18} />
        </ActionIcon>
      </Group>
      <Group visibleFrom="sm">
        <PeriodNav period={period} date={date} onDateChange={onDateChange} />
      </Group>
    </Flex>
  );
}
