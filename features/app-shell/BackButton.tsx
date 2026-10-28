'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { IconArrowLeft } from '@tabler/icons-react';
import { ActionIcon, Box } from '@mantine/core';

// «назад» в левом верхнем углу раздела: возвращает на предыдущую страницу, как кнопка браузера.
// Если истории нет (страница открыта по прямой ссылке), ведёт на href.
// На десктопе скрыта: там навигация идёт через боковое меню
export function BackButton({ href, label = 'Назад' }: { href: string; label?: string }) {
  const router = useRouter();

  return (
    <Box display={{ base: 'contents', md: 'none' }}>
      <ActionIcon
      component={Link}
      href={href}
      variant="default"
      size="lg"
      radius="xl"
      aria-label={label}
      onClick={(e: React.MouseEvent) => {
        if (window.history.length <= 1) return;
        e.preventDefault();
        router.back();
      }}
    >
        <IconArrowLeft size={18} />
      </ActionIcon>
    </Box>
  );
}
