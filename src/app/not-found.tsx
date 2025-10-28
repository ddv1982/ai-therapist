'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  const t = useTranslations('ui');

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-background via-background to-muted/20">
      {/* Background decoration */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.1 }}
        transition={{ duration: 1 }}
      >
        <motion.div
          className="absolute top-20 right-20 w-40 h-40 bg-primary rounded-full blur-3xl"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 left-20 w-40 h-40 bg-accent rounded-full blur-3xl"
          animate={{ rotate: 360 }}
          transition={{ duration: 25, repeat: Infinity, delay: 5 }}
        />
      </motion.div>

      <motion.div
        className="text-center space-y-8 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, staggerChildren: 0.1 }}
      >
        {/* 404 Number */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1, y: [0, -20, 0] }}
          transition={{ duration: 0.6, y: { duration: 3, repeat: Infinity } }}
          className="text-7xl sm:text-8xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent"
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
          <h1 className="text-3xl sm:text-4xl font-semibold">
            {t('notFound.title') || 'Page not found'}
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto">
            {t('notFound.desc') || "The page you're looking for doesn't exist or has been moved."}
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
        >
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-primary text-primary-foreground font-medium transition-all hover:shadow-lg"
            >
              <Home className="w-4 h-4" />
              {t('notFound.returnHome') || 'Go home'}
            </motion.button>
          </Link>
          <Link href="javascript:history.back()">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md border border-border text-foreground font-medium transition-all hover:bg-muted"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('notFound.goBack') || 'Go back'}
            </motion.button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
