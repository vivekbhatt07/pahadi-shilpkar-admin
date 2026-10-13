import { useState } from 'react';
import { Plus, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import { PRODUCT_LIMITS } from '../constants';
import { sameText } from '../variants';

type TOptionValuesInputProps = {
  /** What the values are of — "Design" — for labels. */
  optionName: string;
  values: string[];
  onAdd: (value: string) => void;
  onRename: (from: string, to: string) => void;
  onRemove: (value: string) => void;
  disabled?: boolean;
};

const chipClass =
  'inline-flex h-7 items-center gap-1 rounded-md bg-stone-100 pl-2.5 text-sm text-stone-800 dark:bg-stone-800 dark:text-stone-100';

/**
 * Values as chips. Type one and press Enter — or several at once, "Peacock,
 * Lotus, Kalash". Click a chip to rename it: its variants keep their ids, so
 * a typo can be fixed without breaking a combo that sells one.
 */
const OptionValuesInput = ({
  optionName,
  values,
  onAdd,
  onRename,
  onRemove,
  disabled,
}: TOptionValuesInputProps) => {
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ from: string; to: string } | null>(
    null,
  );
  const label = optionName.trim() || 'this option';

  // Why `value` can't be added (or a chip renamed to it), or null
  const problemWith = (value: string, except?: string) => {
    if (value.length > PRODUCT_LIMITS.VARIANT_OPTION_VALUE_MAX) {
      return `Values must be ${PRODUCT_LIMITS.VARIANT_OPTION_VALUE_MAX} characters or fewer`;
    }
    if (values.some((v) => v !== except && sameText(v, value))) {
      return `${value} is already listed`;
    }
    return null;
  };

  const addDraft = () => {
    const entries = draft
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
    if (entries.length === 0) return;

    const added: string[] = [];
    for (const entry of entries) {
      if (
        values.length + added.length >=
        PRODUCT_LIMITS.VARIANT_OPTION_VALUES_MAX
      ) {
        setError(
          `An option can have up to ${PRODUCT_LIMITS.VARIANT_OPTION_VALUES_MAX} values`,
        );
        break;
      }
      const problem =
        problemWith(entry) ??
        (added.some((v) => sameText(v, entry))
          ? `${entry} is already listed`
          : null);
      if (problem) {
        setError(problem);
        continue;
      }
      added.push(entry);
      onAdd(entry);
    }
    if (added.length === entries.length) setError(null);
    setDraft('');
  };

  const commitRename = () => {
    if (!editing) return;
    const to = editing.to.trim();
    if (!to || to === editing.from) {
      setEditing(null);
      return;
    }
    const problem = problemWith(to, editing.from);
    if (problem) {
      setError(problem);
      return;
    }
    onRename(editing.from, to);
    setEditing(null);
    setError(null);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {values.map((value) =>
          editing?.from === value ? (
            <Input
              key={value}
              autoFocus
              value={editing.to}
              maxLength={PRODUCT_LIMITS.VARIANT_OPTION_VALUE_MAX}
              aria-label={`Rename ${value}`}
              onChange={(event) =>
                setEditing({ from: value, to: event.target.value })
              }
              onBlur={commitRename}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  commitRename();
                }
                if (event.key === 'Escape') {
                  event.preventDefault();
                  setEditing(null);
                  setError(null);
                }
              }}
              className="h-7 w-40 text-sm md:h-7"
            />
          ) : (
            <span key={value} className={chipClass}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => setEditing({ from: value, to: value })}
                title="Click to rename"
                className="cursor-text rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-accent-500/40"
              >
                {value}
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onRemove(value)}
                aria-label={`Remove ${value} from ${label}`}
                className="flex size-7 cursor-pointer items-center justify-center rounded-r-md text-stone-400 transition-colors outline-none hover:bg-stone-200 hover:text-stone-700 focus-visible:ring-2 focus-visible:ring-accent-500/40 dark:hover:bg-stone-700 dark:hover:text-stone-200"
              >
                <X className="size-3.5" />
              </button>
            </span>
          ),
        )}
      </div>

      <div className="flex items-center gap-2">
        <Input
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addDraft();
            }
          }}
          placeholder={
            values.length === 0
              ? 'Type values and press Enter — Peacock, Lotus, Kalash'
              : 'Add another value…'
          }
          aria-label={`Add a value to ${label}`}
          aria-invalid={Boolean(error)}
          disabled={disabled}
          className={cn('h-8 md:h-9')}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={addDraft}
          disabled={disabled || !draft.trim()}
        >
          <Plus />
          Add
        </Button>
      </div>
      {error && (
        <p className="text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
};

export default OptionValuesInput;
