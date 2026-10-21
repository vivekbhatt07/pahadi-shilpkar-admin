import { Badge } from '@/components/ui/badge';
import { SimpleTooltip } from '@/components/ui/tooltip';
import type { CostingStatus } from '@/types/api';

import { COSTING_STATUS_BADGES } from '../constants';

/** How a listing's price stands against its cost. */
const StatusBadge = ({ status }: { status: CostingStatus }) => {
  const badge = COSTING_STATUS_BADGES[status];
  return (
    <SimpleTooltip label={badge.description}>
      <Badge variant={badge.variant}>{badge.label}</Badge>
    </SimpleTooltip>
  );
};

export default StatusBadge;
