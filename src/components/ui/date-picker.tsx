"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"

import { cn } from "@/lib/utils/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {useTranslations} from 'next-intl'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface DatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  maxDate?: Date
  minDate?: Date
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled = false,
  className,
  maxDate,
  minDate,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const t = useTranslations('ui')

  const handleSelect = React.useCallback((date: Date | undefined) => {
    onChange?.(date)
    setOpen(false)
  }, [onChange])

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
            "w-full md:w-[320px] justify-start text-left font-normal h-10 px-3",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" aria-hidden="true" />
          {value ? format(value, "PPP") : <span>{placeholder || t('datePick')}</span>}
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
          "p-0 w-[min(92vw,360px)] md:w-[360px] max-h-[min(70vh,420px)] md:overflow-visible overflow-auto rounded-lg border mx-2 md:mx-0"
        )}
      >
        <div className="p-2 w-full">
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleSelect}
            disabled={(date) => {
              if (maxDate && date > maxDate) return true
              if (minDate && date < minDate) return true
              return false
            }}
            // Responsive cell size: larger tap targets on mobile
            className="[--cell-size:2.75rem] md:[--cell-size:2.25rem]"
            initialFocus
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}

DatePicker.displayName = "DatePicker"