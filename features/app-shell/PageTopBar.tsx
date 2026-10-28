'use client';

import { Box, Group, Text } from '@mantine/core';
import { BackButton } from './BackButton';

type Props = {
  backHref: string;
  backLabel?: string;
  title: string;
};

// верх раздела: «назад» слева, заголовок по центру (справа пустое место под ширину кнопки)
export function PageTopBar({ backHref, backLabel, title }: Props) {
  return (
    <Group justify="space-between" wrap="nowrap" gap="sm">
      <BackButton href={backHref} label={backLabel} />
      <Text fw={600} ta="center" truncate style={{ flex: 1 }}>
        {title}
      </Text>
      <Box w={34} h={34} />
    </Group>
  );
}
