import { memo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Minus } from 'lucide-react';
import {
  TherapeuticFieldWrapper,
  type FieldVariant,
  type FieldSize,
} from '@/components/ui/therapeutic-forms/base/therapeutic-field-wrapper';

export type ArrayItem = string | { value: string; [key: string]: unknown };

export interface ArrayFieldInputProps {
  label?: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  items?: ArrayItem[];
  onAddItem?: () => void;
  onRemoveItem?: (index: number) => void;
  onUpdateItem?: (index: number, value: string | Record<string, unknown>) => void;
  arrayItemRender?: (item: ArrayItem, index: number) => ReactNode;
  addButtonText?: string;
  maxItems?: number;
  variant?: FieldVariant;
  size?: FieldSize;
  className?: string;
  labelClassName?: string;
}

const ArrayFieldInputComponent = function ArrayFieldInput({
  label,
  description,
  placeholder,
  required = false,
  disabled = false,
  items = [],
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  arrayItemRender,
  addButtonText = 'Add Item',
  maxItems,
  variant = 'default',
  size = 'md',
  className,
  labelClassName,
}: ArrayFieldInputProps) {
  return (
    <TherapeuticFieldWrapper
      label={label}
      description={description}
      required={required}
      variant={variant}
      size={size}
      className={className}
      labelClassName={labelClassName}
    >
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="bg-muted/30 flex items-center gap-2 rounded-lg p-3">
            <div className="flex-1">
              {arrayItemRender ? (
                arrayItemRender(item, index)
              ) : (
                <Input
                  value={typeof item === 'string' ? item : item.value || ''}
                  onChange={(e) => onUpdateItem?.(index, e.target.value)}
                  placeholder={placeholder}
                  disabled={disabled}
                />
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemoveItem?.(index)}
              className="hover:bg-destructive/10 hover:text-destructive h-8 w-8 p-0"
              disabled={disabled}
            >
              <Minus className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {(!maxItems || items.length < maxItems) && (
          <Button
            variant="outline"
            onClick={onAddItem}
            className="w-full border-dashed"
            disabled={disabled}
          >
            <Plus className="mr-2 h-4 w-4" />
            {addButtonText}
          </Button>
        )}
      </div>
    </TherapeuticFieldWrapper>
  );
};

export const ArrayFieldInput = memo(ArrayFieldInputComponent);
