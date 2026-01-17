// GenLayer StudioNet Configuration
export const GENLAYER_CONFIG = {
  chainId: 61999, // 0xF22F
  rpcUrl: "https://studio.genlayer.com/api",
  contractAddress: "0xc43aC3931dA9DEd67F12391EE9E6663E0C3440E3",
  consensusContract: "0x000000000000000000000000000000000000000A",
} as const;

export const CATEGORIES = [
  "Funniest",
  "Most Accurate",
  "Most Creative",
  "Best Meme",
] as const;

export type Category = (typeof CATEGORIES)[number];
