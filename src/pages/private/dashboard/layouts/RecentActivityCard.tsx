import { History } from 'lucide-react';

import EmptyState from '@/components/custom/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { ROUTES } from '@/constants/routes';
import { useActivity } from '@/hooks/activity';

import ActivityList from '../../activity/layouts/ActivityList';
import ListSkeletonRows from './ListSkeletonRows';
import PanelHeader from './PanelHeader';

const SHOWN = 6;

/** The latest changes admins made — the full log is a click away. */
const RecentActivityCard = () => {
  const activity = useActivity({ limit: SHOWN });
  const items = activity.data?.items ?? [];

  return (
    <Card className="gap-0 sm:gap-0 md:gap-0">
      <PanelHeader
        icon={<History />}
        title="Recent activity"
        to={ROUTES.PRIVATE.ACTIVITY}
      />
      <CardContent className="px-0 sm:px-0 md:px-0">
        {activity.isPending ? (
          <ListSkeletonRows avatar="circle" />
        ) : items.length > 0 ? (
          <ActivityList activities={items} compact />
        ) : (
          <EmptyState
            icon={<History className="size-5" />}
            title="No changes yet"
            description="Each change an admin saves shows up here."
            className="py-10"
          />
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivityCard;
