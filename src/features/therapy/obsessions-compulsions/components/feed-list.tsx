import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import type { ObsessionsCompulsionsData } from '@/types';
import { MetricTile } from '@/features/therapy/obsessions-compulsions/components/metric-tile';

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
            className="border-muted/30 bg-card/70 rounded-xl border px-6 py-6 shadow-sm md:px-8 md:py-7"
          >
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-3">
                  <div className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                    {texts.pairLabel} {index + 1}
                  </div>
                  <div className="space-y-2">
                    <SectionHeading icon="🧠" label={texts.obsessionLabel} />
                    <p className="text-foreground/90 text-sm leading-relaxed">
                      {obsession.obsession}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <MetricTile
                        label={texts.intensityLabel}
                        value={`${obsession.intensity}/10`}
                      />
                      <MetricTile
                        label={texts.recordedLabel}
                        value={new Date(obsession.createdAt).toLocaleDateString()}
                      />
                      {obsession.triggers.length > 0 && (
                        <TriggerBadges label={texts.triggersLabel} values={obsession.triggers} />
                      )}
                    </div>
                  </div>
                </div>

                <PairActions
                  onEdit={() => onEdit(index)}
                  onDelete={() => onDelete(index)}
                  editLabel={texts.editAction}
                  deleteLabel={texts.deleteAction}
                />
              </div>

              {compulsion && (
                <div className="space-y-3">
                  <SectionHeading icon="🔁" label={texts.compulsionLabel} />
                  <p className="text-foreground/90 text-sm leading-relaxed">
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

interface SectionHeadingProps {
  icon: string;
  label: string;
}

function SectionHeading({ icon, label }: SectionHeadingProps) {
  return (
    <div className="text-foreground flex items-center gap-2 text-lg font-semibold">
      <span aria-hidden>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

interface PairActionsProps {
  onEdit: () => void;
  onDelete: () => void;
  editLabel: string;
  deleteLabel: string;
}

function PairActions({ onEdit, onDelete, editLabel, deleteLabel }: PairActionsProps) {
  return (
    <div className="flex items-center gap-2 sm:self-start">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="flex items-center gap-1"
        onClick={onEdit}
      >
        <Pencil className="h-4 w-4" />
        {editLabel}
      </Button>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        className="flex items-center gap-1"
        onClick={onDelete}
      >
        <Trash2 className="h-4 w-4" />
        {deleteLabel}
      </Button>
    </div>
  );
}

interface TriggerBadgesProps {
  label: string;
  values: string[];
}

function TriggerBadges({ label, values }: TriggerBadgesProps) {
  return (
    <div className="border-muted/30 bg-background/40 rounded-lg border px-3 py-2">
      <span className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
        {label}
      </span>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {values.map((value) => (
          <Badge key={value} variant="secondary" className="text-xs font-medium">
            {value}
          </Badge>
        ))}
      </div>
    </div>
  );
}
