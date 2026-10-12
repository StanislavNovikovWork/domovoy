'use client';

import { IconUsers } from '@tabler/icons-react';
import { Menu } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { BudgetView, type CategoryOption } from '@/features/budget';
import type {
  HouseholdGuestItem,
  HouseholdMemberItem,
  InviteItem,
} from '@/server/households/queries';
import type { PlanItem, TransactionItem } from '@/shared/lib/budget';
import { MembersModal } from './MembersModal';

type Props = {
  householdId: string;
  name: string;
  periodic: boolean;
  currentUserId: string;
  role: 'owner' | 'member';
  initialDate: string;
  transactions: TransactionItem[];
  categories: CategoryOption[];
  plans: PlanItem[];
  shareTotals: { name: string; total: number }[];
  members: HouseholdMemberItem[];
  guests: HouseholdGuestItem[];
  invites: InviteItem[];
};

// общий бюджет = обычный BudgetView плюс кнопка и модалка участников
export function FamilyBudget({
  members,
  guests,
  invites,
  currentUserId,
  role,
  name,
  shareTotals,
  ...budget
}: Props) {
  const [opened, modal] = useDisclosure(false);

  return (
    <>
      <BudgetView
        {...budget}
        shareTotals={shareTotals}
        members={members.map((m) => ({ userId: m.userId, name: m.name }))}
        guestNames={guests.map((g) => g.name)}
        actions={
          <Menu.Item leftSection={<IconUsers size={16} />} onClick={modal.open}>
            Участники
          </Menu.Item>
        }
      />
      <MembersModal
        opened={opened}
        onClose={modal.close}
        householdId={budget.householdId}
        name={name}
        currentUserId={currentUserId}
        role={role}
        members={members}
        guests={guests}
        invites={invites}
      />
    </>
  );
}
