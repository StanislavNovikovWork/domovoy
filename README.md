# Mantine Next.js template

This is a template for [Next.js](https://nextjs.org/) app router + [Mantine](https://mantine.dev/).
If you want to use pages router instead, see [next-pages-template](https://github.com/mantinedev/next-pages-template).

## Features

This template comes with the following features:

- [PostCSS](https://postcss.org/) with [mantine-postcss-preset](https://mantine.dev/styles/postcss-preset)
- [TypeScript](https://www.typescriptlang.org/)
- [Storybook](https://storybook.js.org/)
- [Jest](https://jestjs.io/) setup with [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)
- Oxlint setup for TypeScript and React sources

## npm scripts

### Build and dev scripts

- `dev` – start dev server together with an SSH tunnel to the server Postgres (`db:tunnel`); no local Postgres needed. `DATABASE_URL` in `.env.local` must point to `127.0.0.1:5432` with the server credentials (see `.env.db` on the server)
- `dev:next` – start dev server only (bring your own database)
- `db:tunnel` – forward `127.0.0.1:5432` to the server Postgres over SSH (`DEPLOY_HOST` / `DEPLOY_KEY` override the defaults)
- `build` – bundle application for production
- `analyze` – analyzes application bundle with [@next/bundle-analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)

### Testing scripts

- `typecheck` – checks TypeScript types
- `lint` – runs oxlint and stylelint
- `format:test` – checks files with oxfmt
- `jest` – runs jest tests
- `jest:watch` – starts jest watch
- `test` – runs `jest`, `format:test`, `lint` and `typecheck` scripts

### Other scripts

- `storybook` – starts storybook dev server
- `storybook:build` – build production storybook bundle to `storybook-static`
- `format:write` – formats all files with oxfmt
