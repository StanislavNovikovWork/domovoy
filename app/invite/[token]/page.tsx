import { getFamilyHousehold, getInviteByToken, isInviteActive } from '@/server/households/queries';
import { getSession } from '@/server/session';
import { inviteTokenSchema } from '@/shared/schemas/household';
import { InviteCard, type InviteState } from '@/features/invite';

// нейтральный заголовок: превью в мессенджерах не раскроет имена
export const metadata = {
  title: 'Приглашение в семейный бюджет',
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ token: string }> };

export default async function InvitePage({ params }: Props) {
  const { token } = await params;
  const state = await resolveState(token);
  return <InviteCard token={token} state={state} />;
}

// Страница только читает данные; вступление — отдельное действие по кнопке,
// иначе боты-превью «использовали» бы приглашение раньше человека
async function resolveState(token: string): Promise<InviteState> {
  if (!inviteTokenSchema.safeParse(token).success) return { kind: 'invalid' };

  const invite = await getInviteByToken(token);
  if (!invite || !isInviteActive(invite)) return { kind: 'invalid' };

  const session = await getSession();
  const details = { inviterName: invite.inviterName, householdName: invite.householdName };
  if (!session) return { kind: 'guest', ...details };

  const family = await getFamilyHousehold(session.user.id);
  if (family?.id === invite.householdId) return { kind: 'already-in-this' };
  if (family) return { kind: 'already-in-other' };

  return { kind: 'can-join', ...details };
}
