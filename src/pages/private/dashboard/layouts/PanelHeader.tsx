import { Link as RouterLink } from 'react-router';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { CardHeader, CardTitle } from '@/components/ui/card';

/** A dashboard panel's title, and a link to the page with all of it. */
const PanelHeader = ({
  icon,
  title,
  to,
}: {
  icon: React.ReactNode;
  title: string;
  to: string;
}) => (
  <CardHeader className="flex flex-row items-center justify-between border-b border-stone-100 pb-3 dark:border-stone-800">
    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
      <span className="text-stone-400 [&_svg]:size-4">{icon}</span>
      {title}
    </CardTitle>
    <Button
      variant="ghost"
      size="sm"
      asChild
      className="group/view -mr-2 gap-1 text-xs text-stone-500"
    >
      <RouterLink to={to}>
        View all
        <ArrowRight className="size-3.5 transition-transform group-hover/view:translate-x-0.5" />
      </RouterLink>
    </Button>
  </CardHeader>
);

export default PanelHeader;
