import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { PurchaseLinkPlatform } from '@/types/api';

import { PRODUCT_LIMITS, PURCHASE_LINK_PLATFORM_OPTIONS } from '../constants';
import type { TVariantFormValue } from '../types';

type TLink = TVariantFormValue['purchaseLinks'][number];

type TVariantLinksFieldProps = {
  value: TLink[];
  onChange: (links: TLink[]) => void;
  /** One message per link, from the form's errors. */
  errors?: (string | undefined)[];
  /** "Peacock" — for labels. */
  title: string;
  disabled?: boolean;
};

/**
 * A variant's own marketplace listings — for a design listed on its own on
 * Amazon or Flipkart. Shoppers who pick it get these buttons instead of the
 * product's. Controlled (not a field array), because a variant row moves
 * when values are reordered.
 */
const VariantLinksField = ({
  value,
  onChange,
  errors,
  title,
  disabled,
}: TVariantLinksFieldProps) => {
  const change = (index: number, patch: Partial<TLink>) =>
    onChange(
      value.map((link, i) => (i === index ? { ...link, ...patch } : link)),
    );

  return (
    <div className="flex flex-col gap-2">
      {value.map((link, index) => (
        <div key={index} className="flex flex-col gap-1">
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
            <Select
              value={link.platform}
              onValueChange={(platform) =>
                change(index, { platform: platform as PurchaseLinkPlatform })
              }
              disabled={disabled}
            >
              <SelectTrigger
                aria-label={`Marketplace of link ${index + 1} for ${title}`}
                className="sm:w-32"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PURCHASE_LINK_PLATFORM_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="url"
              placeholder="https://www.amazon.in/dp/…"
              value={link.url}
              onChange={(event) => change(index, { url: event.target.value })}
              aria-label={`Link ${index + 1} for ${title}`}
              aria-invalid={Boolean(errors?.[index])}
              disabled={disabled}
            />
            <Input
              placeholder="Label (optional)"
              maxLength={PRODUCT_LIMITS.PURCHASE_LINK_LABEL_MAX}
              value={link.label}
              onChange={(event) => change(index, { label: event.target.value })}
              aria-label={`Label of link ${index + 1} for ${title}`}
              disabled={disabled}
              className="sm:w-36"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onChange(value.filter((_, i) => i !== index))}
              disabled={disabled}
              aria-label={`Remove link ${index + 1} for ${title}`}
              className="self-end text-stone-400 sm:self-auto"
            >
              <Trash2 />
            </Button>
          </div>
          {errors?.[index] && (
            <p className="text-xs font-medium text-red-600 dark:text-red-400">
              {errors[index]}
            </p>
          )}
        </div>
      ))}
      {value.length < PRODUCT_LIMITS.PURCHASE_LINKS_MAX && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() =>
            onChange([...value, { platform: 'AMAZON', label: '', url: '' }])
          }
          disabled={disabled}
          startAdornment={<Plus />}
          className="w-fit"
        >
          Add a link for {title}
        </Button>
      )}
    </div>
  );
};

export default VariantLinksField;
