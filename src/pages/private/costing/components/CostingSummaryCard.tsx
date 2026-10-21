import { Link } from 'react-router';
import { Calculator, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { formatPrice } from '@/helpers/format';
import { useComboCosting, useProductCosting } from '@/hooks/costing';
import type { CostingSettings, PriceAnalysis } from '@/types/api';

import ProfitValue from './ProfitValue';
import StatusBadge from './StatusBadge';

const onWhatsapp = (analysis: PriceAnalysis) =>
  analysis.byChannel.find((row) => row.channel === 'WHATSAPP') ?? null;

const Line = ({
  label,
  analysis,
  settings,
}: {
  label: string;
  analysis: PriceAnalysis;
  settings: CostingSettings;
}) => {
  const row = onWhatsapp(analysis);
  return (
    <li className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span className="min-w-0 truncate text-stone-700 dark:text-stone-300">
        {label}
      </span>
      {row ? (
        <span className="flex shrink-0 items-center gap-2 text-xs text-stone-500 tabular-nums">
          costs {formatPrice(row.cost)}
          <ProfitValue
            profit={row.profit}
            marginPercent={row.marginPercent}
            target={settings.targetMarginPercent}
            className="text-sm"
          />
        </span>
      ) : (
        <StatusBadge status="NO_COST" />
      )}
    </li>
  );
};

const Shell = ({ to, children }: { to: string; children: React.ReactNode }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle className="flex items-center gap-2 text-sm font-semibold">
        <Calculator className="size-4 text-stone-400" />
        Cost & profit
      </CardTitle>
      <Button variant="ghost" size="sm" asChild>
        <Link to={to}>
          Cost sheet
          <ChevronRight />
        </Link>
      </Button>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

/** One product's cost and profit on WhatsApp — each variant's, with variants. */
export const ProductCostingCard = ({ productId }: { productId: string }) => {
  const costing = useProductCosting(productId);
  const data = costing.data;
  const to = ROUTES.PRIVATE.COSTING.PRODUCT(productId);

  if (costing.isPending) return <Skeleton className="h-32 w-full rounded-xl" />;
  if (!data) return null;

  return (
    <Shell to={to}>
      {data.product.hasVariants ? (
        <ul className="flex flex-col divide-y divide-stone-100 dark:divide-stone-800">
          {data.variants.map((entry) => (
            <Line
              key={entry.variant.id}
              label={entry.variant.title}
              analysis={entry.analysis}
              settings={data.settings}
            />
          ))}
        </ul>
      ) : data.analysis && data.analysis.unitCost !== null ? (
        <div className="flex flex-col gap-2">
          <ul>
            <Line
              label={`At ${formatPrice(data.product.price)}`}
              analysis={data.analysis}
              settings={data.settings}
            />
          </ul>
          <div className="flex items-center justify-between text-xs text-stone-500">
            <StatusBadge status={data.analysis.status} />
            {data.analysis.suggestedPrice !== null &&
              data.analysis.suggestedPrice > data.product.price && (
                <span>
                  Target reached at{' '}
                  <span className="font-medium text-amber-700 tabular-nums dark:text-amber-400">
                    {formatPrice(data.analysis.suggestedPrice)}
                  </span>
                </span>
              )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-stone-500 dark:text-stone-400">
          No cost sheet yet — add what it takes to make to see what it earns.
        </p>
      )}
    </Shell>
  );
};

/** A combo's cost — its items' and its own extras' — and its profit. */
export const ComboCostingCard = ({ comboId }: { comboId: string }) => {
  const costing = useComboCosting(comboId);
  const data = costing.data;

  if (costing.isPending) return <Skeleton className="h-32 w-full rounded-xl" />;
  if (!data) return null;

  return (
    <Shell to={ROUTES.PRIVATE.COSTING.COMBO(comboId)}>
      {data.analysis.unitCost === null ? (
        <p className="text-sm text-stone-500 dark:text-stone-400">
          {data.items.some((item) => item.unitCost === null)
            ? 'Shown once every item in it has a cost sheet.'
            : 'No cost yet.'}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <ul>
            <Line
              label={`At ${formatPrice(data.combo.price)}`}
              analysis={data.analysis}
              settings={data.settings}
            />
          </ul>
          <StatusBadge status={data.analysis.status} />
        </div>
      )}
    </Shell>
  );
};
