import { InviteCard, type InviteState } from '@/features/invite';
import { getInviteByToken, getUserHousehold, isInviteActive } from '@/server/households/queries';
import { getSession } from '@/server/session';
import { inviteTokenSchema } from '@/shared/schemas/household';

// нейтральный заголовок: превью в мессенджерах не раскроет имена
export const metadata = {
  title: 'Приглашение в бюджет',
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

  const membership = await getUserHousehold(session.user.id, invite.householdId);
  if (membership) return { kind: 'already-in-this', householdId: invite.householdId };

  return { kind: 'can-join', ...details };
}
