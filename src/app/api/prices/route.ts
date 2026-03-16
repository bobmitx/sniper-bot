import { NextRequest, NextResponse } from 'next/server';

// Cache for prices (updated periodically)
let priceCache: Record<string, { price: number; change24h: number; marketCap: number }> = {};
let lastPriceUpdate = 0;
const PRICE_CACHE_DURATION = 30000; // 30 seconds

// CoinGecko API for native token prices
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Chain to CoinGecko ID mapping
const CHAIN_COINGECKO_IDS: Record<string, string> = {
  ethereum: 'ethereum',
  pulsechain: 'pulsechain',
  base: 'base',
  arbitrum: 'arbitrum-one',
  optimism: 'optimistic-ethereum',
  polygon: 'matic-network',
  bsc: 'binancecoin',
  avalanche: 'avalanche-2',
  fantom: 'fantom',
  linea: 'linea',
  zksync: 'zksync',
  scroll: 'scroll',
  mantle: 'mantle',
  celo: 'celo',
  gnosis: 'xdai',
  moonbeam: 'moonbeam',
  moonriver: 'moonriver',
  solana: 'solana',
};

// Popular token address to CoinGecko ID mapping
const TOKEN_COINGECKO_IDS: Record<string, string> = {
  // Ethereum tokens
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': 'ethereum',
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 'usd-coin',
  '0xdac17f958d2ee523a2206206994597c13d831ec7': 'tether',
  '0x6b175474e89094c44da98b954eesdecb6b8b1c': 'dai',
  '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984': 'uniswap',
  '0x514910771af9ca656af840dff83e8264ecf986ca': 'chainlink',
  
  // Solana tokens
  'So11111111111111111111111111111111111111112': 'solana',
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'usd-coin',
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'tether',
  '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R': 'raydium',
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 'bonk',
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': 'jupiter-exchange-solana',
  'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm': 'dogwifcoin',
  
  // Base tokens
  '0x42000000000000000000000000000000000000006': 'ethereum',
  '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913': 'usd-coin',
  
  // PulseChain tokens
  '0xA1077a294dDE1B09bB078844df40758a5D0f9a27': 'pulsechain',
  '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce': 'pulsex',
};

// Fetch prices from CoinGecko
async function fetchNativeTokenPrices(): Promise<Record<string, { price: number; change24h: number; marketCap: number }>> {
  const coinIds = Object.values(CHAIN_COINGECKO_IDS).join(',');
  
  try {
    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`,
      {
        headers: { 'Accept': 'application/json' },
      }
    );
    
    if (!response.ok) {
      console.error(`CoinGecko API error: ${response.status}`);
      return priceCache; // Return cached data on error
    }
    
    const data = await response.json();
    
    // Map to chain names
    const prices: Record<string, { price: number; change24h: number; marketCap: number }> = {};
    
    for (const [chainName, coingeckoId] of Object.entries(CHAIN_COINGECKO_IDS)) {
      const coinData = data[coingeckoId];
      if (coinData) {
        prices[chainName] = {
          price: coinData.usd || 0,
          change24h: coinData.usd_24h_change || 0,
          marketCap: coinData.usd_market_cap || 0,
        };
      }
    }
    
    return prices;
  } catch (error) {
    console.error('Error fetching prices:', error);
    return priceCache;
  }
}

// GET - Fetch prices
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'prices';
  
  try {
    // Return cached prices if still valid
    if (action === 'prices') {
      const now = Date.now();
      
      if (now - lastPriceUpdate > PRICE_CACHE_DURATION || Object.keys(priceCache).length === 0) {
        priceCache = await fetchNativeTokenPrices();
        lastPriceUpdate = now;
      }
      
      return NextResponse.json({
        success: true,
        data: priceCache,
        timestamp: lastPriceUpdate,
      });
    }
    
    // Search for tokens
    if (action === 'search') {
      const query = searchParams.get('q');
      if (!query) {
        return NextResponse.json({ success: false, error: 'Query required' }, { status: 400 });
      }
      
      const response = await fetch(
        `${COINGECKO_API}/search?query=${encodeURIComponent(query)}`,
        { headers: { 'Accept': 'application/json' } }
      );
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      return NextResponse.json({
        success: true,
        data: data.coins?.slice(0, 20) || [],
      });
    }
    
    // Get trending tokens
    if (action === 'trending') {
      const response = await fetch(
        `${COINGECKO_API}/search/trending`,
        { headers: { 'Accept': 'application/json' } }
      );
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      return NextResponse.json({
        success: true,
        data: data.coins?.slice(0, 10) || [],
      });
    }
    
    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Price API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch prices' },
      { status: 500 }
    );
  }
}
