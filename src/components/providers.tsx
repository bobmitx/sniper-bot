'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { 
  RainbowKitProvider, 
  darkTheme,
  connectorsForWallets,
} from '@rainbow-me/rainbowkit';
import {
  metaMaskWallet,
  rainbowWallet,
  trustWallet,
  braveWallet,
  rabbyWallet,
  okxWallet,
  imTokenWallet,
  safeWallet,
  walletConnectWallet,
  ledgerWallet,
} from '@rainbow-me/rainbowkit/wallets';
import '@rainbow-me/rainbowkit/styles.css';
import { useState, useEffect } from 'react';
import { createConfig, http } from 'wagmi';
import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
  avalanche,
  fantom,
  bsc,
  celo,
  gnosis,
  moonbeam,
  moonriver,
  linea,
  scroll,
  mantle,
  zkSync,
} from 'wagmi/chains';

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'demo-project-id';

// Custom PulseChain configuration
const pulsechain = {
  id: 369,
  name: 'PulseChain',
  nativeCurrency: { name: 'Pulse', symbol: 'PLS', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.pulsechain.com'] },
  },
  blockExplorers: {
    default: { name: 'PulseScan', url: 'https://scan.pulsechain.com' },
  },
  testnet: false,
} as const;

// Chain ID to name mapping
export const chainIdToName: Record<number, string> = {
  1: 'ethereum',
  137: 'polygon',
  10: 'optimism',
  42161: 'arbitrum',
  8453: 'base',
  43114: 'avalanche',
  250: 'fantom',
  56: 'bsc',
  42220: 'celo',
  100: 'gnosis',
  1284: 'moonbeam',
  1285: 'moonriver',
  59144: 'linea',
  534352: 'scroll',
  5000: 'mantle',
  324: 'zksync',
  369: 'pulsechain',
};

// Name to chain ID mapping
export const nameToChainId: Record<string, number> = Object.fromEntries(
  Object.entries(chainIdToName).map(([id, name]) => [name, parseInt(id)])
);

// Native currency symbols
export const nativeCurrencySymbols: Record<number, string> = {
  1: 'ETH',
  137: 'MATIC',
  10: 'ETH',
  42161: 'ETH',
  8453: 'ETH',
  43114: 'AVAX',
  250: 'FTM',
  56: 'BNB',
  42220: 'CELO',
  100: 'xDAI',
  1284: 'GLMR',
  1285: 'MOVR',
  59144: 'ETH',
  534352: 'ETH',
  5000: 'MNT',
  324: 'ETH',
  369: 'PLS',
};

// Supported chains
const chains = [
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
  avalanche,
  fantom,
  bsc,
  celo,
  gnosis,
  moonbeam,
  moonriver,
  linea,
  scroll,
  mantle,
  zkSync,
  pulsechain,
] as const;

// Configure wallets - using only injected/extension wallets that work in iframes
// Removed Coinbase Wallet as it requires popup windows which don't work in sandboxed environments
const connectors = connectorsForWallets(
  [
    {
      groupName: 'Browser Extension',
      wallets: [
        metaMaskWallet,
        rabbyWallet,
        braveWallet,
        trustWallet,
        okxWallet,
        imTokenWallet,
      ],
    },
    {
      groupName: 'Mobile & Hardware',
      wallets: [
        rainbowWallet,
        walletConnectWallet,
        ledgerWallet,
        safeWallet,
      ],
    },
  ],
  {
    appName: 'Sniper Bot',
    projectId,
  }
);

// Create wagmi config
const config = createConfig({
  chains,
  connectors,
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
    [avalanche.id]: http(),
    [fantom.id]: http(),
    [bsc.id]: http(),
    [celo.id]: http(),
    [gnosis.id]: http(),
    [moonbeam.id]: http(),
    [moonriver.id]: http(),
    [linea.id]: http(),
    [scroll.id]: http(),
    [mantle.id]: http(),
    [zkSync.id]: http(),
    [pulsechain.id]: http('https://rpc.pulsechain.com'),
  },
  ssr: true,
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
      },
    },
  }));

  // Suppress COOP errors from wallet SDKs in sandboxed environments
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args) => {
      const message = args[0];
      if (typeof message === 'string' && message.includes('Cross-Origin-Opener-Policy')) {
        return; // Suppress COOP errors in sandboxed environments
      }
      originalError.apply(console, args);
    };
    return () => {
      console.error = originalError;
    };
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: 'hsl(var(--primary))',
            accentColorForeground: 'hsl(var(--primary-foreground))',
            borderRadius: 'medium',
            fontStack: 'system',
            overlayBlur: 'small',
          })}
          modalSize="compact"
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
