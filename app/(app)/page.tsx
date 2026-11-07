import { LastSpaceRedirect } from '@/features/family/LastSpaceRedirect';
import { ensurePersonalSpace } from '@/server/households/actions';
import { listUserHouseholds } from '@/server/households/queries';
import { requirePageSession } from '@/server/session';

export const metadata = {
  title: 'Главная',
};

// корень приложения: открываем последнее пространство (или первое), список пространств — в переключателе
export default async function HomePage() {
  const { user } = await requirePageSession('/');
  // у пользователя без периодического пространства создаём «Моё пространство»
  await ensurePersonalSpace();
  const budgets = await listUserHouseholds(user.id);
  return <LastSpaceRedirect spaces={budgets.map((b) => ({ id: b.id, name: b.name }))} />;
}
