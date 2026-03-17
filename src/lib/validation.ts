/**
 * Input Validation Utilities
 * Security helpers for validating user input
 */

import { z } from 'zod';

// Ethereum address validation (0x + 40 hex characters)
export const ethereumAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, {
  message: 'Invalid Ethereum address format',
});

// Solana address validation (base58, 32-44 characters)
export const solanaAddressSchema = z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, {
  message: 'Invalid Solana address format',
});

// Generic token address (either Ethereum or Solana)
export const tokenAddressSchema = z.string().min(32, {
  message: 'Token address must be at least 32 characters',
}).max(100, {
  message: 'Token address too long',
});

// Positive number validation
export const positiveNumberSchema = z.number().positive().finite();

// Non-negative number validation (for amounts)
export const nonNegativeNumberSchema = z.number().nonnegative().finite();

// Percentage validation (0-100)
export const percentageSchema = z.number().min(0).max(100).finite();

// Slippage validation (0-100%)
export const slippageSchema = z.number().min(0).max(100).finite();

// Gas price validation (non-negative)
export const gasPriceSchema = z.number().nonnegative().finite();

// Gas limit validation (positive integer)
export const gasLimitSchema = z.number().int().positive();

// Chain name validation
export const validChains = [
  'ethereum', 'pulsechain', 'base', 'arbitrum', 'optimism', 'polygon',
  'bsc', 'avalanche', 'fantom', 'linea', 'zksync', 'scroll', 'mantle',
  'celo', 'gnosis', 'moonbeam', 'moonriver', 'solana'
] as const;

export const chainSchema = z.enum(validChains);

// DEX name validation - accept any valid DEX name
export const dexSchema = z.string().min(1).max(50);

// Base token validation - accept any valid token symbol
export const baseTokenSchema = z.string().min(1).max(20);

// Trade type validation
export const tradeTypeSchema = z.enum(['buy', 'sell']);

// Trade status validation
export const tradeStatusSchema = z.enum(['pending', 'executing', 'completed', 'failed', 'cancelled']);

// Bot configuration update schema
export const botConfigUpdateSchema = z.object({
  name: z.string().max(100).optional(),
  isActive: z.boolean().optional(),
  exchange: dexSchema.optional(),
  network: chainSchema.optional(),
  rpcUrl: z.string().url().max(500).optional().nullable(),
  targetToken: tokenAddressSchema.optional().nullable(),
  targetTokenSymbol: z.string().max(20).optional().nullable(),
  targetTokenName: z.string().max(100).optional().nullable(),
  baseToken: baseTokenSchema.optional(),
  strategy: z.string().max(50).optional(),
  strategyParams: z.string().max(5000).optional().nullable(),
  buyTriggerType: z.string().max(100).optional(),
  buyTriggerValue: percentageSchema.optional(),
  buyAmount: nonNegativeNumberSchema.optional(),
  buySlippage: slippageSchema.optional(),
  buyGasPrice: gasPriceSchema.optional(),
  buyGasLimit: gasLimitSchema.optional(),
  minLiquidity: nonNegativeNumberSchema.optional(),
  maxBuyPrice: nonNegativeNumberSchema.optional().nullable(),
  sellTriggerType: z.string().max(50).optional(),
  sellTriggerValue: nonNegativeNumberSchema.optional(),
  sellSlippage: slippageSchema.optional(),
  sellGasPrice: gasPriceSchema.optional(),
  sellGasLimit: gasLimitSchema.optional(),
  takeProfitEnabled: z.boolean().optional(),
  takeProfitPercent: percentageSchema.optional(),
  takeProfitAmount: percentageSchema.optional(),
  stopLossEnabled: z.boolean().optional(),
  stopLossPercent: percentageSchema.optional(),
  stopLossType: z.enum(['fixed', 'trailing', 'dynamic']).optional(),
  trailingStopEnabled: z.boolean().optional(),
  trailingStopPercent: percentageSchema.optional(),
  trailingStopActivation: percentageSchema.optional(),
  positionSizingType: z.enum(['fixed', 'percentage', 'kelly', 'risk_parity']).optional(),
  positionSizeValue: nonNegativeNumberSchema.optional(),
  maxPositionSize: nonNegativeNumberSchema.optional(),
  minPositionSize: nonNegativeNumberSchema.optional(),
  maxDailyLoss: nonNegativeNumberSchema.optional(),
  maxDailyTrades: z.number().int().positive().optional(),
  maxOpenPositions: z.number().int().positive().optional(),
  cooldownPeriod: z.number().int().nonnegative().optional(),
  autoApprove: z.boolean().optional(),
  mevProtection: z.boolean().optional(),
  flashLoanDetection: z.boolean().optional(),
  // Auto-Sweep settings
  autoSweepEnabled: z.boolean().optional(),
  sweepChains: z.string().max(500).optional(),
  sweepInterval: z.number().int().min(5).max(3600).optional(),
}).strict();

// Trade creation schema
export const tradeCreateSchema = z.object({
  type: tradeTypeSchema,
  tokenAddress: tokenAddressSchema,
  tokenSymbol: z.string().max(20).optional(),
  tokenName: z.string().max(100).optional(),
  amountIn: nonNegativeNumberSchema,
  amountOut: nonNegativeNumberSchema.optional(),
  price: nonNegativeNumberSchema.optional(),
  priceUsd: nonNegativeNumberSchema.optional(),
  triggerType: z.string().max(50).optional(),
  triggerValue: nonNegativeNumberSchema.optional(),
}).strict();

// Position creation schema
export const positionCreateSchema = z.object({
  tokenAddress: tokenAddressSchema,
  tokenSymbol: z.string().max(20).optional(),
  tokenName: z.string().max(100).optional(),
  entryPrice: nonNegativeNumberSchema,
  entryPriceUsd: nonNegativeNumberSchema.optional(),
  amount: nonNegativeNumberSchema,
  valueIn: nonNegativeNumberSchema,
  stopLossPrice: nonNegativeNumberSchema.optional().nullable(),
  takeProfitPrice: nonNegativeNumberSchema.optional().nullable(),
}).strict();

// Wallet trade execution schema
export const walletTradeSchema = z.object({
  type: tradeTypeSchema,
  tokenAddress: tokenAddressSchema,
  amount: nonNegativeNumberSchema,
  slippage: slippageSchema.optional(),
  userAddress: ethereumAddressSchema.optional(),
  chainId: z.number().int().positive().optional(),
}).strict();

// Validation helper function
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.safeParse(data);
    if (result.success) {
      return { success: true, data: result.data };
    }
    const errorMessage = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    return { success: false, error: errorMessage };
  } catch {
    return { success: false, error: 'Validation failed' };
  }
}

// Sanitize string input (remove potential XSS vectors)
export function sanitizeString(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

// Check if address is valid Ethereum address
export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Check if address is valid Solana address
export function isValidSolanaAddress(address: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

// Validate and normalize token address
export function normalizeTokenAddress(address: string, chain: string): string | null {
  const trimmed = address.trim();
  
  if (chain === 'solana') {
    return isValidSolanaAddress(trimmed) ? trimmed : null;
  }
  
  // For EVM chains, normalize to lowercase
  if (isValidEthereumAddress(trimmed)) {
    return trimmed.toLowerCase();
  }
  
  return null;
}
