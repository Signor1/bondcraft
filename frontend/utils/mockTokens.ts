// Mock data for featured launchpads
export const featuredLaunchpads = [
  {
    id: "1",
    name: "DegenCoin",
    symbol: "DEGEN",
    currentPrice: 0.000215,
    tokensSold: 3500000,
    fundingTokens: 5000000,
    phase: "open" as const,
  },
  {
    id: "2",
    name: "Sui Finance",
    symbol: "SFI",
    currentPrice: 0.00125,
    tokensSold: 7500000,
    fundingTokens: 10000000,
    phase: "open" as const,
  },
  {
    id: "3",
    name: "Metaverse Token",
    symbol: "META",
    currentPrice: 0.00075,
    tokensSold: 9500000,
    fundingTokens: 10000000,
    phase: "closed" as const,
  },
];
