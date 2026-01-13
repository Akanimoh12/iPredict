// Wagmi Configuration for iPredict
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { injectiveTestnet, injectiveMainnet } from './chains';

// RainbowKit + Wagmi config
export const config = getDefaultConfig({
  appName: 'iPredict',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo',
  chains: [injectiveTestnet, injectiveMainnet],
  transports: {
    [injectiveTestnet.id]: http(injectiveTestnet.rpcUrls.default.http[0]),
    [injectiveMainnet.id]: http(injectiveMainnet.rpcUrls.default.http[0]),
  },
  ssr: true,
});
