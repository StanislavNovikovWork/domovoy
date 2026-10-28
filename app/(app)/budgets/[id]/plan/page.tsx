import { notFound } from 'next/navigation';
import { z } from 'zod';
import { PlanView } from '@/features/budget/PlanView';
import { listActiveCategories } from '@/server/categories/queries';
import { getUserHousehold, listGuests, listMembers } from '@/server/households/queries';
import { listPlans } from '@/server/plans/queries';
import { requirePageSession } from '@/server/session';
import { listAllTransactions } from '@/server/transactions/queries';
import { formatDate } from '@/shared/lib/period';

type Props = { params: Promise<{ id: string }> };

export default async function PlanPage({ params }: Props) {
  const { id } = await params;
  const { user } = await requirePageSession(`/budgets/${id}/plan`);
  if (!z.uuid().safeParse(id).success) notFound();

  const budget = await getUserHousehold(user.id, id);
  if (!budget) notFound();

  const [transactions, categories, plans, members, guests] = await Promise.all([
    listAllTransactions(budget.id),
    listActiveCategories(budget.id),
    listPlans(budget.id),
    listMembers(budget.id),
    listGuests(budget.id),
  ]);

  return (
    <PlanView
      householdId={budget.id}
      periodic={budget.kind === 'periodic'}
      currentUserId={user.id}
      role={budget.role}
      initialDate={formatDate(new Date())}
      transactions={transactions}
      categories={categories}
      plans={plans}
      members={members}
      guestNames={guests.map((g) => g.name)}
    />
  );
}
