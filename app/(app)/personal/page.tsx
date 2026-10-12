import { notFound } from 'next/navigation';
import { BudgetView } from '@/features/budget';
import { listActiveCategories } from '@/server/categories/queries';
import { getPersonalHousehold } from '@/server/households/queries';
import { listPlans } from '@/server/plans/queries';
import { requirePageSession } from '@/server/session';
import { listAllTransactions } from '@/server/transactions/queries';
import { formatDate } from '@/shared/lib/period';

export const metadata = {
  title: 'Личный бюджет',
};

export default async function PersonalBudgetPage() {
  const { user } = await requirePageSession('/personal');
  const personal = await getPersonalHousehold(user.id);
  if (!personal) notFound();

  const [transactions, categories, plans] = await Promise.all([
    listAllTransactions(personal.id),
    listActiveCategories(personal.id),
    listPlans(personal.id),
  ]);

  return (
    <BudgetView
      householdId={personal.id}
      initialDate={formatDate(new Date())}
      transactions={transactions}
      categories={categories}
      plans={plans}
    />
  );
}
