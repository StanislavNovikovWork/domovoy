'use client';

import type { ReactNode } from 'react';
import { IconPencil } from '@tabler/icons-react';
import { ActionIcon, Button, Divider, Group, Paper, Stack, Text } from '@mantine/core';
import {
  computeSettlement,
  settleDebts,
  type TransactionItem,
} from '@/shared/lib/budget';
import { formatMoney } from '@/shared/lib/money';
import { formatShortDate } from '@/shared/lib/period';
import { capitalize } from '@/shared/lib/text';
import { signedMoney } from './SidePanel';

const divider = { borderTop: '1px solid var(--mantine-color-default-border)' } as const;

type Props = {
  items: TransactionItem[];
  onShowAll?: () => void;
  // без обводки и отступов: внутри табов на мобильных
  bare?: boolean;
  // кнопки справа от суммы (редактирование и удаление в окне «Все операции»)
  renderActions?: (t: TransactionItem) => ReactNode;
  // переключатель «Все расходы / Мои расходы / Итог»: состояние живёт в BudgetView,
  // чтобы сводка считалась по тому же списку
  scope?: 'all' | 'mine' | 'total';
  onScopeChange?: (scope: 'all' | 'mine' | 'total') => void;
};

// итоговый расчёт: баланс каждого и переводы «кто кому», чтобы все сошлись
function Settlement({ items }: { items: TransactionItem[] }) {
  const rows = computeSettlement(items);
  const transfers = settleDebts(rows);

  if (rows.length === 0) {
    return (
      <Text c="dimmed" size="sm">
        Пока нет операций
      </Text>
    );
  }

  return (
    <Stack gap={0}>
      {rows.map((r, index) => (
        <Group
          key={r.name}
          justify="space-between"
          gap="sm"
          py="sm"
          wrap="nowrap"
          style={index > 0 ? divider : undefined}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text size="sm" fw={500} truncate>
              {r.name}
            </Text>
            <Text size="xs" c="dimmed">
              заплатил {formatMoney(r.paid)} · потратил {formatMoney(r.spent)}
            </Text>
          </div>
          <Text
            size="sm"
            fw={600}
            c={r.balance === 0 ? 'dimmed' : r.balance > 0 ? 'teal' : 'red'}
            style={{ whiteSpace: 'nowrap' }}
          >
            {r.balance === 0
              ? '0'
              : `${r.balance > 0 ? '+' : '−'}${formatMoney(Math.abs(r.balance))}`}
          </Text>
        </Group>
      ))}

      <Divider />

      {transfers.length === 0 ? (
        <Text c="dimmed" size="sm" py="sm">
          Всё сходится, переводить никому не нужно
        </Text>
      ) : (
        <>
          <Text size="sm" fw={600} pt="sm" pb={4}>
            Переводы
          </Text>
          {transfers.map((t, i) => (
            <Group
              key={i}
              justify="space-between"
              gap="sm"
              py="xs"
              wrap="nowrap"
              style={i > 0 ? divider : undefined}
            >
              <Text size="sm" truncate style={{ flex: 1, minWidth: 0 }}>
                {t.from} → {t.to}
              </Text>
              <Text size="sm" fw={600} style={{ whiteSpace: 'nowrap' }}>
                {formatMoney(t.amount)}
              </Text>
            </Group>
          ))}
        </>
      )}
    </Stack>
  );
}

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
export function OneTimeOperations({ items, onShowAll, bare, renderActions, scope, onScopeChange }: Props) {
  // mine: в строках не показываем плательщика и доли (сумма уже посчитана снаружи)
  const mine = scope === 'mine';
  const days = groupByDay(items);

  const content = (
    <Stack gap={0}>
      {!bare && (
        <Group justify="space-between" pt={8} wrap="nowrap">
          {onScopeChange ? (
            <Group gap="xs" wrap="nowrap">
              {(['all', 'mine', 'total'] as const).map((v) => (
                <Button
                  key={v}
                  size="compact-xs"
                  radius="xl"
                  variant={scope === v ? 'filled' : 'light'}
                  color={scope === v ? undefined : 'gray'}
                  onClick={() => onScopeChange(v)}
                >
                  {v === 'all' ? 'Все расходы' : v === 'mine' ? 'Мои расходы' : 'Итог'}
                </Button>
              ))}
            </Group>
          ) : (
            <Text fw={600}>Список операций</Text>
          )}
          {onShowAll && (
            <ActionIcon
              variant="subtle"
              color="gray"
              aria-label="Редактировать операции"
              onClick={onShowAll}
            >
              <IconPencil size={18} />
            </ActionIcon>
          )}
        </Group>
      )}
      {!bare && <Divider mt={2} />}

      {scope === 'total' ? (
        <Settlement items={items} />
      ) : days.length === 0 ? (
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
                    <Text size="sm" truncate>
                      {capitalize(t.note || t.categoryName)}
                    </Text>
                    {!mine && t.shares && t.shares.length > 0 && (
                      <Text size="xs" c="dimmed">
                        {t.shares.map((s) => `${s.name} ${formatMoney(s.amount)}`).join(' / ')}
                      </Text>
                    )}
                  </div>
                  {/* кто платил: имя под суммой */}
                  <div style={{ textAlign: 'right', minWidth: 0, maxWidth: '40%' }}>
                    <Text size="sm" fw={500} style={{ whiteSpace: 'nowrap' }}>
                      {signedMoney(t)}
                    </Text>
                    {!mine && t.paidByName && (
                      <Text size="xs" c="dimmed" truncate>
                        {t.paidByName}
                      </Text>
                    )}
                  </div>
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
    // на мобильных без рамки и боковых отступов: блок сливается со страницей
    <Paper
      radius="lg"
      px={{ base: 0, sm: 'lg' }}
      py={0}
      bd={{ base: 'none', sm: '1px solid var(--mantine-color-default-border)' }}
    >
      {content}
    </Paper>
  );
}
