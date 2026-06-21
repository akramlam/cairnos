import { Toaster as Sonner } from 'sonner';
import { useSettings } from '@/lib/queries';

export function Toaster() {
  // Follow the app theme so the toast surface and text always contrast
  // (a fixed "dark" theme renders dark-on-dark once light mode is active).
  const { data } = useSettings();
  const theme = (data?.theme ?? 'dark') as 'dark' | 'light' | 'system';

  return (
    <Sonner
      theme={theme}
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: 'glass-strong !rounded-xl !border-border !text-foreground !shadow-2xl',
          description: '!text-muted-foreground',
          actionButton: '!brand-gradient !text-white',
          cancelButton: '!bg-foreground/10 !text-foreground',
        },
      }}
    />
  );
}
