import { Button } from '@/components/ui/button';
import { Trash2, Brain, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface DraftPanelProps {
  hasDraft: boolean;
  draftLastSaved?: string;
  onDeleteDraft: () => void;
  onResume: () => void;
  onStartFresh: () => void;
}

export function DraftPanel({
  hasDraft,
  draftLastSaved,
  onDeleteDraft,
  onResume,
  onStartFresh,
}: DraftPanelProps) {
  const t = useTranslations('cbt');

  if (!hasDraft) {
    return (
      <div className="flex justify-center">
        <Button
          onClick={onResume}
          className="group h-12 justify-center gap-3 rounded-xl px-8 shadow-lg transition-all duration-200 hover:shadow-xl"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 transition-colors group-hover:bg-white/30">
            <Brain className="h-4 w-4" />
          </div>
          <span className="font-semibold">{t('actions.begin')}</span>
          <Sparkles className="h-4 w-4 opacity-60 transition-opacity group-hover:opacity-100" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">📝 Previous Session Found</h3>
            {hasDraft && (
              <span className="rounded-full bg-green-100 px-2 py-1 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-400">
                {t('draft.statusSaved')}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('draft.delete')}
            title={t('draft.delete')}
            onClick={onDeleteDraft}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm opacity-90">
          {t('draft.found', {
            date: draftLastSaved ? new Date(draftLastSaved).toLocaleDateString() : 'recently',
          })}
        </p>
        <p className="mt-1 text-sm opacity-75">{t('draft.choice')}</p>
      </div>

      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        <Button
          onClick={onResume}
          className="group h-12 justify-center gap-3 rounded-xl px-6 shadow-lg transition-all duration-200 hover:shadow-xl"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 transition-colors group-hover:bg-white/30">
            <Brain className="h-4 w-4" />
          </div>
          <span className="font-semibold">{t('actions.resume')}</span>
          <Sparkles className="h-4 w-4 opacity-60 transition-opacity group-hover:opacity-100" />
        </Button>
        <Button
          onClick={onStartFresh}
          variant="outline"
          className="hover:bg-accent hover:text-accent-foreground h-12 justify-center rounded-xl border-2 px-6 font-semibold"
        >
          {t('actions.startNew')}
        </Button>
      </div>
    </div>
  );
}
