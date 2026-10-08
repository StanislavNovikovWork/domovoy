'use client';

import { useTransition } from 'react';
import {
  ActionIcon,
  Button,
  Collapse,
  Group,
  Paper,
  Progress,
  Stack,
  Text,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconAdjustments, IconCash, IconCheck, IconChevronDown } from '@tabler/icons-react';
import { copyPlan } from '@/server/plans/actions';
import type { PlanRow } from '@/shared/lib/budget';
import { formatMoney } from '@/shared/lib/money';
import { formatPeriodLabel, prevMonth } from '@/shared/lib/period';
import { CategoryBadge } from '@/shared/ui/CategoryBadge';

type Props = {
  householdId: string;
  month: string; // YYYY-MM-01
  rows: PlanRow[];
  canCopy: boolean; // в прошлом месяце есть план
  onEdit: () => void;
  /** оплата статьи: остаток (копейки) = план минус уже потрачено */
  onPay: (categoryId: string, name: string, remaining: number) => void;
};

function PlanProgress({ spent, planned, color }: { spent: number; planned: number; color: string }) {
  const over = spent > planned;
  return (
    <Progress
      value={planned > 0 ? Math.min(100, (spent / planned) * 100) : spent > 0 ? 100 : 0}
      color={over ? 'red' : color}
      size="sm"
      radius="xl"
    />
  );
}

// '2026-10-05' → '5 окт'
function formatShortDate(date: string) {
  return new Date(`${date}T00:00:00`)
    .toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
    .replace('.', '');
}

