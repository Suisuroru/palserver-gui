import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://palserver-gui.iosoftware.ai',
      lastModified: new Date('2026-07-10'),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];
}
