'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { IconSettings } from '@tabler/icons-react';
import { Box, Button, Grid, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { CategoriesModal } from '@/features/categories';
import {
  buildCategoryRows,
  buildPlainRows,
  buildPlanRows,
  filterTransactions,
  groupByCategory,
  listPendingPayments,
  summarizePlan,
  type PlanItem,
  type TransactionItem,
  type TxType,
} from '@/shared/lib/budget';
import {
  formatPeriodLabel,
  getPeriodRange,
  monthStart,
  prevMonth,
  type Period,
} from '@/shared/lib/period';
import { HeaderActions } from '@/shared/ui/HeaderActions';
import { AddTransactionModal, type CategoryOption } from './AddTransactionModal';
import { AllTransactionsModal } from './AllTransactionsModal';
import { BudgetToolbar } from './BudgetToolbar';
import { CategoriesList } from './CategoriesList';
import { PlanModal } from './PlanModal';
import { PendingPaymentsCard, RecentCard } from './SidePanel';
import { SummaryCard } from './SummaryCard';

type Props = {
  householdId: string;
  initialDate: string;
  transactions: TransactionItem[];
  categories: CategoryOption[];
  plans: PlanItem[];
  /** дополнительные кнопки в шапке рядом с «Категории» (например, «Участники» в семейном бюджете) */
  actions?: ReactNode;
};

export function BudgetView({
  householdId,
  initialDate,
  transactions,
  categories,
  plans,
  actions,
}: Props) {
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
    () => filterTransactions(transactions, type, getPeriodRange(period, date)),
    [transactions, type, period, date]
  );
  const totals = useMemo(() => groupByCategory(items), [items]);

  // план всегда за месяц выбранной даты, независимо от периода сверху
  const planMonth = monthStart(date);
  const planRows = useMemo(
    () =>
      buildPlanRows(plans, categories, transactions, planMonth, getPeriodRange('month', planMonth)),
    [plans, categories, transactions, planMonth]
  );
  const hasPrevPlan = useMemo(() => {
    const prev = prevMonth(planMonth);
    return buildPlanRows(plans, categories, [], prev, getPeriodRange('month', prev)).length > 0;
  }, [plans, categories, planMonth]);

  // лимиты и статьи показываем только в расходах за месяц; иначе обычный список по категориям
  const planMode = type === 'expense' && period === 'month';
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
  const recent = useMemo(
    () => transactions.filter((t) => t.categoryType === type).slice(0, 5),
    [transactions, type]
  );

  const pay = (categoryId: string, name: string, remaining: number) => {
    setPrefill({ categoryId, note: name, amount: remaining / 100 });
    addModal.open();
  };

  return (
    <Box>
      <HeaderActions>
        {actions}
        <Button variant="default" leftSection={<IconSettings size={16} />} onClick={catsModal.open}>
          Категории
        </Button>
      </HeaderActions>

      <Stack gap="lg">
        <BudgetToolbar
          type={type}
          period={period}
          date={date}
          onTypeChange={setType}
          onPeriodChange={setPeriod}
          onDateChange={setDate}
          onAdd={addModal.open}
        />

        <Grid gutter="lg">
          <Grid.Col span={{ base: 12, lg: 8 }}>
            <Stack gap="lg">
              <SummaryCard
                type={type}
                period={period}
                date={date}
                total={total}
                totals={totals}
                plan={planSummary}
                planMonth={planMonth}
                today={initialDate}
              />

              <CategoriesList
                householdId={householdId}
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
              <RecentCard items={recent} onShowAll={allModal.open} />
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
        defaultType={type}
        prefill={prefill}
      />

      <AllTransactionsModal
        opened={allOpened}
        onClose={allModal.close}
        type={type}
        periodLabel={formatPeriodLabel(period, date)}
        items={items}
      />

      <PlanModal
        opened={planOpened}
        onClose={planModal.close}
        householdId={householdId}
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
      />
    </Box>
  );
}
