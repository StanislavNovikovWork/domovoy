import { BudgetsList } from '@/features/family';
import { listUserHouseholds } from '@/server/households/queries';
import { requirePageSession } from '@/server/session';

export const metadata = {
  title: 'Главная',
};

export default async function HomePage() {
  const { user } = await requirePageSession('/');
  const budgets = await listUserHouseholds(user.id);
  return <BudgetsList budgets={budgets} />;
}
