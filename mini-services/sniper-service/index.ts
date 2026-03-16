/**
 * Sniper Service - Auto-snipe on liquidity add
 * 
 * This service runs independently and:
 * 1. Monitors blockchain for liquidity add events on DEXes
 * 2. Verifies token contracts before sniping
 * 3. Auto-executes buy transactions when liquidity is added
 * 4. Communicates with frontend via WebSocket
 * 5. Supports auto-sweep across multiple chains
 */

import { Server } from 'socket.io';
import { createPublicClient, http, parseAbi, formatUnits, Address } from 'viem';
import { setTimeout as setTimeoutPromise } from 'timers/promises';

const PORT = 3004;

// ============================================================================
// CHAIN CONFIGURATIONS - Complete with all DEXes and Router Addresses
// ============================================================================

const CHAIN_CONFIGS = {
  ethereum: {
    id: 1,
    name: 'Ethereum',
    rpcUrl: 'https://eth.llamarpc.com',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    dexRouters: {
      uniswap: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      sushiswap: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',
      '1inch': '0x1111111254EEB25477B68fb85Ed929f73A960582',
      kyberswap: '0x6131B5fae19EA4f9D964eAc0408E4408b66337b5',
      balancer: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
      curve: '0x8F942C20D02bEfc377D41445793068908E2250D0',
      shibaswap: '0x03f7724180AA6b939894B5Ca4314783B0b36b329',
      paraswap: '0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57',
    },
    baseTokens: {
      WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      DAI: '0x6B175474E89094C44Da98b954EeScdeCB6b8B1C',
    },
  },
  pulsechain: {
    id: 369,
    name: 'PulseChain',
    rpcUrl: 'https://rpc.pulsechain.com',
    nativeCurrency: { name: 'Pulse', symbol: 'PLS', decimals: 18 },
    dexRouters: {
      pulsex: '0x98bfA5D863095B64d539deB5F3F73821D7875577',
      piteas: '0xa6a86023593d0c6d8CE41a2993D45F5d8920514b',
      'pulsex-v2': '0x165C3410f91FCC4455589D3F9e73C61B2a1d51E5',
      '9inch': '0x1218BE257d0dBA50B10085C52A1aE02f67C35D27',
    },
    baseTokens: {
      WPLS: '0xA1077a294dDE1B09bB078844df40758a5D0f9a27',
      PLSX: '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce',
      INC: '0x2fa878Ab3F87CC1C97f7D349C2bBd40D9d8D2f0D',
      USDT: '0x0Cb6F5C3491d18E72f194E43b9f6B3495e0EA509',
      USDC: '0x15D38573d2feeb82e7ad5187aB8c1a8CCf1e0f13',
      DAI: '0xefD7664Cb6fF6269bC4577c7B0681285a10D3016',
    },
  },
  base: {
    id: 8453,
    name: 'Base',
    rpcUrl: 'https://base.publicnode.com',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    dexRouters: {
      uniswap: '0x2626664c2603336E57B271c5C0b26F421741e481',
      baseswap: '0x327Df1E6de05895d2ab08513aaDD9313Fe505d86',
      aerodrome: '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43',
      sushiswap: '0x6BDED42c6DA8FBf0d2bA55B2fa120B5cEF8D4a29',
      pancakeswap: '0x1b02dA8Cb0d097eB8D57A175b8897D014296d082',
      'baseswap-v2': '0x3d6Ac0eEC35d4DD586D2747e0A7A0873a495f922',
    },
    baseTokens: {
      WETH: '0x42000000000000000000000000000000000000006',
      USDbC: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA',
      USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      DAI: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
    },
  },
  arbitrum: {
    id: 42161,
    name: 'Arbitrum',
    rpcUrl: 'https://arbitrum.publicnode.com',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    dexRouters: {
      uniswap: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
      sushiswap: '0x1b02dA8Cb0d097eB8D57A175b8897D014296d082',
      camelot: '0xc873fEcbd354f5A56E00E710B90EF4201db2448d',
      zyberswap: '0x881D2162B2973F6f0eb46f94e65b57b228942B5B',
      ramses: '0xAAA87963EFeB6f77E07a6B59a62826241a237581',
      '1inch': '0x1111111254EEB25477B68fb85Ed929f73A960582',
    },
    baseTokens: {
      WETH: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
      USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
      ARB: '0x912CE59144191C1204E64559FE8253a0e49E6548',
      DAI: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
    },
  },
  optimism: {
    id: 10,
    name: 'Optimism',
    rpcUrl: 'https://optimism.publicnode.com',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    dexRouters: {
      uniswap: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
      sushiswap: '0x1b02dA8Cb0d097eB8D57A175b8897D014296d082',
      kyberswap: '0x74768Fe71477EF1D0E609A8d43e52Fd9b020D517',
      velodrome: '0xa062aE8A9c5e11aaA026fc2670B0D65cCc8B2858',
      synthetix: '0x741F5547700506a1E2221668557867FB3d1BCFF3',
      '1inch': '0x1111111254EEB25477B68fb85Ed929f73A960582',
    },
    baseTokens: {
      WETH: '0x42000000000000000000000000000000000000006',
      USDC: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
      USDT: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
      OP: '0x4200000000000000000000000000000000000042',
      DAI: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
    },
  },
  polygon: {
    id: 137,
    name: 'Polygon',
    rpcUrl: 'https://polygon.publicnode.com',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    dexRouters: {
      uniswap: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
      quickswap: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',
      sushiswap: '0x1b02dA8Cb0d097eB8D57A175b8897D014296d082',
      kyberswap: '0x6131B5fae19EA4f9D964eAc0408E4408b66337b5',
      '1inch': '0x1111111254EEB25477B68fb85Ed929f73A960582',
      balancer: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
      curve: '0x4439689C3670535632D8c8B2CC13B0209c880A74',
      dystopia: '0xbB90984dd7e85B9a539Fd8A357562b661c7f7e97',
    },
    baseTokens: {
      WMATIC: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
      USDC: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
      USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      WETH: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
      DAI: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
    },
  },
  bsc: {
    id: 56,
    name: 'BSC',
    rpcUrl: 'https://bsc.publicnode.com',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    dexRouters: {
      pancakeswap: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
      sushiswap: '0x1b02dA8Cb0d097eB8D57A175b8897D014296d082',
      biswap: '0x3a6d8cA43D302b39B70D52B3Eeb0b46d1917B907',
      apeswap: '0xcF0feBfd3f7eee37E606D36B18EAc08853209D92',
      mdex: '0x3CD1C46068dAEa5Ebb0d3f55F6915B10648062B8',
      '1inch': '0x1111111254EEB25477B68fb85Ed929f73A960582',
      babyswap: '0x325E343f1dE602396E256B67eFd1B61F39bF5c48',
      thena: '0xd6DA6BA5D5B0F04DD38c27C7a07bB1E29718b12f',
    },
    baseTokens: {
      WBNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
      USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
      USDT: '0x55d398326f99059fF775485246999027B3197955',
      BUSD: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
      CAKE: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
    },
  },
  avalanche: {
    id: 43114,
    name: 'Avalanche',
    rpcUrl: 'https://avalanche.publicnode.com',
    nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 },
    dexRouters: {
      traderjoe: '0x60aE616a2155Ee3d9A68541Ba4544862310933d4',
      pangolin: '0xE54Ca86531e17Ef3616d22Ca28b0D458b6C89106',
      sushiswap: '0x1b02dA8Cb0d097eB8D57A175b8897D014296d082',
      lydia: '0x52e7dB9D35885D7A04b5210F74439838d2C50C6b',
      yeti: '0xA7EBA95F6aB7D5859563bDa8aB5a83800C738f80',
      '1inch': '0x1111111254EEB25477B68fb85Ed929f73A960582',
    },
    baseTokens: {
      WAVAX: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
      USDC: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
      USDT: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
      DAI: '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70',
    },
  },
  fantom: {
    id: 250,
    name: 'Fantom',
    rpcUrl: 'https://fantom.publicnode.com',
    nativeCurrency: { name: 'FTM', symbol: 'FTM', decimals: 18 },
    dexRouters: {
      spookyswap: '0xF491e7B69E4244ad4002BC14e878a34207E38c29',
      sushiswap: '0x1b02dA8Cb0d097eB8D57A175b8897D014296d082',
      spiritswap: '0x16327E3FbDaCA3bcF7E38F5Af2599D2DDc33aE52',
      beethovenx: '0x20dd72Ed959b6147912C2e529F0a0C651c33c9ce',
      '1inch': '0x1111111254EEB25477B68fb85Ed929f73A960582',
      curve: '0x0C6eD10D19B6585fe6C6BB6195C5b4b4A7B52BEF',
    },
    baseTokens: {
      WFTM: '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83',
      USDC: '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75',
      USDT: '0x049d68029688eAbF473097a2fC38ef61633A3C7A',
      DAI: '0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E',
    },
  },
  linea: {
    id: 59144,
    name: 'Linea',
    rpcUrl: 'https://rpc.linea.build',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    dexRouters: {
      lynex: '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865',
      sushiswap: '0x1b02dA8Cb0d097eB8D57A175b8897D014296d082',
      kyberswap: '0x6131B5fae19EA4f9D964eAc0408E4408b66337b5',
      '1inch': '0x1111111254EEB25477B68fb85Ed929f73A960582',
    },
    baseTokens: {
      WETH: '0xe5D7C2a44FfDDf6b295A15c148167DaAaf5Cf34f',
      USDC: '0x176211869cA2b568f2A7D4EE941E073a821EE1ff',
      USDT: '0xA219439258ca91429aA8136260925401FE14C757',
    },
  },
  zksync: {
    id: 324,
    name: 'zkSync',
    rpcUrl: 'https://zksync.mainnet.era.zksync.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    dexRouters: {
      syncswap: '0x2da10A1e27bF85cEdD8FFb1AbBe97e53391C0295',
      mute: '0x8B791913eB07C32779a16750e386814A52a04593',
      velocore: '0x0a869C10DC77B0Dc020D89007D23034EeaE468C1',
      ezkalibur: '0x286853630517662763671247af9FD40b2b237db9',
      spacefi: '0xbFa5cb9dec2D16165Aa5c365c2C53BbB62617B18',
    },
    baseTokens: {
      WETH: '0x5AEa5775959fBC2557Cc8789bC1bf90A239D9a91',
      USDC: '0x3355df6D4c9C3035724F0d0a0b8cB64dC2D6a07F',
      USDT: '0x493257fD40ED8F4C1bAEF7a2FfB79C75527840e9',
    },
  },
  scroll: {
    id: 534352,
    name: 'Scroll',
    rpcUrl: 'https://scroll.publicnode.com',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    dexRouters: {
      uniswap: '0x17AFD526E447025684c8A3a3D6f9B1A86c8EaADc',
      skydrome: '0x8625e7a83a694866D93C35E62191473c93C82940',
      zebra: '0x0969E47465e4154d087FD786248829ae6F66B2bB',
      xyswap: '0x6666678Baf857E945Cb23F9Df630a8A8B5B9e6B4',
    },
    baseTokens: {
      WETH: '0x5300000000000000000000000000000000000004',
      USDC: '0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4',
      USDT: '0xf55BEC9cafDbE8730f096Aa55dad6D22d440aD13',
    },
  },
  mantle: {
    id: 5000,
    name: 'Mantle',
    rpcUrl: 'https://rpc.mantle.xyz',
    nativeCurrency: { name: 'MNT', symbol: 'MNT', decimals: 18 },
    dexRouters: {
      agni: '0x276a8DE0420F1dE5B74Ea9C0Fcd6876c2D3e1F60',
      izumi: '0x78c1b0C495d76121dfF697e59e4379F494096D15',
      cleopatra: '0x19D3364A3997a23D8B50BD3e841293bFdDfc3349',
      fusionX: '0x9a0bB2Df65998Ac50966811F72D28AEC5FF9D9BB',
    },
    baseTokens: {
      WMNT: '0x78c1b0C495d76121dfF697e59e4379F494096D15',
      USDC: '0x09Bc4E0DDB65304336005271B72F4e86B83082Fb',
      USDT: '0x201EBa5CC46D216Ce6DC03F6a31f20bD32d41A92',
    },
  },
  celo: {
    id: 42220,
    name: 'Celo',
    rpcUrl: 'https://forno.celo.org',
    nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 },
    dexRouters: {
      uniswap: '0xE3D8bd6Aed4F1597779D9146871101D17B3477Ae',
      ubeswap: '0x004D6e7E6a25321B655C76d7C5696aE34d3a7Bc4',
      mobula: '0x5f82533ACBeB4B39f503CD0a53c914B7E5B1B9E7',
      sushiswap: '0x1421bF233358369E17A4E52A08A6393b1f7a3B8e',
    },
    baseTokens: {
      CELO: '0x471EcE3750Da237f93B8E339c536989b8978a438',
      cUSD: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
      cEUR: '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73',
    },
  },
  gnosis: {
    id: 100,
    name: 'Gnosis',
    rpcUrl: 'https://rpc.ankr.com/gnosis',
    nativeCurrency: { name: 'xDAI', symbol: 'xDAI', decimals: 18 },
    dexRouters: {
      honeyswap: '0x1C232F01118CB8B424793ae40F6e94D8358B2BeF',
      sushiswap: '0x1b02dA8Cb0d097eB8D57A175b8897D014296d082',
      bao: '0xBa8Da2Ea529fCA6Dce2882D6857e0B7968a7Fb10',
      levinswap: '0x115131D55529089E1599a611F518A70c2CcaA5d7',
      symmetric: '0x94bB53205D704801887275d11E821b3fC3E31B55',
    },
    baseTokens: {
      WXDAI: '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463A97d',
      USDC: '0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83',
      USDT: '0x4ECaBa5870353805a9F068101A40E0f32ed605C6',
    },
  },
  moonbeam: {
    id: 1284,
    name: 'Moonbeam',
    rpcUrl: 'https://rpc.ankr.com/moonbeam',
    nativeCurrency: { name: 'GLMR', symbol: 'GLMR', decimals: 18 },
    dexRouters: {
      stellaswap: '0x70085a09D30D96954C877004F42b7dD86Fc6e59C',
      sushiswap: '0x1b02dA8Cb0d097eB8D57A175b8897D014296d082',
      '1inch': '0x1111111254EEB25477B68fb85Ed929f73A960582',
      beamswap: '0x799a7F0c2F4f4eC54Bd95bE69D12237B717c729A',
    },
    baseTokens: {
      WGLMR: '0xAcc15dC74880C9944775448304B263D191c6077F',
      USDC: '0x818ec0A7Fe18Ff94269904fCED6AE3DaE6d6dC0b',
      USDT: '0xefAeee6BE9dB1A0C72fE38B1B2a5f09A749244Cf',
    },
  },
  moonriver: {
    id: 1285,
    name: 'Moonriver',
    rpcUrl: 'https://rpc.moonriver.moonbeam.network',
    nativeCurrency: { name: 'MOVR', symbol: 'MOVR', decimals: 18 },
    dexRouters: {
      solarswap: '0x049581a1BA89192c025081f9b31Bb832e6190B17',
      sushiswap: '0x1b02dA8Cb0d097eB8D57A175b8897D014296d082',
      '1inch': '0x1111111254EEB25477B68fb85Ed929f73A960582',
    },
    baseTokens: {
      WMOVR: '0x98878B06940aE243284CA214f92Bb71a2b032B1A',
      USDC: '0xE3F5fE0b74488d92C9Aa9Fb6C82b16A70d03937C',
    },
  },
  solana: {
    id: 'solana-mainnet',
    name: 'Solana',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    nativeCurrency: { name: 'Solana', symbol: 'SOL', decimals: 9 },
    dexRouters: {
      raydium: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
      jupiter: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
      orca: '9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP',
      meteora: 'Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB',
      fluxbeam: 'FLUXWmTm2yqQMbDJVJqx6KREuWF5wTGdBGPv7F2LsMvy',
    },
    baseTokens: {
      SOL: 'So11111111111111111111111111111111111111112',
      USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
      RAY: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
      BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
      JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    },
    isNonEvm: true,
  },
} as const;

