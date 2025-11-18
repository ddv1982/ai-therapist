import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FileText, Calendar, ArrowRight } from 'lucide-react';

export default function ReportsPage() {
  const t = useTranslations('reports');
  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-xl font-semibold">{t('title')}</h1>
          <p className="text-muted-foreground text-base">{t('subtitle')}</p>
        </div>

        {/* Coming Soon Notice */}
        <Card className="mx-auto max-w-2xl">
          <CardHeader className="text-center">
            <div className="bg-muted mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <FileText className="text-muted-foreground h-8 w-8" />
            </div>
            <CardTitle className="text-xl font-semibold">{t('comingSoon.title')}</CardTitle>
            <CardDescription className="text-base">{t('comingSoon.desc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground text-base">{t('comingSoon.includes')}</p>
            <ul className="text-muted-foreground mx-auto max-w-md space-y-2 text-sm">
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
        <div className="mx-auto mt-12 max-w-4xl">
          <h2 className="mb-6 text-center text-xl font-semibold">{t('example.title')}</h2>
          <Card className="opacity-75">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{t('example.cardTitle')}</CardTitle>
                <div className="text-muted-foreground flex items-center text-sm">
                  <Calendar size={16} className="mr-1" />
                  {t('example.duration')}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="mb-2 text-base font-semibold">{t('example.section1')}</h4>
                <ul className="text-muted-foreground space-y-1 text-sm">
                  <li>• {t('example.section1i1')}</li>
                  <li>• {t('example.section1i2')}</li>
                  <li>• {t('example.section1i3')}</li>
                </ul>
              </div>

              <div>
                <h4 className="mb-2 text-base font-semibold">{t('example.section2')}</h4>
                <ul className="text-muted-foreground space-y-1 text-sm">
                  <li>• {t('example.section2i1')}</li>
                  <li>• {t('example.section2i2')}</li>
                  <li>• {t('example.section2i3')}</li>
                </ul>
              </div>

              <div>
                <h4 className="mb-2 text-base font-semibold">{t('example.section3')}</h4>
                <ul className="text-muted-foreground space-y-1 text-sm">
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
