'use client';

import { Button } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { authClient } from '@/shared/lib/auth-client';

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await authClient.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <Button onClick={handleLogout} color="red">
      Выйти
    </Button>
  );
}
