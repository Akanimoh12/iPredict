export type WalletType = "leather" | "xverse";

export interface Wallet {
  /** STX address (e.g. ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM) */
  address: string;
  walletType: WalletType;
}
