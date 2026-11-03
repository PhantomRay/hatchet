import { SetupCard, SetupScreen } from '@/components/layout/setup-card';
import { Button } from '@/components/v1/ui/button';
import { Spinner } from '@/components/v1/ui/loading';
import { controlPlaneApi } from '@/lib/api/api';
import {
  getLastSupportConsoleUrl,
  setSupportSession,
} from '@/lib/support-session';
import queryClient from '@/query-client';
import { appRoutes } from '@/router';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { redirect } from '@tanstack/react-router';

/**
 * Redeems the one-time code from the support console and stores the session,
 * then sends the tab to the tenant. Runs in the route loader so the code is
 * redeemed exactly once per visit (a component effect would be invoked twice
 * in development's strict mode and burn the code).
 */
export async function loader({ code }: { code: string }) {
  const session = (await controlPlaneApi.supportSessionRedeem({ code })).data;

  setSupportSession(session);
  // Anything fetched before the session was stored (the current user, the
  // user's own memberships, control-plane metadata) belongs to a different
  // identity and backend.
  queryClient.clear();

  throw redirect({
    to: appRoutes.tenantRunsRoute.to,
    params: { tenant: session.grant.tenantId },
    replace: true,
  });
}

export function SupportRedeemPending() {
  return (
    <SetupScreen>
      <SetupCard title="Opening support session">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner />
          Redeeming your support link…
        </div>
      </SetupCard>
    </SetupScreen>
  );
}

export function SupportRedeemError() {
  const consoleUrl = getLastSupportConsoleUrl();

  return (
    <SetupScreen>
      <SetupCard
        title="Support link unavailable"
        footer={
          consoleUrl ? (
            <Button asChild size="sm">
              <a href={consoleUrl}>
                Open support console
                <ArrowTopRightOnSquareIcon className="ml-1.5 h-4 w-4" />
              </a>
            </Button>
          ) : undefined
        }
      >
        <p className="text-sm text-muted-foreground">
          This support link is invalid or has expired. Open the tenant again
          from the support console.
        </p>
      </SetupCard>
    </SetupScreen>
  );
}

export default function SupportRedeem() {
  return <SupportRedeemPending />;
}
