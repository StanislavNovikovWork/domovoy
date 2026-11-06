'use client';

import Link from 'next/link';
import { Button, Group, Paper, Stack, Text } from '@mantine/core';
import type { ShoppingWidgetData } from '@/server/checklists/queries';

// виджет «Рабочего стола»: до пяти невыполненных покупок без чекбоксов и переход к списку
export function ShoppingWidget({
  householdId,
  data,
}: {
  householdId: string;
  data: ShoppingWidgetData;
}) {
  const href = data
    ? `/budgets/${householdId}/lists/${data.list.id}`
    : `/budgets/${householdId}/lists`;

  return (
    <Paper withBorder radius="lg" p="lg">
      <Stack gap="sm">
        <Text fw={600} size="lg">
          Список покупок
        </Text>
        {!data || data.items.length === 0 ? (
          <Text size="sm" c="dimmed">
            Покупок нет
          </Text>
        ) : (
          <Stack gap={6}>
            {data.items.map((item) => (
              <Group key={item.id} justify="space-between" wrap="nowrap" gap="sm">
                <Text size="sm" truncate>
                  {item.title}
                </Text>
                {item.quantity && (
                  <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                    {item.quantity}
                  </Text>
                )}
              </Group>
            ))}
          </Stack>
        )}
        <Button component={Link} href={href} variant="light" size="xs">
          К списку покупок
        </Button>
      </Stack>
    </Paper>
  );
}
