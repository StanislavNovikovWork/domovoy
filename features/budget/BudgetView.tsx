'use client';

import { useMemo, useOptimistic, useState, useTransition, type ReactNode } from 'react';
import { IconCategory, IconPlus, IconSettings } from '@tabler/icons-react';
import {
  ActionIcon,
  Box,
  Button,
  Grid,
  Group,
  Menu,
  Paper,
  ScrollArea,
  Stack,
  Tabs,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { FOOTER_HEIGHT } from '@/features/app-shell';
import { CategoriesModal } from '@/features/categories';
import {
  createTransaction,
  deleteTransaction,
  updateTransaction,
} from '@/server/transactions/actions';
import {
  buildCategoryRows,
  buildPlainRows,
  buildPlanRows,
  filterTransactions,
  listPendingPayments,
  summarizePlan,
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
  type Period,
} from '@/shared/lib/period';
import { HeaderActions } from '@/shared/ui/HeaderActions';
import {
  useRegisterSettingsItems,
  type SettingsItem,
} from '@/shared/ui/SettingsItems';
import {
  AddTransactionModal,
  type CategoryOption,
  type SaveTransactionRequest,
  type ShareParticipant,
} from './AddTransactionModal';
import { AllTransactionsModal } from './AllTransactionsModal';
import { BudgetFilters } from './BudgetToolbar';
import { CategoriesList } from './CategoriesList';
import { PlanModal } from './PlanModal';
import { OneTimeAllOperationsModal } from './OneTimeAllOperationsModal';
import { OneTimeOperations } from './OneTimeOperations';
import { MonthPlan } from './MonthPlan';
import { OperationsByCategory, PendingPaymentsCard, RecentCard } from './SidePanel';
import { SummaryCard } from './SummaryCard';

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
  /** дополнительные пункты настроек (шестерёнка в шапке и шторка «Настройки» на мобильных), например «Участники» */
  extraSettings?: SettingsItem[];
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
  extraSettings,
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
            .sort((a, b) => (a.occurredOn < b.occurredOn ? 1 : a.occurredOn > b.occurredOn ? -1 : 0));
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
  const [type, setType] = useState<TxType>('expense');
  const [period, setPeriod] = useState<Period>('month');
  const [date, setDate] = useState(initialDate);
  const [addOpened, addModal] = useDisclosure(false);
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

  const items = useMemo(
    () =>
      filterTransactions(
        transactions,
        type,
        periodic ? getPeriodRange(period, date) : ALL_TIME_RANGE
      ),
    [transactions, type, period, date, periodic]
  );

  // «Все расходы / Мои расходы» в списке операций разового бюджета (только мобильная раскладка)
  const [scope, setScope] = useState<'all' | 'mine'>('all');
  const visibleItems = useMemo(() => {
    if (periodic || scope === 'all' || !currentUserId) return items;
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

  // лимиты и статьи показываем только в расходах за месяц; иначе обычный список по категориям
  const planMode = type === 'expense' && (!periodic || period === 'month');
  const categoryRows = useMemo(
    () =>
      planMode
        ? buildCategoryRows(
            planRows,
            items,
            categories.map((c) => c.id)
          )
        : buildPlainRows(items),
    [planMode, planRows, items, categories]
  );

  const total = useMemo(() => visibleItems.reduce((acc, t) => acc + t.amount, 0), [visibleItems]);
  // блоки плана есть только у расходов
  const planSummary = useMemo(
    () => (type === 'expense' && planRows.length > 0 ? summarizePlan(planRows) : null),
    [type, planRows]
  );

  // правая колонка: ожидаемые платежи (всегда за месяц плана) и последние операции
  const pendingPayments = useMemo(
    () => (type === 'expense' ? listPendingPayments(planRows) : []),
    [type, planRows]
  );
  const typeTransactions = useMemo(
    () => transactions.filter((t) => t.categoryType === type),
    [transactions, type]
  );
  const recent = useMemo(() => typeTransactions.slice(0, 5), [typeTransactions]);

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
    <BudgetFilters
      expenseOnly={false}
      type={type}
      period={period}
      date={date}
      onTypeChange={setType}
      onPeriodChange={setPeriod}
      onDateChange={setDate}
    />
  ) : undefined;

  // периодический бюджет: «Последние операции» и «По категориям» вкладками, общий для мобильной и десктопной раскладки
  const periodicTabs = (
    <Paper withBorder radius="lg" p="lg">
      <Tabs defaultValue="recent">
        <Tabs.List grow>
          <Tabs.Tab value="recent">Последние операции</Tabs.Tab>
          <Tabs.Tab value="categories">По категориям</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="recent" pt="md">
          {/* операции выбранного типа за выбранный период (день, неделя, месяц, год) */}
          <RecentCard bare items={items} />
        </Tabs.Panel>
        <Tabs.Panel value="categories" pt="md">
          {/* те же операции за период, сгруппированные по категориям */}
          <OperationsByCategory items={items} />
        </Tabs.Panel>
      </Tabs>
    </Paper>
  );

  // план затрат на месяц (только цели, без операций): у периодического бюджета, только для расходов
  const monthPlan =
    periodic && type === 'expense' ? (
      <MonthPlan
        householdId={householdId}
        month={planMonth}
        rows={planRows}
        canCopy={hasPrevPlan}
        onEdit={() => openPlan(null)}
        onPay={pay}
      />
    ) : null;

  return (
    <Box>
      <HeaderActions>
        <Menu position="bottom-end" shadow="md" width={200}>
          <Menu.Target>
            <ActionIcon variant="default" size="lg" radius="xl" aria-label="Настройки бюджета">
              <IconSettings size={18} />
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
      </HeaderActions>

      <Stack gap="lg">
        {/* разовый бюджет, десктоп: кнопка над блоком; у периодического «+» внутри карточки сводки, на мобильных тоже */}
        {!periodic && (
          <Box visibleFrom="sm">
            <Group justify="flex-end">
              <Button leftSection={<IconPlus size={16} />} onClick={addModal.open}>
                Добавить операцию
              </Button>
            </Group>
          </Box>
        )}

        {/* мобильная раскладка: «Последние» и «Категории» под табами в одном блоке;
            у разового бюджета блоки стоят плотнее */}
        <Stack
          gap={periodic ? 'lg' : 'sm'}
          hiddenFrom="lg"
          // разовый бюджет: страница не скроллится, итоги сверху неподвижны, прокручивается только список операций
          style={
            periodic
              ? undefined
              : {
                  // svh, не dvh: иначе высота прыгает каждый раз, когда при скролле
                  // прячется/появляется адресная строка браузера.
                  // вычитаем только верхний отступ: низ уходит под нижнее меню
                  height:
                    'calc(100svh - var(--app-shell-header-offset, 0rem) - var(--mantine-spacing-md))',
                }
          }
        >
          {mobileTop && <Box hiddenFrom="sm">{mobileTop}</Box>}

          <SummaryCard
            type={type}
            periodic={periodic}
            period={period}
            date={date}
            total={total}
            plan={planSummary}
            planMonth={planMonth}
            today={initialDate}
            shareTotals={shareTotals}
            onAdd={addModal.open}
            filters={filters}
          />

          {/* у периодического бюджета список операций идёт сразу под сводкой, платежи ниже */}
          {!periodic && pendingPayments.length > 0 && (
            <PendingPaymentsCard payments={pendingPayments} onPay={pay} />
          )}

          {periodic ? (
            periodicTabs
          ) : (
            // разовый бюджет: без табов; прокручивается только эта область без видимой полосы,
            // остальное закреплено; запас снизу, чтобы список доскролливался выше нижнего меню
            <ScrollArea type="never" style={{ flex: 1, minHeight: 0 }}>
              <Box pb={FOOTER_HEIGHT}>
                <OneTimeOperations
                  items={visibleItems}
                  onShowAll={allModal.open}
                  scope={scope}
                  onScopeChange={setScope}
                />
              </Box>
            </ScrollArea>
          )}

          {monthPlan}
        </Stack>

        {/* десктоп: категории слева, ожидаемые платежи и последние операции справа */}
        <Grid gap="lg" visibleFrom="lg">
          <Grid.Col span={{ base: 12, lg: periodic ? 'content' : 8 }}>
            {/* периодический бюджет: левая часть шириной 720px, план затрат встаёт рядом с ней */}
            <Stack gap="lg" style={periodic ? { width: 720, maxWidth: '100%' } : undefined}>
              <SummaryCard
                type={type}
                periodic={periodic}
                period={period}
                date={date}
                total={total}
                plan={planSummary}
                planMonth={planMonth}
                today={initialDate}
                shareTotals={shareTotals}
                onAdd={addModal.open}
                filters={filters}
              />

              {periodic ? (
                periodicTabs
              ) : (
                <CategoriesList
                  householdId={householdId}
                  periodic={periodic}
                  month={planMonth}
                  rows={categoryRows}
                  planMode={planMode}
                  canEditPlan={type === 'expense'}
                  hasPlan={planRows.length > 0}
                  canCopy={hasPrevPlan}
                  onEdit={() => openPlan(null)}
                  onSetLimit={openPlan}
                  onPay={pay}
                />
              )}
            </Stack>
          </Grid.Col>

          {periodic ? (
            monthPlan && (
              <Grid.Col span={{ base: 12, lg: 'auto' }}>
                <Box maw={460} miw={400}>
                  {monthPlan}
                </Box>
              </Grid.Col>
            )
          ) : (
            <Grid.Col span={{ base: 12, lg: 4 }}>
              <Stack gap="lg">
                {pendingPayments.length > 0 && (
                  <PendingPaymentsCard payments={pendingPayments} onPay={pay} />
                )}
                <OneTimeOperations items={recent} onShowAll={allModal.open} />
              </Stack>
            </Grid.Col>
          )}
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
        defaultType={type}
        prefill={prefill}
      />

      {periodic ? (
        <AllTransactionsModal
          opened={allOpened}
          onClose={allModal.close}
          type={type}
          periodLabel={formatPeriodLabel(period, date)}
          items={items}
        />
      ) : (
        <OneTimeAllOperationsModal
          opened={allOpened}
          onClose={allModal.close}
          items={typeTransactions}
          onEdit={setEditing}
          onDelete={removeTransaction}
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