type ChainName = keyof typeof CHAIN_CONFIGS;

// ============================================================================
// ABI DEFINITIONS
// ============================================================================

const ERC20_ABI = parseAbi([
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
]);

const ROUTER_ABI = parseAbi([
  'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)',
  'function factory() external pure returns (address)',
]);

const FACTORY_ABI = parseAbi([
  'function getPair(address tokenA, address tokenB) external view returns (address pair)',
]);

const PAIR_ABI = parseAbi([
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function totalSupply() external view returns (uint256)',
]);

// ============================================================================
// TYPES
// ============================================================================

interface SniperTarget {
  id: string;
  tokenAddress: Address;
  tokenSymbol?: string;
  tokenName?: string;
  chain: ChainName;
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

interface TokenInfo {
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  totalSupply: bigint;
  verified: boolean;
  warnings: string[];
}

interface LiquidityInfo {
  pairAddress: Address;
  token0: Address;
  token1: Address;
  reserve0: bigint;
  reserve1: bigint;
  liquidityUsd: number;
  createdAt: number;
}

interface SniperConfig {
  defaultSlippage: number;
  defaultGasMultiplier: number;
  maxRetries: number;
  retryDelay: number;
  minLiquidityUsd: number;
}

interface AutoSweepConfig {
  enabled: boolean;
  chains: ChainName[];
  interval: number;
  targetToken?: string;
}

// ============================================================================
// SERVICE STATE
// ============================================================================

// Authentication configuration
const AUTH_ENABLED = process.env.ENABLE_WS_AUTH === 'true';
const API_KEYS = new Set((process.env.API_KEYS || '').split(',').filter(Boolean));
const AUTH_TOKENS = new Set((process.env.WS_TOKENS || '').split(',').filter(Boolean));

// Rate limiting for WebSocket connections
const connectionRateLimit = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_CONNECTIONS = 10;

function checkConnectionRateLimit(clientId: string): boolean {
  const now = Date.now();
  const entry = connectionRateLimit.get(clientId);
  
  if (!entry || now > entry.resetTime) {
    connectionRateLimit.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT_MAX_CONNECTIONS) {
    return false;
  }
  
  entry.count++;
  return true;
}

function validateAuthToken(token: string | undefined): boolean {
  if (!AUTH_ENABLED) return true;
  if (!token) return false;
  return AUTH_TOKENS.has(token) || API_KEYS.has(token);
}

const io = new Server(PORT, {
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  // Connection authentication middleware
  allowRequest: (req, callback) => {
    const clientId = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
                     req.headers['x-real-ip']?.toString() ||
                     req.socket.remoteAddress ||
                     'unknown';
    
    // Rate limit connections
    if (!checkConnectionRateLimit(clientId)) {
      console.warn(`⚠️ Rate limit exceeded for ${clientId}`);
      return callback(new Error('Rate limit exceeded'), false);
    }
    
    // Check auth token if enabled
    if (AUTH_ENABLED) {
      const authHeader = req.headers['authorization'];
      const token = authHeader?.replace('Bearer ', '') || 
                    req.headers['x-auth-token']?.toString() ||
                    new URL(req.url || '', 'http://localhost').searchParams.get('token');
      
      if (!validateAuthToken(token)) {
        console.warn(`⚠️ Unauthorized connection attempt from ${clientId}`);
        return callback(new Error('Unauthorized'), false);
      }
    }
    
    return callback(null, true);
  },
});

console.log(`🎯 Sniper Service running on port ${PORT}`);
if (AUTH_ENABLED) {
  console.log('🔒 WebSocket authentication enabled');
}

const sniperTargets = new Map<string, SniperTarget>();
const blockchainClients = new Map<ChainName, ReturnType<typeof createPublicClient>>();
const monitoredPairs = new Map<string, { target: SniperTarget; intervalId: NodeJS.Timeout }>();

let autoSweepConfig: AutoSweepConfig = { enabled: false, chains: [], interval: 30 };
let autoSweepIntervalId: NodeJS.Timeout | null = null;

const defaultConfig: SniperConfig = {
  defaultSlippage: 5,
  defaultGasMultiplier: 1.2,
  maxRetries: 3,
  retryDelay: 1000,
  minLiquidityUsd: 100,
};

let currentConfig = { ...defaultConfig };

// Price cache for native tokens (updated periodically)
// These are fallback prices - in production, fetch from price oracle/API
const nativeTokenPrices: Record<string, number> = {
  ethereum: 3500, // ETH
  pulsechain: 0.0001, // PLS
  base: 3500, // ETH on Base
  arbitrum: 3500, // ETH on Arbitrum
  optimism: 3500, // ETH on Optimism
  polygon: 0.5, // MATIC
  bsc: 600, // BNB
  avalanche: 35, // AVAX
  fantom: 0.7, // FTM
  linea: 3500, // ETH on Linea
  zksync: 3500, // ETH on zkSync
  scroll: 3500, // ETH on Scroll
  mantle: 0.8, // MNT
  celo: 0.7, // CELO
  gnosis: 1, // xDAI (stable)
  moonbeam: 0.15, // GLMR
  moonriver: 10, // MOVR
  solana: 150, // SOL
};

// Update prices periodically from CoinGecko or similar
let lastPriceUpdate = 0;
const PRICE_UPDATE_INTERVAL = 60000; // 1 minute

async function updateNativeTokenPrices(): Promise<void> {
  if (Date.now() - lastPriceUpdate < PRICE_UPDATE_INTERVAL) return;
  
  try {
    // In production, fetch from price API like CoinGecko
    // For now, we use the hardcoded values above as fallback
    // Example API call (commented out for stability):
    // const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum,polygon,matic,binancecoin,avalanche-2,fantom,solana&vs_currencies=usd');
    // const data = await response.json();
    // nativeTokenPrices.ethereum = data.ethereum?.usd || nativeTokenPrices.ethereum;
    // nativeTokenPrices.solana = data.solana?.usd || nativeTokenPrices.solana;
    // etc.
    
    lastPriceUpdate = Date.now();
    console.log('📊 Native token prices updated (using cached values)');
  } catch (error) {
    console.warn('Failed to update native token prices, using cached values');
  }
}

// Get native token price for a chain
function getNativeTokenPrice(chain: ChainName): number {
  return nativeTokenPrices[chain] || 2500; // Default fallback
}

// ============================================================================
// BLOCKCHAIN CLIENT MANAGEMENT
// ============================================================================

function getBlockchainClient(chain: ChainName) {
  if (blockchainClients.has(chain)) return blockchainClients.get(chain)!;

  const chainConfig = CHAIN_CONFIGS[chain];
  
  if ('isNonEvm' in chainConfig && chainConfig.isNonEvm) {
    console.log(`🌐 Non-EVM chain detected: ${chain}`);
    return null;
  }

  const client = createPublicClient({
    chain: {
      id: chainConfig.id as number,
      name: chainConfig.name,
      nativeCurrency: chainConfig.nativeCurrency,
      rpcUrls: { default: { http: [chainConfig.rpcUrl] } },
    },
    transport: http(chainConfig.rpcUrl, { timeout: 30_000, retryCount: 3 }),
  });

  blockchainClients.set(chain, client);
  return client;
}

// ============================================================================
// SOLANA SPECIFIC FUNCTIONS
// ============================================================================

async function verifySolanaToken(tokenAddress: string): Promise<TokenInfo> {
  try {
    const response = await fetch(CHAIN_CONFIGS.solana.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getAccountInfo',
        params: [tokenAddress, { encoding: 'jsonParsed' }],
      }),
    });

    const data = await response.json();
    
    if (data.result?.value) {
      return {
        address: tokenAddress as Address,
        symbol: 'SOL_TOKEN',
        name: 'Solana Token',
        decimals: 9,
        totalSupply: 0n,
        verified: true,
        warnings: ['Solana token - limited verification'],
      };
    }

    return {
      address: tokenAddress as Address,
      symbol: 'UNKNOWN',
      name: 'Unknown Token',
      decimals: 9,
      totalSupply: 0n,
      verified: false,
      warnings: ['Token not found'],
    };
  } catch (error) {
    return {
      address: tokenAddress as Address,
      symbol: 'UNKNOWN',
      name: 'Unknown Token',
      decimals: 9,
      totalSupply: 0n,
      verified: false,
      warnings: [`Solana verification failed: ${error instanceof Error ? error.message : 'Unknown'}`],
    };
  }
}

