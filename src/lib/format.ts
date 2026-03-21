/**
 * Comprehensive number formatting utilities for cryptocurrency applications
 * Handles very small numbers (like PEPE), large numbers, and everything in between
 */

/**
 * Format a price with smart precision for cryptocurrencies
 * Handles very small prices (micro-cap tokens) by showing significant digits
 * 
 * @example
 * formatPrice(0.00000001234) => "0.00000001234"
 * formatPrice(1234.56) => "1,234.56"
 * formatPrice(0.000000000123) => "0.000000000123"
 */
export function formatPrice(price: number | undefined | null, options?: {
  /** Minimum significant digits to show */
  minSignificantDigits?: number;
  /** Maximum decimals for regular prices */
  maxDecimals?: number;
  /** Show currency symbol prefix */
  currency?: boolean;
}): string {
  if (price === undefined || price === null || isNaN(price)) return '—';
  if (price === 0) return '0';
  
  const { minSignificantDigits = 4, maxDecimals = 6, currency = true } = options || {};
  
  // Handle negative prices
  const isNegative = price < 0;
  const absPrice = Math.abs(price);
  
  let formatted: string;
  
  if (absPrice === 0) {
    formatted = '0';
  } else if (absPrice < 0.00000001) {
    // Extremely small: show in scientific notation with enough precision
    // e.g., 0.000000000123 => "1.23e-10"
    const exp = absPrice.toExponential(minSignificantDigits);
    formatted = exp;
  } else if (absPrice < 0.0001) {
    // Very small prices (like PEPE): count leading zeros and show enough decimals
    // e.g., 0.00000001234 => "0.00000001234"
    const str = absPrice.toFixed(20);
    const match = str.match(/^0\.0*[1-9]/);
    if (match) {
      // Find position of first non-zero digit after decimal
      const firstNonZero = str.indexOf(match[0].slice(-1));
      const leadingZeros = firstNonZero - 2; // subtract "0."
      const decimals = leadingZeros + minSignificantDigits;
      formatted = absPrice.toFixed(Math.min(decimals, 18));
      // Remove trailing zeros after the significant digits
      formatted = trimTrailingZeros(formatted);
    } else {
      formatted = absPrice.toFixed(minSignificantDigits);
    }
  } else if (absPrice < 1) {
    // Small prices: show 6-8 decimals
    formatted = absPrice.toFixed(Math.min(maxDecimals, 8));
    formatted = trimTrailingZeros(formatted);
  } else if (absPrice < 1000) {
    // Regular prices: show 2-4 decimals
    formatted = absPrice.toFixed(Math.min(maxDecimals, 4));
    formatted = trimTrailingZeros(formatted);
  } else if (absPrice < 1000000) {
    // Large prices: show with commas, 2 decimals
    formatted = absPrice.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  } else {
    // Very large prices: use compact notation
    formatted = formatCompact(absPrice, 2);
  }
  
  const prefix = currency ? '$' : '';
  const sign = isNegative ? '-' : '';
  return `${sign}${prefix}${formatted}`;
}

/**
 * Format a token amount with appropriate precision
 * Handles very small and very large amounts
 * 
 * @example
 * formatAmount(1234567890) => "1,234,567,890"
 * formatAmount(0.000000123) => "0.000000123"
 * formatAmount(1000000000) => "1B"
 */
