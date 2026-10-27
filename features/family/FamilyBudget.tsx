'use client';

import Link from 'next/link';
import { IconArrowLeft, IconUsers } from '@tabler/icons-react';
import { ActionIcon, Box, Text } from '@mantine/core';
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
      <BudgetView
        {...budget}
        members={members.map((m) => ({ userId: m.userId, name: m.name }))}
        guestNames={guests.map((g) => g.name)}
        currentUserId={currentUserId}
        role={role}
        extraSettings={[
          {
            key: 'members',
            label: 'Участники',
            icon: <IconUsers size={18} />,
            onClick: modal.open,
          },
        ]}
        mobileTop={
          // на мобильных шапки нет: «назад» слева, название бюджета по центру страницы
          <Box pos="relative" h={36}>
            <ActionIcon
              component={Link}
              href="/"
              variant="default"
              size="lg"
              radius="xl"
              aria-label="К списку бюджетов"
              style={{ position: 'absolute', left: 0, top: 0 }}
            >
              <IconArrowLeft size={18} />
            </ActionIcon>
            {/* отступы по бокам, чтобы длинное название не заходило под кнопку */}
            <Text fw={600} ta="center" lh="36px" truncate mx={44}>
              {name}
            </Text>
          </Box>
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
