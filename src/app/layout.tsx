import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/providers/app-provider';
import { getLocale, getMessages } from 'next-intl/server';

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
    icon: '/favicon.ico',
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

export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html lang={locale} className={`${inter.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="manifest" href="/manifest.webmanifest" />
      </head>
      <body className="bg-background font-sans antialiased">
        <AppProvider locale={locale} messages={messages}>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}