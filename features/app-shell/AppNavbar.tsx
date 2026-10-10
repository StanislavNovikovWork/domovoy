'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconUsers, IconWallet } from '@tabler/icons-react';
import { NavLink } from '@mantine/core';

const LINKS = [
  { href: '/', label: 'Личный бюджет', icon: IconWallet },
  { href: '/budgets', label: 'Мои бюджеты', icon: IconUsers },
];

export function AppNavbar({ onNavigate }: { onNavigate: () => void }) {
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
          active={href === '/' ? pathname === '/' : pathname.startsWith(href)}
          onClick={onNavigate}
          style={{ borderRadius: 'var(--mantine-radius-md)' }}
        />
      ))}
    </>
  );
}
