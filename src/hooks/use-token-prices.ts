'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface TokenPrice {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap: number;
  address?: string;
}

interface TokenInfo {
  id: string;
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  chain: string;
  tags?: string[];
}

interface PricesState {
  prices: Record<string, { price: number; change24h: number; marketCap: number }>;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

export function useTokenPrices() {
  const [state, setState] = useState<PricesState>({
    prices: {},
    isLoading: false,
    error: null,
    lastUpdated: null,
  });
  
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const fetchPrices = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await fetch('/api/prices?action=prices');
      const data = await response.json();
      
      if (data.success) {
        setState({
          prices: data.data,
          isLoading: false,
          error: null,
          lastUpdated: data.timestamp,
        });
      } else {
        throw new Error(data.error || 'Failed to fetch prices');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch prices',
      }));
    }
  }, []);
  
  const fetchTokenPrice = useCallback(async (chain: string, address: string): Promise<TokenPrice | null> => {
    try {
      const response = await fetch(`/api/prices?action=token&chain=${chain}&address=${address}`);
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      }
      return null;
    } catch {
      return null;
    }
  }, []);
  
  const searchTokens = useCallback(async (query: string, chain?: string): Promise<TokenInfo[]> => {
    try {
      const url = chain 
        ? `/api/tokens?chain=${chain}&q=${encodeURIComponent(query)}`
        : `/api/tokens?q=${encodeURIComponent(query)}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  }, []);
  
  const getTokensForChain = useCallback(async (chain: string): Promise<TokenInfo[]> => {
    try {
      const response = await fetch(`/api/tokens?chain=${chain}`);
      const data = await response.json();
      
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  }, []);
  
  const getTrendingTokens = useCallback(async (): Promise<TokenInfo[]> => {
    try {
      const response = await fetch('/api/prices?action=trending');
      const data = await response.json();
      
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  }, []);
  
  // Fetch prices on mount and set up refresh interval
  useEffect(() => {
    fetchPrices();
    
    // Refresh prices every 30 seconds
    refreshIntervalRef.current = setInterval(fetchPrices, 30000);
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchPrices]);
  
  return {
    ...state,
    fetchPrices,
    fetchTokenPrice,
    searchTokens,
    getTokensForChain,
    getTrendingTokens,
  };
}

// Hook for token search with debouncing
export function useTokenSearch(chain?: string, debounceMs: number = 300) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TokenInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  
  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      return;
    }
    
    setIsSearching(true);
    
    try {
      const url = chain 
        ? `/api/tokens?chain=${chain}&q=${encodeURIComponent(searchQuery)}`
        : `/api/tokens?q=${encodeURIComponent(searchQuery)}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setResults(data.data);
      }
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [chain]);
  
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      search(query);
    }, debounceMs);
    
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, search, debounceMs]);
  
  return {
    query,
    setQuery,
    results,
    isSearching,
    clearResults: () => setResults([]),
  };
}
