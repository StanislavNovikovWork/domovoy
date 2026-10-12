'use client';

import type { ReactNode } from 'react';
import { Anchor, Avatar, Divider, Group, Paper, Stack, Text, Tooltip } from '@mantine/core';
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
  // кнопки справа от суммы (редактирование и удаление в окне «Все операции»)
  renderActions?: (t: TransactionItem) => ReactNode;
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
export function OneTimeOperations({ items, onShowAll, bare, renderActions }: Props) {
  const days = groupByDay(items);

  const content = (
    <Stack gap={0}>
      {!bare && (
        <Group justify="space-between" pt={8}>
          <Text fw={600}>Список операций</Text>
          {onShowAll && (
            <Anchor component="button" type="button" size="sm" onClick={onShowAll}>
              Все операции
            </Anchor>
          )}
        </Group>
      )}
      {!bare && <Divider mt={2} />}

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
                <Group key={t.id} gap="sm" wrap="nowrap" align="flex-start">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Group gap={6} wrap="nowrap">
                      <Text size="sm" truncate style={{ minWidth: 0 }}>
                        {t.note || t.categoryName}
                      </Text>
                      {t.paidByName && (
                        <Tooltip label={`Платил: ${t.paidByName}`}>
                          <Avatar
                            size={16}
                            radius="xl"
                            color="blue"
                            styles={{ placeholder: { fontSize: 9 } }}
                            style={{ flexShrink: 0 }}
                          >
                            {t.paidByName.trim().charAt(0).toUpperCase()}
                          </Avatar>
                        </Tooltip>
                      )}
                    </Group>
                    {t.shares && t.shares.length > 0 && (
                      <Text size="xs" c="dimmed">
                        {t.shares.map((s) => `${s.name} ${formatMoney(s.amount)}`).join(' / ')}
                      </Text>
                    )}
                  </div>
                  <Text size="sm" fw={500} style={{ whiteSpace: 'nowrap' }}>
                    {signedMoney(t)}
                  </Text>
                  {renderActions?.(t)}
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
    <Paper withBorder radius="lg" px="lg" py={0}>
      {content}
    </Paper>
  );
}
