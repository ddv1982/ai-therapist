import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale } from 'next-intl/server';
import { cookies } from 'next/headers';
import { locales, defaultLocale, type AppLocale } from '@/i18n/config';
import { RootProviders } from '@/app/providers';
import { getMessagesForLocale } from '@/i18n/messages-loader';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: false,
  fallback: ['system-ui', 'arial'],
  adjustFontFallback: false,
});
export const metadata: Metadata = {
  title: 'Therapist AI - Compassionate AI Therapy Support',
  description: 'A professional, judgment-free AI therapist application providing therapeutic support with session continuity and progress tracking.',
  keywords: ['therapy', 'mental health', 'AI therapist', 'counseling', 'support'],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black',
    title: 'AI Therapist',
  },
  icons: {
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180' },
    ],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#000000',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Prefer the cookie locale when present; fall back to next-intl detection
  const cookieLocale = (await cookies()).get('NEXT_LOCALE')?.value;
  const detected = await getLocale();
  const resolvedLocale: AppLocale = (locales as readonly string[]).includes(cookieLocale ?? '')
    ? (cookieLocale as AppLocale)
    : ((detected as AppLocale) ?? defaultLocale);

  // Load nested messages for the resolved locale (static imports for bundler compatibility)
  const messages = await getMessagesForLocale(resolvedLocale);
  return (
    <html lang={resolvedLocale} className={inter.variable} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body className="bg-background font-sans antialiased">
        <NextIntlClientProvider locale={resolvedLocale} messages={messages}>
          <RootProviders>
            {children}
          </RootProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
