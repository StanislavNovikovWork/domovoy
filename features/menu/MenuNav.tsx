'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { IconChefHat, IconPlus } from '@tabler/icons-react';
import {
  ActionIcon,
  Box,
  Button,
  Center,
  Group,
  Image,
  NavLink,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { PageTopBar } from '@/features/app-shell';
import type { RecipeListItem } from '@/server/recipes/queries';

function Links({
  householdId,
  items,
  pathname,
}: {
  householdId: string;
  items: RecipeListItem[];
  pathname: string;
}) {
  const base = `/budgets/${householdId}/menu`;
  return (
    <>
      {items.map((item) => (
        <NavLink
          key={item.id}
          component={Link}
          href={`${base}/${item.id}`}
          label={item.title}
          leftSection={<IconChefHat size={18} />}
          active={pathname === `${base}/${item.id}`}
          variant="light"
          style={{ borderRadius: 'var(--mantine-radius-md)' }}
        />
      ))}
    </>
  );
}

// левая колонка «Меню» на десктопе: список рецептов
export function MenuNav({ householdId, items }: { householdId: string; items: RecipeListItem[] }) {
  const pathname = usePathname();

  return (
    <Box component="nav" w={260} visibleFrom="md" style={{ flexShrink: 0 }}>
      <Group justify="space-between" wrap="nowrap" mb="xs" px="xs">
        <Text fw={700} size="lg">
          Меню
        </Text>
        <Button
          component={Link}
          href={`/budgets/${householdId}/menu/new`}
          variant="light"
          size="compact-xs"
          leftSection={<IconPlus size={12} />}
        >
          Новый рецепт
        </Button>
      </Group>
      <Links householdId={householdId} items={items} pathname={pathname} />
      {items.length === 0 && (
        <Text size="sm" c="dimmed" px="xs">
          Рецептов пока нет
        </Text>
      )}
    </Box>
  );
}

// мобильный экран «Меню»: список рецептов; на десктопе открываем первый
export function MenuIndex({ householdId, items }: { householdId: string; items: RecipeListItem[] }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia('(min-width: 62em)').matches && items.length > 0) {
      router.replace(`/budgets/${householdId}/menu/${items[0].id}`);
    }
  }, [router, householdId, items]);

  return (
    <Stack gap="lg">
      <Box hiddenFrom="md">
        <PageTopBar
          backHref={`/budgets/${householdId}`}
          backLabel="К пространству"
          title="Меню"
          right={
            <ActionIcon
              component={Link}
              href={`/budgets/${householdId}/menu/new`}
              size="lg"
              radius="xl"
              aria-label="Новый рецепт"
            >
              <IconPlus size={20} />
            </ActionIcon>
          }
        />
      </Box>
      <SimpleGrid cols={2} hiddenFrom="md">
        {items.map((item) => (
          <UnstyledButton
            key={item.id}
            component={Link}
            href={`/budgets/${householdId}/menu/${item.id}`}
          >
            <Paper withBorder radius="lg" style={{ overflow: 'hidden' }}>
              {item.photoId ? (
                <Image
                  src={`/api/files/${item.photoId}`}
                  alt={item.title}
                  h={110}
                  fit="cover"
                />
              ) : (
                <Center h={110} bg="var(--mantine-color-default-hover)">
                  <IconChefHat size={32} color="var(--mantine-color-dimmed)" />
                </Center>
              )}
              <Text fw={600} size="sm" p="sm" ta="center" truncate>
                {item.title}
              </Text>
            </Paper>
          </UnstyledButton>
        ))}
      </SimpleGrid>
      {items.length === 0 && (
        <Text size="sm" c="dimmed" px="xs">
          Рецептов пока нет. Создайте первый
        </Text>
      )}
    </Stack>
  );
}
