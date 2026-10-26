'use client';

import type { ReactNode } from 'react';
import { IconPlus } from '@tabler/icons-react';
import { ActionIcon, Box, Collapse, Group, Paper, SimpleGrid, Stack, Text } from '@mantine/core';
import type { PlanSummary, TxType } from '@/shared/lib/budget';
import { formatMoney } from '@/shared/lib/money';
import { formatPeriodCaption, type Period } from '@/shared/lib/period';

const BORDER = '1px solid var(--mantine-color-default-border)';

// анимация сворачивания сводки: одна длительность и кривая для всех частей, чтобы двигались синхронно
const COLLAPSE_MS = 350;
const COLLAPSE_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';
const COLLAPSE_TRANSITION = `${COLLAPSE_MS}ms ${COLLAPSE_EASING}`;

type Props = {
  periodic: boolean;
  type: TxType;
  period: Period;
  date: string;
  total: number; // за выбранный период и тип
  plan: PlanSummary | null; // null: нет плана или вкладка «Доходы»
  // суммы расходов по участникам (разовый бюджет), список под общей суммой
  shareTotals?: { name: string; total: number }[];
  onAdd: () => void; // «+» в углу карточки, только на мобильных
  // фильтры (расходы/доходы, период, навигация) внутри карточки; «+» тогда стоит рядом с суммой на всех экранах
  filters?: ReactNode;
  // мобильные: при прокрутке списка фильтры и «+» сворачиваются, остаются только суммы
  collapsed?: boolean;
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
  shareTotals,
  onAdd,
  filters,
  collapsed = false,
}: Props) {
  const overPlan = plan ? plan.remaining < 0 : false;

  // на мобильных: без рамки и боковых отступов, блок сливается со страницей
  return (
    <Paper radius="lg" p={{ base: 0, sm: 'lg' }} pos="relative" bd={{ base: 'none', sm: BORDER }}>
      {!filters && (
        <ActionIcon
          pos="absolute"
          top={{ base: 0, sm: 16 }}
          right={{ base: 0, sm: 16 }}
          size="lg"
          radius="xl"
          aria-label="Добавить операцию"
          onClick={onAdd}
          style={{ zIndex: 2 }}
        >
          <IconPlus size={20} />
        </ActionIcon>
      )}
      {filters && (
        <>
          {/* мобильные: «+» в правом верхнем углу карточки, на одной линии с переключателями;
              в свёрнутом состоянии прячется вместе с фильтрами */}
          <ActionIcon
            hiddenFrom="sm"
            pos="absolute"
            top={0}
            right={0}
            size="lg"
            radius="xl"
            aria-label="Добавить операцию"
            onClick={onAdd}
            tabIndex={collapsed ? -1 : undefined}
            style={{
              zIndex: 2,
              opacity: collapsed ? 0 : 1,
              pointerEvents: collapsed ? 'none' : undefined,
              transition: `opacity ${COLLAPSE_TRANSITION}`,
            }}
          >
            <IconPlus size={20} />
          </ActionIcon>
          {/* десктоп: «+» у правого края карточки по центру высоты; справа у суммы и плана оставлено место, чтобы не накрывать их */}
          <ActionIcon
            visibleFrom="sm"
            pos="absolute"
            top="50%"
            right={16}
            size="lg"
            radius="xl"
            aria-label="Добавить операцию"
            onClick={onAdd}
            style={{ transform: 'translateY(-50%)', zIndex: 2 }}
          >
            <IconPlus size={20} />
          </ActionIcon>
        </>
      )}
      <Stack gap={collapsed ? 0 : 'lg'} style={{ transition: `gap ${COLLAPSE_TRANSITION}` }}>
        {/* фильтры сворачиваются с анимацией при прокрутке списка (на десктопе collapsed всегда false) */}
        {filters && (
          <Collapse
            expanded={!collapsed}
            transitionDuration={COLLAPSE_MS}
            transitionTimingFunction={COLLAPSE_EASING}
          >
            {filters}
          </Collapse>
        )}
        {/* блок сумм: «Потрачено» и «Осталось по плану» в одну строку на всех экранах */}
        <Box pos="relative">
          <SimpleGrid
            cols={plan ? 2 : 1}
            spacing="lg"
            pr={filters ? { base: 0, sm: 48 } : 48}
          >
            <Stack gap={2}>
              {periodic && (
                <Text size="sm" c="dimmed">
                  {type === 'expense' ? 'Потрачено' : 'Получено'}{' '}
                  {formatPeriodCaption(period, date)}
                </Text>
              )}
              <Text
                fz={collapsed ? 24 : 32}
                fw={700}
                lh={1.1}
                style={{ transition: `font-size ${COLLAPSE_TRANSITION}` }}
              >
                {formatMoney(total)}
              </Text>
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
                    <Group key={s.name} justify="space-between" gap="xs" wrap="nowrap">
                      <Text size="xs" truncate>
                        {s.name}
                      </Text>
                      <Text size="xs" style={{ whiteSpace: 'nowrap' }}>
                        {formatMoney(s.total)}
                      </Text>
                    </Group>
                  ))}
                </Box>
              )}
            </Stack>

            {plan && (
              <Metric
                label={overPlan ? 'Превышено по плану' : 'Осталось по плану'}
                value={formatMoney(Math.abs(plan.remaining))}
                red={overPlan}
              />
            )}
          </SimpleGrid>
        </Box>
      </Stack>
    </Paper>
  );
}