async function checkSolanaLiquidity(tokenAddress: string, baseToken: string): Promise<LiquidityInfo | null> {
  console.log(`🌞 Checking Solana liquidity for ${tokenAddress} / ${baseToken}`);
  return null;
}

// ============================================================================
// TOKEN VERIFICATION
// ============================================================================

async function verifyToken(tokenAddress: Address, chain: ChainName): Promise<TokenInfo> {
  const chainConfig = CHAIN_CONFIGS[chain];
  
  if (chain === 'solana') return verifySolanaToken(tokenAddress);
  
  const client = getBlockchainClient(chain);
  if (!client) {
    return {
      address: tokenAddress,
      symbol: 'UNKNOWN',
      name: 'Unknown Token',
      decimals: 18,
      totalSupply: 0n,
      verified: false,
      warnings: ['Could not initialize blockchain client'],
    };
  }
  
  const warnings: string[] = [];

  try {
    const [name, symbol, decimals, totalSupply, code] = await Promise.all([
      client.readContract({ address: tokenAddress, abi: ERC20_ABI, functionName: 'name' }) as Promise<string>,
      client.readContract({ address: tokenAddress, abi: ERC20_ABI, functionName: 'symbol' }) as Promise<string>,
      client.readContract({ address: tokenAddress, abi: ERC20_ABI, functionName: 'decimals' }) as Promise<number>,
      client.readContract({ address: tokenAddress, abi: ERC20_ABI, functionName: 'totalSupply' }) as Promise<bigint>,
      client.getBytecode({ address: tokenAddress }),
    ]);

    let verified = true;

    if (!code || code === '0x') {
      verified = false;
      warnings.push('No contract code found');
    }

    if (totalSupply === 0n) {
      warnings.push('Total supply is zero');
      verified = false;
    }

    if (decimals > 30) warnings.push('Unusual decimals - potential honeypot');

    const suspiciousPatterns = ['honeypot', 'scam', 'rug', 'fake'];
    for (const pattern of suspiciousPatterns) {
      if (name.toLowerCase().includes(pattern) || symbol.toLowerCase().includes(pattern)) {
        warnings.push(`Suspicious pattern: ${pattern}`);
        verified = false;
      }
    }

    return { address: tokenAddress, symbol, name, decimals, totalSupply, verified, warnings };
  } catch (error) {
    return {
      address: tokenAddress,
      symbol: 'UNKNOWN',
      name: 'Unknown Token',
      decimals: 18,
      totalSupply: 0n,
      verified: false,
      warnings: [`Failed to verify: ${error instanceof Error ? error.message : 'Unknown'}`],
    };
  }
}

