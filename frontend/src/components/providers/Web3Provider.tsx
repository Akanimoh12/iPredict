'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { config } from '@/lib/wagmi';
import { useState, useEffect } from 'react';

import '@rainbow-me/rainbowkit/styles.css';

// Custom RainbowKit theme matching iPredict design
const iPredictTheme = darkTheme({
  accentColor: '#00F2FE', // Injective cyan
  accentColorForeground: '#09090B', // Dark background
  borderRadius: 'medium',
  fontStack: 'system',
  overlayBlur: 'small',
});

// Customize specific theme properties
const customTheme = {
  ...iPredictTheme,
  colors: {
    ...iPredictTheme.colors,
    modalBackground: '#18181B', // Card background
    modalBorder: '#27272A', // Border color
    profileForeground: '#18181B',
    closeButton: '#A1A1AA',
    closeButtonBackground: '#27272A',
    actionButtonBorder: '#27272A',
    actionButtonBorderMobile: '#27272A',
    actionButtonSecondaryBackground: '#27272A',
    error: '#EF4444', // Red for errors
    generalBorder: '#27272A',
    generalBorderDim: '#27272A',
    menuItemBackground: '#27272A',
    standby: '#F59E0B', // Gold for pending states
  },
  shadows: {
    ...iPredictTheme.shadows,
    connectButton: '0 0 20px rgba(0, 242, 254, 0.2)',
    dialog: '0 0 40px rgba(0, 242, 254, 0.1)',
  },
};

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5000,
            refetchOnWindowFocus: false,
            retry: 2,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={customTheme}
          modalSize="compact"
          showRecentTransactions={true}
          appInfo={{
            appName: 'iPredict',
            learnMoreUrl: 'https://docs.injective.network',
          }}
        >
          {mounted ? children : null}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
