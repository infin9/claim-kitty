import { chain, Chain } from 'wagmi';
class SupportedChain {
  contractAddress: string;
  chain: Chain;
  constructor(props: { contractAddress: string; chain: Chain }) {
    this.contractAddress = props.contractAddress;
    this.chain = props.chain;
  }

  get parseJSONForMetamask() {
    return {
      chainId: '0x' + this.chain.id.toString(16),
      chainName: this.chain.name,
      nativeCurrency: this.chain.nativeCurrency,
      rpcUrls: Object.values(this.chain.rpcUrls),
      blockExplorerUrls: !!this.chain.blockExplorers
        ? Object.values(this.chain.blockExplorers).map(c => c.url)
        : undefined,
    };
  }
}

export const SUPPORTED_CHAINS: SupportedChain[] = [
  {
    contractAddress: '0x554ed5BA071205eDC6d9a5BdF86a1E93cBC3AD2c',
    chain: chain.goerli,
  },
  {
    contractAddress: '0xc2289c8CC82b0010071FEE509233C3F8B45E1484',
    chain: chain.mainnet,
  },
  {
    contractAddress: '0x3Cc4B318A852C1C0a5A45aBCD260FAb136aB2784',
    chain: {
      id: 56,
      name: 'BNB Smart Chain',
      network: 'bsc',
      nativeCurrency: {
        name: 'Binance Chain Native Token',
        symbol: 'BNB',
        decimals: 18,
      },
      rpcUrls: {
        default: 'https://bsc-dataseed.binance.org',
        public: 'https://bsc-dataseed.binance.org',
      },
      testnet: false,
    },
  },
  {
    contractAddress: '0x2C4b68C1D67f50dA4f87c13a54fE3Afd3ba4Fe90',
    chain: chain.polygon,
  },
  {
    contractAddress: '0x4010D4d88cca02572b38AD9542Dd6C7524914810',
    chain: {
      id: 1285,
      name: 'Moonriver',
      network: 'moonriver',
      nativeCurrency: { name: 'Moonriver', symbol: 'MOVR', decimals: 18 },
      rpcUrls: {
        default: 'https://rpc.api.moonriver.moonbeam.network',
        public: 'https://rpc.api.moonriver.moonbeam.network',
      },
      testnet: false,
    },
  },
  {
    contractAddress: '0xEeFf4Ae9A80c97b779499aD73bfDE209aA48db1F',
    chain: {
      ...chain.arbitrum,
      rpcUrls: {
        default: 'https://arb1.arbitrum.io/rpc',
        public: 'https://arb1.arbitrum.io/rpc',
      },
    },
  },
  {
    contractAddress: '0x579AbfC42980c56f87BCffCDe07a93c00a8733a1',
    chain: {
      id: 43114,
      name: 'Avalanche',
      network: 'avalanche',
      nativeCurrency: {
        decimals: 18,
        name: 'Avalanche',
        symbol: 'AVAX',
      },
      rpcUrls: {
        default: 'https://api.avax.network/ext/bc/C/rpc',
      },
      blockExplorers: {
        default: { name: 'SnowTrace', url: 'https://snowtrace.io' },
      },
      testnet: false,
    },
  },
].map(x => new SupportedChain(x));
