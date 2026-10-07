'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavLink } from '@mantine/core';
import { IconWallet } from '@tabler/icons-react';

const LINKS = [
  { href: '/', label: 'Бюджет', icon: IconWallet },
  // позже: Семья, Категории
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