'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { IconUser } from '@tabler/icons-react';
import { ActionIcon, Box, Group, Indicator, Text } from '@mantine/core';

type Props = {
  /** вышла новая версия, список изменений которой пользователь ещё не открывал: красная точка на профиле */
  hasNewChangelog: boolean;
  /** заголовок между кнопками (название пространства) */
  title?: string;
  /** вместо заголовка — свой элемент (например, переключатель пространств) */
  titleMenu?: ReactNode;
};

// верх главной и пространства: «Главная» в левом углу, «Профиль» в правом, между ними заголовок
export function HomeProfileBar({ hasNewChangelog, title, titleMenu }: Props) {
  return (
    <Group justify="space-between" wrap="nowrap" gap="sm">
      {titleMenu ? (
        <Box style={{ flex: 1, minWidth: 0 }}>{titleMenu}</Box>
      ) : (
        title && (
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Text fw={600} ta="center" truncate>
              {title}
            </Text>
          </Box>
        )
      )}
      <Indicator color="red" size={9} offset={4} disabled={!hasNewChangelog}>
        <ActionIcon
          component={Link}
          href="/profile"
          variant="default"
          size="lg"
          radius="xl"
          aria-label="Профиль"
        >
          <IconUser size={18} />
        </ActionIcon>
      </Indicator>
    </Group>
  );
}
