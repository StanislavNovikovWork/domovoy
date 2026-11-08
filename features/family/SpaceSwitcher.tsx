'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { IconChevronDown, IconPlus } from '@tabler/icons-react';
import {
  Box,
  Button,
  Group,
  NavLink,
  Stack,
  Text,
  Transition,
  UnstyledButton,
} from '@mantine/core';
import { CreateSpaceModal } from './CreateSpaceModal';

type Space = { id: string; name: string };

type Props = {
  spaces: Space[];
  currentId: string;
  currentName: string;
};

// переключатель пространства: название со стрелкой, выпадающий список на всю ширину экрана
export function SpaceSwitcher({ spaces, currentId, currentName }: Props) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{
    top: number;
    left: number;
    width: number | '100%';
    desktop: boolean;
  }>({ top: 0, left: 0, width: '100%', desktop: false });
  const [createOpen, setCreateOpen] = useState(false);

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    const rect = btnRef.current?.getBoundingClientRect();
    // на десктопе список компактный под кнопкой, на мобильных — на всю ширину экрана
    const desktop = window.matchMedia('(min-width: 62em)').matches;
    setPos({
      top: (rect?.bottom ?? 0) + 4,
      left: desktop ? (rect?.left ?? 0) : 0,
      width: desktop ? Math.max(rect?.width ?? 240, 240) : '100%',
      desktop,
    });
    setOpen(true);
  };

  const close = () => setOpen(false);

  return (
    <>
      <UnstyledButton
        ref={btnRef}
        w="100%"
        px="xs"
        py={6}
        aria-label="Выбрать пространство"
        aria-expanded={open}
        onClick={toggle}
        style={{ borderRadius: 'var(--mantine-radius-md)' }}
      >
        <Group justify="flex-start" wrap="nowrap" gap={4}>
          <Text fw={700} size="lg" truncate>
            {currentName}
          </Text>
          <IconChevronDown
            size={18}
            style={{
              flexShrink: 0,
              transform: open ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.15s ease',
            }}
          />
        </Group>
      </UnstyledButton>

      {/* затемнение под списком: от его верхнего края до низа экрана (сам список поверх) */}
      <Transition mounted={open} transition="fade" duration={180}>
        {(styles) => (
          <Box
            pos="fixed"
            top={pos.top}
            bottom={0}
            left={0}
            right={0}
            hiddenFrom="md"
            style={{ ...styles, zIndex: 299, background: 'rgba(0, 0, 0, 0.18)' }}
          />
        )}
      </Transition>
      {/* клик мимо закрывает список */}
      <Transition mounted={open} transition="fade" duration={180}>
        {(styles) => (
          <Box pos="fixed" inset={0} onClick={close} style={{ ...styles, zIndex: 299 }} />
        )}
      </Transition>
      <Transition mounted={open} transition="fade" duration={180} timingFunction="ease">
        {(styles) => (
        <Box
          pos="fixed"
          left={pos.left}
          w={pos.width}
          top={pos.top}
          bg="var(--mantine-color-body)"
          style={{
            ...styles,
            zIndex: 300,
            // десктоп — компактная карточка, мобильные — шторка на всю ширину с нижним скруглением
            ...(pos.desktop
              ? {
                  border: '1px solid var(--mantine-color-default-border)',
                  borderRadius: 'var(--mantine-radius-lg)',
                }
              : {
                  borderBottom: '1px solid var(--mantine-color-default-border)',
                  borderBottomLeftRadius: 'var(--mantine-radius-lg)',
                  borderBottomRightRadius: 'var(--mantine-radius-lg)',
                }),
            overflow: 'hidden',
          }}
        >
            <Stack gap={2} px="sm" pb="sm" pt={0}>
              {spaces
                .filter((s) => s.id !== currentId)
                .map((s) => (
                <NavLink
                  key={s.id}
                  component={Link}
                  href={`/budgets/${s.id}`}
                  label={<Text size="lg" fw={600}>{s.name}</Text>}
                  active={s.id === currentId}
                  onClick={close}
                  variant="light"
                  style={{ borderRadius: 'var(--mantine-radius-md)' }}
                />
              ))}
              <Button
                variant="subtle"
                color="gray"
                w="100%"
                justify="flex-start"
                leftSection={<IconPlus size={16} />}
                onClick={() => {
                  close();
                  setCreateOpen(true);
                }}
              >
                Создать новое пространство
              </Button>
            </Stack>
          </Box>
        )}
      </Transition>

      <CreateSpaceModal opened={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
