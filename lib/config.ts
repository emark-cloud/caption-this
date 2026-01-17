// GenLayer StudioNet Configuration
export const GENLAYER_CONFIG = {
  chainId: 61999, // 0xF22F
  rpcUrl: "https://studio.genlayer.com/api",
  contractAddress: "0x8dF1102cC710F56A928393e1A76Db5942cd57b82",
  consensusContract: "0x000000000000000000000000000000000000000A",
} as const;

export const CATEGORIES = [
  "Funniest",
  "Most Accurate",
  "Most Creative",
  "Best Meme",
] as const;

export type Category = (typeof CATEGORIES)[number];
