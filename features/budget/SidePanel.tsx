'use client';

import { IconChevronDown } from '@tabler/icons-react';
import { Anchor, Box, Collapse, Group, Paper, Stack, Text, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  groupTransactions,
  type CategoryGroup,
  type PendingPayment,
  type TransactionItem,
} from '@/shared/lib/budget';
import { formatMoney } from '@/shared/lib/money';
import { formatShortDate } from '@/shared/lib/period';
import { capitalize } from '@/shared/lib/text';
import { CategoryBadge } from '@/shared/ui/CategoryBadge';
import { PayCircle } from './PayCircle';

export const signedMoney = (t: Pick<TransactionItem, 'amount' | 'categoryType'>) =>
  `${t.categoryType === 'expense' ? '' : '+'}${formatMoney(t.amount)}`;

const divider = { borderTop: '1px solid var(--mantine-color-default-border)' } as const;

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

export function PendingPaymentsCard({
  payments,
  onPay,
}: {
  payments: PendingPayment[];
  onPay: (categoryId: string, name: string, remaining: number) => void;
}) {
  const total = payments.reduce((acc, p) => acc + p.remaining, 0);

  return (
    <Paper withBorder radius="lg" p="lg">
      <Stack gap="xs">
        <Group justify="space-between">
          <Text fw={600}>Ожидаются платежи</Text>
          <Text size="sm" c="dimmed">
            {formatMoney(total)}
          </Text>
        </Group>

        <Stack gap={0}>
          {payments.map((p, index) => (
            <Group
              key={`${p.categoryId}|${p.name}`}
              gap="sm"
              wrap="nowrap"
              py="xs"
              style={index > 0 ? divider : undefined}
            >
              <PayCircle
                partial={p.partial}
                label={`Оплатить: ${p.name}`}
                onClick={() => onPay(p.categoryId, p.name, p.remaining)}
              />
              <Box style={{ flex: 1, minWidth: 0 }}>
                <Text size="sm" truncate>
                  {p.name}
                </Text>
                <Text size="xs" c="dimmed" truncate>
                  {p.categoryName}
                  {p.partial ? ' · остаток' : ''}
                </Text>
              </Box>
              <Text size="sm" fw={500} style={{ whiteSpace: 'nowrap' }}>
                {formatMoney(p.remaining)}
              </Text>
            </Group>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}

export function RecentCard({
  items,
  onShowAll,
  bare,
}: {
  items: TransactionItem[];
  onShowAll?: () => void;
  // без обводки и отступов: внутри табов на мобильных
  bare?: boolean;
}) {
  const content = (
    <Stack gap="xs">
        {!bare && (
          <Group justify="space-between">
            <Text fw={600}>Последние операции</Text>
            {onShowAll && (
              <Anchor component="button" type="button" size="sm" onClick={onShowAll}>
                Все операции
              </Anchor>
            )}
          </Group>
        )}

        {items.length === 0 ? (
          <Text c="dimmed" size="sm">
            Пока нет операций
          </Text>
        ) : (
          <Stack gap={0}>
            {groupByDay(items).map((day, index) => (
              <Stack key={day.date} gap={4} py="sm" style={index > 0 ? divider : undefined}>
                <Group justify="space-between" wrap="nowrap">
                  <Text size="xs" fw={600} c="dimmed">
                    {formatShortDate(day.date)}
                  </Text>
                  <Text size="xs" fw={600} c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                    {signedMoney({ amount: day.total, categoryType: day.items[0].categoryType })}
                  </Text>
                </Group>
                {day.items.map((t) => (
                  <Group key={t.id} gap="sm" wrap="nowrap">
                    <CategoryBadge icon={t.categoryIcon} color={t.categoryColor} size={22} />
                    <Text size="sm" truncate style={{ flex: 1, minWidth: 0 }}>
                      {capitalize(t.note || t.categoryName)}
                    </Text>
                    <Text
                      size="sm"
                      fw={500}
                      c={t.categoryType === 'income' ? 'teal' : undefined}
                      style={{ whiteSpace: 'nowrap' }}
                    >
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
  return bare ? content : <Paper withBorder radius="lg" p="lg">{content}</Paper>;
}

// операции того же вида, что «Последние операции», но сгруппированные по категориям (от большей суммы к меньшей)
export function OperationsByCategory({ items }: { items: TransactionItem[] }) {
  if (items.length === 0) {
    return (
      <Text c="dimmed" size="sm">
        Пока нет операций
      </Text>
    );
  }

  return (
    <Stack gap={0}>
      {groupTransactions(items).map((group, index) => (
        <Box key={group.categoryId} style={index > 0 ? divider : undefined}>
          <CategoryOperationsGroup group={group} />
        </Box>
      ))}
    </Stack>
  );
}

// категория как сворачиваемый блок: заголовок с суммой, под ним операции
function CategoryOperationsGroup({ group }: { group: CategoryGroup }) {
  const [opened, { toggle }] = useDisclosure(false);
  const categoryType = group.items[0].categoryType;

  return (
    <Stack gap={0} py="sm">
      <UnstyledButton onClick={toggle} aria-expanded={opened}>
        <Group justify="space-between" wrap="nowrap">
          <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
            <CategoryBadge icon={group.icon} color={group.color} size={22} />
            <Text size="sm" fw={600} truncate>
              {group.name}
            </Text>
          </Group>
          <Group gap="xs" wrap="nowrap">
            <Text size="sm" fw={600} style={{ whiteSpace: 'nowrap' }}>
              {signedMoney({ amount: group.total, categoryType })}
            </Text>
            <IconChevronDown
              size={16}
              style={{
                flexShrink: 0,
                transform: opened ? 'rotate(180deg)' : undefined,
                transition: 'transform 150ms',
              }}
            />
          </Group>
        </Group>
      </UnstyledButton>

      <Collapse expanded={opened}>
        <Stack gap={4} pt="xs">
          {group.items.map((t) => (
            <Group key={t.id} gap="sm" wrap="nowrap">
              <Text size="xs" c="dimmed" w={44} style={{ flexShrink: 0 }}>
                {formatShortDate(t.occurredOn)}
              </Text>
              <Text size="sm" truncate style={{ flex: 1, minWidth: 0 }}>
                {capitalize(t.note || t.categoryName)}
              </Text>
              <Text
                size="sm"
                c={categoryType === 'income' ? 'teal' : undefined}
                style={{ whiteSpace: 'nowrap' }}
              >
                {signedMoney(t)}
              </Text>
            </Group>
          ))}
        </Stack>
      </Collapse>
    </Stack>
  );
}
