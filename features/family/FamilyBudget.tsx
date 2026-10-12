'use client';

import Link from 'next/link';
import { IconArrowLeft, IconUsers } from '@tabler/icons-react';
import { ActionIcon, Menu } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { BudgetView, type CategoryOption } from '@/features/budget';
import type {
  HouseholdGuestItem,
  HouseholdMemberItem,
  InviteItem,
} from '@/server/households/queries';
import type { PlanItem, TransactionItem } from '@/shared/lib/budget';
import { HeaderLeft } from '@/shared/ui/HeaderActions';
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
  ...budget
}: Props) {
  const [opened, modal] = useDisclosure(false);

  return (
    <>
      <HeaderLeft>
        <ActionIcon
          component={Link}
          href="/budgets"
          variant="default"
          size="lg"
          radius="xl"
          aria-label="К списку бюджетов"
        >
          <IconArrowLeft size={18} />
        </ActionIcon>
      </HeaderLeft>
      <BudgetView
        {...budget}
        members={members.map((m) => ({ userId: m.userId, name: m.name }))}
        guestNames={guests.map((g) => g.name)}
        currentUserId={currentUserId}
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
