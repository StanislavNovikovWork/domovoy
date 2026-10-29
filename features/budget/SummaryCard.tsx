'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { IconPlus, IconX } from '@tabler/icons-react';
import { DonutChart } from '@mantine/charts';
import {
  ActionIcon,
  Badge,
  Box,
  Center,
  Collapse,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core';
import type { TxType } from '@/shared/lib/budget';
import { formatMoney } from '@/shared/lib/money';
import { formatPeriodCaption, type Period } from '@/shared/lib/period';
import { CategoryIcon } from '@/shared/ui/CategoryIcon';

const BORDER = '1px solid var(--mantine-color-default-border)';

// анимация сворачивания сводки: одна длительность и кривая для всех частей, чтобы двигались синхронно
const COLLAPSE_MS = 350;
const COLLAPSE_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';
const COLLAPSE_TRANSITION = `${COLLAPSE_MS}ms ${COLLAPSE_EASING}`;

// доля категории: сектор кольцевой диаграммы и полосы на плитке (color — ссылка на тему, 'teal.6')
export type ChartSlice = { name: string; value: number; color: string; icon?: string };

// 'teal.6' → var(--mantine-color-teal-6): ссылка темы для обычных элементов вне графика
const cssColor = (c: string) => `var(--mantine-color-${c.replace('.', '-')})`;

// пустая диаграмма: нейтральное кольцо без секторов и подсказок
const EMPTY_CHART: ChartSlice[] = [
  { name: '', value: 1, color: 'var(--mantine-color-default-border)' },
];
const EMPTY_TILE: TypeTile = { total: 0, slices: [] };

// размер иконки категории внутри сектора кольца и порог: на крошечных секторах иконку не рисуем
const SLICE_ICON = 14;
const SLICE_ICON_MIN = 0.06;
const CHART_SIZE = 140;
const CHART_THICKNESS = 22;
// визуально обход идёт от верхней точки по часовой (90 → -270).
// Рисуем сектора в обратном порядке против часовой (-270 → 90): тогда в каждом стыке
// верхним оказывается конец предыдущего по обходу бара — они наезжают каскадом в одну сторону
const CHART_START = 90;
const CHART_END = -270;
// paddingAngle у DonutChart: отрицательный — бары наезжают друг на друга
const CHART_PAD = -12;

// «кепка» поверх стыка: дуга цветом наезжающего бара с тенью на перекрытый
const CAP_BEFORE = 4;
const CAP_AFTER = 14;

// дуга по медианному радиусу кольца между двумя углами (развёртка рендера: углы растут против часовой)
function arcPath(fromDeg: number, toDeg: number): string {
  const half = CHART_SIZE / 2;
  const radius = half - CHART_THICKNESS / 2;
  const pt = (deg: number) => {
    const rad = (-deg * Math.PI) / 180;
    return `${half + radius * Math.cos(rad)} ${half + radius * Math.sin(rad)}`;
  };
  return `M ${pt(fromDeg)} A ${radius} ${radius} 0 0 0 ${pt(toDeg)}`;
}

// стартовые углы секторов в развёртке рендера: recharts делит реальный размах
// (360 − N·pad), и каждый следующий сектор стартует на pad раньше конца предыдущего
function sectorStarts(renderSlices: ChartSlice[]): number[] {
  const total = renderSlices.reduce((acc, s) => acc + s.value, 0);
  const realTotal = Math.abs(CHART_END - CHART_START) - renderSlices.length * CHART_PAD;
  let start = CHART_END;
  return renderSlices.map((s) => {
    const a = start;
    start += (s.value / total) * realTotal + CHART_PAD;
    return a;
  });
}

// позиции иконок поверх секторов: у стыка, где бар наезжает на следующий,
// чуть внутри перед закруглённой кромкой, на медианном радиусе кольца
function sliceIcons(renderSlices: ChartSlice[]) {
  const total = renderSlices.reduce((acc, s) => acc + s.value, 0);
  if (total <= 0) {
    return [];
  }
  const half = CHART_SIZE / 2;
  const radius = half - CHART_THICKNESS / 2;
  // центр иконки — на самом носике выступающего бара, слегка за кромкой
  const inset = -3;
  const starts = sectorStarts(renderSlices);
  return renderSlices.flatMap((s, i) => {
    if (!s.icon || s.value / total < SLICE_ICON_MIN) {
      return [];
    }
    const rad = (-(starts[i] + inset) * Math.PI) / 180;
    return [{ icon: s.icon, x: half + radius * Math.cos(rad), y: half + radius * Math.sin(rad) }];
  });
}

// данные плитки типа в обзоре: итог и доли категорий
export type TypeTile = { total: number; slices: ChartSlice[] };

// плитка в обзоре: сумма, подпись и мини-полоса долей категорий; клик открывает детали типа
function TypeTileButton({
  label,
  tile,
  onClick,
}: {
  label: string;
  tile: TypeTile;
  onClick: () => void;
}) {
  const sum = tile.slices.reduce((acc, s) => acc + s.value, 0);
  return (
    <UnstyledButton
      // blur: иначе фокус остаётся внутри сворачиваемого блока и конфликтует с aria-hidden
      onClick={(e) => {
        e.currentTarget.blur();
        onClick();
      }}
      p="md"
      style={{ border: BORDER, borderRadius: 'var(--mantine-radius-lg)' }}
    >
      <Text fz={20} fw={700} lh={1.2}>
        {formatMoney(tile.total)}
      </Text>
      <Text size="sm" c="dimmed" mb="sm">
        {label}
      </Text>
      <Group gap={2} wrap="nowrap" h={10} align="stretch">
        {sum === 0 ? (
          <Box
            flex={1}
            style={{ borderRadius: 999, background: 'var(--mantine-color-default-border)' }}
          />
        ) : (
          tile.slices.map((s) => (
            <Box
              key={s.name}
              h="100%"
              style={{
                // доля категории в общей сумме: пропорциональная ширина сегмента
                flex: `${s.value} 1 0`,
                minWidth: 4,
                borderRadius: 999,
                background: cssColor(s.color),
              }}
            />
          ))
        )}
      </Group>
    </UnstyledButton>
  );
}

type Props = {
  periodic: boolean;
  period: Period;
  date: string;
  // периодический бюджет: выбранный тип — детали с кольцевой диаграммой; null — обзор двух плиток
  selected?: TxType | null;
  onSelectType?: (type: TxType | null) => void;
  // итоги и доли категорий по типам за выбранный период (обзор и детали)
  expense?: TypeTile;
  income?: TypeTile;
  // сумма выбранного типа за предыдущий такой же период: бейдж сравнения в деталях
  prevTotal?: number;
  total: number; // за выбранный период и тип
  // суммы расходов по участникам (разовый бюджет), список под общей суммой
  shareTotals?: { name: string; total: number }[];
  onAdd: () => void; // «+» в углу карточки
  // фильтры (период и навигация) внутри карточки
  filters?: ReactNode;
  // мобильные: при прокрутке списка сводка сворачивается до одной строки с суммами
  collapsed?: boolean;
};

export function SummaryCard({
  periodic,
  period,
  date,
  selected = null,
  onSelectType,
  expense,
  income,
  prevTotal,
  total,
  shareTotals,
  onAdd,
  filters,
  collapsed = false,
}: Props) {
  const detailSlices = selected === 'income' ? income?.slices : expense?.slices;
  const slices = detailSlices?.length ? detailSlices : EMPTY_CHART;
  // сектора в обратном порядке: порядок отрисовки задаёт каскад наезда баров
  const renderSlices = [...slices].reverse();

  // чарт живёт, пока блок деталей открыт, и ещё всю анимацию закрытия —
  // уезжает вместе с ней, а не пропадает мгновенно. В закрытом Collapse
  // (display:none) recharts мерял бы контейнер 0×0 и писал варнинг в консоль
  const chartOpen = !!selected && !collapsed;
  const [chartMounted, setChartMounted] = useState(false);
  useEffect(() => {
    if (chartOpen) {
      setChartMounted(true);
      return;
    }
    const t = setTimeout(() => setChartMounted(false), COLLAPSE_MS - 50);
    return () => clearTimeout(t);
  }, [chartOpen]);

  // на мобильных: без рамки и боковых отступов, блок сливается со страницей
  return (
    <Paper radius="lg" p={{ base: 0, sm: 'lg' }} pos="relative" bd={{ base: 'none', sm: BORDER }}>
      {/* «+» в углу карточки: у периодического бюджета справа снизу, у разового справа сверху;
          в свёрнутом состоянии прячется вместе с остальной сводкой */}
      <ActionIcon
        pos="absolute"
        right={{ base: 0, sm: 16 }}
        {...(periodic ? { bottom: { base: 0, sm: 16 } } : { top: { base: 0, sm: 16 } })}
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

      <Stack gap={collapsed ? 0 : 'lg'} style={{ transition: `gap ${COLLAPSE_TRANSITION}` }}>
        {periodic ? (
          <>
            {/* свёрнутая сводка при прокрутке списка: только итоги */}
            <Collapse
              expanded={collapsed}
              transitionDuration={COLLAPSE_MS}
              transitionTimingFunction={COLLAPSE_EASING}
            >
              {selected ? (
                <Stack gap={2}>
                  <Text size="sm" c="dimmed">
                    {selected === 'expense' ? 'Потрачено' : 'Получено'}{' '}
                    {formatPeriodCaption(period, date)}
                  </Text>
                  <Text fz={24} fw={700} lh={1.1}>
                    {formatMoney(total)}
                  </Text>
                </Stack>
              ) : (
                <Group gap="xl">
                  <Stack gap={2}>
                    <Text size="xs" c="dimmed">
                      Траты
                    </Text>
                    <Text fz={20} fw={700} lh={1.1}>
                      {formatMoney(expense?.total ?? 0)}
                    </Text>
                  </Stack>
                  <Stack gap={2}>
                    <Text size="xs" c="dimmed">
                      Доходы
                    </Text>
                    <Text fz={20} fw={700} lh={1.1}>
                      {formatMoney(income?.total ?? 0)}
                    </Text>
                  </Stack>
                </Group>
              )}
            </Collapse>

            {/* обзор ⇄ детали: блоки раскрываются и сворачиваются навстречу друг другу,
                фильтры периода едут вместе с диаграммой */}
            <Collapse
              expanded={!collapsed}
              transitionDuration={COLLAPSE_MS}
              transitionTimingFunction={COLLAPSE_EASING}
            >
              {/* обзор: плитки расходов и доходов, клик по плитке открывает детали типа */}
              <Collapse
                expanded={!selected}
                transitionDuration={COLLAPSE_MS}
                transitionTimingFunction={COLLAPSE_EASING}
              >
                <SimpleGrid cols={2} spacing="sm" pr={{ base: 0, sm: 48 }}>
                  <TypeTileButton
                    label="Траты"
                    tile={expense ?? EMPTY_TILE}
                    onClick={() => onSelectType?.('expense')}
                  />
                  <TypeTileButton
                    label="Доходы"
                    tile={income ?? EMPTY_TILE}
                    onClick={() => onSelectType?.('income')}
                  />
                </SimpleGrid>
              </Collapse>

              {/* детали типа: сумма, сравнение с прошлым периодом и кольцо долей категорий */}
              <Collapse
                expanded={!!selected}
                transitionDuration={COLLAPSE_MS}
                transitionTimingFunction={COLLAPSE_EASING}
              >
                <Stack gap="lg">
                  <Stack gap="sm" pr={{ base: 0, sm: 48 }}>
                    <Group justify="space-between" align="flex-start" wrap="nowrap">
                      <Stack gap={2}>
                        <Group gap="sm" align="center" wrap="nowrap">
                          <Text fz={28} fw={700} lh={1.1}>
                            {formatMoney(total)}
                          </Text>
                          {prevTotal != null && prevTotal > 0 && (
                            <Badge variant="light" color="gray" radius="md" size="lg">
                              {total > prevTotal ? '↑' : '↓'} {formatMoney(prevTotal)}
                            </Badge>
                          )}
                        </Group>
                        <Text size="sm" c="dimmed">
                          {selected === 'expense' ? 'Траты' : 'Доходы'}
                        </Text>
                      </Stack>
                      <ActionIcon
                        variant="default"
                        radius="xl"
                        size="lg"
                        aria-label="К обзору"
                        onClick={(e) => {
                          e.currentTarget.blur();
                          onSelectType?.(null);
                        }}
                      >
                        <IconX size={18} />
                      </ActionIcon>
                    </Group>
                    <Center>
                      {/* иконки категорий — HTML-оверлей поверх кольца: позиции считаем сами,
                          не завися от конвейера меток recharts */}
                      <Box pos="relative">
                        {chartMounted && (
                          <DonutChart
                            data={renderSlices}
                            size={CHART_SIZE}
                            thickness={CHART_THICKNESS}
                            // отрицательный отступ: сектора чуть заезжают друг на друга, без зазоров
                            paddingAngle={CHART_PAD}
                            startAngle={CHART_END}
                            endAngle={CHART_START}
                            // закруглённые концы баров: радиус = половина толщины кольца
                            pieProps={{ cornerRadius: CHART_THICKNESS / 2 }}
                            // без обводки у секторов
                            strokeWidth={0}
                            // метки внутри секторов свои (иконки), withLabels бы добавил +40px высоты под внешние
                            withLabels={false}
                            // клик по сектору ничего не показывает: без тултипа и слоя доступности recharts
                            withTooltip={false}
                            accessibilityLayer={false}
                          />
                        )}
                        {/* стыки: поверх каждого дуга-«кепка» цветом наезжающего бара */}
                        {chartMounted && slices !== EMPTY_CHART && slices.length > 1 && (
                          <svg
                            width={CHART_SIZE}
                            height={CHART_SIZE}
                            viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`}
                            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
                          >
                            {sectorStarts(renderSlices).map((a, i) => (
                              <path
                                key={a}
                                d={arcPath(a - CAP_BEFORE, a + CAP_AFTER)}
                                fill="none"
                                stroke={cssColor(renderSlices[i].color)}
                                strokeWidth={CHART_THICKNESS}
                                strokeLinecap="round"
                              />
                            ))}
                          </svg>
                        )}
                        {chartMounted &&
                          sliceIcons(renderSlices).map((p, i) => (
                            <CategoryIcon
                              key={i}
                              name={p.icon}
                              size={SLICE_ICON}
                              color="#fff"
                              style={{
                                position: 'absolute',
                                left: p.x - SLICE_ICON / 2,
                                top: p.y - SLICE_ICON / 2,
                                pointerEvents: 'none',
                              }}
                            />
                          ))}
                      </Box>
                    </Center>
                  </Stack>
                  {filters}
                </Stack>
              </Collapse>
            </Collapse>
          </>
        ) : (
          /* разовый бюджет: сумма и траты участников одним столбцом, справа запас под «+» */
          <Stack gap={2} pr={48}>
            <Text fz={32} fw={700} lh={1.1}>
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
        )}
      </Stack>
    </Paper>
  );
}
