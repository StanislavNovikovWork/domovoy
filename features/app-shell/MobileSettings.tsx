'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { IconChevronRight, IconSettings } from '@tabler/icons-react';
import { ActionIcon, Modal, NavLink, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useSettingsItems } from '@/shared/ui/SettingsItems';

// мобильные: кнопка настроек раздела в правом верхнем углу и полноэкранное окно с пунктами
export function MobileSettings() {
  const pathname = usePathname();
  const [settingsOpened, settings] = useDisclosure(false);
  const items = useSettingsItems();

  // окно настроек живёт в общем лейауте: закрываем при смене страницы (например, после удаления бюджета)
  // и когда у страницы не осталось пунктов настроек
  useEffect(() => {
    settings.close();
  }, [pathname, items.length === 0]);

  return (
    <>
      {/* настройки бюджета — фиксированная кнопка в правом верхнем углу экрана */}
      {items.length > 0 && (
        <ActionIcon
          hiddenFrom="sm"
          variant="default"
          size="lg"
          radius="xl"
          aria-label="Настройки бюджета"
          onClick={settings.open}
          style={{
            position: 'fixed',
            top: 'var(--mantine-spacing-md)',
            right: 'var(--mantine-spacing-md)',
            zIndex: 100,
          }}
        >
          <IconSettings size={18} />
        </ActionIcon>
      )}

      {/* полноэкранные настройки; пункты открывают вложенные окна поверх (zIndex выше), сами не закрываются */}
      <Modal
        opened={settingsOpened}
        onClose={settings.close}
        fullScreen
        radius={0}
        title="Настройки"
        transitionProps={{ transition: 'slide-up' }}
      >
        <Stack gap={2} pb="md">
          {items.map((item) => (
            <NavLink
              key={item.key}
              label={item.label}
              leftSection={item.icon}
              rightSection={<IconChevronRight size={16} />}
              onClick={item.onClick}
              style={{ borderRadius: 'var(--mantine-radius-md)' }}
            />
          ))}
        </Stack>
      </Modal>
    </>
  );
}
