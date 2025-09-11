import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Brain, Sparkles } from 'lucide-react';
import {useTranslations} from 'next-intl';

interface DraftPanelProps {
  hasDraft: boolean;
  draftLastSaved?: string;
  onDeleteDraft: () => void;
  onResume: () => void;
  onStartFresh: () => void;
}

export function DraftPanel({ hasDraft, draftLastSaved, onDeleteDraft, onResume, onStartFresh }: DraftPanelProps) {
  const t = useTranslations('cbt');

  if (!hasDraft) {
    return (
      <div className="flex justify-center">
        <Button
          onClick={onResume}
          className="justify-center gap-3 h-12 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 group px-8"
        >
          <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
            <Brain className="w-4 h-4" />
          </div>
          <span className="font-semibold">{t('actions.begin')}</span>
          <Sparkles className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">📝 Previous Session Found</h3>
            {hasDraft && (
              <span className="px-2 py-1 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                {t('status.saved')}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('actions.deleteDraft')}
            title={t('actions.deleteDraft')}
            onClick={onDeleteDraft}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-sm opacity-90">
          {t('draft.found', { date: draftLastSaved ? new Date(draftLastSaved).toLocaleDateString() : 'recently' })}
        </p>
        <p className="text-sm opacity-75 mt-1">
          {t('draft.choice')}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          onClick={onResume}
          className="justify-center gap-3 h-12 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 group px-6"
        >
          <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
            <Brain className="w-4 h-4" />
          </div>
          <span className="font-semibold">{t('actions.resume')}</span>
          <Sparkles className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" />
        </Button>
        <Button
          onClick={onStartFresh}
          variant="outline"
          className="justify-center h-12 rounded-xl border-2 hover:bg-accent hover:text-accent-foreground px-6 font-semibold"
        >
          {t('actions.startNew')}
        </Button>
      </div>
    </div>
  );
}
