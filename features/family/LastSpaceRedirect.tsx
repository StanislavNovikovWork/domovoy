'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader, Stack } from '@mantine/core';

type Props = {
  spaces: { id: string; name: string }[];
};

// корень приложения: открываем последнее пространство, иначе первое из списка
export function LastSpaceRedirect({ spaces }: Props) {
  const router = useRouter();

  useEffect(() => {
    let target = spaces[0]?.id;
    try {
      const saved = localStorage.getItem('cash:lastSpace');
      if (saved && spaces.some((s) => s.id === saved)) target = saved;
    } catch {
      // localStorage недоступен — открываем первое пространство
    }
    if (target) router.replace(`/budgets/${target}`);
  }, [router, spaces]);

  return (
    <Stack align="center" mt="30vh">
      <Loader />
    </Stack>
  );
}
