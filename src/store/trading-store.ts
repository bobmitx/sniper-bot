import { create } from 'zustand';

// Types
export interface BotConfig {
  id: string;
  name: string;
  isActive: boolean;
  exchange: string;
  network: string;
  rpcUrl: string | null;
  targetToken: string | null;
  targetTokenSymbol: string | null;
  targetTokenName: string | null;
  baseToken: string;
  strategy: string;
  strategyParams: string | null;
  buyTriggerType: string;
  buyTriggerValue: number;
  buyAmount: number;
  buySlippage: number;
  buyGasPrice: number;
  buyGasLimit: number;
  sellTriggerType: string;
  sellTriggerValue: number;
  sellSlippage: number;
  sellGasPrice: number;
  sellGasLimit: number;
  stopLossEnabled: boolean;
  stopLossPercent: number;
  stopLossType: string;
  trailingStopEnabled: boolean;
  trailingStopPercent: number;
  trailingStopActivation: number;
  takeProfitEnabled: boolean;
  takeProfitPercent: number;
  takeProfitAmount: number;
  positionSizingType: string;
  positionSizeValue: number;
  maxPositionSize: number;
  minPositionSize: number;
  maxDailyLoss: number;
  maxDailyTrades: number;
  maxOpenPositions: number;
  cooldownPeriod: number;
  autoApprove: boolean;
  mevProtection: boolean;
  flashLoanDetection: boolean;
  // Auto-Sweep settings
  autoSweepEnabled: boolean;
  sweepChains: string;
  sweepInterval: number;
  // Additional security settings
  mevProtectionEnabled?: boolean;
  flashLoanDetectionEnabled?: boolean;
  autoApproveEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Trade {
  id: string;
  type: 'buy' | 'sell';
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'cancelled';
  tokenAddress: string;
  tokenSymbol: string | null;
  tokenName: string | null;
  amountIn: number;
  amountOut: number;
  price: number;
  priceUsd: number | null;
  txHash: string | null;
  blockNumber: number | null;
  gasUsed: number | null;
  gasPrice: number | null;
  gasCost: number | null;
  triggerType: string | null;
  triggerValue: number | null;
  slippageActual: number | null;
  profitLoss: number | null;
  profitLossPercent: number | null;
  profitLossUsd: number | null;
  executedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  errorMessage: string | null;
}

export interface Position {
  id: string;
  tokenAddress: string;
  tokenSymbol: string | null;
  tokenName: string | null;
  entryPrice: number;
  entryPriceUsd: number | null;
  amount: number;
  valueIn: number;
  currentValue: number | null;
  highestPrice: number | null;
  lowestPrice: number | null;
  stopLossPrice: number | null;
  takeProfitPrice: number | null;
  trailingStopPrice: number | null;
  status: 'open' | 'closing' | 'closed';
  openedAt: string;
  closedAt: string | null;
  updatedAt: string;
  profitLoss?: number;
  profitLossPercent?: number;
}

export interface PriceData {
  symbol: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  liquidity?: number;
  lastUpdated: string;
}

export interface ActivityLog {
  id: string;
  level: 'debug' | 'info' | 'warning' | 'error';
  category: 'trade' | 'price' | 'system' | 'security';
  message: string;
  details: string | null;
  createdAt: string;
}

interface TradingState {
  // Bot Configuration
  botConfig: BotConfig | null;
  isLoadingConfig: boolean;
  
  // Trades
  trades: Trade[];
  isLoadingTrades: boolean;
  
  // Positions
  positions: Position[];
  isLoadingPositions: boolean;
  
  // Market Data
  prices: Record<string, PriceData>;
  
  // Activity Logs
  activityLogs: ActivityLog[];
  
  // UI State
  activeTab: string;
  isBotStarting: boolean;
  wsConnected: boolean;
  
  // Actions
  setBotConfig: (config: BotConfig | ((prev: BotConfig | null) => BotConfig | null)) => void;
  setTrades: (trades: Trade[]) => void;
  addTrade: (trade: Trade) => void;
  setPositions: (positions: Position[]) => void;
  updatePosition: (id: string, data: Partial<Position>) => void;
  setPrice: (symbol: string, data: PriceData) => void;
  addActivityLog: (log: ActivityLog) => void;
  setActiveTab: (tab: string) => void;
  setWsConnected: (connected: boolean) => void;
  setIsBotStarting: (starting: boolean) => void;
  setIsLoadingConfig: (loading: boolean) => void;
  setIsLoadingTrades: (loading: boolean) => void;
  setIsLoadingPositions: (loading: boolean) => void;
}

export const useTradingStore = create<TradingState>((set) => ({
  // Initial State
  botConfig: null,
  isLoadingConfig: false,
  trades: [],
  isLoadingTrades: false,
  positions: [],
  isLoadingPositions: false,
  prices: {},
  activityLogs: [],
  activeTab: 'dashboard',
  isBotStarting: false,
  wsConnected: false,
  
  // Actions
  setBotConfig: (config: BotConfig | ((prev: BotConfig | null) => BotConfig)) => set((state) => ({
    botConfig: typeof config === 'function' ? config(state.botConfig) : config
  })),
  setTrades: (trades) => set({ trades }),
  addTrade: (trade) => set((state) => ({ trades: [trade, ...state.trades] })),
  setPositions: (positions) => set({ positions }),
  updatePosition: (id, data) => set((state) => ({
    positions: state.positions.map((p) => (p.id === id ? { ...p, ...data } : p)),
  })),
  setPrice: (symbol, data) => set((state) => ({
    prices: { ...state.prices, [symbol]: data },
  })),
  addActivityLog: (log) => set((state) => ({
    activityLogs: [log, ...state.activityLogs].slice(0, 100),
  })),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setWsConnected: (connected) => set({ wsConnected: connected }),
  setIsBotStarting: (starting) => set({ isBotStarting: starting }),
  setIsLoadingConfig: (loading) => set({ isLoadingConfig: loading }),
  setIsLoadingTrades: (loading) => set({ isLoadingTrades: loading }),
  setIsLoadingPositions: (loading) => set({ isLoadingPositions: loading }),
}));
