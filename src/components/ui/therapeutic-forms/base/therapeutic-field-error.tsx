import { cn } from '@/lib/utils';

export interface TherapeuticFieldErrorProps {
  error?: string | null;
  className?: string;
}

export function TherapeuticFieldError({ error, className }: TherapeuticFieldErrorProps) {
  if (!error) return null;

  return <p className={cn('text-destructive text-sm', className)}>{error}</p>;
}
