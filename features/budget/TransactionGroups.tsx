'use client';

import { Accordion, Group, Paper, Stack, Text } from '@mantine/core';
import { formatMoney } from '@/shared/lib/money';
import { CategoryBadge } from '@/shared/ui/CategoryBadge';
import type { CategoryGroup } from '@/shared/lib/budget';

function pluralOperations(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} операция`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} операции`;
  return `${n} операций`;
}

export function TransactionGroups({ groups }: { groups: CategoryGroup[] }) {
  return (
    <Paper withBorder radius="lg" p="lg">
      {groups.length === 0 ? (
        <Text c="dimmed" ta="center" size="sm">
          Пока нет операций за этот период
        </Text>
      ) : (
        <Accordion multiple variant="default" chevronPosition="right">
          {groups.map((g) => (
            <Accordion.Item key={g.categoryId} value={g.categoryId}>
              <Accordion.Control>
                <Group justify="space-between" wrap="nowrap" pr="sm">
                  <Group gap="sm" wrap="nowrap">
                     <CategoryBadge icon={g.icon} color={g.color} />
                    <div>
                      <Text size="sm" fw={500}>
                        {g.name}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {pluralOperations(g.items.length)}
                      </Text>
                    </div>
                  </Group>
                  <Text fw={600}>{formatMoney(g.total)}</Text>
                </Group>
              </Accordion.Control>

              <Accordion.Panel>
                {/* правый отступ = шеврон (0.9375rem) + pr заголовка, чтобы суммы встали ровно под общей суммой */}
                <Stack gap="sm" pr="calc(0.9375rem + var(--mantine-spacing-sm))">
                  {g.items.map((t) => (
                    <Group key={t.id} gap="sm" wrap="nowrap" align="center">
                      {/* ширина колонки даты = размер иконки категории (44), чтобы дата стояла под иконкой */}
                      <Text size="xs" c="dimmed" ta="center" w={44} style={{ flexShrink: 0 }}>
                        {new Date(`${t.occurredOn}T00:00:00`)
                          .toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
                          .replace('.', '')}
                      </Text>
                      <Text size="sm" c={t.note ? undefined : 'dimmed'} truncate style={{ flex: 1, minWidth: 0 }}>
                        {t.note || 'Без описания'}
                      </Text>
                      <Text size="sm" fw={500}>
                        {formatMoney(t.amount)}
                      </Text>
                    </Group>
                  ))}
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      )}
    </Paper>
  );
}