'use client';

import { useState, useCallback } from 'react';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

import { cn } from '@/lib/utils/helpers';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { useTranslations } from 'next-intl';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  maxDate?: Date;
  minDate?: Date;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  disabled = false,
  className,
  maxDate,
  minDate,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations('ui');

  const handleSelect = useCallback(
    (date: Date | undefined) => {
      onChange?.(date);
      setOpen(false);
    },
    [onChange]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-haspopup="dialog"
          aria-expanded={open}
          className={cn(
            // DS: full width on mobile, natural on desktop up to 320px
            'h-10 w-full justify-start px-3 text-left font-normal md:w-[320px]',
            !value && 'text-muted-foreground',
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" aria-hidden="true" />
          {value ? format(value, 'PPP') : <span>{placeholder || t('datePick')}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={8}
        avoidCollisions
        collisionPadding={8}
        className={cn(
          // Responsive sizing per shadcn + DS: avoid desktop scrollbar, allow mobile scroll
          'mx-2 max-h-[min(70vh,420px)] w-[min(92vw,360px)] overflow-auto rounded-lg border p-0 md:mx-0 md:w-[360px] md:overflow-visible'
        )}
      >
        <div className="w-full p-2">
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleSelect}
            disabled={(date) => {
              if (maxDate && date > maxDate) return true;
              if (minDate && date < minDate) return true;
              return false;
            }}
            // Responsive cell size: larger tap targets on mobile
            className="[--cell-size:2.75rem] md:[--cell-size:2.25rem]"
            initialFocus
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

DatePicker.displayName = 'DatePicker';
