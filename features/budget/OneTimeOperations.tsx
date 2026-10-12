'use client';

import { Anchor, Group, Paper, Stack, Text } from '@mantine/core';
import type { TransactionItem } from '@/shared/lib/budget';
import { formatMoney } from '@/shared/lib/money';
import { formatShortDate } from '@/shared/lib/period';
import { signedMoney } from './SidePanel';

const divider = { borderTop: '1px solid var(--mantine-color-default-border)' } as const;

type Props = {
  items: TransactionItem[];
  onShowAll?: () => void;
  // без обводки и отступов: внутри табов на мобильных
  bare?: boolean;
};

type Day = { date: string; total: number; items: TransactionItem[] };

// операции приходят отсортированными по дате (новые сверху): группируем подряд идущие по дню
function groupByDay(items: TransactionItem[]): Day[] {
  const days: Day[] = [];
  for (const t of items) {
    const last = days[days.length - 1];
    if (last && last.date === t.occurredOn) {
      last.items.push(t);
      last.total += t.amount;
    } else {
      days.push({ date: t.occurredOn, total: t.amount, items: [t] });
    }
  }
  return days;
}

// блок операций разового бюджета; отдельно от RecentCard, чтобы менять его независимо
export function OneTimeOperations({ items, onShowAll, bare }: Props) {
  const days = groupByDay(items);

  const content = (
    <Stack gap="xs">
      {onShowAll && (
        <Group justify="flex-end">
          <Anchor component="button" type="button" size="sm" onClick={onShowAll}>
            Все операции
          </Anchor>
        </Group>
      )}

      {days.length === 0 ? (
        <Text c="dimmed" size="sm">
          Пока нет операций
        </Text>
      ) : (
        <Stack gap={0}>
          {days.map((day, index) => (
            <Stack
              key={day.date}
              gap={4}
              py="sm"
              style={index > 0 ? divider : undefined}
            >
              <Group justify="space-between" wrap="nowrap">
                <Text size="xs" fw={600} c="dimmed">
                  {formatShortDate(day.date)}
                </Text>
                <Text size="xs" fw={600} c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                  {formatMoney(day.total)}
                </Text>
              </Group>
              {day.items.map((t) => (
                <Group key={t.id} gap="sm" wrap="nowrap">
                  <Text size="sm" truncate style={{ flex: 1, minWidth: 0 }}>
                    {t.note || t.categoryName}
                  </Text>
                  <Text size="sm" fw={500} style={{ whiteSpace: 'nowrap' }}>
                    {signedMoney(t)}
                  </Text>
                </Group>
              ))}
            </Stack>
          ))}
        </Stack>
      )}
    </Stack>
  );

  return bare ? (
    content
  ) : (
    <Paper withBorder radius="lg" p="lg">
      {content}
    </Paper>
  );
}
