import { notFound } from 'next/navigation';
import { z } from 'zod';
import { FamilyBudget } from '@/features/family';
import { listActiveCategories } from '@/server/categories/queries';
import { getUserHousehold, listGuests, listMembers } from '@/server/households/queries';
import { listPlans } from '@/server/plans/queries';
import { requirePageSession } from '@/server/session';
import { listAllTransactions } from '@/server/transactions/queries';
import { formatDate } from '@/shared/lib/period';

type Props = { params: Promise<{ id: string }> };

export default async function BudgetPage({ params }: Props) {
  const { id } = await params;
  const { user } = await requirePageSession(`/budgets/${id}/budget`);
  if (!z.uuid().safeParse(id).success) notFound();

  const budget = await getUserHousehold(user.id, id);
  if (!budget) notFound();

  const parentId = budget.parentId ?? null;
  const [transactions, categories, plans, members, guests, spaceMembers, spaceGuests] =
    await Promise.all([
      listAllTransactions(budget.id),
      listActiveCategories(budget.id),
      listPlans(budget.id),
      listMembers(budget.id),
      listGuests(budget.id),
      // у поездки участники добавляются из списка участников родительского пространства
      parentId ? listMembers(parentId) : Promise.resolve([]),
      parentId ? listGuests(parentId) : Promise.resolve([]),
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
      guests={guests}
      parentId={parentId}
      spaceMembers={spaceMembers}
      spaceGuests={spaceGuests}
    />
  );
}
