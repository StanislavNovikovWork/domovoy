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
                <Stack gap="sm" pl={56}>
                  {g.items.map((t) => (
                    <Group key={t.id} justify="space-between" wrap="nowrap" align="flex-start">
                      <div style={{ minWidth: 0 }}>
                        <Text size="sm">
                          {new Date(`${t.occurredOn}T00:00:00`).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'long',
                          })}
                        </Text>
                        {t.note && (
                          <Text size="xs" c="dimmed" truncate>
                            {t.note}
                          </Text>
                        )}
                      </div>
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