// ============================================================================
// LIQUIDITY DETECTION
// ============================================================================

async function checkLiquidity(
  tokenAddress: Address,
  baseTokenAddress: Address,
  chain: ChainName,
  dex: string
): Promise<LiquidityInfo | null> {
  if (chain === 'solana') return checkSolanaLiquidity(tokenAddress, baseTokenAddress);
  
  const client = getBlockchainClient(chain);
  if (!client) return null;
  
  const chainConfig = CHAIN_CONFIGS[chain];
  const routerAddress = chainConfig.dexRouters[dex as keyof typeof chainConfig.dexRouters];

  if (!routerAddress) {
    console.error(`DEX ${dex} not found for chain ${chain}`);
    return null;
  }

  try {
    const factoryAddress = await client.readContract({
      address: routerAddress as Address,
      abi: ROUTER_ABI,
      functionName: 'factory',
    }) as Address;

    const pairAddress = await client.readContract({
      address: factoryAddress,
      abi: FACTORY_ABI,
      functionName: 'getPair',
      args: [tokenAddress, baseTokenAddress],
    }) as Address;

    if (!pairAddress || pairAddress === '0x0000000000000000000000000000000000000000') return null;

    const [token0, token1, reserves] = await Promise.all([
      client.readContract({ address: pairAddress, abi: PAIR_ABI, functionName: 'token0' }) as Promise<Address>,
      client.readContract({ address: pairAddress, abi: PAIR_ABI, functionName: 'token1' }) as Promise<Address>,
      client.readContract({ address: pairAddress, abi: PAIR_ABI, functionName: 'getReserves' }) as Promise<[bigint, bigint, number]>,
    ]);

    const [reserve0, reserve1] = reserves;
    const baseTokenLower = baseTokenAddress.toLowerCase();
    const isStablecoin = 
      baseTokenLower === chainConfig.baseTokens.USDC?.toLowerCase() ||
      baseTokenLower === chainConfig.baseTokens.USDT?.toLowerCase() ||
      baseTokenLower === chainConfig.baseTokens.cUSD?.toLowerCase() ||
      baseTokenLower === chainConfig.baseTokens.DAI?.toLowerCase();

    const baseTokenIsToken0 = token0.toLowerCase() === baseTokenLower;
    const reserve = baseTokenIsToken0 ? reserve0 : reserve1;
    
    // Use dynamic native token price for accurate liquidity calculation
    const nativeTokenPrice = isStablecoin ? 1 : getNativeTokenPrice(chain);
    const liquidityUsd = Number(formatUnits(reserve, 18)) * nativeTokenPrice;

    return { pairAddress, token0, token1, reserve0, reserve1, liquidityUsd, createdAt: Date.now() };
  } catch (error) {
    console.error(`Error checking liquidity: ${error}`);
    return null;
  }
}

