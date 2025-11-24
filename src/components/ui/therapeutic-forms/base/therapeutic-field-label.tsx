import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export interface TherapeuticFieldLabelProps {
  label?: string;
  required?: boolean;
  isValid?: boolean;
  isDraftSaved?: boolean;
  className?: string;
  inline?: boolean;
}

export function TherapeuticFieldLabel({
  label,
  required,
  isValid,
  isDraftSaved,
  className,
  inline,
}: TherapeuticFieldLabelProps) {
  const t = useTranslations('ui');

  if (!label) return null;

  return (
    <div className="flex items-center justify-between">
      <Label className={cn('flex items-center gap-1', inline && 'mb-0', className)}>
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>

      <div className="flex items-center gap-2">
        {/* Draft saved indicator */}
        {isDraftSaved !== undefined && (
          <div
            className={cn(
              'flex items-center gap-1 rounded px-2 py-1 text-sm transition-all duration-300',
              isDraftSaved
                ? 'scale-100 bg-green-900/20 text-green-400 opacity-100'
                : 'scale-95 opacity-0'
            )}
          >
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            {t('saved')}
          </div>
        )}

        {/* Validation indicator */}
        {isValid !== undefined && (
          <Badge variant={isValid ? 'default' : 'destructive'} size="sm">
            {isValid ? t('valid') : t('invalid')}
          </Badge>
        )}
      </div>
    </div>
  );
}
