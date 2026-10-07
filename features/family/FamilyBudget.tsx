'use client';

import { Button } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconUsers } from '@tabler/icons-react';
import { BudgetView, type CategoryOption } from '@/features/budget';
import type { HouseholdMemberItem, InviteItem } from '@/server/households/queries';
import type { TransactionItem } from '@/shared/lib/budget';
import { MembersModal } from './MembersModal';

type Props = {
  householdId: string;
  currentUserId: string;
  role: 'owner' | 'member';
  initialDate: string;
  transactions: TransactionItem[];
  categories: CategoryOption[];
  members: HouseholdMemberItem[];
  invites: InviteItem[];
};

// семейный бюджет = обычный BudgetView плюс кнопка и модалка участников
export function FamilyBudget({ members, invites, currentUserId, role, ...budget }: Props) {
  const [opened, modal] = useDisclosure(false);

  return (
    <>
      <BudgetView
        {...budget}
        actions={
          <Button variant="default" leftSection={<IconUsers size={16} />} onClick={modal.open}>
            Участники
          </Button>
        }
      />
      <MembersModal
        opened={opened}
        onClose={modal.close}
        householdId={budget.householdId}
        currentUserId={currentUserId}
        role={role}
        members={members}
        invites={invites}
      />
    </>
  );
}
