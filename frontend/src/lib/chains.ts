// Injective EVM Chain Configurations
import { defineChain } from 'viem';

// Injective EVM Testnet
export const injectiveTestnet = defineChain({
  id: 1439,
  name: 'Injective EVM Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Injective',
    symbol: 'INJ',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet.sentry.chain.json-rpc.injective.network'],
    },
    public: {
      http: ['https://testnet.sentry.chain.json-rpc.injective.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Injective Explorer',
      url: 'https://testnet.blockscout.injective.network',
    },
  },
  testnet: true,
});

// Injective EVM Mainnet
export const injectiveMainnet = defineChain({
  id: 2525,
  name: 'Injective EVM',
  nativeCurrency: {
    decimals: 18,
    name: 'Injective',
    symbol: 'INJ',
  },
  rpcUrls: {
    default: {
      http: ['https://sentry.evm-rpc.injective.network'],
    },
    public: {
      http: ['https://sentry.evm-rpc.injective.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Injective Explorer',
      url: 'https://explorer.injective.network',
    },
  },
  testnet: false,
});

// Export the chain to use based on environment
export const activeChain = process.env.NEXT_PUBLIC_CHAIN_ID === '2525' 
  ? injectiveMainnet 
  : injectiveTestnet;
