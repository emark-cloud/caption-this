// GenLayer StudioNet Configuration
export const GENLAYER_CONFIG = {
  chainId: 61999, // 0xF22F
  rpcUrl: "https://studio.genlayer.com/api",
  contractAddress: "0x29AD2F9f905bFaAB635cA4d5E954983449b9E538",
  consensusContract: "0x000000000000000000000000000000000000000A",
} as const;

export const CATEGORIES = [
  "Funniest",
  "Most Accurate",
  "Most Creative",
  "Best Meme",
] as const;

export type Category = (typeof CATEGORIES)[number];
