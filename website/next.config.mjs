/** @type {import('next').NextConfig} */
const nextConfig = {
  // 純靜態匯出:next build 直接產出 out/,任何靜態主機都能 serve。
  output: 'export',
  images: { unoptimized: true },
  // monorepo 根目錄有 pnpm-lock.yaml,明確指定以 website/ 為根, 避免誤判。
  outputFileTracingRoot: import.meta.dirname,
};

export default nextConfig;
