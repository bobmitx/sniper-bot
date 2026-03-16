import { http, createConfig, createStorage, cookieStorage } from 'wagmi';
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
import { injected, walletConnect, coinbaseWallet, metaMask } from 'wagmi/connectors';

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

export const config = createConfig({
  chains: [
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
  ],
  connectors: [
    injected({ target: 'metaMask' }),
    metaMask(),
    coinbaseWallet({ appName: 'Sniper Bot' }),
    walletConnect({ projectId }),
  ],
  storage: createStorage({
    storage: cookieStorage,
  }),
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
});

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

// Get chain name from ID
export function getChainName(chainId: number): string {
  return chainIdToName[chainId] || 'unknown';
}

// Get chain ID from name
export function getChainId(name: string): number | undefined {
  return nameToChainId[name.toLowerCase()];
}

declare module 'wagmi' {
  export interface Register {
    config: typeof config;
  }
}
