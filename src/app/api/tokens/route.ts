import { NextRequest, NextResponse } from 'next/server';

// Token registry with popular tokens per chain
// In production, this would be fetched from on-chain data or token list APIs

interface TokenInfo {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  chain: string;
  logoURI?: string;
  tags?: string[];
}

// Popular tokens by chain
const TOKEN_REGISTRY: Record<string, TokenInfo[]> = {
  ethereum: [
    { symbol: 'WETH', name: 'Wrapped Ether', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18, chain: 'ethereum', tags: ['native', 'wrapped'] },
    { symbol: 'USDC', name: 'USD Coin', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6, chain: 'ethereum', tags: ['stablecoin'] },
    { symbol: 'USDT', name: 'Tether USD', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6, chain: 'ethereum', tags: ['stablecoin'] },
    { symbol: 'DAI', name: 'Dai Stablecoin', address: '0x6B175474E89094C44Da98b954EeSdeCB6b8B1C', decimals: 18, chain: 'ethereum', tags: ['stablecoin'] },
    { symbol: 'UNI', name: 'Uniswap', address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', decimals: 18, chain: 'ethereum', tags: ['defi', 'governance'] },
    { symbol: 'LINK', name: 'Chainlink', address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', decimals: 18, chain: 'ethereum', tags: ['oracle'] },
    { symbol: 'AAVE', name: 'Aave', address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', decimals: 18, chain: 'ethereum', tags: ['defi', 'lending'] },
    { symbol: 'SHIB', name: 'Shiba Inu', address: '0x95aD61b0a150d79219dcF64e1E6Cc01f0B64C4cE', decimals: 18, chain: 'ethereum', tags: ['meme'] },
    { symbol: 'PEPE', name: 'Pepe', address: '0x6982508145454Ce325dDbE47a25d4ec3d2311933', decimals: 18, chain: 'ethereum', tags: ['meme'] },
    { symbol: 'MKR', name: 'Maker', address: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2', decimals: 18, chain: 'ethereum', tags: ['defi', 'governance'] },
  ],
  pulsechain: [
    { symbol: 'WPLS', name: 'Wrapped Pulse', address: '0xA1077a294dDE1B09bB078844df40758a5D0f9a27', decimals: 18, chain: 'pulsechain', tags: ['native', 'wrapped'] },
    { symbol: 'PLSX', name: 'PulseX', address: '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce', decimals: 18, chain: 'pulsechain', tags: ['defi', 'governance'] },
    { symbol: 'INC', name: 'Incinerate', address: '0x2fa878Ab3F87CC1C97f7D349C2bBd40D9d8D2f0D', decimals: 18, chain: 'pulsechain', tags: ['deflationary'] },
    { symbol: 'USDT', name: 'Tether USD', address: '0x0Cb6F5C3491d18E72f194E43b9f6B3495e0EA509', decimals: 6, chain: 'pulsechain', tags: ['stablecoin'] },
    { symbol: 'USDC', name: 'USD Coin', address: '0x15D38573d2feeb82e7ad5187aB8c1a8CCf1e0f13', decimals: 6, chain: 'pulsechain', tags: ['stablecoin'] },
    { symbol: 'DAI', name: 'Dai Stablecoin', address: '0xefD7664Cb6fF6269bC4577c7B0681285a10D3016', decimals: 18, chain: 'pulsechain', tags: ['stablecoin'] },
  ],
  base: [
    { symbol: 'WETH', name: 'Wrapped Ether', address: '0x42000000000000000000000000000000000000006', decimals: 18, chain: 'base', tags: ['native', 'wrapped'] },
    { symbol: 'USDC', name: 'USD Coin', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6, chain: 'base', tags: ['stablecoin'] },
    { symbol: 'USDbC', name: 'USD Base Coin', address: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA', decimals: 6, chain: 'base', tags: ['stablecoin'] },
    { symbol: 'DAI', name: 'Dai Stablecoin', address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', decimals: 18, chain: 'base', tags: ['stablecoin'] },
    { symbol: 'AERO', name: 'Aerodrome', address: '0x940181a94A35A4569E4529A3CDfB729e4474B70E', decimals: 18, chain: 'base', tags: ['defi'] },
    { symbol: 'DEGEN', name: 'Degen', address: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed', decimals: 18, chain: 'base', tags: ['meme'] },
    { symbol: 'BRETT', name: 'Brett', address: '0x532f27373A9BB903C4c49FAF73C373a9B81c6e84', decimals: 18, chain: 'base', tags: ['meme'] },
  ],
  solana: [
    { symbol: 'SOL', name: 'Solana', address: 'So11111111111111111111111111111111111111112', decimals: 9, chain: 'solana', tags: ['native', 'wrapped'] },
    { symbol: 'USDC', name: 'USD Coin', address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6, chain: 'solana', tags: ['stablecoin'] },
    { symbol: 'USDT', name: 'Tether USD', address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', decimals: 6, chain: 'solana', tags: ['stablecoin'] },
    { symbol: 'RAY', name: 'Raydium', address: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', decimals: 6, chain: 'solana', tags: ['defi', 'dex'] },
    { symbol: 'BONK', name: 'Bonk', address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', decimals: 5, chain: 'solana', tags: ['meme'] },
    { symbol: 'JUP', name: 'Jupiter', address: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', decimals: 6, chain: 'solana', tags: ['defi', 'dex'] },
    { symbol: 'WIF', name: 'dogwifhat', address: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', decimals: 6, chain: 'solana', tags: ['meme'] },
    { symbol: 'ORCA', name: 'Orca', address: 'orcaEKTdK7LKj57MvvmeDoe7hDWdSWqAhoyBonVJnyXY', decimals: 6, chain: 'solana', tags: ['defi', 'dex'] },
    { symbol: 'PYTH', name: 'Pyth Network', address: 'HZ1JnjYjVNLbbPjE5s4FqM6iLq3s4g2V8vD5QgXRvPn', decimals: 6, chain: 'solana', tags: ['oracle'] },
  ],
  arbitrum: [
    { symbol: 'WETH', name: 'Wrapped Ether', address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', decimals: 18, chain: 'arbitrum', tags: ['native', 'wrapped'] },
    { symbol: 'USDC', name: 'USD Coin', address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6, chain: 'arbitrum', tags: ['stablecoin'] },
    { symbol: 'USDT', name: 'Tether USD', address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6, chain: 'arbitrum', tags: ['stablecoin'] },
    { symbol: 'ARB', name: 'Arbitrum', address: '0x912CE59144191C1204E64559FE8253a0e49E6548', decimals: 18, chain: 'arbitrum', tags: ['governance'] },
    { symbol: 'DAI', name: 'Dai', address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', decimals: 18, chain: 'arbitrum', tags: ['stablecoin'] },
    { symbol: 'GMX', name: 'GMX', address: '0xfc5A1A6EB076a2C7aD06eD22C90d7E7fE34327B2', decimals: 18, chain: 'arbitrum', tags: ['defi', 'derivatives'] },
  ],
  optimism: [
    { symbol: 'WETH', name: 'Wrapped Ether', address: '0x42000000000000000000000000000000000000006', decimals: 18, chain: 'optimism', tags: ['native', 'wrapped'] },
    { symbol: 'USDC', name: 'USD Coin', address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', decimals: 6, chain: 'optimism', tags: ['stablecoin'] },
    { symbol: 'OP', name: 'Optimism', address: '0x4200000000000000000000000000000000000042', decimals: 18, chain: 'optimism', tags: ['governance'] },
    { symbol: 'USDT', name: 'Tether USD', address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', decimals: 6, chain: 'optimism', tags: ['stablecoin'] },
    { symbol: 'DAI', name: 'Dai', address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', decimals: 18, chain: 'optimism', tags: ['stablecoin'] },
  ],
  polygon: [
    { symbol: 'WMATIC', name: 'Wrapped Matic', address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', decimals: 18, chain: 'polygon', tags: ['native', 'wrapped'] },
    { symbol: 'USDC', name: 'USD Coin', address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', decimals: 6, chain: 'polygon', tags: ['stablecoin'] },
    { symbol: 'USDT', name: 'Tether USD', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6, chain: 'polygon', tags: ['stablecoin'] },
    { symbol: 'WETH', name: 'Wrapped Ether', address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', decimals: 18, chain: 'polygon', tags: ['wrapped'] },
    { symbol: 'DAI', name: 'Dai', address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', decimals: 18, chain: 'polygon', tags: ['stablecoin'] },
  ],
  bsc: [
    { symbol: 'WBNB', name: 'Wrapped BNB', address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', decimals: 18, chain: 'bsc', tags: ['native', 'wrapped'] },
    { symbol: 'USDC', name: 'USD Coin', address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', decimals: 18, chain: 'bsc', tags: ['stablecoin'] },
    { symbol: 'USDT', name: 'Tether USD', address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18, chain: 'bsc', tags: ['stablecoin'] },
    { symbol: 'BUSD', name: 'BUSD', address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', decimals: 18, chain: 'bsc', tags: ['stablecoin'] },
    { symbol: 'CAKE', name: 'PancakeSwap', address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82', decimals: 18, chain: 'bsc', tags: ['defi', 'dex'] },
  ],
  avalanche: [
    { symbol: 'WAVAX', name: 'Wrapped AVAX', address: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', decimals: 18, chain: 'avalanche', tags: ['native', 'wrapped'] },
    { symbol: 'USDC', name: 'USD Coin', address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', decimals: 6, chain: 'avalanche', tags: ['stablecoin'] },
    { symbol: 'USDT', name: 'Tether USD', address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', decimals: 6, chain: 'avalanche', tags: ['stablecoin'] },
    { symbol: 'DAI', name: 'Dai', address: '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70', decimals: 18, chain: 'avalanche', tags: ['stablecoin'] },
    { symbol: 'JOE', name: 'Trader Joe', address: '0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd', decimals: 18, chain: 'avalanche', tags: ['defi', 'dex'] },
  ],
  fantom: [
    { symbol: 'WFTM', name: 'Wrapped FTM', address: '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83', decimals: 18, chain: 'fantom', tags: ['native', 'wrapped'] },
    { symbol: 'USDC', name: 'USD Coin', address: '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75', decimals: 6, chain: 'fantom', tags: ['stablecoin'] },
    { symbol: 'USDT', name: 'Tether USD', address: '0x049d68029688eAbF473097a2fC38ef61633A3C7A', decimals: 6, chain: 'fantom', tags: ['stablecoin'] },
    { symbol: 'DAI', name: 'Dai', address: '0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E', decimals: 18, chain: 'fantom', tags: ['stablecoin'] },
  ],
};

// Rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 50;

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(clientId);
  
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT_MAX) return false;
  
  entry.count++;
  return true;
}

// GET - Search tokens by chain or query
export async function GET(request: NextRequest) {
  const clientId = request.headers.get('x-forwarded-for') || 'unknown';
  if (!checkRateLimit(clientId)) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const chain = searchParams.get('chain');
    const query = searchParams.get('q')?.toLowerCase();
    const address = searchParams.get('address')?.toLowerCase();
    
    // Get tokens for specific chain
    if (chain && !query && !address) {
      const tokens = TOKEN_REGISTRY[chain] || [];
      return NextResponse.json({
        success: true,
        data: tokens,
        chain,
      });
    }
    
    // Search tokens by query across all chains or specific chain
    if (query) {
      let searchChains = chain ? [chain] : Object.keys(TOKEN_REGISTRY);
      const results: TokenInfo[] = [];
      
      for (const c of searchChains) {
        const chainTokens = TOKEN_REGISTRY[c] || [];
        const matches = chainTokens.filter(
          token =>
            token.symbol.toLowerCase().includes(query) ||
            token.name.toLowerCase().includes(query) ||
            token.address.toLowerCase().includes(query)
        );
        results.push(...matches);
      }
      
      return NextResponse.json({
        success: true,
        data: results.slice(0, 50),
        query,
      });
    }
    
    // Get token by address
    if (address && chain) {
      const chainTokens = TOKEN_REGISTRY[chain] || [];
      const token = chainTokens.find(t => t.address.toLowerCase() === address);
      
      if (token) {
        return NextResponse.json({
          success: true,
          data: token,
        });
      }
      
      return NextResponse.json({
        success: false,
        error: 'Token not found',
      }, { status: 404 });
    }
    
    // Get all tokens for all chains
    const allTokens: TokenInfo[] = [];
    for (const [chainName, tokens] of Object.entries(TOKEN_REGISTRY)) {
      allTokens.push(...tokens);
    }
    
    return NextResponse.json({
      success: true,
      data: allTokens,
      chains: Object.keys(TOKEN_REGISTRY),
    });
  } catch (error) {
    console.error('Token search API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search tokens' },
      { status: 500 }
    );
  }
}
