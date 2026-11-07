'use client';

import { useState } from 'react';
import { IconSettings } from '@tabler/icons-react';
import { Box, Text } from '@mantine/core';
import { BackButton } from '@/features/app-shell';
import { BudgetView, type CategoryOption } from '@/features/budget';
import type { HouseholdGuestItem, HouseholdMemberItem } from '@/server/households/queries';
import type { PlanItem, TransactionItem } from '@/shared/lib/budget';
import type { SettingsItem } from '@/shared/ui/SettingsItems';
import { TripSettingsModal } from './TripSettingsModal';

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
  /** родительское пространство для поездки и его участники (только у one_time) */
  parentId?: string | null;
  spaceMembers?: HouseholdMemberItem[];
  spaceGuests?: HouseholdGuestItem[];
};

// бюджет пространства: обычный BudgetView; «назад» ведёт в пространство
export function FamilyBudget({
  members,
  guests,
  currentUserId,
  role,
  name,
  parentId,
  spaceMembers,
  spaceGuests,
  ...budget
}: Props) {
  const backHref = `/budgets/${budget.householdId}`;
  const [tripSettingsOpen, setTripSettingsOpen] = useState(false);
  // у поездки вместо «Категорий» — настройки поездки (название, участники, удаление)
  const extraSettings: SettingsItem[] = budget.periodic
    ? []
    : [
        {
          key: 'trip-settings',
          label: 'Настройки поездки',
          icon: <IconSettings size={18} />,
          onClick: () => setTripSettingsOpen(true),
        },
      ];

  return (
    <>
      <BudgetView
        {...budget}
        extraSettings={extraSettings}
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
      {!budget.periodic && parentId && (
        <TripSettingsModal
          opened={tripSettingsOpen}
          onClose={() => setTripSettingsOpen(false)}
          householdId={budget.householdId}
          parentId={parentId}
          name={name}
          role={role}
          currentUserId={currentUserId}
          members={members}
          guests={guests}
          spaceMembers={spaceMembers ?? []}
          spaceGuests={spaceGuests ?? []}
        />
      )}
    </>
  );
}
