import type { ReactNode } from 'react';
import Image from 'next/image';
import bg from '@/app/bg.png';
import logo from '@/app/icon.png';
import { Box, Container, Group, Paper, Stack, Text, Title } from '@mantine/core';

// общая обёртка страниц входа/регистрации: фото слева, форма справа
type Props = {
  children: ReactNode;
};

export function AuthShell({ children }: Props) {
  return (
    <Box mih="100dvh" style={{ display: 'flex', flexDirection: 'column' }}>
      <Box style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* фото слева ~2/3 экрана */}
        <Box visibleFrom="md" pos="relative" style={{ flex: '0 0 68%' }}>
          <Image src={bg} alt="" fill priority sizes="68vw" style={{ objectFit: 'cover' }} />
        </Box>
        {/* справа — форма на фирменном фоне */}
        <Box
          bg="#228BE6"
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: '4dvh',
          }}
        >
          <Container size={440} w="100%" px="md" py="xl">
            <Stack gap="xl">
              <Group gap="sm" align="center">
                <Image src={logo} alt="" width={80} height={80} priority />
                <Text fw={700} lh={1.15} c="white" style={{ fontSize: '1.6rem' }}>
                  Семейные
                  <br />
                  дела
                </Text>
              </Group>
              <Box mt={50}>
                <Title order={1} size="h1" lh={1.15} c="white">
                  Вместе еще
                  <br />
                  лучше
                </Title>
                <Text c="rgba(255,255,255,0.75)" mt={4}>
                  Планируйте, организуйте и наслаждайтесь временем с семьей
                </Text>
              </Box>
              <Paper withBorder shadow="sm" p="xl" radius="lg">
                {children}
              </Paper>
            </Stack>
          </Container>
        </Box>
      </Box>
    </Box>
  );
}
