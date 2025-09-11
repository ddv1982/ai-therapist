import React from 'react';
import {useTranslations} from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FileText, Calendar, ArrowRight } from 'lucide-react';

export default function ReportsPage() {
  const t = useTranslations('reports');
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl font-semibold mb-2">{t('title')}</h1>
          <p className="text-base text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>

        {/* Coming Soon Notice */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-xl font-semibold">{t('comingSoon.title')}</CardTitle>
            <CardDescription className="text-base">
              {t('comingSoon.desc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-base text-muted-foreground">
              {t('comingSoon.includes')}
            </p>
            <ul className="text-sm text-muted-foreground space-y-2 max-w-md mx-auto">
              <li>• {t('comingSoon.item1')}</li>
              <li>• {t('comingSoon.item2')}</li>
              <li>• {t('comingSoon.item3')}</li>
              <li>• {t('comingSoon.item4')}</li>
              <li>• {t('comingSoon.item5')}</li>
            </ul>
            <div className="pt-4">
              <Link href="/chat">
                <Button size="lg" className="flex items-center space-x-2">
                  <span>{t('cta')}</span>
                  <ArrowRight size={16} />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Example Report Preview */}
        <div className="mt-12 max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold mb-6 text-center">{t('example.title')}</h2>
          <Card className="opacity-75">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{t('example.cardTitle')}</CardTitle>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar size={16} className="mr-1" />
                  {t('example.duration')}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="text-base font-semibold mb-2">{t('example.section1')}</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• {t('example.section1i1')}</li>
                  <li>• {t('example.section1i2')}</li>
                  <li>• {t('example.section1i3')}</li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-base font-semibold mb-2">{t('example.section2')}</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• {t('example.section2i1')}</li>
                  <li>• {t('example.section2i2')}</li>
                  <li>• {t('example.section2i3')}</li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-base font-semibold mb-2">{t('example.section3')}</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• {t('example.section3i1')}</li>
                  <li>• {t('example.section3i2')}</li>
                  <li>• {t('example.section3i3')}</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}