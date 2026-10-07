import { requirePageSession } from '@/server/session';
import { getFamilyHousehold, listActiveInvites, listMembers } from '@/server/households/queries';
import { listAllTransactions } from '@/server/transactions/queries';
import { listActiveCategories } from '@/server/categories/queries';
import { formatDate } from '@/shared/lib/period';
import { CreateFamilyCard, FamilyBudget } from '@/features/family';

export const metadata = {
  title: 'Семейный бюджет',
};

export default async function FamilyPage() {
  const { user } = await requirePageSession('/family');
  const family = await getFamilyHousehold(user.id);
  if (!family) return <CreateFamilyCard />;

  const [transactions, categories, members, invites] = await Promise.all([
    listAllTransactions(family.id),
    listActiveCategories(family.id),
    listMembers(family.id),
    // приглашения видит только владелец
    family.role === 'owner' ? listActiveInvites(family.id) : Promise.resolve([]),
  ]);

  return (
    <FamilyBudget
      householdId={family.id}
      currentUserId={user.id}
      role={family.role}
      initialDate={formatDate(new Date())}
      transactions={transactions}
      categories={categories}
      members={members}
      invites={invites}
    />
  );
}