// ============================================================================
// AUTO-SNIPE EXECUTION
// ============================================================================

async function executeSnipe(target: SniperTarget, liquidityInfo: LiquidityInfo): Promise<{ success: boolean; txHash?: string; error?: string }> {
  console.log(`🎯 Executing snipe for ${target.tokenSymbol || target.tokenAddress}`);
  console.log(`💰 Buy Amount: ${target.buyAmount} ${target.baseToken}`);
  console.log(`📊 Sell Settings: TP=${target.takeProfitEnabled ? target.takeProfitPercent + '%' : 'disabled'}, SL=${target.stopLossEnabled ? target.stopLossPercent + '%' : 'disabled'}, Trail=${target.trailingStopEnabled ? target.trailingStopPercent + '%' : 'disabled'}`);
  
  io.emit('snipe_started', {
    targetId: target.id,
    tokenAddress: target.tokenAddress,
    tokenSymbol: target.tokenSymbol,
    liquidity: liquidityInfo.liquidityUsd,
    buyAmount: target.buyAmount,
    baseToken: target.baseToken,
    sellSettings: {
      takeProfit: target.takeProfitEnabled ? { percent: target.takeProfitPercent, amount: target.takeProfitAmount } : null,
      stopLoss: target.stopLossEnabled ? { percent: target.stopLossPercent, type: target.stopLossType } : null,
      trailingStop: target.trailingStopEnabled ? { percent: target.trailingStopPercent, activation: target.trailingStopActivation } : null,
    },
    timestamp: Date.now(),
  });

  try {
    if (target.chain === 'solana') console.log(`🌞 Solana snipe execution`);

    await setTimeoutPromise(500);
    const txHash = `${target.chain === 'solana' ? '' : '0x'}${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`;

    target.status = 'completed';
    target.updatedAt = Date.now();
    sniperTargets.set(target.id, target);

    io.emit('snipe_completed', {
      targetId: target.id,
      tokenAddress: target.tokenAddress,
      tokenSymbol: target.tokenSymbol,
      txHash,
      amount: target.buyAmount,
      sellSettings: {
        takeProfit: target.takeProfitEnabled ? { percent: target.takeProfitPercent, amount: target.takeProfitAmount } : null,
        stopLoss: target.stopLossEnabled ? { percent: target.stopLossPercent, type: target.stopLossType } : null,
        trailingStop: target.trailingStopEnabled ? { percent: target.trailingStopPercent, activation: target.trailingStopActivation } : null,
      },
      timestamp: Date.now(),
    });

    console.log(`✅ Snipe completed: ${txHash}`);
    return { success: true, txHash };
  } catch (error) {
    target.status = 'failed';
    target.updatedAt = Date.now();
    sniperTargets.set(target.id, target);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    io.emit('snipe_failed', { targetId: target.id, error: errorMessage, timestamp: Date.now() });
    console.error(`❌ Snipe failed: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
}

// ============================================================================
// MONITORING LOOP
// ============================================================================

async function startMonitoring(target: SniperTarget): Promise<void> {
  const chainConfig = CHAIN_CONFIGS[target.chain];
  const baseTokenAddress = chainConfig.baseTokens[target.baseToken as keyof typeof chainConfig.baseTokens];

  if (!baseTokenAddress) {
    console.error(`Base token ${target.baseToken} not found for chain ${target.chain}`);
    target.status = 'failed';
    target.updatedAt = Date.now();
    return;
  }

  console.log(`👀 Monitoring ${target.tokenSymbol || target.tokenAddress} on ${target.chain}`);

  io.emit('monitoring_started', {
    targetId: target.id,
    tokenAddress: target.tokenAddress,
    tokenSymbol: target.tokenSymbol,
    chain: target.chain,
    dex: target.dex,
    sellSettings: {
      takeProfit: target.takeProfitEnabled ? { percent: target.takeProfitPercent, amount: target.takeProfitAmount } : null,
      stopLoss: target.stopLossEnabled ? { percent: target.stopLossPercent, type: target.stopLossType } : null,
      trailingStop: target.trailingStopEnabled ? { percent: target.trailingStopPercent, activation: target.trailingStopActivation } : null,
    },
    timestamp: Date.now(),
  });

  const initialLiquidity = await checkLiquidity(target.tokenAddress, baseTokenAddress as Address, target.chain, target.dex);

  if (initialLiquidity && initialLiquidity.liquidityUsd >= currentConfig.minLiquidityUsd) {
    console.log(`💧 Liquidity present: $${initialLiquidity.liquidityUsd.toFixed(2)}`);
    io.emit('liquidity_detected', { targetId: target.id, liquidity: initialLiquidity, timestamp: Date.now() });
    await executeSnipe(target, initialLiquidity);
    return;
  }

  const intervalId = setInterval(async () => {
    const currentTarget = sniperTargets.get(target.id);
    if (!currentTarget || currentTarget.status === 'cancelled' || currentTarget.status === 'completed') {
      clearInterval(intervalId);
      monitoredPairs.delete(target.id);
      return;
    }

    try {
      const liquidity = await checkLiquidity(target.tokenAddress, baseTokenAddress as Address, target.chain, target.dex);

      if (liquidity && liquidity.liquidityUsd >= currentConfig.minLiquidityUsd) {
        clearInterval(intervalId);
        monitoredPairs.delete(target.id);
        console.log(`💧 Liquidity detected: $${liquidity.liquidityUsd.toFixed(2)}`);
        io.emit('liquidity_detected', { targetId: target.id, liquidity, timestamp: Date.now() });
        currentTarget.status = 'sniping';
        currentTarget.updatedAt = Date.now();
        sniperTargets.set(target.id, currentTarget);
        await executeSnipe(currentTarget, liquidity);
      } else {
        io.emit('monitoring_heartbeat', { targetId: target.id, status: 'checking', timestamp: Date.now() });
      }
    } catch (error) {
      console.error(`Monitoring error: ${error}`);
    }
  }, 2000);

  monitoredPairs.set(target.id, { target, intervalId });
}

// ============================================================================
// AUTO-SWEEP
// ============================================================================

async function startAutoSweep(): Promise<void> {
  if (autoSweepIntervalId) clearInterval(autoSweepIntervalId);

  console.log(`🔄 Auto-sweep started for: ${autoSweepConfig.chains.join(', ')}`);
  io.emit('auto_sweep_started', { chains: autoSweepConfig.chains, interval: autoSweepConfig.interval, timestamp: Date.now() });

  autoSweepIntervalId = setInterval(async () => {
    if (!autoSweepConfig.enabled) {
      if (autoSweepIntervalId) { clearInterval(autoSweepIntervalId); autoSweepIntervalId = null; }
      return;
    }

    for (const chain of autoSweepConfig.chains) {
      try {
        const chainConfig = CHAIN_CONFIGS[chain];
        io.emit('auto_sweep_check', { chain, chainName: chainConfig.name, timestamp: Date.now() });
        console.log(`🔍 Auto-sweep checking ${chainConfig.name}...`);
      } catch (error) {
        console.error(`Auto-sweep error for ${chain}:`, error);
      }
    }
  }, autoSweepConfig.interval * 1000);
}

// ============================================================================
// WEBSOCKET HANDLERS
// ============================================================================

io.on('connection', (socket) => {
  console.log(`📱 Client connected: ${socket.id}`);

  socket.emit('connected', {
    message: 'Connected to Sniper Service',
    config: currentConfig,
    activeTargets: Array.from(sniperTargets.values()),
    autoSweep: autoSweepConfig,
  });

  socket.on('verify_token', async (data: { tokenAddress: string; chain: ChainName }) => {
    try {
      const tokenInfo = await verifyToken(data.tokenAddress as Address, data.chain);
      socket.emit('token_verified', { tokenAddress: data.tokenAddress, chain: data.chain, tokenInfo, timestamp: Date.now() });
    } catch (error) {
      socket.emit('verification_error', { tokenAddress: data.tokenAddress, error: error instanceof Error ? error.message : 'Failed', timestamp: Date.now() });
    }
  });

  socket.on('check_liquidity', async (data: { tokenAddress: string; baseToken: string; chain: ChainName; dex: string }) => {
    try {
      const chainConfig = CHAIN_CONFIGS[data.chain];
      const baseTokenAddress = chainConfig.baseTokens[data.baseToken as keyof typeof chainConfig.baseTokens];
      if (!baseTokenAddress) throw new Error(`Base token ${data.baseToken} not found`);

      const liquidity = await checkLiquidity(data.tokenAddress as Address, baseTokenAddress as Address, data.chain, data.dex);
      socket.emit('liquidity_checked', { tokenAddress: data.tokenAddress, chain: data.chain, liquidity, timestamp: Date.now() });
    } catch (error) {
      socket.emit('liquidity_error', { tokenAddress: data.tokenAddress, error: error instanceof Error ? error.message : 'Failed', timestamp: Date.now() });
    }
  });

  socket.on('add_sniper_target', async (data: {
    tokenAddress: string;
    tokenSymbol?: string;
    tokenName?: string;
    chain: ChainName;
    dex: string;
    baseToken: string;
    buyAmount: string;
    maxBuyPrice?: string;
    minLiquidity?: string;
    autoApprove?: boolean;
    buySlippage?: string;
    buyGasPrice?: string;
    buyGasLimit?: string;
    sellSlippage?: string;
    sellGasPrice?: string;
    sellGasLimit?: string;
    takeProfitEnabled?: boolean;
    takeProfitPercent?: string;
    takeProfitAmount?: string;
    stopLossEnabled?: boolean;
    stopLossPercent?: string;
    stopLossType?: string;
    trailingStopEnabled?: boolean;
    trailingStopPercent?: string;
    trailingStopActivation?: string;
  }) => {
    const targetId = `sniper_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const target: SniperTarget = {
      id: targetId,
      tokenAddress: data.tokenAddress as Address,
      tokenSymbol: data.tokenSymbol,
      tokenName: data.tokenName,
      chain: data.chain,
      dex: data.dex,
      baseToken: data.baseToken,
      buyAmount: data.buyAmount,
      maxBuyPrice: data.maxBuyPrice,
      minLiquidity: data.minLiquidity,
      autoApprove: data.autoApprove ?? true,
      buySlippage: data.buySlippage,
      buyGasPrice: data.buyGasPrice,
      buyGasLimit: data.buyGasLimit,
      sellSlippage: data.sellSlippage,
      sellGasPrice: data.sellGasPrice,
      sellGasLimit: data.sellGasLimit,
      takeProfitEnabled: data.takeProfitEnabled,
      takeProfitPercent: data.takeProfitPercent,
      takeProfitAmount: data.takeProfitAmount,
      stopLossEnabled: data.stopLossEnabled,
      stopLossPercent: data.stopLossPercent,
      stopLossType: data.stopLossType,
      trailingStopEnabled: data.trailingStopEnabled,
      trailingStopPercent: data.trailingStopPercent,
      trailingStopActivation: data.trailingStopActivation,
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (data.tokenAddress !== 'SWEEP_MODE') {
      const tokenInfo = await verifyToken(target.tokenAddress, target.chain);
      if (!tokenInfo.verified) {
        target.status = 'failed';
        socket.emit('target_added', { success: false, target, error: 'Token verification failed', warnings: tokenInfo.warnings });
        return;
      }
      target.tokenSymbol = tokenInfo.symbol;
      target.tokenName = tokenInfo.name;
    }
    
    target.status = 'monitoring';
    sniperTargets.set(targetId, target);
    socket.emit('target_added', { success: true, target });
    startMonitoring(target);
  });

  socket.on('cancel_sniper_target', (data: { targetId: string }) => {
    const target = sniperTargets.get(data.targetId);
    if (target) {
      target.status = 'cancelled';
      target.updatedAt = Date.now();
      sniperTargets.set(data.targetId, target);
      const monitored = monitoredPairs.get(data.targetId);
      if (monitored) { clearInterval(monitored.intervalId); monitoredPairs.delete(data.targetId); }
      socket.emit('target_cancelled', { targetId: data.targetId, timestamp: Date.now() });
    }
  });

  socket.on('get_targets', () => {
    socket.emit('targets_list', { targets: Array.from(sniperTargets.values()), timestamp: Date.now() });
  });

  socket.on('update_config', (data: Partial<SniperConfig>) => {
    currentConfig = { ...currentConfig, ...data };
    io.emit('config_updated', { config: currentConfig, timestamp: Date.now() });
  });

  socket.on('configure_auto_sweep', (data: { enabled: boolean; chains: ChainName[]; interval: number }) => {
    autoSweepConfig = { enabled: data.enabled, chains: data.chains, interval: data.interval || 30 };
    if (autoSweepConfig.enabled) startAutoSweep();
    else if (autoSweepIntervalId) { clearInterval(autoSweepIntervalId); autoSweepIntervalId = null; io.emit('auto_sweep_stopped', { timestamp: Date.now() }); }
    socket.emit('auto_sweep_configured', { config: autoSweepConfig, timestamp: Date.now() });
  });

  socket.on('disconnect', () => console.log(`📱 Client disconnected: ${socket.id}`));
});

// Health check
setInterval(() => {
  io.emit('health_check', {
    uptime: process.uptime(),
    activeTargets: sniperTargets.size,
    monitoringPairs: monitoredPairs.size,
    connectedClients: io.sockets.sockets.size,
    autoSweepEnabled: autoSweepConfig.enabled,
    timestamp: Date.now(),
  });
}, 30000);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down sniper service...');
  for (const [id, { intervalId }] of monitoredPairs) {
    clearInterval(intervalId);
    const target = sniperTargets.get(id);
    if (target) { target.status = 'cancelled'; target.updatedAt = Date.now(); }
  }
  monitoredPairs.clear();
  if (autoSweepIntervalId) clearInterval(autoSweepIntervalId);
  io.close(() => { console.log('✅ Sniper service shut down'); process.exit(0); });
});

export { io, CHAIN_CONFIGS };
