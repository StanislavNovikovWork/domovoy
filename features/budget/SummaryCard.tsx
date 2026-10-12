'use client';

import { IconPlus } from '@tabler/icons-react';
import {
  ActionIcon,
  Box,
  Paper,
  Progress,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core';
import type { PlanSummary, TxType } from '@/shared/lib/budget';
import { formatMoney } from '@/shared/lib/money';
import { formatPeriodCaption, getMonthProgress, type Period } from '@/shared/lib/period';
import { pluralRu } from '@/shared/lib/plural';

type Props = {
  periodic: boolean;
  type: TxType;
  period: Period;
  date: string;
  total: number; // за выбранный период и тип
  plan: PlanSummary | null; // null: нет плана или вкладка «Доходы»
  planMonth: string;
  today: string;
  // суммы расходов по участникам (разовый бюджет), список под общей суммой
  shareTotals?: { name: string; total: number }[];
  onAdd: () => void; // «+» в углу карточки, только на мобильных
};

function Metric({
  label,
  value,
  hint,
  red,
}: {
  label: string;
  value: string;
  hint?: string;
  red?: boolean;
}) {
  return (
    <Stack gap={2}>
      <Text size="sm" c="dimmed">
        {label}
      </Text>
      <Text fz={20} fw={600} c={red ? 'red' : undefined}>
        {value}
      </Text>
      {hint && (
        <Text size="xs" c="dimmed">
          {hint}
        </Text>
      )}
    </Stack>
  );
}

export function SummaryCard({
  periodic,
  type,
  period,
  date,
  total,
  plan,
  planMonth,
  today,
  shareTotals,
  onAdd,
}: Props) {
  const progress = plan && periodic ? getMonthProgress(planMonth, today) : null;
  const planPercent =
    plan && plan.planned > 0 ? Math.round((plan.spentInPlan / plan.planned) * 100) : 0;
  const overPlan = plan ? plan.remaining < 0 : false;

  return (
    <Paper withBorder radius="lg" p="lg" pos="relative">
      <ActionIcon
        hiddenFrom="sm"
        pos="absolute"
        top={16}
        right={16}
        size="lg"
        radius="xl"
        aria-label="Добавить операцию"
        onClick={onAdd}
      >
        <IconPlus size={20} />
      </ActionIcon>
      <Stack gap="lg">
        <SimpleGrid cols={{ base: 1, sm: plan ? 3 : 1 }} spacing="lg">
          <Stack gap={2}>
            <Text size="sm" c="dimmed">
              {type === 'expense' ? 'Потрачено' : 'Получено'}{' '}
              {periodic ? formatPeriodCaption(period, date) : 'за всё время'}
            </Text>
            <Text fz={32} fw={700} lh={1.1}>
              {formatMoney(total)}
            </Text>
            {plan && (
              <Text size="xs" c="dimmed">
                По плану: {formatMoney(plan.spentInPlan)} из {formatMoney(plan.planned)} ·{' '}
                {planPercent}%
              </Text>
            )}
            {shareTotals && shareTotals.length > 0 && (
              <Box
                mt="xs"
                style={{
                  display: 'grid',
                  gridTemplateRows: 'repeat(3, auto)',
                  gridAutoFlow: 'column',
                  gridAutoColumns: 'minmax(0, 1fr)',
                  columnGap: 'var(--mantine-spacing-md)',
                  rowGap: 2,
                }}
              >
                {shareTotals.map((s) => (
                  <Text key={s.name} size="xs" truncate>
                    {s.name} — {formatMoney(s.total)}
                  </Text>
                ))}
              </Box>
            )}
          </Stack>

          {plan && (
            <>
              <Metric
                label={overPlan ? 'Превышено по плану' : 'Осталось по плану'}
                value={formatMoney(Math.abs(plan.remaining))}
                red={overPlan}
                hint={
                  progress
                    ? `${progress.daysLeft} ${pluralRu(progress.daysLeft, ['день', 'дня', 'дней'])} до конца месяца`
                    : undefined
                }
              />
              <Metric
                label="Ещё ожидается оплатить"
                value={formatMoney(plan.pendingAmount)}
                hint={`${plan.pendingCount} ${pluralRu(plan.pendingCount, [
                  'запланированный платёж',
                  'запланированных платежа',
                  'запланированных платежей',
                ])}`}
              />
            </>
          )}
        </SimpleGrid>

        {plan && plan.planned > 0 && (
          <Box pos="relative" pb={progress ? 28 : 0}>
            <Progress
              value={Math.min(100, (plan.spentInPlan / plan.planned) * 100)}
              color={plan.spentInPlan > plan.planned ? 'red' : 'blue'}
              size="md"
              radius="xl"
            />
            {progress && (
              <>
                {/* маркер «сегодня»: доля прошедшего месяца */}
                <Box
                  pos="absolute"
                  top={-5}
                  w={2}
                  h={18}
                  style={{ left: `${progress.percent}%`, background: 'var(--mantine-color-text)' }}
                />
                <Text
                  size="xs"
                  fw={500}
                  pos="absolute"
                  top={20}
                  style={{
                    left: `${progress.percent}%`,
                    transform: `translateX(-${progress.percent}%)`,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Сегодня, {progress.dayLabel} · прошло {progress.percent}% месяца
                </Text>
              </>
            )}
          </Box>
        )}
      </Stack>
    </Paper>
  );
}
