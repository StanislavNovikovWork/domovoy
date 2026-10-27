'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconUsers } from '@tabler/icons-react';
import { NavLink } from '@mantine/core';

const LINKS = [{ href: '/', label: 'Главная', icon: IconUsers }];

// главная и страницы бюджетов (/budgets/...) — один раздел
const isActive = (pathname: string) => pathname === '/' || pathname.startsWith('/budgets');

export function AppNavbar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {LINKS.map(({ href, label, icon: Icon }) => (
        <NavLink
          key={href}
          component={Link}
          href={href}
          label={label}
          leftSection={<Icon size={18} />}
          active={isActive(pathname)}
          onClick={onNavigate}
          style={{ borderRadius: 'var(--mantine-radius-md)' }}
        />
      ))}
    </>
  );
}
