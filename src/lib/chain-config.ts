// Chain configurations for the sniper bot
// Each chain has DEXes and base tokens available for trading

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
}

export interface ChainConfig {
  id: number | string;
  name: string;
  rpcUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  dexes: string[];
  baseTokens: BaseToken[];
  isNonEvm?: boolean;
}

export const chainConfigs: Record<ChainName, ChainConfig> = {
  ethereum: {
    id: 1,
    name: 'Ethereum',
    rpcUrl: 'https://eth.llamarpc.com',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    dexes: ['uniswap', 'sushiswap', '1inch', 'kyberswap', 'balancer', 'curve', 'shibaswap', 'paraswap'],
    baseTokens: [
      { symbol: 'WETH', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' },
      { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
      { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' },
      { symbol: 'DAI', address: '0x6B175474E89094C44Da98b954EeScdeCB6b8B1C' },
    ],
  },
  pulsechain: {
    id: 369,
    name: 'PulseChain',
    rpcUrl: 'https://rpc.pulsechain.com',
    nativeCurrency: { name: 'Pulse', symbol: 'PLS', decimals: 18 },
    dexes: ['pulsex', 'piteas', 'pulsex-v2', '9inch'],
    baseTokens: [
      { symbol: 'WPLS', address: '0xA1077a294dDE1B09bB078844df40758a5D0f9a27' },
      { symbol: 'PLSX', address: '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce' },
      { symbol: 'INC', address: '0x2fa878Ab3F87CC1C97f7D349C2bBd40D9d8D2f0D' },
      { symbol: 'USDT', address: '0x0Cb6F5C3491d18E72f194E43b9f6B3495e0EA509' },
      { symbol: 'USDC', address: '0x15D38573d2feeb82e7ad5187aB8c1a8CCf1e0f13' },
      { symbol: 'DAI', address: '0xefD7664Cb6fF6269bC4577c7B0681285a10D3016' },
    ],
  },
  base: {
    id: 8453,
    name: 'Base',
    rpcUrl: 'https://base.publicnode.com',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    dexes: ['uniswap', 'baseswap', 'aerodrome', 'sushiswap', 'pancakeswap', 'baseswap-v2'],
    baseTokens: [
      { symbol: 'WETH', address: '0x42000000000000000000000000000000000000006' },
      { symbol: 'USDbC', address: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA' },
      { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' },
      { symbol: 'DAI', address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb' },
    ],
  },
  arbitrum: {
    id: 42161,
    name: 'Arbitrum',
    rpcUrl: 'https://arbitrum.publicnode.com',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    dexes: ['uniswap', 'sushiswap', 'camelot', 'zyberswap', 'ramses', '1inch'],
    baseTokens: [
      { symbol: 'WETH', address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1' },
      { symbol: 'USDC', address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' },
      { symbol: 'USDT', address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9' },
      { symbol: 'ARB', address: '0x912CE59144191C1204E64559FE8253a0e49E6548' },
      { symbol: 'DAI', address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1' },
    ],
  },
  optimism: {
    id: 10,
    name: 'Optimism',
    rpcUrl: 'https://optimism.publicnode.com',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    dexes: ['uniswap', 'sushiswap', 'kyberswap', 'velodrome', 'synthetix', '1inch'],
    baseTokens: [
      { symbol: 'WETH', address: '0x42000000000000000000000000000000000000006' },
      { symbol: 'USDC', address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85' },
      { symbol: 'USDT', address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58' },
      { symbol: 'OP', address: '0x4200000000000000000000000000000000000042' },
      { symbol: 'DAI', address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1' },
    ],
  },
  polygon: {
    id: 137,
    name: 'Polygon',
    rpcUrl: 'https://polygon.publicnode.com',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    dexes: ['uniswap', 'quickswap', 'sushiswap', 'kyberswap', '1inch', 'balancer', 'curve', 'dystopia'],
    baseTokens: [
      { symbol: 'WMATIC', address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270' },
      { symbol: 'USDC', address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359' },
      { symbol: 'USDT', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F' },
      { symbol: 'WETH', address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619' },
      { symbol: 'DAI', address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063' },
    ],
  },
  bsc: {
    id: 56,
    name: 'BSC',
    rpcUrl: 'https://bsc.publicnode.com',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    dexes: ['pancakeswap', 'sushiswap', 'biswap', 'apeswap', 'mdex', '1inch', 'babyswap', 'thena'],
    baseTokens: [
      { symbol: 'WBNB', address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' },
      { symbol: 'USDC', address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d' },
      { symbol: 'USDT', address: '0x55d398326f99059fF775485246999027B3197955' },
      { symbol: 'BUSD', address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56' },
      { symbol: 'CAKE', address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82' },
    ],
  },
  avalanche: {
    id: 43114,
    name: 'Avalanche',
    rpcUrl: 'https://avalanche.publicnode.com',
    nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 },
    dexes: ['traderjoe', 'pangolin', 'sushiswap', 'lydia', 'yeti', '1inch'],
    baseTokens: [
      { symbol: 'WAVAX', address: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7' },
      { symbol: 'USDC', address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E' },
      { symbol: 'USDT', address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7' },
      { symbol: 'DAI', address: '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70' },
    ],
  },
  fantom: {
    id: 250,
    name: 'Fantom',
    rpcUrl: 'https://fantom.publicnode.com',
    nativeCurrency: { name: 'FTM', symbol: 'FTM', decimals: 18 },
    dexes: ['spookyswap', 'sushiswap', 'spiritswap', 'beethovenx', '1inch', 'curve'],
    baseTokens: [
      { symbol: 'WFTM', address: '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83' },
      { symbol: 'USDC', address: '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75' },
      { symbol: 'USDT', address: '0x049d68029688eAbF473097a2fC38ef61633A3C7A' },
      { symbol: 'DAI', address: '0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E' },
    ],
  },
  linea: {
    id: 59144,
    name: 'Linea',
    rpcUrl: 'https://rpc.linea.build',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    dexes: ['lynex', 'sushiswap', 'kyberswap', '1inch'],
    baseTokens: [
      { symbol: 'WETH', address: '0xe5D7C2a44FfDDf6b295A15c148167DaAaf5Cf34f' },
      { symbol: 'USDC', address: '0x176211869cA2b568f2A7D4EE941E073a821EE1ff' },
      { symbol: 'USDT', address: '0xA219439258ca91429aA8136260925401FE14C757' },
    ],
  },
  zksync: {
    id: 324,
    name: 'zkSync',
    rpcUrl: 'https://zksync.mainnet.era.zksync.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    dexes: ['syncswap', 'mute', 'velocore', 'ezkalibur', 'spacefi'],
    baseTokens: [
      { symbol: 'WETH', address: '0x5AEa5775959fBC2557Cc8789bC1bf90A239D9a91' },
      { symbol: 'USDC', address: '0x3355df6D4c9C3035724F0d0a0b8cB64dC2D6a07F' },
      { symbol: 'USDT', address: '0x493257fD40ED8F4C1bAEF7a2FfB79C75527840e9' },
    ],
  },
  scroll: {
    id: 534352,
    name: 'Scroll',
    rpcUrl: 'https://scroll.publicnode.com',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    dexes: ['uniswap', 'skydrome', 'zebra', 'xyswap'],
    baseTokens: [
      { symbol: 'WETH', address: '0x5300000000000000000000000000000000000004' },
      { symbol: 'USDC', address: '0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4' },
      { symbol: 'USDT', address: '0xf55BEC9cafDbE8730f096Aa55dad6D22d440aD13' },
    ],
  },
  mantle: {
    id: 5000,
    name: 'Mantle',
    rpcUrl: 'https://rpc.mantle.xyz',
    nativeCurrency: { name: 'MNT', symbol: 'MNT', decimals: 18 },
    dexes: ['agni', 'izumi', 'cleopatra', 'fusionX'],
    baseTokens: [
      { symbol: 'WMNT', address: '0x78c1b0C495d76121dfF697e59e4379F494096D15' },
      { symbol: 'USDC', address: '0x09Bc4E0DDB65304336005271B72F4e86B83082Fb' },
      { symbol: 'USDT', address: '0x201EBa5CC46D216Ce6DC03F6a31f20bD32d41A92' },
    ],
  },
  celo: {
    id: 42220,
    name: 'Celo',
    rpcUrl: 'https://forno.celo.org',
    nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 },
    dexes: ['uniswap', 'ubeswap', 'mobula', 'sushiswap'],
    baseTokens: [
      { symbol: 'CELO', address: '0x471EcE3750Da237f93B8E339c536989b8978a438' },
      { symbol: 'cUSD', address: '0x765DE816845861e75A25fCA122bb6898B8B1282a' },
      { symbol: 'cEUR', address: '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73' },
    ],
  },
  gnosis: {
    id: 100,
    name: 'Gnosis',
    rpcUrl: 'https://rpc.ankr.com/gnosis',
    nativeCurrency: { name: 'xDAI', symbol: 'xDAI', decimals: 18 },
    dexes: ['honeyswap', 'sushiswap', 'bao', 'levinswap', 'symmetric'],
    baseTokens: [
      { symbol: 'WXDAI', address: '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463A97d' },
      { symbol: 'USDC', address: '0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83' },
      { symbol: 'USDT', address: '0x4ECaBa5870353805a9F068101A40E0f32ed605C6' },
    ],
  },
  moonbeam: {
    id: 1284,
    name: 'Moonbeam',
    rpcUrl: 'https://rpc.ankr.com/moonbeam',
    nativeCurrency: { name: 'GLMR', symbol: 'GLMR', decimals: 18 },
    dexes: ['stellaswap', 'sushiswap', '1inch', 'beamswap'],
    baseTokens: [
      { symbol: 'WGLMR', address: '0xAcc15dC74880C9944775448304B263D191c6077F' },
      { symbol: 'USDC', address: '0x818ec0A7Fe18Ff94269904fCED6AE3DaE6d6dC0b' },
      { symbol: 'USDT', address: '0xefAeee6BE9dB1A0C72fE38B1B2a5f09A749244Cf' },
    ],
  },
  moonriver: {
    id: 1285,
    name: 'Moonriver',
    rpcUrl: 'https://rpc.moonriver.moonbeam.network',
    nativeCurrency: { name: 'MOVR', symbol: 'MOVR', decimals: 18 },
    dexes: ['solarswap', 'sushiswap', '1inch'],
    baseTokens: [
      { symbol: 'WMOVR', address: '0x98878B06940aE243284CA214f92Bb71a2b032B1A' },
      { symbol: 'USDC', address: '0xE3F5fE0b74488d92C9Aa9Fb6C82b16A70d03937C' },
    ],
  },
  solana: {
    id: 'solana-mainnet',
    name: 'Solana',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    nativeCurrency: { name: 'Solana', symbol: 'SOL', decimals: 9 },
    dexes: ['raydium', 'jupiter', 'orca', 'meteora', 'fluxbeam'],
    baseTokens: [
      { symbol: 'SOL', address: 'So11111111111111111111111111111111111111112' },
      { symbol: 'USDC', address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' },
      { symbol: 'USDT', address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB' },
      { symbol: 'RAY', address: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R' },
      { symbol: 'BONK', address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263' },
      { symbol: 'JUP', address: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN' },
    ],
    isNonEvm: true,
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
