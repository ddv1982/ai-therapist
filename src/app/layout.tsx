import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { headers } from 'next/headers';
import { routing, type Locale } from '@/i18n/routing';
import { RootProviders } from '@/app/providers';
import { SessionAIProvider } from '@/app/ai/session-ai';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,  // Preload font for faster render
  fallback: ['system-ui', 'arial'],
  adjustFontFallback: true,  // Show fallback while loading
});
export const metadata: Metadata = {
  title: 'Therapist AI - Compassionate AI Therapy Support',
  description:
    'A professional, judgment-free AI therapist application providing therapeutic support with session continuity and progress tracking.',
  keywords: ['therapy', 'mental health', 'AI therapist', 'counseling', 'support'],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black',
    title: 'AI Therapist',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32.png', type: 'image/png', sizes: '32x32' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // If essential public env is missing, render a lightweight fallback layout
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const convexUrlEnv = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!pk || !convexUrlEnv) {
    return (
      <html
        lang={routing.defaultLocale}
        className={inter.variable}
        data-scroll-behavior="smooth"
        suppressHydrationWarning
      >
        <head>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
          />
          <link rel="manifest" href="/manifest.webmanifest" />
        </head>
        <body className="bg-background font-sans antialiased">
          <div className="flex min-h-screen items-center justify-center p-8">
            <div className="max-w-md space-y-4 text-center">
              <h1 className="text-2xl font-semibold">Local environment not configured</h1>
              <p className="text-muted-foreground">
                Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and NEXT_PUBLIC_CONVEX_URL in .env.local to
                enable the full app. The server is running.
              </p>
            </div>
          </div>
        </body>
      </html>
    );
  }
  // Prefer the cookie locale when present; fall back to next-intl detection
  // Read from header (set in middleware) instead of cookies() - much faster!
  const headerStore = await headers();
  const cookieLocale = headerStore.get('x-locale');
  const detected = await getLocale();
  
  const resolvedLocale: Locale = routing.locales.includes(cookieLocale as Locale)
    ? (cookieLocale as Locale)
    : routing.locales.includes(detected as Locale)
      ? (detected as Locale)
      : routing.defaultLocale;

  // Load messages for the resolved locale
  const messages = await getMessages({ locale: resolvedLocale });
  return (
    <html
      lang={resolvedLocale}
      className={inter.variable}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body className="bg-background font-sans antialiased">
        <SessionAIProvider>
          <NextIntlClientProvider locale={resolvedLocale} messages={messages}>
            <RootProviders>{children}</RootProviders>
          </NextIntlClientProvider>
        </SessionAIProvider>
      </body>
    </html>
  );
}
