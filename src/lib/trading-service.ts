// Secure Trading Service - Handles DEX interactions and transaction execution
// This module provides secure functions for trading on various DEXs across EVM chains

import { createPublicClient, createWalletClient, http, formatUnits, parseUnits, type Address, type WalletClient, type PublicClient } from 'viem';

// ERC20 ABI for token interactions
export const ERC20_ABI = [
  {
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    name: 'decimals',
    inputs: [],
    outputs: [{ type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    name: 'symbol',
    inputs: [],
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Uniswap V2 Router ABI
export const UNISWAP_ROUTER_ABI = [
  {
    name: 'swapExactTokensForTokens',
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'path', type: 'address[]' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    name: 'swapExactETHForTokens',
    inputs: [
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'path', type: 'address[]' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    name: 'swapExactTokensForETH',
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'path', type: 'address[]' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    name: 'getAmountsOut',
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'path', type: 'address[]' },
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Security utilities
export function validateAddress(address: string): address is Address {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function validateAmount(amount: string): boolean {
  const parsed = parseFloat(amount);
  return !isNaN(parsed) && parsed > 0;
}

// Create a deadline timestamp for transactions
export function createDeadline(minutes: number = 20): bigint {
  return BigInt(Math.floor(Date.now() / 1000) + minutes * 60);
}

// Calculate minimum output with slippage protection
export function calculateMinOutput(
  expectedOutput: bigint,
  slippagePercent: number
): bigint {
  const slippageMultiplier = BigInt(Math.floor((100 - slippagePercent) * 100));
  return (expectedOutput * slippageMultiplier) / BigInt(10000);
}

// Trading configuration interface
export interface TradeConfig {
  chainId: number;
  routerAddress: Address;
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
  amountOutMin: bigint;
  recipient: Address;
  deadline: bigint;
  isNativeIn: boolean;
  isNativeOut: boolean;
}

// Security checks for trading
export interface SecurityChecks {
  checkLiquidity: boolean;
  checkHoneypot: boolean;
  checkContract: boolean;
  maxGasPrice: bigint;
  minPoolSize: bigint;
}

// Default security settings
export const DEFAULT_SECURITY_CHECKS: SecurityChecks = {
  checkLiquidity: true,
  checkHoneypot: true,
  checkContract: true,
  maxGasPrice: parseUnits('100', 9), // 100 gwei
  minPoolSize: parseUnits('1', 18), // Minimum 1 native token liquidity
};

// Security check results
export interface SecurityCheckResult {
  passed: boolean;
  warnings: string[];
  errors: string[];
}

// Perform security checks before trading
export async function performSecurityChecks(
  publicClient: PublicClient,
  tokenAddress: Address,
  config: SecurityChecks = DEFAULT_SECURITY_CHECKS
): Promise<SecurityCheckResult> {
  const result: SecurityCheckResult = {
    passed: true,
    warnings: [],
    errors: [],
  };

  try {
    // Check if contract is verified (basic check)
    if (config.checkContract) {
      try {
        const bytecode = await publicClient.getBytecode({ address: tokenAddress });
        if (!bytecode || bytecode === '0x') {
          result.warnings.push('Token has no contract code (might be a native token wrapper issue)');
        }
      } catch {
        result.warnings.push('Could not verify token contract');
      }
    }

    // Additional security checks would go here:
    // - Honeypot detection
    // - Liquidity verification
    // - Tax analysis
    // - Owner permissions check
    
  } catch (error) {
    result.errors.push(`Security check failed: ${error}`);
    result.passed = false;
  }

  return result;
}

// Execute a token swap
export async function executeSwap(
  walletClient: WalletClient,
  publicClient: PublicClient,
  tradeConfig: TradeConfig,
  securityChecks: SecurityChecks = DEFAULT_SECURITY_CHECKS
): Promise<{ hash: Address; amountOut?: bigint }> {
  const { chain } = walletClient;
  
  if (!chain) {
    throw new Error('Wallet not connected to a chain');
  }

  // Security checks
  const security = await performSecurityChecks(
    publicClient,
    tradeConfig.tokenOut,
    securityChecks
  );

  if (security.errors.length > 0) {
    throw new Error(`Security check failed: ${security.errors.join(', ')}`);
  }

  if (security.warnings.length > 0) {
    console.warn('Security warnings:', security.warnings);
  }

  // Check allowance for non-native input tokens
  if (!tradeConfig.isNativeIn) {
    const [account] = await walletClient.getAddresses();
    
    const allowance = await publicClient.readContract({
      address: tradeConfig.tokenIn,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [account, tradeConfig.routerAddress],
    });

    if (allowance < tradeConfig.amountIn) {
      throw new Error('Insufficient allowance. Please approve token spending first.');
    }
  }

  // Build swap path
  const path = [tradeConfig.tokenIn, tradeConfig.tokenOut];

  // Get account address
  const [account] = await walletClient.getAddresses();

  let hash: Address;

  // Execute appropriate swap function
  if (tradeConfig.isNativeIn && !tradeConfig.isNativeOut) {
    // ETH/BNB/AVAX -> Token
    hash = await walletClient.writeContract({
      address: tradeConfig.routerAddress,
      abi: UNISWAP_ROUTER_ABI,
      functionName: 'swapExactETHForTokens',
      args: [tradeConfig.amountOutMin, path, tradeConfig.recipient, tradeConfig.deadline],
      value: tradeConfig.amountIn,
    });
  } else if (!tradeConfig.isNativeIn && tradeConfig.isNativeOut) {
    // Token -> ETH/BNB/AVAX
    hash = await walletClient.writeContract({
      address: tradeConfig.routerAddress,
      abi: UNISWAP_ROUTER_ABI,
      functionName: 'swapExactTokensForETH',
      args: [
        tradeConfig.amountIn,
        tradeConfig.amountOutMin,
        path,
        tradeConfig.recipient,
        tradeConfig.deadline,
      ],
    });
  } else {
    // Token -> Token
    hash = await walletClient.writeContract({
      address: tradeConfig.routerAddress,
      abi: UNISWAP_ROUTER_ABI,
      functionName: 'swapExactTokensForTokens',
      args: [
        tradeConfig.amountIn,
        tradeConfig.amountOutMin,
        path,
        tradeConfig.recipient,
        tradeConfig.deadline,
      ],
    });
  }

  return { hash };
}

// Approve token spending
export async function approveToken(
  walletClient: WalletClient,
  tokenAddress: Address,
  spenderAddress: Address,
  amount: bigint
): Promise<Address> {
  const [account] = await walletClient.getAddresses();

  const hash = await walletClient.writeContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [spenderAddress, amount],
  });

  return hash;
}

// Get token balance
export async function getTokenBalance(
  publicClient: PublicClient,
  tokenAddress: Address,
  walletAddress: Address
): Promise<bigint> {
  return await publicClient.readContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [walletAddress],
  });
}

// Get native balance
export async function getNativeBalance(
  publicClient: PublicClient,
  walletAddress: Address
): Promise<bigint> {
  return await publicClient.getBalance({ address: walletAddress });
}

// Estimate gas for a transaction
export async function estimateGasPrice(
  publicClient: PublicClient
): Promise<{ gasPrice: bigint; maxFeePerGas?: bigint; maxPriorityFeePerGas?: bigint }> {
  const gasPrice = await publicClient.getGasPrice();
  
  // For EIP-1559 chains
  try {
    const block = await publicClient.getBlock();
    const baseFee = block.baseFeePerGas;
    
    if (baseFee) {
      const maxPriorityFeePerGas = parseUnits('2', 9); // 2 gwei
      const maxFeePerGas = baseFee + maxPriorityFeePerGas;
      
      return {
        gasPrice,
        maxFeePerGas,
        maxPriorityFeePerGas,
      };
    }
  } catch {
    // Not an EIP-1559 chain
  }

  return { gasPrice };
}

// Constants for common token addresses
export const COMMON_TOKENS: Record<number, Record<string, Address>> = {
  1: { // Ethereum
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  },
  137: { // Polygon
    WMATIC: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
    USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
  },
  369: { // PulseChain
    WPLS: '0xA1077a294dDE1B09bB078844df40758a5D0f9a27',
    USDC: '0x0cb6F4a77E69fB781B85e2eA60A80B751beC3827',
    USDT: '0xEF584451bBCfF18EAa63f392dfE57F08A2CeF439',
  },
};
