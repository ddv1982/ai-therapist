import {useTranslations} from 'next-intl';

export default function NotFound() {
  const t = useTranslations('ui');
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-semibold">{t('notFound.title')}</h1>
        <p className="text-muted-foreground">{t('notFound.desc')}</p>
      </div>
    </div>
  );
}
