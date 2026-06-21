import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useSettings } from '@/lib/queries';
import { Onboarding } from './Onboarding';

/**
 * First-run guard. Until the user has completed onboarding, the welcome screen
 * replaces the app. The public /landing page is never gated.
 */
export function OnboardingGate({ children }: { children: ReactNode }) {
  const location = useLocation();
  const settings = useSettings();

  if (location.pathname === '/landing') return <>{children}</>;

  if (settings.isLoading || !settings.data) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!settings.data.onboarded) return <Onboarding />;
  return <>{children}</>;
}
