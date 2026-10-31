'use client';

import type { ReactNode } from 'react';
import { Box, Group, Text } from '@mantine/core';
import { BackButton } from './BackButton';

type Props = {
  backHref: string;
  backLabel?: string;
  title: string;
  /** кнопка действия раздела в правом углу; без неё справа пустое место под ширину «назад» */
  right?: ReactNode;
  /** left: заголовок у левого края (страницы настроек), по умолчанию по центру */
  titleAlign?: 'center' | 'left';
};

// верх раздела: «назад» слева, заголовок по центру, справа действие раздела
export function PageTopBar({ backHref, backLabel, title, right, titleAlign = 'center' }: Props) {
  return (
    <Group justify="space-between" wrap="nowrap" gap="sm">
      <BackButton href={backHref} label={backLabel} />
      <Text fw={600} ta={titleAlign} truncate style={{ flex: 1 }}>
        {title}
      </Text>
      {right ?? <Box w={34} h={34} display={{ base: 'block', md: 'none' }} />}
    </Group>
  );
}
