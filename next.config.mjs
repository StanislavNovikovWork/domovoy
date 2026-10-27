import bundleAnalyzer from '@next/bundle-analyzer';
import pkg from './package.json' with { type: 'json' };

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer({
  reactStrictMode: false,
  // версия приложения (semver из package.json) для страницы профиля
  env: { NEXT_PUBLIC_APP_VERSION: pkg.version },
  // самодостаточная сборка для Docker: в образ попадает только нужное, без всего node_modules
  output: 'standalone',
  experimental: {
    optimizePackageImports: ['@mantine/core', '@mantine/hooks'],
    // клиентский кэш роутера: повторный переход на уже открытую страницу в течение 30с —
    // мгновенный, без запроса к серверу (mutations с revalidatePath кэш сбрасывают)
    staleTimes: { dynamic: 30 },
  },
});
