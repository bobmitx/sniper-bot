'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// Types
export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  totalSupply: string;
  verified: boolean;
  warnings: string[];
}

export interface LiquidityInfo {
  pairAddress: string;
  token0: string;
  token1: string;
  reserve0: string;
  reserve1: string;
  liquidityUsd: number;
  createdAt: number;
}

export interface SniperTarget {
  id: string;
  tokenAddress: string;
  tokenSymbol?: string;
  tokenName?: string;
  chain: string;
  dex: string;
  baseToken: string;
  buyAmount: string;
  maxBuyPrice?: string;
  minLiquidity?: string;
  autoApprove: boolean;
  // Buy settings
  buySlippage?: string;
  buyGasPrice?: string;
  buyGasLimit?: string;
  // Sell settings
  sellSlippage?: string;
  sellGasPrice?: string;
  sellGasLimit?: string;
  // Take Profit
  takeProfitEnabled?: boolean;
  takeProfitPercent?: string;
  takeProfitAmount?: string;
  // Stop Loss
  stopLossEnabled?: boolean;
  stopLossPercent?: string;
  stopLossType?: string;
  // Trailing Stop
  trailingStopEnabled?: boolean;
  trailingStopPercent?: string;
  trailingStopActivation?: string;
  // Status
  status: 'pending' | 'monitoring' | 'sniping' | 'completed' | 'failed' | 'cancelled';
  createdAt: number;
  updatedAt: number;
}

export interface SniperEvent {
  type: string;
  data: Record<string, unknown>;
  timestamp: number;
}

export interface AutoSweepConfig {
  enabled: boolean;
  chains: string[];
  interval: number;
}

interface SniperServiceState {
  connected: boolean;
  targets: SniperTarget[];
  events: SniperEvent[];
  config: {
    defaultSlippage: number;
    defaultGasMultiplier: number;
    maxRetries: number;
    retryDelay: number;
    minLiquidityUsd: number;
  } | null;
  autoSweep: AutoSweepConfig | null;
  // Derived state from events
  lastVerifiedToken: TokenInfo | null;
  lastLiquidityInfo: LiquidityInfo | null;
  verificationError: string | null;
}

type SocketType = {
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  emit: (event: string, data: unknown) => void;
  disconnect: () => void;
  connected: boolean;
};

