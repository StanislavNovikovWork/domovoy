'use client';

import { IconUsers } from '@tabler/icons-react';
import { Button } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { BudgetView, type CategoryOption } from '@/features/budget';
import type { HouseholdMemberItem, InviteItem } from '@/server/households/queries';
import type { PlanItem, TransactionItem } from '@/shared/lib/budget';
import { MembersModal } from './MembersModal';

type Props = {
  householdId: string;
  name: string;
  currentUserId: string;
  role: 'owner' | 'member';
  initialDate: string;
  transactions: TransactionItem[];
  categories: CategoryOption[];
  plans: PlanItem[];
  members: HouseholdMemberItem[];
  invites: InviteItem[];
};

// общий бюджет = обычный BudgetView плюс кнопка и модалка участников
export function FamilyBudget({ members, invites, currentUserId, role, name, ...budget }: Props) {
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
        name={name}
        currentUserId={currentUserId}
        role={role}
        members={members}
        invites={invites}
      />
    </>
  );
}
