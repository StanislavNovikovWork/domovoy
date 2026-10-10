'use client';

import { useState, useTransition } from 'react';
import { IconAdjustments, IconCheck, IconChevronDown } from '@tabler/icons-react';
import {
  Badge,
  Box,
  Button,
  Collapse,
  Group,
  Paper,
  SegmentedControl,
  Stack,
  Text,
  ThemeIcon,
  UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { copyPlan } from '@/server/plans/actions';
import type { CategoryRow, PlanRowItem } from '@/shared/lib/budget';
import { formatMoney } from '@/shared/lib/money';
import { formatShortDate, prevMonth } from '@/shared/lib/period';
import { pluralRu } from '@/shared/lib/plural';
import { CategoryBadge } from '@/shared/ui/CategoryBadge';
import { PayCircle } from './PayCircle';
import { PlanProgress } from './PlanProgress';

type Props = {
  householdId: string;
  month: string; // YYYY-MM-01
  rows: CategoryRow[];
  planMode: boolean; // расходы за месяц: показываем лимиты, статьи и «Без лимита»
  canEditPlan: boolean;
  hasPlan: boolean; // на этот месяц есть план
  canCopy: boolean; // в прошлом месяце есть план
  onEdit: () => void;
  onSetLimit: (categoryId: string) => void;
  onPay: (categoryId: string, name: string, remaining: number) => void;
};

const isOver = (r: CategoryRow) => r.planned !== null && r.spent > r.planned;

function subtitle(r: CategoryRow): string {
  const pending = r.items.filter((i) => i.spent < i.planned).length;
  const opsCount =
    r.transactions.length + r.items.reduce((acc, i) => acc + i.transactions.length, 0);

  if (r.spent === 0) {
    const waiting =
      pending > 0
        ? ` · ${pending} ${pluralRu(pending, ['ожидается', 'ожидаются', 'ожидаются'])}`
        : '';
    return `пока без операций${waiting}`;
  }
  if (r.items.length > 0) {
    const done = r.items.filter((i) => i.spent >= i.planned).length;
    const partial = r.items.some((i) => i.spent > 0 && i.spent < i.planned);
    const payments = pluralRu(r.items.length, ['платежа', 'платежей', 'платежей']);
    return `${done} из ${r.items.length} ${payments} ${partial ? 'закрыты полностью' : 'оплачено'}`;
  }
  return `${opsCount} ${pluralRu(opsCount, ['операция', 'операции', 'операций'])}`;
}

function StatusIcon({ item, onPay }: { item: PlanRowItem; onPay: () => void }) {
  if (item.spent >= item.planned) {
    return (
      <ThemeIcon radius="xl" size={20} color="teal">
        <IconCheck size={12} />
      </ThemeIcon>
    );
  }
  return <PayCircle partial={item.spent > 0} label={`Оплатить: ${item.name}`} onClick={onPay} />;
}

function ItemRow({ item, color, onPay }: { item: PlanRowItem; color: string; onPay: () => void }) {
  const done = item.spent >= item.planned;
  const partial = item.spent > 0 && !done;

  return (
    <Stack gap={4}>
      <Group gap="sm" wrap="nowrap">
        <StatusIcon item={item} onPay={onPay} />
        <Text size="sm" truncate style={{ flex: 1, minWidth: 0 }}>
          {item.name}
        </Text>
        {done && item.transactions[0] && (
          <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
            {formatShortDate(item.transactions[0].occurredOn)}
          </Text>
        )}
        {!done && (
          <Badge size="xs" variant="light" color={partial ? 'blue' : 'yellow'}>
            {partial ? 'Частично' : 'Ожидается'}
          </Badge>
        )}
        <Text
          size="sm"
          fw={done ? 500 : undefined}
          c={done ? undefined : 'dimmed'}
          style={{ whiteSpace: 'nowrap' }}
        >
          {partial
            ? `${formatMoney(item.spent)} из ${formatMoney(item.planned)}`
            : formatMoney(done ? item.spent : item.planned)}
        </Text>
      </Group>
      {partial && (
        <Box pl={32} pr={0}>
          <PlanProgress spent={item.spent} planned={item.planned} color={color} size="xs" />
        </Box>
      )}
    </Stack>
  );
}

function CategoryRowView({
  row: r,
  planMode,
  onSetLimit,
  onPay,
}: {
  row: CategoryRow;
  planMode: boolean;
  onSetLimit: Props['onSetLimit'];
  onPay: Props['onPay'];
}) {
  const [opened, { toggle }] = useDisclosure(false);
  const hasDetails = r.items.length > 0 || r.transactions.length > 0;
  const unlimited = planMode && r.planned === null;
  const over = isOver(r);

  return (
    <Stack gap={8} py="sm">
      <Group gap="sm" wrap="nowrap" align="flex-start">
        <UnstyledButton
          onClick={hasDetails ? toggle : undefined}
          style={{ flex: 1, minWidth: 0, cursor: hasDetails ? 'pointer' : 'default' }}
        >
          <Group gap="sm" wrap="nowrap" align="flex-start">
            <CategoryBadge icon={r.icon} color={r.color} size={36} />
            <Stack gap={6} style={{ flex: 1, minWidth: 0 }}>
              <Group justify="space-between" wrap="nowrap" gap="sm" align="flex-start">
                <div style={{ minWidth: 0 }}>
                  <Group gap={6} wrap="nowrap">
                    <Text size="sm" fw={500} truncate>
                      {r.name}
                    </Text>
                    {unlimited && (
                      <Badge size="xs" variant="light" color="gray">
                        Без лимита
                      </Badge>
                    )}
                  </Group>
                  {!unlimited && (
                    <Text size="xs" c="dimmed">
                      {subtitle(r)}
                    </Text>
                  )}
                </div>
                <Group gap="xs" wrap="nowrap">
                  <Text size="sm" style={{ whiteSpace: 'nowrap' }}>
                    <Text span fw={600} c={over ? 'red' : undefined}>
                      {formatMoney(r.spent)}
                    </Text>
                    {r.planned !== null && (
                      <Text span c="dimmed">
                        {' '}
                        из {formatMoney(r.planned)}
                      </Text>
                    )}
                  </Text>
                  {hasDetails && (
                    <IconChevronDown
                      size={16}
                      style={{
                        flexShrink: 0,
                        transform: opened ? 'rotate(180deg)' : undefined,
                        transition: 'transform 150ms',
                      }}
                    />
                  )}
                </Group>
              </Group>

              {r.planned !== null && (
                <PlanProgress spent={r.spent} planned={r.planned} color={r.color} />
              )}
              {unlimited && (
                <Box
                  h={6}
                  style={{
                    borderRadius: 999,
                    background:
                      'repeating-linear-gradient(90deg, var(--mantine-color-gray-4) 0 3px, transparent 3px 7px)',
                  }}
                />
              )}
              {over && r.planned !== null && (
                <Text size="xs" c="red">
                  Превышено на {formatMoney(r.spent - r.planned)}
                </Text>
              )}
            </Stack>
          </Group>
        </UnstyledButton>

        {unlimited && (
          <Button size="xs" variant="default" onClick={() => onSetLimit(r.categoryId)}>
            Задать лимит
          </Button>
        )}
      </Group>

      {hasDetails && (
        <Collapse expanded={opened}>
          <Stack gap="sm" pl={48} pt={4}>
            {r.items.map((i) => (
              <ItemRow
                key={i.name}
                item={i}
                color={r.color}
                onPay={() => onPay(r.categoryId, i.name, i.planned - i.spent)}
              />
            ))}

            {r.transactions.length > 0 && (
              <Stack gap={6}>
                {r.items.length > 0 && (
                  <Text size="xs" c="dimmed" fw={500}>
                    Вне статей
                  </Text>
                )}
                {r.transactions.map((t) => (
                  <Group key={t.id} gap="sm" wrap="nowrap">
                    <Text size="xs" c="dimmed" w={44} style={{ flexShrink: 0 }}>
                      {formatShortDate(t.occurredOn)}
                    </Text>
                    <Text
                      size="xs"
                      c={t.note ? undefined : 'dimmed'}
                      truncate
                      style={{ flex: 1, minWidth: 0 }}
                    >
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

export function CategoriesList({
  householdId,
  month,
  rows,
  planMode,
  canEditPlan,
  hasPlan,
  canCopy,
  onEdit,
  onSetLimit,
  onPay,
}: Props) {
  const [filter, setFilter] = useState<'all' | 'attention'>('all');
  const [pending, startTransition] = useTransition();

  const visible = filter === 'attention' ? rows.filter(isOver) : rows;

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
      <Stack gap="sm">
        <Group justify="space-between" gap="sm">
          <Group gap="md">
            <Text fw={600} size="lg">
              Категории
            </Text>
            {planMode && (
              <SegmentedControl
                size="xs"
                value={filter}
                onChange={(v) => setFilter(v as 'all' | 'attention')}
                data={[
                  { value: 'all', label: 'Все' },
                  { value: 'attention', label: 'Требуют внимания' },
                ]}
              />
            )}
          </Group>
          {canEditPlan && (
            <Button
              variant="default"
              size="xs"
              leftSection={<IconAdjustments size={14} />}
              onClick={onEdit}
            >
              Настроить план
            </Button>
          )}
        </Group>

        {planMode && !hasPlan && canCopy && (
          <Group justify="space-between" gap="sm">
            <Text size="sm" c="dimmed">
              На этот месяц плана ещё нет
            </Text>
            <Button variant="light" size="xs" onClick={copyFromPrev} loading={pending}>
              Скопировать с прошлого месяца
            </Button>
          </Group>
        )}

        {visible.length === 0 ? (
          <Text c="dimmed" ta="center" size="sm" py="md">
            {filter === 'attention'
              ? 'Нет категорий, требующих внимания'
              : 'Пока нет операций за этот период'}
          </Text>
        ) : (
          <Stack gap={0}>
            {visible.map((r, index) => (
              <Box
                key={r.categoryId}
                style={
                  index > 0
                    ? { borderTop: '1px solid var(--mantine-color-default-border)' }
                    : undefined
                }
              >
                <CategoryRowView
                  row={r}
                  planMode={planMode}
                  onSetLimit={onSetLimit}
                  onPay={onPay}
                />
              </Box>
            ))}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
