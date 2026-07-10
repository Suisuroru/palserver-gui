import type { Metadata, Viewport } from 'next';
import './globals.css';

const SITE_URL = 'https://palserver-gui.iosoftware.ai';
const TITLE = 'palserver GUI — 帕魯專用伺服器管理, 一鍵開服零指令';
const DESCRIPTION =
  'palserver GUI 是免費開源的帕魯(Palworld)專用伺服器管理工具:一鍵開服、80+ 世界設定、模組管理、自動備份、手機遠端管理。零指令、零設定檔, 免安裝下載即用。';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: '%s — palserver GUI' },
  description: DESCRIPTION,
  keywords: [
    '帕魯伺服器',
    '帕魯開服',
    '帕魯專用伺服器',
    'Palworld 伺服器',
    'Palworld dedicated server',
    'Palworld server manager',
    '開服工具',
    '伺服器管理介面',
    'palserver GUI',
    '免費開源',
  ],
  authors: [{ name: 'Eason Lu (Dalufish)', url: 'https://github.com/Dalufishe' }],
  creator: 'io software',
  publisher: 'io software',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'palserver GUI',
    locale: 'zh_TW',
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: '/assets/overview.jpg',
        width: 1320,
        height: 848,
        alt: 'palserver GUI 伺服器管理總覽畫面',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/assets/overview.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  category: 'technology',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#7A5FCF' },
    { media: '(prefers-color-scheme: dark)', color: '#201C2C' },
  ],
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE_URL}/#app`,
      name: 'palserver GUI',
      description: DESCRIPTION,
      url: SITE_URL,
      applicationCategory: 'GameApplication',
      operatingSystem: 'Windows, Linux',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
      downloadUrl: 'https://github.com/io-software-ai/palserver-gui/releases',
      softwareVersion: '2.0',
      inLanguage: ['zh-Hant', 'en', 'ja'],
      screenshot: `${SITE_URL}/assets/overview.jpg`,
      license: 'https://polyformproject.org/licenses/noncommercial/1.0.0/',
      author: { '@id': `${SITE_URL}/#org` },
    },
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#org`,
      name: 'io software',
      url: 'https://iosoftware.ai',
      logo: `${SITE_URL}/assets/iosoftware-logo.svg`,
      email: 'contact@iosoftware.ai',
      sameAs: [
        'https://github.com/io-software-ai',
        'https://www.instagram.com/iosoftware.ai/',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#site`,
      name: 'palserver GUI',
      url: SITE_URL,
      inLanguage: 'zh-Hant',
      publisher: { '@id': `${SITE_URL}/#org` },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
