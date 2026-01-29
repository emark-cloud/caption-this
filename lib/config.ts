// GenLayer StudioNet Configuration
export const GENLAYER_CONFIG = {
  chainId: 61999, // 0xF22F
  rpcUrl: "https://studio.genlayer.com/api",
  contractAddress: "0x9995764bcaa4D62DaC4866F00C8fB0D9Ca9EE0af",
  consensusContract: "0xb7278A61aa25c888815aFC32Ad3cC52fF24fE575",
} as const;

export const CATEGORIES = [
  "Funniest",
  "Most Accurate",
] as const;

export type Category = (typeof CATEGORIES)[number];
