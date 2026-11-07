import { Stack } from '@mantine/core';
import { HomeProfileBar } from '@/features/app-shell';
import { BudgetsList } from '@/features/family';
import { ensurePersonalSpace } from '@/server/households/actions';
import { hasUnseenChangelog } from '@/server/changelog/seen';
import { listUserHouseholds } from '@/server/households/queries';
import { requirePageSession } from '@/server/session';

export const metadata = {
  title: 'Главная',
};

export default async function HomePage() {
  const { user } = await requirePageSession('/');
  // у пользователя без периодического пространства создаём «Моё пространство»
  await ensurePersonalSpace();
  const budgets = await listUserHouseholds(user.id);
  return (
    <Stack gap="lg">
      <HomeProfileBar hasNewChangelog={hasUnseenChangelog(user)} />
      <BudgetsList budgets={budgets} />
    </Stack>
  );
}
