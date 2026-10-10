'use client';

import { Anchor, Box, Group, Paper, Stack, Text } from '@mantine/core';
import type { PendingPayment, TransactionItem } from '@/shared/lib/budget';
import { formatMoney } from '@/shared/lib/money';
import { formatShortDate } from '@/shared/lib/period';
import { PayCircle } from './PayCircle';

export const signedMoney = (t: Pick<TransactionItem, 'amount' | 'categoryType'>) =>
  `${t.categoryType === 'expense' ? '−' : '+'}${formatMoney(t.amount)}`;

const divider = { borderTop: '1px solid var(--mantine-color-default-border)' } as const;

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

export function RecentCard({ items, onShowAll }: { items: TransactionItem[]; onShowAll: () => void }) {
  return (
    <Paper withBorder radius="lg" p="lg">
      <Stack gap="xs">
        <Group justify="space-between">
          <Text fw={600}>Последние операции</Text>
          <Anchor component="button" type="button" size="sm" onClick={onShowAll}>
            Все операции
          </Anchor>
        </Group>

        {items.length === 0 ? (
          <Text c="dimmed" size="sm">
            Пока нет операций
          </Text>
        ) : (
          <Stack gap={0}>
            {items.map((t, index) => (
              <Group key={t.id} gap="sm" wrap="nowrap" py="xs" style={index > 0 ? divider : undefined}>
                <Text size="xs" c="dimmed" w={44} style={{ flexShrink: 0 }}>
                  {formatShortDate(t.occurredOn)}
                </Text>
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Text size="sm" truncate>
                    {t.note || t.categoryName}
                  </Text>
                  <Text size="xs" c="dimmed" truncate>
                    {t.categoryName}
                  </Text>
                </Box>
                <Text size="sm" fw={500} c={t.categoryType === 'income' ? 'teal' : undefined} style={{ whiteSpace: 'nowrap' }}>
                  {signedMoney(t)}
                </Text>
              </Group>
            ))}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
