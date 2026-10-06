'use client';

import { Button, Group, useMantineColorScheme } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { authClient } from '@/shared/lib/auth-client';

export function ColorSchemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const router = useRouter();

  const handleLogout = async () => {
    await authClient.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <Group justify="center" mt="xl">
      <Button onClick={() => setColorScheme('light')}>Light</Button>
      <Button onClick={() => setColorScheme('dark')}>Dark</Button>
      <Button onClick={() => setColorScheme('auto')}>Auto</Button>
      <Button onClick={handleLogout} color="red">
        Выйти
      </Button>
    </Group>
  );
}
