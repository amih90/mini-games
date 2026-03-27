import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const isGithubPages = process.env.GITHUB_PAGES === 'true';
const basePath = isGithubPages ? '/mini-games' : '';

const nextConfig: NextConfig = {
  output: 'export',
  ...(isGithubPages && {
    basePath,
  }),
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default withNextIntl(nextConfig);
