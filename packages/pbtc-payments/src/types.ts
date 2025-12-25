export type PaymentType = "PBTC" | "SOL";

export interface PBTCCheckoutProps {
  amount: number;
  merchantWallet: string;
  reference: string;
  memo?: string;
  onSuccess?: (signature: string) => void;
  onError?: (error: Error) => void;
  onCancel?: () => void;
  solAmount?: number;
}

export interface TransferResult {
  success: boolean;
  signature?: string;
  error?: string;
}

export interface PhantomProvider {
  isPhantom?: boolean;
  publicKey?: { toString: () => string };
  connect: () => Promise<{ publicKey: { toString: () => string } }>;
  disconnect: () => Promise<void>;
  signAndSendTransaction: (transaction: unknown) => Promise<{ signature: string }>;
  on: (event: string, callback: (args: unknown) => void) => void;
  off: (event: string, callback: (args: unknown) => void) => void;
}

declare global {
  interface Window {
    solana?: PhantomProvider;
  }
}
