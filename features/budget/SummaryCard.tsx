'use client';

import { Box, ColorSwatch, Group, Paper, Progress, SimpleGrid, Stack, Text, Tooltip } from '@mantine/core';
import type { CategoryTotal, PlanSummary, TxType } from '@/shared/lib/budget';
import { formatMoney } from '@/shared/lib/money';
import { formatPeriodCaption, getMonthProgress, type Period } from '@/shared/lib/period';
import { pluralRu } from '@/shared/lib/plural';

type Props = {
  type: TxType;
  period: Period;
  date: string;
  total: number; // за выбранный период и тип
  totals: CategoryTotal[];
  plan: PlanSummary | null; // null: нет плана или вкладка «Доходы»
  planMonth: string;
  today: string;
};

const LEGEND_LIMIT = 6;

function Metric({ label, value, hint, red }: { label: string; value: string; hint?: string; red?: boolean }) {
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

function StructureBar({ type, totals }: { type: TxType; totals: CategoryTotal[] }) {
  const sum = totals.reduce((acc, t) => acc + t.total, 0);
  const legend = totals.slice(0, LEGEND_LIMIT);

  return (
    <Stack gap="xs">
      <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
        <Text size="sm" c="dimmed">
          {type === 'expense' ? 'Структура расходов' : 'Структура доходов'}
        </Text>
        <Group gap="md" justify="flex-end" style={{ rowGap: 4 }}>
          {legend.map((t) => (
            <Group key={t.categoryId} gap={6} wrap="nowrap">
              <ColorSwatch size={10} color={`var(--mantine-color-${t.color}-6)`} />
              <Text size="xs">
                {Math.round((t.total / sum) * 100)}% {t.name}
              </Text>
            </Group>
          ))}
        </Group>
      </Group>

      <Group gap={2} wrap="nowrap">
        {sum === 0 ? (
          <Box h={10} style={{ flex: 1, borderRadius: 999, background: 'var(--mantine-color-gray-light)' }} />
        ) : (
          totals.map((t) => (
            <Tooltip key={t.categoryId} label={`${t.name}: ${formatMoney(t.total)}`}>
              <Box
                h={10}
                style={{
                  flex: t.total,
                  minWidth: 4,
                  borderRadius: 999,
                  background: `var(--mantine-color-${t.color}-6)`,
                }}
              />
            </Tooltip>
          ))
        )}
      </Group>
    </Stack>
  );
}

export function SummaryCard({ type, period, date, total, totals, plan, planMonth, today }: Props) {
  const progress = plan ? getMonthProgress(planMonth, today) : null;
  const planPercent = plan && plan.planned > 0 ? Math.round((plan.spentInPlan / plan.planned) * 100) : 0;
  const overPlan = plan ? plan.remaining < 0 : false;

  return (
    <Paper withBorder radius="lg" p="lg">
      <Stack gap="lg">
        <SimpleGrid cols={{ base: 1, sm: plan ? 3 : 1 }} spacing="lg">
          <Stack gap={2}>
            <Text size="sm" c="dimmed">
              {type === 'expense' ? 'Потрачено' : 'Получено'} {formatPeriodCaption(period, date)}
            </Text>
            <Text fz={32} fw={700} lh={1.1}>
              {formatMoney(total)}
            </Text>
            {plan && (
              <Text size="xs" c="dimmed">
                По плану: {formatMoney(plan.spentInPlan)} из {formatMoney(plan.planned)} · {planPercent}%
              </Text>
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

        <StructureBar type={type} totals={totals} />
      </Stack>
    </Paper>
  );
}
