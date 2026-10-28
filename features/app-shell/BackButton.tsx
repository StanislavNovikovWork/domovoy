'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { IconArrowLeft } from '@tabler/icons-react';
import { ActionIcon } from '@mantine/core';

// «назад» в левом верхнем углу раздела: возвращает на предыдущую страницу, как кнопка браузера.
// Если истории нет (страница открыта по прямой ссылке), ведёт на href
export function BackButton({ href, label = 'Назад' }: { href: string; label?: string }) {
  const router = useRouter();

  return (
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
  );
}
