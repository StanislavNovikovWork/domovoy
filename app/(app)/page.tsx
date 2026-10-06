import { notFound } from 'next/navigation';
import { requirePageSession } from '@/server/session';
import { getPersonalHousehold } from '@/server/households/queries';
import { listAllTransactions } from '@/server/transactions/queries';
import { listActiveCategories } from '@/server/categories/queries';
import { formatDate } from '@/shared/lib/period';
import { BudgetView } from '@/features/budget';

export default async function BudgetPage() {
  const { user } = await requirePageSession();
  const personal = await getPersonalHousehold(user.id);
  if (!personal) notFound();

  const [transactions, categories] = await Promise.all([
    listAllTransactions(personal.id),
    listActiveCategories(personal.id),
  ]);

  return (
    <BudgetView
      householdId={personal.id}
      initialDate={formatDate(new Date())}
      transactions={transactions}
      categories={categories}
    />
  );
}