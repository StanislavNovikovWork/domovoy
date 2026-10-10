import { notFound, redirect } from 'next/navigation';
import { z } from 'zod';
import { FamilyBudget } from '@/features/family';
import { listActiveCategories } from '@/server/categories/queries';
import { getUserHousehold, listActiveInvites, listMembers } from '@/server/households/queries';
import { listPlans } from '@/server/plans/queries';
import { requirePageSession } from '@/server/session';
import { listAllTransactions } from '@/server/transactions/queries';
import { formatDate } from '@/shared/lib/period';

type Props = { params: Promise<{ id: string }> };

export default async function SharedBudgetPage({ params }: Props) {
  const { id } = await params;
  const { user } = await requirePageSession(`/budgets/${id}`);
  if (!z.uuid().safeParse(id).success) notFound();

  const budget = await getUserHousehold(user.id, id);
  if (!budget) notFound();
  if (budget.type === 'personal') redirect('/');

  const [transactions, categories, plans, members, invites] = await Promise.all([
    listAllTransactions(budget.id),
    listActiveCategories(budget.id),
    listPlans(budget.id),
    listMembers(budget.id),
    // приглашения видит только владелец
    budget.role === 'owner' ? listActiveInvites(budget.id) : Promise.resolve([]),
  ]);

  return (
    <FamilyBudget
      householdId={budget.id}
      name={budget.name}
      periodic={budget.kind === 'periodic'}
      currentUserId={user.id}
      role={budget.role}
      initialDate={formatDate(new Date())}
      transactions={transactions}
      categories={categories}
      plans={plans}
      members={members}
      invites={invites}
    />
  );
}
