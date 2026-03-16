'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { formatUnits } from 'viem';

// Chain configurations for balance fetching
export const SUPPORTED_CHAINS = [
  { id: 1, name: 'ethereum', symbol: 'ETH', rpcUrl: 'https://eth.llamarpc.com' },
  { id: 369, name: 'pulsechain', symbol: 'PLS', rpcUrl: 'https://rpc.pulsechain.com' },
  { id: 8453, name: 'base', symbol: 'ETH', rpcUrl: 'https://base.publicnode.com' },
  { id: 42161, name: 'arbitrum', symbol: 'ETH', rpcUrl: 'https://arbitrum.publicnode.com' },
  { id: 10, name: 'optimism', symbol: 'ETH', rpcUrl: 'https://optimism.publicnode.com' },
  { id: 137, name: 'polygon', symbol: 'MATIC', rpcUrl: 'https://polygon.publicnode.com' },
  { id: 56, name: 'bsc', symbol: 'BNB', rpcUrl: 'https://bsc.publicnode.com' },
  { id: 43114, name: 'avalanche', symbol: 'AVAX', rpcUrl: 'https://avalanche.publicnode.com' },
  { id: 250, name: 'fantom', symbol: 'FTM', rpcUrl: 'https://fantom.publicnode.com' },
  { id: 59144, name: 'linea', symbol: 'ETH', rpcUrl: 'https://rpc.linea.build' },
  { id: 324, name: 'zksync', symbol: 'ETH', rpcUrl: 'https://zksync.mainnet.era.zksync.io' },
  { id: 534352, name: 'scroll', symbol: 'ETH', rpcUrl: 'https://scroll.publicnode.com' },
  { id: 5000, name: 'mantle', symbol: 'MNT', rpcUrl: 'https://rpc.mantle.xyz' },
  { id: 42220, name: 'celo', symbol: 'CELO', rpcUrl: 'https://forno.celo.org' },
  { id: 100, name: 'gnosis', symbol: 'xDAI', rpcUrl: 'https://rpc.ankr.com/gnosis' },
  { id: 1284, name: 'moonbeam', symbol: 'GLMR', rpcUrl: 'https://rpc.ankr.com/moonbeam' },
  { id: 1285, name: 'moonriver', symbol: 'MOVR', rpcUrl: 'https://rpc.moonriver.moonbeam.network' },
];

export interface ChainBalance {
  chainId: number;
  chainName: string;
  symbol: string;
  balance: string;
  balanceFormatted: string;
  isLoading: boolean;
  error: string | null;
}

export interface WalletBalances {
  address: string | undefined;
  isConnected: boolean;
  currentChainId: number | undefined;
  balances: ChainBalance[];
  isLoading: boolean;
  totalValueUsd: number | null;
  refetch: () => void;
}

// Fetch balance via RPC
async function fetchBalanceForChain(
  address: string,
  chainConfig: { id: number; name: string; symbol: string; rpcUrl: string }
): Promise<ChainBalance> {
  try {
    const response = await fetch(chainConfig.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getBalance',
        params: [address, 'latest'],
      }),
    });

    const data = await response.json();
    
    if (data.result) {
      const balanceWei = BigInt(data.result);
      const balanceFormatted = parseFloat(formatUnits(balanceWei, 18)).toFixed(6);
      
      return {
        chainId: chainConfig.id,
        chainName: chainConfig.name,
        symbol: chainConfig.symbol,
        balance: balanceWei.toString(),
        balanceFormatted,
        isLoading: false,
        error: null,
      };
    }

    return {
      chainId: chainConfig.id,
      chainName: chainConfig.name,
      symbol: chainConfig.symbol,
      balance: '0',
      balanceFormatted: '0.000000',
      isLoading: false,
      error: 'Failed to fetch balance',
    };
  } catch (error) {
    return {
      chainId: chainConfig.id,
      chainName: chainConfig.name,
      symbol: chainConfig.symbol,
      balance: '0',
      balanceFormatted: '0.000000',
      isLoading: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export function useWalletBalances(): WalletBalances {
  const { address, isConnected, chain } = useAccount();
  const [balances, setBalances] = useState<ChainBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fetchingRef = useRef(false);

  // Fetch balance for current connected chain
  const { data: currentBalance, refetch } = useBalance({
    address,
  });

  // Fetch all chain balances
  const fetchAllBalances = useCallback(async () => {
    if (!address || !isConnected || fetchingRef.current) return;
    
    fetchingRef.current = true;
    setIsLoading(true);

    try {
      // Fetch balances for all supported chains in parallel
      const balancePromises = SUPPORTED_CHAINS.map(async (chainConfig) => {
        // For the currently connected chain, use the balance from wagmi
        if (chain?.id === chainConfig.id && currentBalance) {
          return {
            chainId: chainConfig.id,
            chainName: chainConfig.name,
            symbol: chainConfig.symbol,
            balance: currentBalance.value.toString(),
            balanceFormatted: parseFloat(formatUnits(currentBalance.value, currentBalance.decimals)).toFixed(6),
            isLoading: false,
            error: null,
          };
        }

        return fetchBalanceForChain(address, chainConfig);
      });

      const results = await Promise.all(balancePromises);
      setBalances(results);
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  }, [address, isConnected, chain?.id, currentBalance]);

  // Fetch balances when address or connection status changes
  useEffect(() => {
    if (isConnected && address) {
      // Use setTimeout to defer setState outside of effect
      const timeoutId = setTimeout(() => {
        fetchAllBalances();
      }, 0);
      return () => clearTimeout(timeoutId);
    } else {
      setBalances([]);
    }
  }, [address, isConnected, fetchAllBalances]);

  // Refetch current chain balance periodically
  useEffect(() => {
    if (!isConnected) return;
    
    const interval = setInterval(() => {
      refetch();
    }, 30000); // Refetch every 30 seconds

    return () => clearInterval(interval);
  }, [isConnected, refetch]);

  return {
    address,
    isConnected,
    currentChainId: chain?.id,
    balances,
    isLoading,
    totalValueUsd: null, // Would need price oracle for this
    refetch: fetchAllBalances,
  };
}

// Get balance for a specific chain
export function getBalanceForChain(balances: ChainBalance[], chainName: string): ChainBalance | undefined {
  return balances.find(b => b.chainName === chainName);
}

// Get balance for a specific chain by ID
export function getBalanceForChainId(balances: ChainBalance[], chainId: number): ChainBalance | undefined {
  return balances.find(b => b.chainId === chainId);
}

// Format balance for display
export function formatBalance(balance: string, decimals: number = 6): string {
  const num = parseFloat(balance);
  if (isNaN(num) || num === 0) return '0';
  if (num < 0.000001) return '<0.000001';
  return num.toFixed(decimals);
}

// Check if wallet has enough balance for a trade
export function hasEnoughBalance(
  balances: ChainBalance[],
  chainName: string,
  requiredAmount: number
): boolean {
  const balance = getBalanceForChain(balances, chainName);
  if (!balance) return false;
  return parseFloat(balance.balanceFormatted) >= requiredAmount;
}
