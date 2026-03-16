// Chain configurations for the sniper bot
// Each chain has DEXes, base tokens, and optimal RPC URLs for trading

export type ChainName = 
  | 'ethereum' 
  | 'pulsechain' 
  | 'base' 
  | 'arbitrum' 
  | 'optimism' 
  | 'polygon' 
  | 'bsc' 
  | 'avalanche' 
  | 'fantom' 
  | 'linea' 
  | 'zksync' 
  | 'scroll' 
  | 'mantle' 
  | 'celo' 
  | 'gnosis' 
  | 'moonbeam' 
  | 'moonriver' 
  | 'solana';

export interface BaseToken {
  symbol: string;
  address: string;
  name?: string;
  decimals?: number;
  logoURI?: string;
}

export interface ChainConfig {
  id: number | string;
  name: string;
  rpcUrl: string;
  rpcUrls: string[]; // Multiple RPC endpoints for fallback
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  dexes: string[];
  baseTokens: BaseToken[];
  isNonEvm?: boolean;
  blockExplorer?: string;
  coingeckoId?: string;
}

export const chainConfigs: Record<ChainName, ChainConfig> = {
  ethereum: {
    id: 1,
    name: 'Ethereum',
    rpcUrl: 'https://eth.drpc.org',
    rpcUrls: [
      'https://eth.drpc.org',
      'https://ethereum.publicnode.com',
      'https://eth.llamarpc.com',
      'https://rpc.ankr.com/eth',
      'https://eth-mainnet.g.alchemy.com/v2/demo',
      'https://cloudflare-eth.com',
    ],
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    dexes: ['uniswap', 'sushiswap', '1inch', 'kyberswap', 'balancer', 'curve', 'shibaswap', 'paraswap'],
    baseTokens: [
      { symbol: 'WETH', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', name: 'Wrapped Ether' },
      { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', name: 'USD Coin' },
      { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', name: 'Tether USD' },
      { symbol: 'DAI', address: '0x6B175474E89094C44Da98b954EeScdeCB6b8B1C', name: 'Dai Stablecoin' },
    ],
    blockExplorer: 'https://etherscan.io',
    coingeckoId: 'ethereum',
  },
  pulsechain: {
    id: 369,
    name: 'PulseChain',
    rpcUrl: 'https://rpc.pulsechain.com',
    rpcUrls: [
      'https://rpc.pulsechain.com',
      'https://rpc-pulsechain.g4mm4.io',
      'https://pulsechain.publicnode.com',
    ],
    nativeCurrency: { name: 'Pulse', symbol: 'PLS', decimals: 18 },
    dexes: ['pulsex', 'piteas', 'pulsex-v2', '9inch'],
    baseTokens: [
      { symbol: 'WPLS', address: '0xA1077a294dDE1B09bB078844df40758a5D0f9a27', name: 'Wrapped Pulse' },
      { symbol: 'PLSX', address: '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce', name: 'PulseX' },
      { symbol: 'INC', address: '0x2fa878Ab3F87CC1C97f7D349C2bBd40D9d8D2f0D', name: 'Incinerate' },
      { symbol: 'USDT', address: '0x0Cb6F5C3491d18E72f194E43b9f6B3495e0EA509', name: 'Tether USD' },
      { symbol: 'USDC', address: '0x15D38573d2feeb82e7ad5187aB8c1a8CCf1e0f13', name: 'USD Coin' },
      { symbol: 'DAI', address: '0xefD7664Cb6fF6269bC4577c7B0681285a10D3016', name: 'Dai Stablecoin' },
    ],
    blockExplorer: 'https://scan.pulsechain.com',
    coingeckoId: 'pulsechain',
  },
  base: {
    id: 8453,
    name: 'Base',
    rpcUrl: 'https://base.drpc.org',
    rpcUrls: [
      'https://base.drpc.org',
      'https://base.publicnode.com',
      'https://mainnet.base.org',
      'https://base.blockpi.network/v1/rpc/public',
    ],
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    dexes: ['uniswap', 'baseswap', 'aerodrome', 'sushiswap', 'pancakeswap', 'baseswap-v2'],
    baseTokens: [
      { symbol: 'WETH', address: '0x42000000000000000000000000000000000000006', name: 'Wrapped Ether' },
      { symbol: 'USDbC', address: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA', name: 'USD Base Coin' },
      { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', name: 'USD Coin' },
      { symbol: 'DAI', address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', name: 'Dai Stablecoin' },
    ],
    blockExplorer: 'https://basescan.org',
    coingeckoId: 'base',
  },
  arbitrum: {
    id: 42161,
    name: 'Arbitrum',
    rpcUrl: 'https://arbitrum.drpc.org',
    rpcUrls: [
      'https://arbitrum.drpc.org',
      'https://arbitrum.publicnode.com',
      'https://arb1.arbitrum.io/rpc',
      'https://rpc.ankr.com/arbitrum',
    ],
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    dexes: ['uniswap', 'sushiswap', 'camelot', 'zyberswap', 'ramses', '1inch'],
    baseTokens: [
      { symbol: 'WETH', address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', name: 'Wrapped Ether' },
      { symbol: 'USDC', address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', name: 'USD Coin' },
      { symbol: 'USDT', address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', name: 'Tether USD' },
      { symbol: 'ARB', address: '0x912CE59144191C1204E64559FE8253a0e49E6548', name: 'Arbitrum' },
      { symbol: 'DAI', address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', name: 'Dai Stablecoin' },
    ],
    blockExplorer: 'https://arbiscan.io',
    coingeckoId: 'arbitrum-one',
  },
  optimism: {
    id: 10,
    name: 'Optimism',
    rpcUrl: 'https://optimism.drpc.org',
    rpcUrls: [
      'https://optimism.drpc.org',
      'https://optimism.publicnode.com',
      'https://mainnet.optimism.io',
      'https://rpc.ankr.com/optimism',
    ],
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    dexes: ['uniswap', 'sushiswap', 'kyberswap', 'velodrome', 'synthetix', '1inch'],
    baseTokens: [
      { symbol: 'WETH', address: '0x42000000000000000000000000000000000000006', name: 'Wrapped Ether' },
      { symbol: 'USDC', address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', name: 'USD Coin' },
      { symbol: 'USDT', address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', name: 'Tether USD' },
      { symbol: 'OP', address: '0x4200000000000000000000000000000000000042', name: 'Optimism' },
      { symbol: 'DAI', address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', name: 'Dai Stablecoin' },
    ],
    blockExplorer: 'https://optimistic.etherscan.io',
    coingeckoId: 'optimistic-ethereum',
  },
  polygon: {
    id: 137,
    name: 'Polygon',
    rpcUrl: 'https://polygon.drpc.org',
    rpcUrls: [
      'https://polygon.drpc.org',
      'https://polygon.publicnode.com',
      'https://polygon-rpc.com',
      'https://rpc.ankr.com/polygon',
      'https://matic-mainnet.chainstacklabs.com',
    ],
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    dexes: ['uniswap', 'quickswap', 'sushiswap', 'kyberswap', '1inch', 'balancer', 'curve', 'dystopia'],
    baseTokens: [
      { symbol: 'WMATIC', address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', name: 'Wrapped Matic' },
      { symbol: 'USDC', address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', name: 'USD Coin' },
      { symbol: 'USDT', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', name: 'Tether USD' },
      { symbol: 'WETH', address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', name: 'Wrapped Ether' },
      { symbol: 'DAI', address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', name: 'Dai Stablecoin' },
    ],
    blockExplorer: 'https://polygonscan.com',
    coingeckoId: 'polygon-pos',
  },
  bsc: {
    id: 56,
    name: 'BSC',
    rpcUrl: 'https://bsc.drpc.org',
    rpcUrls: [
      'https://bsc.drpc.org',
      'https://bsc.publicnode.com',
      'https://bsc-dataseed1.binance.org',
      'https://bsc-dataseed2.binance.org',
      'https://rpc.ankr.com/bsc',
    ],
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    dexes: ['pancakeswap', 'sushiswap', 'biswap', 'apeswap', 'mdex', '1inch', 'babyswap', 'thena'],
    baseTokens: [
      { symbol: 'WBNB', address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', name: 'Wrapped BNB' },
      { symbol: 'USDC', address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', name: 'USD Coin' },
      { symbol: 'USDT', address: '0x55d398326f99059fF775485246999027B3197955', name: 'Tether USD' },
      { symbol: 'BUSD', address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', name: 'BUSD' },
      { symbol: 'CAKE', address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82', name: 'PancakeSwap' },
    ],
    blockExplorer: 'https://bscscan.com',
    coingeckoId: 'binance-smart-chain',
  },
  avalanche: {
    id: 43114,
    name: 'Avalanche',
    rpcUrl: 'https://avalanche.drpc.org',
    rpcUrls: [
      'https://avalanche.drpc.org',
      'https://avalanche.publicnode.com',
      'https://api.avax.network/ext/bc/C/rpc',
      'https://rpc.ankr.com/avalanche',
    ],
    nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 },
    dexes: ['traderjoe', 'pangolin', 'sushiswap', 'lydia', 'yeti', '1inch'],
    baseTokens: [
      { symbol: 'WAVAX', address: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', name: 'Wrapped AVAX' },
      { symbol: 'USDC', address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', name: 'USD Coin' },
      { symbol: 'USDT', address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', name: 'Tether USD' },
      { symbol: 'DAI', address: '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70', name: 'Dai Stablecoin' },
    ],
    blockExplorer: 'https://snowtrace.io',
    coingeckoId: 'avalanche',
  },
  fantom: {
    id: 250,
    name: 'Fantom',
    rpcUrl: 'https://fantom.drpc.org',
    rpcUrls: [
      'https://fantom.drpc.org',
      'https://fantom.publicnode.com',
      'https://rpc.ftm.tools',
      'https://rpc.ankr.com/fantom',
    ],
    nativeCurrency: { name: 'FTM', symbol: 'FTM', decimals: 18 },
    dexes: ['spookyswap', 'sushiswap', 'spiritswap', 'beethovenx', '1inch', 'curve'],
    baseTokens: [
      { symbol: 'WFTM', address: '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83', name: 'Wrapped FTM' },
      { symbol: 'USDC', address: '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75', name: 'USD Coin' },
      { symbol: 'USDT', address: '0x049d68029688eAbF473097a2fC38ef61633A3C7A', name: 'Tether USD' },
      { symbol: 'DAI', address: '0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E', name: 'Dai Stablecoin' },
    ],
    blockExplorer: 'https://ftmscan.com',
    coingeckoId: 'fantom',
  },
  linea: {
    id: 59144,
    name: 'Linea',
    rpcUrl: 'https://linea.drpc.org',
    rpcUrls: [
      'https://linea.drpc.org',
      'https://rpc.linea.build',
      'https://rpc.ankr.com/linea',
    ],
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    dexes: ['lynex', 'sushiswap', 'kyberswap', '1inch'],
    baseTokens: [
      { symbol: 'WETH', address: '0xe5D7C2a44FfDDf6b295A15c148167DaAaf5Cf34f', name: 'Wrapped Ether' },
      { symbol: 'USDC', address: '0x176211869cA2b568f2A7D4EE941E073a821EE1ff', name: 'USD Coin' },
      { symbol: 'USDT', address: '0xA219439258ca91429aA8136260925401FE14C757', name: 'Tether USD' },
    ],
    blockExplorer: 'https://lineascan.build',
    coingeckoId: 'linea',
  },
  zksync: {
    id: 324,
    name: 'zkSync',
    rpcUrl: 'https://zksync.drpc.org',
    rpcUrls: [
      'https://zksync.drpc.org',
      'https://zksync.mainnet.era.zksync.io',
      'https://rpc.ankr.com/zksync_era',
    ],
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    dexes: ['syncswap', 'mute', 'velocore', 'ezkalibur', 'spacefi'],
    baseTokens: [
      { symbol: 'WETH', address: '0x5AEa5775959fBC2557Cc8789bC1bf90A239D9a91', name: 'Wrapped Ether' },
      { symbol: 'USDC', address: '0x3355df6D4c9C3035724F0d0a0b8cB64dC2D6a07F', name: 'USD Coin' },
      { symbol: 'USDT', address: '0x493257fD40ED8F4C1bAEF7a2FfB79C75527840e9', name: 'Tether USD' },
    ],
    blockExplorer: 'https://explorer.zksync.io',
    coingeckoId: 'zksync',
  },
  scroll: {
    id: 534352,
    name: 'Scroll',
    rpcUrl: 'https://scroll.drpc.org',
    rpcUrls: [
      'https://scroll.drpc.org',
      'https://scroll.publicnode.com',
      'https://rpc.scroll.io',
    ],
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    dexes: ['uniswap', 'skydrome', 'zebra', 'xyswap'],
    baseTokens: [
      { symbol: 'WETH', address: '0x5300000000000000000000000000000000000004', name: 'Wrapped Ether' },
      { symbol: 'USDC', address: '0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4', name: 'USD Coin' },
      { symbol: 'USDT', address: '0xf55BEC9cafDbE8730f096Aa55dad6D22d440aD13', name: 'Tether USD' },
    ],
    blockExplorer: 'https://scrollscan.com',
    coingeckoId: 'scroll',
  },
  mantle: {
    id: 5000,
    name: 'Mantle',
    rpcUrl: 'https://mantle.drpc.org',
    rpcUrls: [
      'https://mantle.drpc.org',
      'https://rpc.mantle.xyz',
      'https://rpc.ankr.com/mantle',
    ],
    nativeCurrency: { name: 'MNT', symbol: 'MNT', decimals: 18 },
    dexes: ['agni', 'izumi', 'cleopatra', 'fusionX'],
    baseTokens: [
      { symbol: 'WMNT', address: '0x78c1b0C495d76121dfF697e59e4379F494096D15', name: 'Wrapped MNT' },
      { symbol: 'USDC', address: '0x09Bc4E0DDB65304336005271B72F4e86B83082Fb', name: 'USD Coin' },
      { symbol: 'USDT', address: '0x201EBa5CC46D216Ce6DC03F6a31f20bD32d41A92', name: 'Tether USD' },
    ],
    blockExplorer: 'https://mantlescan.xyz',
    coingeckoId: 'mantle',
  },
  celo: {
    id: 42220,
    name: 'Celo',
    rpcUrl: 'https://celo.drpc.org',
    rpcUrls: [
      'https://celo.drpc.org',
      'https://forno.celo.org',
      'https://rpc.ankr.com/celo',
    ],
    nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 },
    dexes: ['uniswap', 'ubeswap', 'mobula', 'sushiswap'],
    baseTokens: [
      { symbol: 'CELO', address: '0x471EcE3750Da237f93B8E339c536989b8978a438', name: 'Celo' },
      { symbol: 'cUSD', address: '0x765DE816845861e75A25fCA122bb6898B8B1282a', name: 'Celo Dollar' },
      { symbol: 'cEUR', address: '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73', name: 'Celo Euro' },
    ],
    blockExplorer: 'https://explorer.celo.org',
    coingeckoId: 'celo',
  },
  gnosis: {
    id: 100,
    name: 'Gnosis',
    rpcUrl: 'https://gnosis.drpc.org',
    rpcUrls: [
      'https://gnosis.drpc.org',
      'https://rpc.ankr.com/gnosis',
      'https://gnosis.publicnode.com',
      'https://rpc.gnosischain.com',
    ],
    nativeCurrency: { name: 'xDAI', symbol: 'xDAI', decimals: 18 },
    dexes: ['honeyswap', 'sushiswap', 'bao', 'levinswap', 'symmetric'],
    baseTokens: [
      { symbol: 'WXDAI', address: '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463A97d', name: 'Wrapped xDAI' },
      { symbol: 'USDC', address: '0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83', name: 'USD Coin' },
      { symbol: 'USDT', address: '0x4ECaBa5870353805a9F068101A40E0f32ed605C6', name: 'Tether USD' },
    ],
    blockExplorer: 'https://gnosisscan.io',
    coingeckoId: 'xdai',
  },
  moonbeam: {
    id: 1284,
    name: 'Moonbeam',
    rpcUrl: 'https://moonbeam.drpc.org',
    rpcUrls: [
      'https://moonbeam.drpc.org',
      'https://rpc.ankr.com/moonbeam',
      'https://rpc.api.moonbeam.network',
    ],
    nativeCurrency: { name: 'GLMR', symbol: 'GLMR', decimals: 18 },
    dexes: ['stellaswap', 'sushiswap', '1inch', 'beamswap'],
    baseTokens: [
      { symbol: 'WGLMR', address: '0xAcc15dC74880C9944775448304B263D191c6077F', name: 'Wrapped GLMR' },
      { symbol: 'USDC', address: '0x818ec0A7Fe18Ff94269904fCED6AE3DaE6d6dC0b', name: 'USD Coin' },
      { symbol: 'USDT', address: '0xefAeee6BE9dB1A0C72fE38B1B2a5f09A749244Cf', name: 'Tether USD' },
    ],
    blockExplorer: 'https://moonscan.io',
    coingeckoId: 'moonbeam',
  },
  moonriver: {
    id: 1285,
    name: 'Moonriver',
    rpcUrl: 'https://moonriver.drpc.org',
    rpcUrls: [
      'https://moonriver.drpc.org',
      'https://rpc.moonriver.moonbeam.network',
      'https://rpc.ankr.com/moonriver',
    ],
    nativeCurrency: { name: 'MOVR', symbol: 'MOVR', decimals: 18 },
    dexes: ['solarswap', 'sushiswap', '1inch'],
    baseTokens: [
      { symbol: 'WMOVR', address: '0x98878B06940aE243284CA214f92Bb71a2b032B1A', name: 'Wrapped MOVR' },
      { symbol: 'USDC', address: '0xE3F5fE0b74488d92C9Aa9Fb6C82b16A70d03937C', name: 'USD Coin' },
    ],
    blockExplorer: 'https://moonriver.moonscan.io',
    coingeckoId: 'moonriver',
  },
  solana: {
    id: 'solana-mainnet',
    name: 'Solana',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    rpcUrls: [
      'https://api.mainnet-beta.solana.com',
      'https://solana.public-rpc.com',
      'https://rpc.ankr.com/solana',
    ],
    nativeCurrency: { name: 'Solana', symbol: 'SOL', decimals: 9 },
    dexes: ['raydium', 'jupiter', 'orca', 'meteora', 'fluxbeam'],
    baseTokens: [
      { symbol: 'SOL', address: 'So11111111111111111111111111111111111111112', name: 'Solana' },
      { symbol: 'USDC', address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', name: 'USD Coin' },
      { symbol: 'USDT', address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', name: 'Tether USD' },
      { symbol: 'RAY', address: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', name: 'Raydium' },
      { symbol: 'BONK', address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', name: 'Bonk' },
      { symbol: 'JUP', address: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', name: 'Jupiter' },
    ],
    isNonEvm: true,
    blockExplorer: 'https://explorer.solana.com',
    coingeckoId: 'solana',
  },
};

// Get chain config by name
export function getChainConfig(chain: ChainName): ChainConfig | undefined {
  return chainConfigs[chain];
}

// Get all chain names
export function getAllChainNames(): ChainName[] {
  return Object.keys(chainConfigs) as ChainName[];
}

// Get DEX list for a chain
export function getDexesForChain(chain: ChainName): string[] {
  return chainConfigs[chain]?.dexes || [];
}

// Get base tokens for a chain
export function getBaseTokensForChain(chain: ChainName): BaseToken[] {
  return chainConfigs[chain]?.baseTokens || [];
}

// Get all RPC URLs for a chain (for fallback)
export function getRpcUrlsForChain(chain: ChainName): string[] {
  return chainConfigs[chain]?.rpcUrls || [chainConfigs[chain]?.rpcUrl].filter(Boolean) as string[];
}

// Get block explorer URL for a chain
export function getBlockExplorerForChain(chain: ChainName): string | undefined {
  return chainConfigs[chain]?.blockExplorer;
}

// Get CoinGecko ID for a chain (for price fetching)
export function getCoingeckoIdForChain(chain: ChainName): string | undefined {
  return chainConfigs[chain]?.coingeckoId;
}

// Popular tokens for each chain (for token search)
export const popularTokens: Record<ChainName, BaseToken[]> = {
  ethereum: [
    { symbol: 'ETH', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', name: 'Ethereum' },
    { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', name: 'USD Coin' },
    { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', name: 'Tether' },
    { symbol: 'WETH', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', name: 'Wrapped Ethereum' },
    { symbol: 'WBTC', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', name: 'Wrapped Bitcoin' },
    { symbol: 'SHIB', address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE', name: 'Shiba Inu' },
    { symbol: 'LINK', address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', name: 'Chainlink' },
    { symbol: 'UNI', address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', name: 'Uniswap' },
    { symbol: 'PEPE', address: '0x6982508145454Ce325dDbE47a25d4ec3d2311933', name: 'Pepe' },
    { symbol: 'DAI', address: '0x6B175474E89094C44Da98b954EeScdeCB6b8B1C', name: 'Dai' },
  ],
  pulsechain: [
    { symbol: 'WPLS', address: '0xA1077a294dDE1B09bB078844df40758a5D0f9a27', name: 'Wrapped Pulse' },
    { symbol: 'PLSX', address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE', name: 'PulseX' },
    { symbol: 'INC', address: '0x2fa878Ab3F87CC1C97f7D349C2bBd40D9d8D2f0D', name: 'Incinerate' },
    { symbol: 'USDT', address: '0x0Cb6F5C3491d18E72f194E43b9f6B3495e0EA509', name: 'Tether' },
    { symbol: 'USDC', address: '0x15D38573d2feeb82e7ad5187aB8c1a8CCf1e0f13', name: 'USD Coin' },
    { symbol: 'DAI', address: '0xefD7664Cb6fF6269bC4577c7B0681285a10D3016', name: 'Dai' },
  ],
  base: [
    { symbol: 'WETH', address: '0x42000000000000000000000000000000000000006', name: 'Wrapped Ether' },
    { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', name: 'USD Coin' },
    { symbol: 'USDbC', address: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA', name: 'USD Base Coin' },
    { symbol: 'DAI', address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', name: 'Dai' },
    { symbol: 'DEGEN', address: '0x4ed4E862860beD51a9570b96d89aF5E1B0EfEed6', name: 'Degen' },
  ],
  arbitrum: [
    { symbol: 'WETH', address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', name: 'Wrapped Ether' },
    { symbol: 'USDC', address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', name: 'USD Coin' },
    { symbol: 'USDT', address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', name: 'Tether' },
    { symbol: 'ARB', address: '0x912CE59144191C1204E64559FE8253a0e49E6548', name: 'Arbitrum' },
    { symbol: 'DAI', address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', name: 'Dai' },
    { symbol: 'GMX', address: '0xfc5A1A6EB076a2C7aD06eD22C90d7E7fE34327B2', name: 'GMX' },
  ],
  optimism: [
    { symbol: 'WETH', address: '0x42000000000000000000000000000000000000006', name: 'Wrapped Ether' },
    { symbol: 'USDC', address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', name: 'USD Coin' },
    { symbol: 'USDT', address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', name: 'Tether' },
    { symbol: 'OP', address: '0x4200000000000000000000000000000000000042', name: 'Optimism' },
    { symbol: 'DAI', address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', name: 'Dai' },
    { symbol: 'VELA', address: '0x08826eC41d4024215FBCc28024E6335258BbD94c', name: 'Vela' },
  ],
  polygon: [
    { symbol: 'WMATIC', address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', name: 'Wrapped Matic' },
    { symbol: 'USDC', address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', name: 'USD Coin' },
    { symbol: 'USDT', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', name: 'Tether' },
    { symbol: 'WETH', address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', name: 'Wrapped Ether' },
    { symbol: 'DAI', address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', name: 'Dai' },
  ],
  bsc: [
    { symbol: 'WBNB', address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', name: 'Wrapped BNB' },
    { symbol: 'USDC', address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', name: 'USD Coin' },
    { symbol: 'USDT', address: '0x55d398326f99059fF775485246999027B3197955', name: 'Tether' },
    { symbol: 'BUSD', address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', name: 'BUSD' },
    { symbol: 'CAKE', address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82', name: 'PancakeSwap' },
  ],
  avalanche: [
    { symbol: 'WAVAX', address: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', name: 'Wrapped AVAX' },
    { symbol: 'USDC', address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', name: 'USD Coin' },
    { symbol: 'USDT', address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', name: 'Tether' },
    { symbol: 'DAI', address: '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70', name: 'Dai' },
    { symbol: 'JOE', address: '0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd', name: 'Trader Joe' },
  ],
  fantom: [
    { symbol: 'WFTM', address: '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83', name: 'Wrapped FTM' },
    { symbol: 'USDC', address: '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75', name: 'USD Coin' },
    { symbol: 'USDT', address: '0x049d68029688eAbF473097a2fC38ef61633A3C7A', name: 'Tether' },
    { symbol: 'DAI', address: '0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E', name: 'Dai' },
  ],
  linea: [
    { symbol: 'WETH', address: '0xe5D7C2a44FfDDf6b295A15c148167DaAaf5Cf34f', name: 'Wrapped Ether' },
    { symbol: 'USDC', address: '0x176211869cA2b568f2A7D4EE941E073a821EE1ff', name: 'USD Coin' },
    { symbol: 'USDT', address: '0xA219439258ca91429aA8136260925401FE14C757', name: 'Tether' },
  ],
  zksync: [
    { symbol: 'WETH', address: '0x5AEa5775959fBC2557Cc8789bC1bf90A239D9a91', name: 'Wrapped Ether' },
    { symbol: 'USDC', address: '0x3355df6D4c9C3035724F0d0a0b8cB64dC2D6a07F', name: 'USD Coin' },
    { symbol: 'USDT', address: '0x493257fD40ED8F4C1bAEF7a2FfB79C75527840e9', name: 'Tether' },
  ],
  scroll: [
    { symbol: 'WETH', address: '0x5300000000000000000000000000000000000004', name: 'Wrapped Ether' },
    { symbol: 'USDC', address: '0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4', name: 'USD Coin' },
    { symbol: 'USDT', address: '0xf55BEC9cafDbE8730f096Aa55dad6D22d440aD13', name: 'Tether' },
  ],
  mantle: [
    { symbol: 'WMNT', address: '0x78c1b0C495d76121dfF697e59e4379F494096D15', name: 'Wrapped MNT' },
    { symbol: 'USDC', address: '0x09Bc4E0DDB65304336005271B72F4e86B83082Fb', name: 'USD Coin' },
    { symbol: 'USDT', address: '0x201EBa5CC46D216Ce6DC03F6a31f20bD32d41A92', name: 'Tether' },
  ],
  celo: [
    { symbol: 'CELO', address: '0x471EcE3750Da237f93B8E339c536989b8978a438', name: 'Celo' },
    { symbol: 'cUSD', address: '0x765DE816845861e75A25fCA122bb6898B8B1282a', name: 'Celo Dollar' },
    { symbol: 'cEUR', address: '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73', name: 'Celo Euro' },
  ],
  gnosis: [
    { symbol: 'WXDAI', address: '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463A97d', name: 'Wrapped xDAI' },
    { symbol: 'USDC', address: '0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83', name: 'USD Coin' },
    { symbol: 'USDT', address: '0x4ECaBa5870353805a9F068101A40E0f32ed605C6', name: 'Tether' },
  ],
  moonbeam: [
    { symbol: 'WGLMR', address: '0xAcc15dC74880C9944775448304B263D191c6077F', name: 'Wrapped GLMR' },
    { symbol: 'USDC', address: '0x818ec0A7Fe18Ff94269904fCED6AE3DaE6d6dC0b', name: 'USD Coin' },
    { symbol: 'USDT', address: '0xefAeee6BE9dB1A0C72fE38B1B2a5f09A749244Cf', name: 'Tether' },
  ],
  moonriver: [
    { symbol: 'WMOVR', address: '0x98878B06940aE243284CA214f92Bb71a2b032B1A', name: 'Wrapped MOVR' },
    { symbol: 'USDC', address: '0xE3F5fE0b74488d92C9Aa9Fb6C82b16A70d03937C', name: 'USD Coin' },
  ],
  solana: [
    { symbol: 'SOL', address: 'So11111111111111111111111111111111111111112', name: 'Solana' },
    { symbol: 'USDC', address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', name: 'USD Coin' },
    { symbol: 'USDT', address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', name: 'Tether' },
    { symbol: 'RAY', address: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', name: 'Raydium' },
    { symbol: 'BONK', address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', name: 'Bonk' },
    { symbol: 'JUP', address: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', name: 'Jupiter' },
    { symbol: 'WIF', address: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', name: 'dogwifhat' },
  ],
};

// Get popular tokens for a chain
export function getPopularTokensForChain(chain: ChainName): BaseToken[] {
  return popularTokens[chain] || [];
}
