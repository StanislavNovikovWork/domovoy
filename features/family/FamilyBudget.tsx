'use client';

import { Box, Text } from '@mantine/core';
import { BackButton } from '@/features/app-shell';
import { BudgetView, type CategoryOption } from '@/features/budget';
import type { HouseholdGuestItem, HouseholdMemberItem } from '@/server/households/queries';
import type { PlanItem, TransactionItem } from '@/shared/lib/budget';

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
};

// бюджет пространства: обычный BudgetView; «назад» ведёт в пространство
export function FamilyBudget({ members, guests, currentUserId, role, name, ...budget }: Props) {
  const backHref = `/budgets/${budget.householdId}`;

  return (
    <BudgetView
      {...budget}
      members={members.map((m) => ({ userId: m.userId, name: m.name }))}
      guestNames={guests.map((g) => g.name)}
      currentUserId={currentUserId}
      role={role}
      backHref={backHref}
      mobileTop={
        // на мобильных шапки нет: «назад» слева, название бюджета по центру страницы
        <Box pos="relative" h={36}>
          <Box pos="absolute" left={0} top={0}>
            <BackButton href={backHref} label="К пространству" />
          </Box>
          {/* отступы по бокам, чтобы длинное название не заходило под кнопку */}
          <Text fw={600} ta="center" lh="36px" truncate mx={44}>
            {name}
          </Text>
        </Box>
      }
    />
  );
}