export function useSniperService() {
  const socketRef = useRef<SocketType | null>(null);
  const [state, setState] = useState<SniperServiceState>({
    connected: false,
    targets: [],
    events: [],
    config: null,
    autoSweep: null,
    lastVerifiedToken: null,
    lastLiquidityInfo: null,
    verificationError: null,
  });

  // Connect to sniper service
  useEffect(() => {
    if (!socketRef.current) {
      import('socket.io-client').then(({ io }) => {
        try {
          const socket = io('/?XTransformPort=3004', {
            transports: ['websocket'],
            reconnectionAttempts: 10,
            reconnectionDelay: 2000,
            timeout: 15000,
          });
          socketRef.current = socket as unknown as SocketType;

          // Connection events
          socket.on('connect', () => {
            setState(prev => ({ ...prev, connected: true }));
            console.log('🎯 Connected to Sniper Service');
          });

          socket.on('disconnect', () => {
            setState(prev => ({ ...prev, connected: false }));
            console.log('📱 Disconnected from Sniper Service');
          });

          socket.on('connect_error', (error: Error) => {
            console.log('Sniper service connection error:', error.message);
            setState(prev => ({ ...prev, connected: false }));
          });

          // Initial connection data
          socket.on('connected', (data: { 
            config: SniperServiceState['config']; 
            activeTargets: SniperTarget[];
            autoSweep: AutoSweepConfig;
          }) => {
            setState(prev => ({
              ...prev,
              config: data.config,
              targets: data.activeTargets || [],
              autoSweep: data.autoSweep,
            }));
          });

          // Token verification
          socket.on('token_verified', (data: { tokenInfo: TokenInfo }) => {
            setState(prev => ({
              ...prev,
              lastVerifiedToken: data.tokenInfo,
              verificationError: null,
            }));
            addEvent('token_verified', data);
          });

          socket.on('verification_error', (data: { error: string }) => {
            setState(prev => ({
              ...prev,
              lastVerifiedToken: null,
              verificationError: data.error,
            }));
            addEvent('verification_error', data);
          });

          // Liquidity events
          socket.on('liquidity_checked', (data: { liquidity: LiquidityInfo | null }) => {
            setState(prev => ({
              ...prev,
              lastLiquidityInfo: data.liquidity,
            }));
            addEvent('liquidity_checked', data);
          });

          socket.on('liquidity_detected', (data: { targetId: string; liquidity: LiquidityInfo }) => {
            addEvent('liquidity_detected', data);
          });

          // Target events
          socket.on('target_added', (data: { success: boolean; target: SniperTarget; error?: string }) => {
            if (data.success && data.target) {
              setState(prev => ({
                ...prev,
                targets: [...prev.targets.filter(t => t.id !== data.target.id), data.target],
              }));
            }
            addEvent('target_added', data);
          });

          socket.on('monitoring_started', (data: { targetId: string }) => {
            addEvent('monitoring_started', data);
          });

          socket.on('monitoring_heartbeat', (data: { targetId: string; status: string }) => {
            // Silent heartbeat, don't add to events
          });

          // Snipe events
          socket.on('snipe_started', (data: { targetId: string; liquidity: number }) => {
            addEvent('snipe_started', data);
          });

          socket.on('snipe_completed', (data: { targetId: string; txHash: string; amount: string }) => {
            // Update target status
            setState(prev => ({
              ...prev,
              targets: prev.targets.map(t => 
                t.id === data.targetId 
                  ? { ...t, status: 'completed' as const, updatedAt: Date.now() }
                  : t
              ),
            }));
            addEvent('snipe_completed', data);
          });

          socket.on('snipe_failed', (data: { targetId: string; error: string }) => {
            // Update target status
            setState(prev => ({
              ...prev,
              targets: prev.targets.map(t => 
                t.id === data.targetId 
                  ? { ...t, status: 'failed' as const, updatedAt: Date.now() }
                  : t
              ),
            }));
            addEvent('snipe_failed', data);
          });

          socket.on('target_cancelled', (data: { targetId: string }) => {
            setState(prev => ({
              ...prev,
              targets: prev.targets.map(t => 
                t.id === data.targetId 
                  ? { ...t, status: 'cancelled' as const, updatedAt: Date.now() }
                  : t
              ),
            }));
            addEvent('target_cancelled', data);
          });

          // Targets list
          socket.on('targets_list', (data: { targets: SniperTarget[] }) => {
            setState(prev => ({ ...prev, targets: data.targets }));
          });

          // Config update
          socket.on('config_updated', (data: { config: SniperServiceState['config'] }) => {
            setState(prev => ({ ...prev, config: data.config }));
          });

          // Auto-sweep events
          socket.on('auto_sweep_started', (data: { chains: string[]; interval: number }) => {
            setState(prev => ({
              ...prev,
              autoSweep: { enabled: true, chains: data.chains, interval: data.interval },
            }));
            addEvent('auto_sweep_started', data);
          });

          socket.on('auto_sweep_stopped', () => {
            setState(prev => ({
              ...prev,
              autoSweep: prev.autoSweep ? { ...prev.autoSweep, enabled: false } : null,
            }));
            addEvent('auto_sweep_stopped', {});
          });

          socket.on('auto_sweep_check', (data: { chain: string; chainName: string }) => {
            addEvent('auto_sweep_check', data);
          });

          socket.on('auto_sweep_configured', (data: { config: AutoSweepConfig }) => {
            setState(prev => ({ ...prev, autoSweep: data.config }));
            addEvent('auto_sweep_configured', data);
          });

          // Health check
          socket.on('health_check', (data: Record<string, unknown>) => {
            // Silent health check
          });

        } catch {
          console.log('Failed to initialize sniper service connection');
        }
      }).catch(() => {
        console.log('Failed to load socket.io-client for sniper service');
      });
    }

    return () => {
      // Don't disconnect on unmount
    };
  }, []);

  const addEvent = useCallback((type: string, data: Record<string, unknown>) => {
    setState(prev => ({
      ...prev,
      events: [
        { type, data, timestamp: Date.now() },
        ...prev.events.slice(0, 99), // Keep last 100 events
      ],
    }));
  }, []);

  // Actions
  const verifyToken = useCallback((tokenAddress: string, chain: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('verify_token', { tokenAddress, chain });
    }
  }, []);

  const checkLiquidity = useCallback((data: {
    tokenAddress: string;
    baseToken: string;
    chain: string;
    dex: string;
  }) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('check_liquidity', data);
    }
  }, []);

  const addTarget = useCallback((data: {
    tokenAddress: string;
    tokenSymbol?: string;
    tokenName?: string;
    chain: string;
    dex: string;
    baseToken: string;
    buyAmount: string;
    maxBuyPrice?: string;
    minLiquidity?: string;
    autoApprove?: boolean;
    // Buy settings
    buySlippage?: string;
    buyGasPrice?: string;
    buyGasLimit?: string;
    // Sell settings
    sellSlippage?: string;
    sellGasPrice?: string;
    sellGasLimit?: string;
    // Take Profit
    takeProfitEnabled?: boolean;
    takeProfitPercent?: string;
    takeProfitAmount?: string;
    // Stop Loss
    stopLossEnabled?: boolean;
    stopLossPercent?: string;
    stopLossType?: string;
    // Trailing Stop
    trailingStopEnabled?: boolean;
    trailingStopPercent?: string;
    trailingStopActivation?: string;
  }) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('add_sniper_target', data);
    }
  }, []);

  const cancelTarget = useCallback((targetId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('cancel_sniper_target', { targetId });
    }
  }, []);

  const getTargets = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('get_targets', {});
    }
  }, []);

  const updateConfig = useCallback((config: Partial<SniperServiceState['config']>) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('update_config', config);
    }
  }, []);

  const configureAutoSweep = useCallback((config: {
    enabled: boolean;
    chains: string[];
    interval: number;
  }) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('configure_auto_sweep', config);
    }
  }, []);

  return {
    ...state,
    verifyToken,
    checkLiquidity,
    addTarget,
    cancelTarget,
    getTargets,
    updateConfig,
    configureAutoSweep,
  };
}
