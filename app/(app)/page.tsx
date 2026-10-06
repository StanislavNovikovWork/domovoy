import { notFound } from 'next/navigation';
import { requirePageSession } from '@/server/session';
import { getPersonalHousehold } from '@/server/households/queries';
import { listMonthTransactions, getMonthTotalsByCategory } from '@/server/transactions/queries';
import { listActiveCategories } from '@/server/categories/queries';
import { currentMonth } from '@/shared/lib/month';
import { BudgetView } from '@/features/budget';

export default async function BudgetPage() {
  const { user } = await requirePageSession();
  const personal = await getPersonalHousehold(user.id);
  if (!personal) notFound();

  const month = currentMonth();
  const [transactions, totals, categories] = await Promise.all([
    listMonthTransactions(personal.id, month),
    getMonthTotalsByCategory(personal.id, month),
    listActiveCategories(personal.id),
  ]);

  const monthLabel = new Date().toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });

  return (
    <BudgetView
      householdId={personal.id}
      monthLabel={monthLabel}
      transactions={transactions}
      totals={totals}
      categories={categories}
    />
  );
}