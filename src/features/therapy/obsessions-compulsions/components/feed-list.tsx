import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import type { ObsessionsCompulsionsData } from '@/types/therapy';
import { MetricTile } from './metric-tile';

interface FeedListProps {
  data: ObsessionsCompulsionsData;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  texts: {
    pairLabel: string;
    obsessionLabel: string;
    compulsionLabel: string;
    recordedLabel: string;
    intensityLabel: string;
    frequencyLabel: string;
    durationLabel: string;
    durationUnit: string;
    reliefLabel: string;
    triggersLabel: string;
    editAction: string;
    deleteAction: string;
  };
}

export function FeedList({ data, onEdit, onDelete, texts }: FeedListProps) {
  return (
    <div className="space-y-6">
      {data.obsessions.map((obsession, index) => {
        const compulsion = data.compulsions[index];
        return (
          <Card
            key={obsession.id}
            className="rounded-xl border border-muted/30 bg-card/70 px-6 py-6 shadow-sm md:px-8 md:py-7"
          >
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {texts.pairLabel} {index + 1}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                      <span aria-hidden>🧠</span>
                      <span>{texts.obsessionLabel}</span>
                    </div>
                    <p className="text-sm leading-relaxed text-foreground/90">
                      {obsession.obsession}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <MetricTile label={texts.intensityLabel} value={`${obsession.intensity}/10`} />
                      <MetricTile
                        label={texts.recordedLabel}
                        value={new Date(obsession.createdAt).toLocaleDateString()}
                      />
                      {obsession.triggers.length > 0 && (
                        <div className="rounded-lg border border-muted/30 bg-background/40 px-3 py-2">
                          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            {texts.triggersLabel}
                          </span>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {obsession.triggers.map((trigger) => (
                              <Badge key={trigger} variant="secondary" className="text-xs font-medium">
                                {trigger}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:self-start">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => onEdit(index)}
                  >
                    <Pencil className="w-4 h-4" />
                    {texts.editAction}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => onDelete(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                    {texts.deleteAction}
                  </Button>
                </div>
              </div>

              {compulsion && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                    <span aria-hidden>🔁</span>
                    <span>{texts.compulsionLabel}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/90">
                    {compulsion.compulsion}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <MetricTile label={texts.frequencyLabel} value={`${compulsion.frequency}/10`} />
                    <MetricTile
                      label={texts.durationLabel}
                      value={`${compulsion.duration} ${texts.durationUnit}`}
                    />
                    <MetricTile label={texts.reliefLabel} value={`${compulsion.reliefLevel}/10`} />
                  </div>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