export function formatAmount(amount: number | undefined | null, options?: {
  /** Number of decimals for regular amounts */
  decimals?: number;
  /** Use compact notation for large numbers (K/M/B) */
  compact?: boolean;
  /** Compact threshold (default: 1 million) */
  compactThreshold?: number;
  /** Show all decimals for small amounts */
  showSmallDecimals?: boolean;
}): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '—';
  if (amount === 0) return '0';
  
  const { 
    decimals = 4, 
    compact = false, 
    compactThreshold = 1000000,
    showSmallDecimals = true 
  } = options || {};
  
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  let formatted: string;
  
  if (absAmount < 0.0001 && showSmallDecimals) {
    // Very small amounts: show significant digits
    const str = absAmount.toFixed(20);
    const match = str.match(/^0\.0*[1-9]/);
    if (match) {
      const firstNonZero = str.indexOf(match[0].slice(-1));
      const leadingZeros = firstNonZero - 2;
      const sigDecimals = leadingZeros + 4;
      formatted = absAmount.toFixed(Math.min(sigDecimals, 18));
      formatted = trimTrailingZeros(formatted);
    } else {
      formatted = '<0.0001';
    }
  } else if (absAmount < 1) {
    formatted = absAmount.toFixed(Math.min(decimals, 8));
    formatted = trimTrailingZeros(formatted);
  } else if (absAmount < compactThreshold || !compact) {
    // Regular amounts: show with decimals and optional commas
    const intPart = Math.floor(absAmount);
    const fracPart = absAmount - intPart;
    
    if (fracPart === 0 || decimals === 0) {
      formatted = intPart.toLocaleString('en-US');
    } else {
      const fracStr = fracPart.toFixed(decimals).slice(2);
      formatted = `${intPart.toLocaleString('en-US')}.${trimTrailingZeros(fracStr)}`;
    }
  } else {
    // Large amounts: compact notation
    formatted = formatCompact(absAmount, 2);
  }
  
  return `${isNegative ? '-' : ''}${formatted}`;
}

/**
 * Format a USD value with appropriate precision and K/M/B suffixes
 * 
 * @example
 * formatUsd(1234.56) => "$1,234.56"
 * formatUsd(1234567) => "$1.23M"
 * formatUsd(0.0001) => "<$0.01"
 */
export function formatUsd(value: number | undefined | null, options?: {
  /** Show cents for values under $1 */
  showCents?: boolean;
  /** Compact threshold */
  compactThreshold?: number;
}): string {
  if (value === undefined || value === null || isNaN(value)) return '—';
  if (value === 0) return '$0';
  
  const { showCents = true, compactThreshold = 100000 } = options || {};
  
  const isNegative = value < 0;
  const absValue = Math.abs(value);
  
  let formatted: string;
  
  if (absValue < 0.01) {
    formatted = '<$0.01';
  } else if (absValue < 1) {
    formatted = `$${absValue.toFixed(4)}`;
    formatted = trimTrailingZeros(formatted.slice(1));
    formatted = `$${formatted}`;
  } else if (absValue < compactThreshold) {
    formatted = absValue.toLocaleString('en-US', {
      minimumFractionDigits: showCents ? 2 : 0,
      maximumFractionDigits: showCents ? 2 : 0,
    });
    formatted = `$${formatted}`;
  } else if (absValue < 1000000000) {
    formatted = `$${formatCompact(absValue, 2)}`;
  } else {
    formatted = `$${formatCompact(absValue, 2)}`;
  }
  
  return `${isNegative ? '-' : ''}${formatted}`;
}

/**
 * Format a percentage value
 * 
 * @example
 * formatPercent(15.234) => "15.23%"
 * formatPercent(-5.67) => "-5.67%"
 */
export function formatPercent(value: number | undefined | null, options?: {
  /** Number of decimal places */
  decimals?: number;
  /** Always show sign (for P&L) */
  showSign?: boolean;
}): string {
  if (value === undefined || value === null || isNaN(value)) return '—';
  
  const { decimals = 2, showSign = false } = options || {};
  
  const sign = value > 0 ? '+' : '';
  const formatted = `${value.toFixed(decimals)}%`;
  
  return showSign ? `${sign}${formatted}` : formatted;
}

/**
 * Format a number in compact notation (K, M, B, T)
 * 
 * @example
 * formatCompact(1234) => "1.23K"
 * formatCompact(1234567) => "1.23M"
 * formatCompact(1234567890) => "1.23B"
 */
export function formatCompact(value: number, decimals: number = 2): string {
  if (value === 0) return '0';
  
  const suffixes = ['', 'K', 'M', 'B', 'T'];
  const tier = Math.floor(Math.log10(Math.abs(value)) / 3);
  
  if (tier === 0) {
    return value.toFixed(decimals);
  }
  
  const scaled = value / Math.pow(1000, tier);
  const suffix = suffixes[tier] || '';
  
  return `${scaled.toFixed(decimals)}${suffix}`;
}

/**
 * Format P&L (Profit/Loss) with color-ready values
 * Returns both formatted string and direction for styling
 * 
 * @example
 * formatPnL(123.45) => { value: "+$123.45", isPositive: true }
 * formatPnL(-50) => { value: "-$50.00", isPositive: false }
 */
