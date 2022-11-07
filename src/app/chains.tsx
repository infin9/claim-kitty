interface ChainProps {
  name: string;
  id: number;
  contractAddress: string;
  network: {
    nativeCurrency: {
      name: string;
      symbol: string;
      decimals: number;
    };
    rpcUrls: string[];
  };
}

class Chain {
  name: string;
  id: number;
  contractAddress: string;
  network: {
    nativeCurrency: {
      name: string;
      symbol: string;
      decimals: number;
    };
    rpcUrls: string[];
  };

  constructor(props: ChainProps) {
    this.name = props.name;
    this.id = props.id;
    this.contractAddress = props.contractAddress;
    this.network = props.network;
  }
  get details() {
    return {
      chainId: '0x' + this.id.toString(16),
      chainName: this.name,
      ...this.network,
    };
  }
}

export const SUPPORTED_CHAINS: Chain[] = [
  {
    name: 'Görli',
    id: 5,
    contractAddress: '0x554ed5BA071205eDC6d9a5BdF86a1E93cBC3AD2c',
    network: {
      nativeCurrency: {
        name: 'Görli Ether',
        symbol: 'ETH',
        decimals: 18,
      },
      rpcUrls: ['https://rpc.goerli.mudit.blog/'],
    },
  },
  {
    name: 'Ethereum Mainnet',
    id: 1,
    contractAddress: '0xc2289c8CC82b0010071FEE509233C3F8B45E1484',
    network: {
      nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18,
      },
      rpcUrls: [
        'https://api.mycryptoapi.com/eth',
        'https://cloudflare-eth.com',
      ],
    },
  },
  {
    name: 'Binance Smart Chain Mainnet',
    id: 56,
    contractAddress: '0x3Cc4B318A852C1C0a5A45aBCD260FAb136aB2784',
    network: {
      nativeCurrency: {
        name: 'Binance Chain Native Token',
        symbol: 'BNB',
        decimals: 18,
      },
      rpcUrls: [
        'https://bsc-dataseed1.binance.org',
        'https://bsc-dataseed2.binance.org',
        'https://bsc-dataseed3.binance.org',
        'https://bsc-dataseed4.binance.org',
        'https://bsc-dataseed1.defibit.io',
        'https://bsc-dataseed2.defibit.io',
        'https://bsc-dataseed3.defibit.io',
        'https://bsc-dataseed4.defibit.io',
        'https://bsc-dataseed1.ninicoin.io',
        'https://bsc-dataseed2.ninicoin.io',
        'https://bsc-dataseed3.ninicoin.io',
        'https://bsc-dataseed4.ninicoin.io',
        'wss://bsc-ws-node.nariox.org',
      ],
    },
  },
  {
    name: 'Polygon Mainnet',
    id: 137,
    contractAddress: '0x2C4b68C1D67f50dA4f87c13a54fE3Afd3ba4Fe90',
    network: {
      nativeCurrency: {
        name: 'MATIC',
        symbol: 'MATIC',
        decimals: 18,
      },
      rpcUrls: [
        'https://polygon-rpc.com/',
        'https://rpc-mainnet.matic.network',
        'https://matic-mainnet.chainstacklabs.com',
        'https://rpc-mainnet.maticvigil.com',
        'https://rpc-mainnet.matic.quiknode.pro',
        'https://matic-mainnet-full-rpc.bwarelabs.com',
        'https://polygon-bor.publicnode.com',
      ],
    },
  },
  {
    name: 'Moonriver',
    id: 1285,
    contractAddress: '0x4010D4d88cca02572b38AD9542Dd6C7524914810',
    network: {
      nativeCurrency: {
        name: 'Moonriver',
        symbol: 'MOVR',
        decimals: 18,
      },
      rpcUrls: [
        'https://rpc.api.moonriver.moonbeam.network',
        'wss://wss.api.moonriver.moonbeam.network',
      ],
    },
  },
  {
    name: 'Arbitrum One',
    id: 42161,
    contractAddress: '0xEeFf4Ae9A80c97b779499aD73bfDE209aA48db1F',
    network: {
      nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18,
      },
      rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    },
  },
  {
    name: 'Avalanche C-Chain',
    id: 43114,
    contractAddress: '0x579AbfC42980c56f87BCffCDe07a93c00a8733a1',
    network: {
      nativeCurrency: {
        name: 'Avalanche',
        symbol: 'AVAX',
        decimals: 18,
      },
      rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
    },
  },
].map(x => new Chain(x));