// строка категории; раскрывается списком статей с фактом и отдельными операциями вне статей
function PlanRowView({ row: r, onPay }: { row: PlanRow; onPay: Props['onPay'] }) {
  const [opened, { toggle }] = useDisclosure(false);
  const over = r.spent - r.planned;
  const hasItems = r.items.length > 0;
  const expandable = hasItems || r.otherTransactions.length > 0;

  return (
    <Stack gap={6}>
      <UnstyledButton onClick={expandable ? toggle : undefined} style={{ cursor: expandable ? 'pointer' : 'default' }}>
        <Group gap="sm" wrap="nowrap" align="flex-start">
          <CategoryBadge icon={r.icon} color={r.color} size={36} />
          <Stack gap={6} style={{ flex: 1, minWidth: 0 }}>
            <Group justify="space-between" wrap="nowrap" gap="sm">
              <Group gap={4} wrap="nowrap" style={{ minWidth: 0 }}>
                <Text size="sm" fw={500} truncate>
                  {r.name}
                </Text>
                {expandable && (
                  <IconChevronDown
                    size={14}
                    style={{ flexShrink: 0, transform: opened ? 'rotate(180deg)' : undefined, transition: 'transform 150ms' }}
                  />
                )}
              </Group>
              <Text size="sm" c={over > 0 ? 'red' : undefined} style={{ whiteSpace: 'nowrap' }}>
                {formatMoney(r.spent)} / {formatMoney(r.planned)}
              </Text>
            </Group>
            <PlanProgress spent={r.spent} planned={r.planned} color={r.color} />
            {over > 0 && (
              <Text size="xs" c="red">
                Превышено на {formatMoney(over)}
              </Text>
            )}
          </Stack>
        </Group>
      </UnstyledButton>

      {expandable && (
        <Collapse expanded={opened}>
          <Stack gap="sm" pl={48} pt={4}>
            {r.items.map((i) => {
              // завершена: потрачено не меньше плана; в процессе: есть траты, но меньше плана
              const done = i.spent >= i.planned;
              const inProgress = i.spent > 0 && !done;
              return (
                <Stack key={i.name} gap={4}>
                  <Group justify="space-between" wrap="nowrap" gap="sm">
                    <Text size="xs" truncate style={{ flex: 1, minWidth: 0 }}>
                      {i.name}
                    </Text>
                    <Group gap={6} wrap="nowrap">
                      {done ? (
                        <IconCheck size={14} color="var(--mantine-color-teal-6)" />
                      ) : (
                        <Tooltip label="Оплатить">
                          <ActionIcon
                            variant="light"
                            size="sm"
                            aria-label={`Оплатить: ${i.name}`}
                            onClick={() => onPay(r.categoryId, i.name, i.planned - i.spent)}
                          >
                            <IconCash size={14} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                      <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                        {inProgress ? `${formatMoney(i.spent)} / ${formatMoney(i.planned)}` : formatMoney(i.planned)}
                      </Text>
                    </Group>
                  </Group>
                  {inProgress && <PlanProgress spent={i.spent} planned={i.planned} color={r.color} />}
                </Stack>
              );
            })}
            {r.otherTransactions.length > 0 && (
              <Stack gap={6}>
                {hasItems && (
                  <Text size="xs" c="dimmed" fw={500}>
                    Вне статей
                  </Text>
                )}
                {r.otherTransactions.map((t) => (
                  <Group key={t.id} gap="sm" wrap="nowrap">
                    <Text size="xs" c="dimmed" w={44} style={{ flexShrink: 0 }}>
                      {formatShortDate(t.occurredOn)}
                    </Text>
                    <Text size="xs" c={t.note ? undefined : 'dimmed'} truncate style={{ flex: 1, minWidth: 0 }}>
                      {t.note || 'Без описания'}
                    </Text>
                    <Text size="xs" style={{ whiteSpace: 'nowrap' }}>
                      {formatMoney(t.amount)}
                    </Text>
                  </Group>
                ))}
              </Stack>
            )}
          </Stack>
        </Collapse>
      )}
    </Stack>
  );
}

export function PlanCard({ householdId, month, rows, canCopy, onEdit, onPay }: Props) {
  const [pending, startTransition] = useTransition();
  const totalPlanned = rows.reduce((acc, r) => acc + r.planned, 0);
  const totalSpent = rows.reduce((acc, r) => acc + r.spent, 0);

  const copyFromPrev = () => {
    startTransition(async () => {
      const result = await copyPlan({ householdId, fromMonth: prevMonth(month), toMonth: month });
      if (result.ok) {
        notifications.show({ message: 'План скопирован с прошлого месяца', color: 'teal' });
      } else {
        notifications.show({ message: result.error, color: 'red' });
      }
    });
  };

  return (
    <Paper withBorder radius="lg" p="lg">
      <Stack gap="md">
        <Group justify="space-between" wrap="nowrap">
          <div>
            <Text fw={600}>План затрат</Text>
            <Text size="xs" c="dimmed">
              {formatPeriodLabel('month', month)}
            </Text>
          </div>
          {rows.length > 0 && (
            <Button variant="default" size="xs" leftSection={<IconAdjustments size={14} />} onClick={onEdit}>
              Настроить
            </Button>
          )}
        </Group>

        {rows.length === 0 ? (
          <Stack align="center" gap="sm" py="md">
            <Text c="dimmed" size="sm" ta="center">
              На этот месяц плана ещё нет
            </Text>
            <Button onClick={onEdit}>Создать план затрат</Button>
            {canCopy && (
              <Button variant="subtle" size="xs" onClick={copyFromPrev} loading={pending}>
                Скопировать с прошлого месяца
              </Button>
            )}
          </Stack>
        ) : (
          <>
            <Stack gap={6}>
              <Group justify="space-between" align="baseline">
                <Text size="sm" c="dimmed">
                  Всего потрачено
                </Text>
                <Text size="sm" fw={600}>
                  {formatMoney(totalSpent)} / {formatMoney(totalPlanned)}
                </Text>
              </Group>
              <PlanProgress spent={totalSpent} planned={totalPlanned} color="blue" />
            </Stack>

            <Stack gap="md">
              {rows.map((r) => (
                <PlanRowView key={r.categoryId} row={r} onPay={onPay} />
              ))}
            </Stack>
          </>
        )}
      </Stack>
    </Paper>
  );
}
