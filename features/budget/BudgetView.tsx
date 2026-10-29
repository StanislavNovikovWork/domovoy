'use client';

import { useMemo, useOptimistic, useState, useTransition, type ReactNode } from 'react';
import { IconCategory, IconPencil, IconSettings } from '@tabler/icons-react';
import {
  ActionIcon,
  Box,
  Button,
  Divider,
  Grid,
  Group,
  Menu,
  Paper,
  ScrollArea,
  Stack,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { BackButton, BOTTOM_INSET } from '@/features/app-shell';
import { CategoriesModal } from '@/features/categories';
import {
  createTransaction,
  deleteTransaction,
  updateTransaction,
} from '@/server/transactions/actions';
import {
  buildPlanRows,
  filterTransactions,
  groupTransactions,
  type PlanItem,
  type TransactionItem,
  type TxType,
} from '@/shared/lib/budget';
import {
  ALL_TIME_RANGE,
  ONE_TIME_MONTH,
  formatPeriodLabel,
  getPeriodRange,
  monthStart,
  prevMonth,
  shiftDate,
  type Period,
} from '@/shared/lib/period';
import { useRegisterSettingsItems, type SettingsItem } from '@/shared/ui/SettingsItems';
import {
  AddTransactionModal,
  type CategoryOption,
  type SaveTransactionRequest,
  type ShareParticipant,
} from './AddTransactionModal';
import { AllTransactionsModal } from './AllTransactionsModal';
import { BudgetFilters } from './BudgetToolbar';
import { MonthPlan } from './MonthPlan';
import { OneTimeAllOperationsModal } from './OneTimeAllOperationsModal';
import { OneTimeOperations } from './OneTimeOperations';
import { PlanModal } from './PlanModal';
import { OperationsByCategory, RecentCard } from './SidePanel';
import { SummaryCard } from './SummaryCard';

const CARD_BORDER = '1px solid var(--mantine-color-default-border)';

type OptimisticAction =
  | { type: 'add'; item: TransactionItem }
  | { type: 'update'; item: TransactionItem }
  | { type: 'delete'; id: string };

// фактическая трата пользователя по операции: его доля, а не сумма, которую он платил
function mySpend(t: TransactionItem, userId?: string) {
  const share = t.shares?.find((s) => s.userId === userId);
  if (share) return share.amount;
  // нет долей и платил я — весь расход мой; иначе моя трата 0
  if (!t.shares?.length && t.paidByUserId === userId) return t.amount;
  return 0;
}

type Props = {
  householdId: string;
  initialDate: string;
  transactions: TransactionItem[];
  categories: CategoryOption[];
  plans: PlanItem[];
  /** false: разовый бюджет без периодов, всё считается за всё время */
  periodic?: boolean;
  /** члены бюджета для выбора участников расхода; показывается только при periodic=false */
  members?: ShareParticipant[];
  /** имена участников без аккаунта, ранее вписанных в бюджет */
  guestNames?: string[];
  /** текущий пользователь: плательщик по умолчанию в разовом бюджете */
  currentUserId?: string;
  /** роль текущего пользователя: в разовом бюджете участник правит только свои операции */
  role?: 'owner' | 'member';
  /** дополнительные пункты настроек (шестерёнка в шапке и шторка «Настройки» на мобильных), например «Участники» */
  extraSettings?: SettingsItem[];
  /** куда ведёт «назад» в левом верхнем углу на десктопе (на мобильных она внутри mobileTop) */
  backHref?: string;
  /** верх страницы только для мобильных (там нет шапки), например кнопка «назад» */
  mobileTop?: ReactNode;
};

export function BudgetView({
  householdId,
  initialDate,
  transactions: serverTransactions,
  categories: allCategories,
  plans,
  periodic = true,
  members,
  guestNames,
  currentUserId,
  role,
  extraSettings,
  backHref,
  mobileTop,
}: Props) {
  // оптимистичный список: операция появляется, изменяется или исчезает сразу, запрос идёт в фоне.
  // Состояние держится, пока идёт действие и обновление страницы; при ошибке откатывается само
  const [transactions, applyOptimistic] = useOptimistic(
    serverTransactions,
    (state, action: OptimisticAction): TransactionItem[] => {
      switch (action.type) {
        case 'add':
          // сортировка устойчивая: новая операция остаётся первой среди операций своего дня
          return [action.item, ...state].sort((a, b) =>
            a.occurredOn < b.occurredOn ? 1 : a.occurredOn > b.occurredOn ? -1 : 0
          );
        case 'update':
          return state
            .map((t) => (t.id === action.item.id ? action.item : t))
            .sort((a, b) =>
              a.occurredOn < b.occurredOn ? 1 : a.occurredOn > b.occurredOn ? -1 : 0
            );
        case 'delete':
          return state.filter((t) => t.id !== action.id);
      }
    }
  );
  const [, startTransition] = useTransition();

  const saveTransaction = ({ item, payload, editingId }: SaveTransactionRequest) => {
    startTransition(async () => {
      applyOptimistic({ type: editingId ? 'update' : 'add', item });
      try {
        if (editingId) await updateTransaction({ ...payload, id: editingId });
        else await createTransaction({ ...payload, id: item.id });
      } catch {
        // сеть недоступна: оптимистичная запись откатится сама, сообщений пока нет
      }
    });
  };

  const removeTransaction = (id: string) => {
    startTransition(async () => {
      applyOptimistic({ type: 'delete', id });
      try {
        await deleteTransaction({ householdId, id });
      } catch {
        // откат произойдёт сам
      }
    });
  };

  // суммы расходов по участникам (разовые бюджеты) считаем из долей операций
  const shareTotals = useMemo(() => {
    if (periodic) return [];
    const map = new Map<string, number>();
    for (const t of transactions) {
      for (const s of t.shares ?? []) map.set(s.name, (map.get(s.name) ?? 0) + s.amount);
    }
    return [...map.entries()]
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [transactions, periodic]);

  // в разовом бюджете только расходы: доходов и их категорий нет
  const categories = useMemo(
    () => (periodic ? allCategories : allCategories.filter((c) => c.type === 'expense')),
    [allCategories, periodic]
  );
  // выбранный тип в сводке периодического бюджета: null — обзор двух плиток,
  // 'expense'/'income' — детали типа с кольцевой диаграммой (клик по плитке)
  const [selected, setSelected] = useState<TxType | null>(null);
  const [period, setPeriod] = useState<Period>('month');
  const [date, setDate] = useState(initialDate);
  const [addOpened, addModal] = useDisclosure(false);
  // активный таб блока операций периодического бюджета (общий для мобильной и десктопной раскладки)
  const [tab, setTab] = useState('recent');
  // мобильные, периодический бюджет: сводка сворачивается при прокрутке списка.
  // Гистерезис: сворачиваем после 48px, разворачиваем только у самого верха — иначе
  // изменение высоты сводки при сворачивании дёргало бы состояние туда-обратно
  const [summaryCollapsed, setSummaryCollapsed] = useState(false);
  const onListScroll = ({ y }: { y: number }) => {
    if (y > 48 && !summaryCollapsed) setSummaryCollapsed(true);
    else if (y <= 4 && summaryCollapsed) setSummaryCollapsed(false);
  };
  // операция, открытая на редактирование (окно «Все операции» разового бюджета)
  const [editing, setEditing] = useState<TransactionItem | null>(null);
  const [catsOpened, catsModal] = useDisclosure(false);
  const [planOpened, planModal] = useDisclosure(false);
  const [allOpened, allModal] = useDisclosure(false);
  // категория, выбранная в форме плана при открытии («Задать лимит»)
  const [planFocus, setPlanFocus] = useState<string | null>(null);
  const openPlan = (categoryId: string | null) => {
    setPlanFocus(categoryId);
    planModal.open();
  };
  // предзаполнение новой операции при оплате статьи плана
  const [prefill, setPrefill] = useState<{
    categoryId: string;
    note: string;
    amount: number;
  } | null>(null);

  const range = useMemo(
    () => (periodic ? getPeriodRange(period, date) : ALL_TIME_RANGE),
    [periodic, period, date]
  );

  // операции списка: обзор — все типы периода, детали — только выбранный;
  // разовый бюджет — только расходы за всё время
  const items = useMemo(
    () =>
      periodic && !selected
        ? transactions.filter((t) => t.occurredOn >= range.from && t.occurredOn < range.to)
        : filterTransactions(transactions, selected ?? 'expense', range),
    [transactions, selected, range, periodic]
  );

  // плитки обзора и сектора диаграммы в деталях: итог и доли категорий по каждому типу
  const tile = useMemo(
    () => (t: TxType) => {
      const list = filterTransactions(transactions, t, range);
      return {
        total: list.reduce((acc, x) => acc + x.amount, 0),
        slices: groupTransactions(list).map((g) => ({
          name: g.name,
          value: g.total,
          color: `${g.color}.6`,
          icon: g.icon,
        })),
      };
    },
    [transactions, range]
  );
  const expenseTile = useMemo(() => tile('expense'), [tile]);
  const incomeTile = useMemo(() => tile('income'), [tile]);

  // сумма выбранного типа за предыдущий такой же период: бейдж сравнения в деталях
  const prevTotal = useMemo(() => {
    if (!periodic || !selected) {
      return undefined;
    }
    const prev = getPeriodRange(period, shiftDate(period, date, -1));
    return filterTransactions(transactions, selected, prev).reduce((acc, t) => acc + t.amount, 0);
  }, [periodic, selected, period, date, transactions]);

  // «Все расходы / Мои расходы / Итог» в списке операций разового бюджета
  const [scope, setScope] = useState<'all' | 'mine' | 'total'>('all');
  const visibleItems = useMemo(() => {
    if (periodic || scope !== 'mine' || !currentUserId) return items;
    return items
      .map((t) => ({ t, amount: mySpend(t, currentUserId) }))
      .filter((x) => x.amount > 0)
      .map((x) => ({ ...x.t, amount: x.amount }));
  }, [items, periodic, scope, currentUserId]);

  // план всегда за месяц выбранной даты, независимо от периода сверху
  const planMonth = periodic ? monthStart(date) : ONE_TIME_MONTH;
  const planRange = periodic ? getPeriodRange('month', planMonth) : ALL_TIME_RANGE;
  const planRows = useMemo(
    () => buildPlanRows(plans, categories, transactions, planMonth, planRange),
    [plans, categories, transactions, planMonth, planRange]
  );
  const hasPrevPlan = useMemo(() => {
    if (!periodic) return false;
    const prev = prevMonth(planMonth);
    return buildPlanRows(plans, categories, [], prev, getPeriodRange('month', prev)).length > 0;
  }, [plans, categories, planMonth, periodic]);

  const total = useMemo(() => visibleItems.reduce((acc, t) => acc + t.amount, 0), [visibleItems]);

  const pay = (categoryId: string, name: string, remaining: number) => {
    setPrefill({ categoryId, note: name, amount: remaining / 100 });
    addModal.open();
  };

  // пункты настроек бюджета: шестерёнка в шапке (десктоп) и шторка «Настройки» в нижнем меню (мобильные)
  const settingsItems: SettingsItem[] = [
    ...(extraSettings ?? []),
    {
      key: 'categories',
      label: 'Категории',
      icon: <IconCategory size={18} />,
      onClick: catsModal.open,
    },
  ];
  useRegisterSettingsItems(settingsItems);

  // фильтры периодического бюджета показываются внутри карточки сводки
  const filters = periodic ? (
    <BudgetFilters period={period} date={date} onPeriodChange={setPeriod} onDateChange={setDate} />
  ) : undefined;

  // периодический бюджет: «Последние операции» и «По категориям» кнопками-табами, как
  // «Все расходы / Мои расходы» в разовом бюджете; общий для мобильной и десктопной раскладки.
  // На мобильных без рамки и отступов, как блоки разового бюджета.
  // withPlan: третий таб «План» (мобильные; на десктопе план стоит отдельной колонкой справа)
  const hasPlan = periodic && selected !== 'income';
  // если вкладка «План» скрылась (переключились на доходы), показываем операции
  const activeTab = hasPlan ? tab : tab === 'plan' ? 'recent' : tab;
  const periodicTabs = (withPlan: boolean) => {
    const tabsList: { value: 'recent' | 'categories' | 'plan'; label: string }[] = [
      { value: 'recent', label: withPlan ? 'Операции' : 'Последние операции' },
      { value: 'categories', label: 'По категориям' },
      ...(withPlan && hasPlan ? [{ value: 'plan' as const, label: 'План' }] : []),
    ];
    return (
      <Paper radius="lg" p={{ base: 0, sm: 'lg' }} bd={{ base: 'none', sm: CARD_BORDER }}>
        <Group justify="space-between" wrap="nowrap">
          <Group gap="xs" wrap="nowrap">
            {tabsList.map((t) => (
              <Button
                key={t.value}
                size="compact-xs"
                radius="xl"
                variant={activeTab === t.value ? 'filled' : 'light'}
                color={activeTab === t.value ? undefined : 'gray'}
                onClick={() => setTab(t.value)}
              >
                {t.label}
              </Button>
            ))}
          </Group>
          {/* карандаш открывает «Все операции» с редактированием */}
          <ActionIcon
            variant="subtle"
            color="gray"
            aria-label="Редактировать операции"
            onClick={allModal.open}
          >
            <IconPencil size={18} />
          </ActionIcon>
        </Group>
        <Divider mt={2} />
        <Box>
          {/* операции выбранного типа за выбранный период (день, неделя, месяц, год) */}
          {activeTab === 'recent' && <RecentCard bare items={items} />}
          {/* те же операции за период, сгруппированные по категориям */}
          {activeTab === 'categories' && <OperationsByCategory items={items} />}
          {activeTab === 'plan' && withPlan && hasPlan && <Box pt={12}>{monthPlan(true)}</Box>}
        </Box>
      </Paper>
    );
  };

  // план затрат на месяц (только цели, без операций): у периодического бюджета, только для расходов
  const monthPlan = (bare: boolean) =>
    hasPlan ? (
      <MonthPlan
        householdId={householdId}
        month={planMonth}
        rows={planRows}
        canCopy={hasPrevPlan}
        onEdit={() => openPlan(null)}
        onPay={pay}
        bare={bare}
      />
    ) : null;

  return (
    <Box pos="relative">
      {/* десктоп: кнопка настроек в правом верхнем углу экрана, поверх контента и не сдвигает его вниз.
          Отрицательные отступы -4px ставят её в 12px от краёв экрана (поле страницы 16px).
          На мобильных настройки открываются кнопкой в углу из нижнего меню */}
      {backHref && (
        <Box visibleFrom="sm" pos="absolute" top={-4} left={-4} style={{ zIndex: 10 }}>
          <BackButton href={backHref} label="К пространству" />
        </Box>
      )}
      <Box visibleFrom="sm" pos="absolute" top={-4} right={-4} style={{ zIndex: 10 }}>
        <Menu position="bottom-end" shadow="md" width={200}>
          <Menu.Target>
            <ActionIcon variant="default" size={28} radius="xl" aria-label="Настройки бюджета">
              <IconSettings size={16} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            {settingsItems.map((item) => (
              <Menu.Item key={item.key} leftSection={item.icon} onClick={item.onClick}>
                {item.label}
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>
      </Box>

      <Stack gap="lg">
        {/* мобильная раскладка: «Последние» и «Категории» под табами в одном блоке;
            у разового бюджета блоки стоят плотнее */}
        <Stack
          gap={periodic ? 'lg' : 'sm'}
          hiddenFrom="lg"
          // страница не скроллится: шапка и сводка сверху неподвижны, прокручивается только список операций
          style={{
            // svh, не dvh: иначе высота прыгает каждый раз, когда при скролле
            // прячется/появляется адресная строка браузера.
            // вычитаем только верхний отступ: низ уходит под нижнее меню
            height:
              'calc(100svh - var(--app-shell-header-offset, 0rem) - var(--mantine-spacing-md))',
          }}
        >
          {mobileTop && <Box hiddenFrom="sm">{mobileTop}</Box>}

          <SummaryCard
            periodic={periodic}
            period={period}
            date={date}
            selected={selected}
            onSelectType={setSelected}
            expense={expenseTile}
            income={incomeTile}
            prevTotal={prevTotal}
            total={total}
            shareTotals={shareTotals}
            onAdd={addModal.open}
            filters={filters}
            collapsed={periodic && summaryCollapsed}
          />

          {periodic ? (
            // периодический бюджет: табы и план прокручиваются вместе, сводка над ними сворачивается.
            // Запас снизу больше высоты свёрнутой части сводки, чтобы короткий список
            // всё равно можно было прокрутить и свернуть сводку
            <ScrollArea
              type="never"
              style={{ flex: 1, minHeight: 0 }}
              onScrollPositionChange={onListScroll}
            >
              <Box pb={`calc(${BOTTOM_INSET} + 160px)`}>{periodicTabs(true)}</Box>
            </ScrollArea>
          ) : (
            // разовый бюджет: без табов; прокручивается только эта область без видимой полосы,
            // остальное закреплено; запас снизу, чтобы список доскролливался выше нижнего меню
            <ScrollArea type="never" style={{ flex: 1, minHeight: 0 }}>
              <Box pb={BOTTOM_INSET}>
                <OneTimeOperations
                  items={visibleItems}
                  onShowAll={allModal.open}
                  scope={scope}
                  onScopeChange={setScope}
                />
              </Box>
            </ScrollArea>
          )}
        </Stack>

        {/* десктоп: сводка и список операций слева, справа план (периодический) или ожидаемые платежи (разовый) */}
        <Grid gap="lg" visibleFrom="lg" pb={BOTTOM_INSET}>
          <Grid.Col span={{ base: 12, lg: periodic ? 'content' : 8 }}>
            {/* периодический бюджет: левая часть шириной 720px, план затрат встаёт рядом с ней */}
            <Stack gap="lg" style={periodic ? { width: 720, maxWidth: '100%' } : undefined}>
              <SummaryCard
                periodic={periodic}
                period={period}
                date={date}
                selected={selected}
                onSelectType={setSelected}
                expense={expenseTile}
                income={incomeTile}
                prevTotal={prevTotal}
                total={total}
                shareTotals={shareTotals}
                onAdd={addModal.open}
                filters={filters}
              />

              {periodic ? (
                periodicTabs(false)
              ) : (
                // разовый бюджет: список операций под сводкой, блок категорий пока убран
                <OneTimeOperations
                  items={visibleItems}
                  onShowAll={allModal.open}
                  scope={scope}
                  onScopeChange={setScope}
                />
              )}
            </Stack>
          </Grid.Col>

          {periodic
            ? hasPlan && (
                <Grid.Col span={{ base: 12, lg: 'auto' }}>
                  <Box maw={460} miw={400}>
                    {monthPlan(false)}
                  </Box>
                </Grid.Col>
              )
            : null}
        </Grid>
      </Stack>

      <AddTransactionModal
        opened={addOpened || !!editing}
        onClose={() => {
          addModal.close();
          setPrefill(null);
          setEditing(null);
        }}
        editing={editing}
        onSave={saveTransaction}
        householdId={householdId}
        categories={categories}
        members={periodic ? undefined : members}
        guestNames={guestNames}
        currentUserId={currentUserId}
        expenseOnly={!periodic}
        defaultType={selected ?? 'expense'}
        prefill={prefill}
      />

      {periodic ? (
        <AllTransactionsModal
          opened={allOpened}
          onClose={allModal.close}
          type={selected ?? undefined}
          periodLabel={formatPeriodLabel(period, date)}
          items={items}
          onEdit={setEditing}
          onDelete={removeTransaction}
        />
      ) : (
        <OneTimeAllOperationsModal
          opened={allOpened}
          onClose={allModal.close}
          items={transactions}
          onEdit={setEditing}
          onDelete={removeTransaction}
          currentUserId={currentUserId}
          role={role}
        />
      )}

      <PlanModal
        opened={planOpened}
        onClose={planModal.close}
        householdId={householdId}
        periodic={periodic}
        month={planMonth}
        rows={planRows}
        categories={categories}
        initialCategoryId={planFocus}
      />

      <CategoriesModal
        opened={catsOpened}
        onClose={catsModal.close}
        householdId={householdId}
        categories={categories}
        expenseOnly={!periodic}
      />
    </Box>
  );
}
