import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer({
  reactStrictMode: false,
  // самодостаточная сборка для Docker: в образ попадает только нужное, без всего node_modules
  output: 'standalone',
  // главная страница — список бюджетов
  async redirects() {
    return [{ source: '/', destination: '/budgets', permanent: false }];
  },
  experimental: {
    optimizePackageImports: ['@mantine/core', '@mantine/hooks'],
    // клиентский кэш роутера: повторный переход на уже открытую страницу в течение 30с —
    // мгновенный, без запроса к серверу (mutations с revalidatePath кэш сбрасывают)
    staleTimes: { dynamic: 30 },
  },
});
