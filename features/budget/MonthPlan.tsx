'use client';

import { useTransition } from 'react';
import { IconAdjustments, IconCheck, IconChevronDown } from '@tabler/icons-react';
import {
  Box,
  Button,
  Collapse,
  Group,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { copyPlan } from '@/server/plans/actions';
import type { PlanRow } from '@/shared/lib/budget';
import { formatMoney } from '@/shared/lib/money';
import { formatPeriodLabel, prevMonth } from '@/shared/lib/period';
import { CategoryBadge } from '@/shared/ui/CategoryBadge';
import { PayCircle } from './PayCircle';

type Props = {
  householdId: string;
  month: string; // YYYY-MM-01
  rows: PlanRow[];
  canCopy: boolean; // в прошлом месяце есть план
  onEdit: () => void;
  // открыть форму операции с предзаполнением; сумма в копейках
  onPay: (categoryId: string, name: string, amount: number) => void;
  // без обводки и заголовка: внутри таба «План» на мобильных
  bare?: boolean;
};

const divider = { borderTop: '1px solid var(--mantine-color-default-border)' } as const;

function PlanCategory({ row, onPay }: { row: PlanRow; onPay: Props['onPay'] }) {
  // статьи по умолчанию свёрнуты
  const [opened, { toggle }] = useDisclosure(false);
  const hasItems = row.items.length > 0;

  return (
    <Stack gap={0} py="sm">
      <UnstyledButton
        onClick={hasItems ? toggle : undefined}
        style={{ cursor: hasItems ? 'pointer' : 'default' }}
      >
        <Group gap="sm" wrap="nowrap">
          <CategoryBadge icon={row.icon} color={row.color} size={28} />
          <Text size="sm" fw={500} truncate style={{ flex: 1, minWidth: 0 }}>
            {row.name}
          </Text>
          <Text size="sm" fw={600} style={{ whiteSpace: 'nowrap' }}>
            {formatMoney(row.planned)}
          </Text>
          {hasItems ? (
            <IconChevronDown
              size={16}
              style={{
                flexShrink: 0,
                transform: opened ? 'rotate(180deg)' : undefined,
                transition: 'transform 150ms',
              }}
            />
          ) : (
            // пустое место под стрелку, чтобы сумма стояла вровень с категориями со статьями
            <Box w={16} style={{ flexShrink: 0 }} />
          )}
        </Group>
      </UnstyledButton>

      {hasItems && (
        <Collapse expanded={opened}>
          {/* отступ 6px: кружок (16px) стоит ровно под иконкой категории (28px) */}
          <Stack gap={8} pl={6} pt="xs">
            {row.items.map((i) => (
              <Group key={i.name} gap="sm" wrap="nowrap">
                {/* оплаченная статья: зелёная галочка; иначе кружок открывает форму операции,
                    предзаполненную категорией, названием и суммой (остатком) статьи */}
                {i.spent >= i.planned ? (
                  <ThemeIcon radius="xl" size={16} color="teal" style={{ flexShrink: 0 }}>
                    <IconCheck size={10} />
                  </ThemeIcon>
                ) : (
                  <PayCircle
                    size={16}
                    partial={i.spent > 0}
                    label={`Добавить операцию: ${i.name}`}
                    onClick={() => onPay(row.categoryId, i.name, i.planned - i.spent)}
                  />
                )}
                <Text size="sm" truncate style={{ flex: 1, minWidth: 0 }}>
                  {i.name}
                </Text>
                <Text size="sm" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                  {formatMoney(i.planned)}
                </Text>
              </Group>
            ))}
          </Stack>
        </Collapse>
      )}
    </Stack>
  );
}

// план затрат на месяц: только цели по категориям и статьям, без операций и фактических трат
export function MonthPlan({ householdId, month, rows, canCopy, onEdit, onPay, bare }: Props) {
  const [pending, startTransition] = useTransition();
  const total = rows.reduce((acc, r) => acc + r.planned, 0);

  const copyFromPrev = () => {
    startTransition(async () => {
      const result = await copyPlan({ householdId, fromMonth: prevMonth(month), toMonth: month });
      if (result.ok) notifications.show({ message: 'План скопирован с прошлого месяца', color: 'teal' });
      else notifications.show({ message: result.error, color: 'red' });
    });
  };

  const content = (
      <Stack gap="sm">
        <Group justify="space-between" gap="sm" wrap="nowrap" align="flex-start">
          <Box style={{ minWidth: 0 }}>
            {/* внутри таба заголовок не нужен — им служит сам таб */}
            {!bare && (
              <Text fw={600} size="lg">
                План затрат
              </Text>
            )}
            <Text size={bare ? 'sm' : 'xs'} c="dimmed" lh={bare ? '30px' : undefined}>
              {formatPeriodLabel('month', month)}
              {rows.length > 0 && ` · всего ${formatMoney(total)}`}
            </Text>
          </Box>
          <Button
            variant="default"
            size="xs"
            leftSection={<IconAdjustments size={14} />}
            onClick={onEdit}
            style={{ flexShrink: 0 }}
          >
            Настроить
          </Button>
        </Group>

        {rows.length === 0 ? (
          <Stack gap="xs" align="flex-start">
            <Text size="sm" c="dimmed">
              На этот месяц плана ещё нет
            </Text>
            {canCopy && (
              <Button variant="light" size="xs" onClick={copyFromPrev} loading={pending}>
                Скопировать с прошлого месяца
              </Button>
            )}
          </Stack>
        ) : (
          <Stack gap={0}>
            {rows.map((r, index) => (
              <Box key={r.categoryId} style={index > 0 ? divider : undefined}>
                <PlanCategory row={r} onPay={onPay} />
              </Box>
            ))}
          </Stack>
        )}
      </Stack>
  );

  // на мобильных без рамки и отступов, блок сливается со страницей
  return bare ? (
    content
  ) : (
    <Paper radius="lg" p={{ base: 0, sm: 'lg' }} bd={{ base: 'none', sm: divider.borderTop }}>
      {content}
    </Paper>
  );
}
