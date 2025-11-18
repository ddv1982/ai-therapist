'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  const t = useTranslations('ui');

  return (
    <div className="from-background via-background to-muted/20 flex min-h-screen items-center justify-center bg-gradient-to-br p-8">
      {/* Background decoration */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.1 }}
        transition={{ duration: 1 }}
      >
        <motion.div
          className="bg-primary absolute top-20 right-20 h-40 w-40 rounded-full blur-3xl"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity }}
        />
        <motion.div
          className="bg-accent absolute bottom-20 left-20 h-40 w-40 rounded-full blur-3xl"
          animate={{ rotate: 360 }}
          transition={{ duration: 25, repeat: Infinity, delay: 5 }}
        />
      </motion.div>

      <motion.div
        className="relative z-10 space-y-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, staggerChildren: 0.1 }}
      >
        {/* 404 Number */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1, y: [0, -20, 0] }}
          transition={{ duration: 0.6, y: { duration: 3, repeat: Infinity } }}
          className="from-primary via-accent to-primary bg-gradient-to-r bg-clip-text text-7xl font-bold text-transparent sm:text-8xl"
        >
          404
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-2"
        >
          <h1 className="text-3xl font-semibold sm:text-4xl">
            {t('notFound.title') || 'Page not found'}
          </h1>
          <p className="text-muted-foreground mx-auto max-w-md text-base sm:text-lg">
            {t('notFound.desc') || "The page you're looking for doesn't exist or has been moved."}
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col justify-center gap-4 pt-4 sm:flex-row"
        >
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-primary text-primary-foreground inline-flex items-center gap-2 rounded-md px-6 py-3 font-medium transition-all hover:shadow-lg"
            >
              <Home className="h-4 w-4" />
              {t('notFound.returnHome') || 'Go home'}
            </motion.button>
          </Link>
          <Link href="javascript:history.back()">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="border-border text-foreground hover:bg-muted inline-flex items-center gap-2 rounded-md border px-6 py-3 font-medium transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('notFound.goBack') || 'Go back'}
            </motion.button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