export function formatPnL(value: number | undefined | null, options?: {
  /** Show USD prefix */
  showUsd?: boolean;
  /** Show percentage */
  showPercent?: boolean;
}): { value: string; isPositive: boolean | null } {
  if (value === undefined || value === null || isNaN(value)) {
    return { value: '—', isPositive: null };
  }
  
  if (value === 0) {
    return { value: '$0.00', isPositive: null };
  }
  
  const { showUsd = true, showPercent = false } = options || {};
  const isPositive = value > 0;
  const prefix = isPositive ? '+' : '';
  const absValue = Math.abs(value);
  
  let formatted: string;
  if (showPercent) {
    formatted = `${prefix}${value.toFixed(2)}%`;
  } else if (showUsd) {
    if (absValue < 0.01) {
      formatted = `${prefix}$<0.01`;
    } else if (absValue < 100000) {
      formatted = `${prefix}$${absValue.toFixed(2)}`;
    } else {
      formatted = `${prefix}$${formatCompact(absValue, 2)}`;
    }
  } else {
    formatted = `${prefix}${absValue.toFixed(2)}`;
  }
  
  return { value: formatted, isPositive };
}

/**
 * Format a wallet balance with appropriate precision
 * Handles both native token balances and token balances
 * 
 * @example
 * formatBalance(0.000000123) => "0.000000123"
 * formatBalance(1234.567) => "1,234.567"
 */
export function formatBalance(balance: number | string | undefined | null, decimals: number = 6): string {
  if (balance === undefined || balance === null) return '0';
  
  const num = typeof balance === 'string' ? parseFloat(balance) : balance;
  if (isNaN(num) || num === 0) return '0';
  
  if (num < 0.0001) {
    // Very small balance: show significant digits
    const str = num.toFixed(20);
    const match = str.match(/^0\.0*[1-9]/);
    if (match) {
      const firstNonZero = str.indexOf(match[0].slice(-1));
      const leadingZeros = firstNonZero - 2;
      const sigDecimals = leadingZeros + 4;
      return num.toFixed(Math.min(sigDecimals, 18));
    }
    return '<0.0001';
  }
  
  return num.toFixed(decimals);
}

/**
 * Trim trailing zeros from a decimal number string
 * "1.23000" => "1.23"
 * "0.00012300" => "0.000123"
 */
function trimTrailingZeros(str: string): string {
  // Don't trim if it's a whole number (no decimal point)
  if (!str.includes('.')) return str;
  
  // Trim trailing zeros
  let trimmed = str.replace(/(\.\d*[1-9])0+$/, '$1');
  
  // If we're left with just a decimal point, remove it
  trimmed = trimmed.replace(/\.$/, '');
  
  return trimmed;
}

/**
 * Parse a formatted number string back to a number
 * Handles K/M/B suffixes and comma separators
 * 
 * @example
 * parseFormattedNumber("1.23K") => 1230
 * parseFormattedNumber("1,234.56") => 1234.56
 */
export function parseFormattedNumber(str: string): number {
  if (!str || str === '—') return NaN;
  
  // Remove commas and currency symbols
  let cleaned = str.replace(/[$,]/g, '');
  
  // Handle suffixes
  const suffixes: Record<string, number> = {
    'K': 1000,
    'M': 1000000,
    'B': 1000000000,
    'T': 1000000000000,
  };
  
  const match = cleaned.match(/^([\d.]+)([KMBT])?$/i);
  if (match) {
    const num = parseFloat(match[1]);
    const suffix = match[2]?.toUpperCase();
    return num * (suffixes[suffix] || 1);
  }
  
  return parseFloat(cleaned);
}

/**
 * Get the number of decimal places needed to display a number properly
 * Useful for input field precision
 */
export function getDecimalPlaces(num: number): number {
  if (num === 0 || num >= 1) return 2;
  
  const str = num.toFixed(20);
  const match = str.match(/^0\.0*([1-9])/);
  if (match) {
    const firstSigDigit = str.indexOf(match[1]);
    return firstSigDigit - 2 + 4; // leading zeros + 4 significant digits
  }
  
  return 6;
}
