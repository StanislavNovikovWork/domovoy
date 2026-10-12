'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { IconCategory, IconSettings } from '@tabler/icons-react';
import { ActionIcon, Box, Grid, Menu, Paper, Stack, Tabs } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { CategoriesModal } from '@/features/categories';
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
  AddTransactionModal,
  type CategoryOption,
  type ShareParticipant,
} from './AddTransactionModal';
import { AllTransactionsModal } from './AllTransactionsModal';
import { BudgetToolbar } from './BudgetToolbar';
import { CategoriesList } from './CategoriesList';
import { PlanModal } from './PlanModal';
import { OneTimeOperations } from './OneTimeOperations';
import { PendingPaymentsCard, RecentCard } from './SidePanel';
import { SummaryCard } from './SummaryCard';

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
  /** суммы расходов по участникам (разовые бюджеты); под общей суммой */
  shareTotals?: { name: string; total: number }[];
  /** дополнительные пункты меню настроек (шестерёнка в шапке), например «Участники» */
  actions?: ReactNode;
};

export function BudgetView({
  householdId,
  initialDate,
  transactions,
  categories: allCategories,
  plans,
  periodic = true,
  members,
  guestNames,
  shareTotals,
  actions,
}: Props) {
  // в разовом бюджете только расходы: доходов и их категорий нет
  const categories = useMemo(
    () => (periodic ? allCategories : allCategories.filter((c) => c.type === 'expense')),
    [allCategories, periodic]
  );
  const [type, setType] = useState<TxType>('expense');
  const [period, setPeriod] = useState<Period>('month');
  const [date, setDate] = useState(initialDate);
  const [addOpened, addModal] = useDisclosure(false);
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

  const total = useMemo(() => items.reduce((acc, t) => acc + t.amount, 0), [items]);
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
            {actions}
            <Menu.Item leftSection={<IconCategory size={16} />} onClick={catsModal.open}>
              Категории
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </HeaderActions>

      <Stack gap="lg">
        <BudgetToolbar
          type={type}
          periodic={periodic}
          expenseOnly={!periodic}
          period={period}
          date={date}
          onTypeChange={setType}
          onPeriodChange={setPeriod}
          onDateChange={setDate}
          onAdd={addModal.open}
        />

        {/* мобильная раскладка: «Последние» и «Категории» под табами в одном блоке */}
        <Stack gap="lg" hiddenFrom="lg">
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
          />

          {pendingPayments.length > 0 && (
            <PendingPaymentsCard payments={pendingPayments} onPay={pay} />
          )}

          {periodic ? (
            <Paper withBorder radius="lg" p="lg">
              <Tabs defaultValue="recent">
                <Tabs.List grow>
                  <Tabs.Tab value="recent">Расходы</Tabs.Tab>
                  <Tabs.Tab value="categories">План</Tabs.Tab>
                </Tabs.List>
                <Tabs.Panel value="recent" pt="md">
                  {/* на мобильных показываем всю историю без ограничения, ссылка «Все операции» не нужна */}
                  <RecentCard bare items={typeTransactions} />
                </Tabs.Panel>
                <Tabs.Panel value="categories" pt="md">
                  <CategoriesList
                    bare
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
                </Tabs.Panel>
              </Tabs>
            </Paper>
          ) : (
            // разовый бюджет: без табов, «План» будет вынесен в другое место
            <OneTimeOperations items={typeTransactions} />
          )}
        </Stack>

        {/* десктоп: категории слева, ожидаемые платежи и последние операции справа */}
        <Grid gutter="lg" visibleFrom="lg">
          <Grid.Col span={{ base: 12, lg: 8 }}>
            <Stack gap="lg">
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
              />

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
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, lg: 4 }}>
            <Stack gap="lg">
              {pendingPayments.length > 0 && (
                <PendingPaymentsCard payments={pendingPayments} onPay={pay} />
              )}
              {periodic ? (
                <RecentCard items={recent} onShowAll={allModal.open} />
              ) : (
                <OneTimeOperations items={recent} onShowAll={allModal.open} />
              )}
            </Stack>
          </Grid.Col>
        </Grid>
      </Stack>

      <AddTransactionModal
        opened={addOpened}
        onClose={() => {
          addModal.close();
          setPrefill(null);
        }}
        householdId={householdId}
        categories={categories}
        members={periodic ? undefined : members}
        guestNames={guestNames}
        expenseOnly={!periodic}
        defaultType={type}
        prefill={prefill}
      />

      <AllTransactionsModal
        opened={allOpened}
        onClose={allModal.close}
        type={type}
        periodLabel={periodic ? formatPeriodLabel(period, date) : 'за всё время'}
        items={items}
      />

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
