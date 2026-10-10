import { BudgetsList } from '@/features/family';
import { listUserHouseholds } from '@/server/households/queries';
import { requirePageSession } from '@/server/session';

export const metadata = {
  title: 'Мои бюджеты',
};

export default async function BudgetsPage() {
  const { user } = await requirePageSession('/budgets');
  const budgets = await listUserHouseholds(user.id);
  return <BudgetsList budgets={budgets} />;
}
