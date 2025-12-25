import { Connection, PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import { 
  getAssociatedTokenAddress, 
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
  getAccount,
  createAssociatedTokenAccountInstruction
} from "@solana/spl-token";
import { PBTC_CONFIG } from "@shared/schema";

declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      connect: () => Promise<{ publicKey: PublicKey }>;
      disconnect: () => Promise<void>;
      signAndSendTransaction: (transaction: Transaction) => Promise<{ signature: string }>;
      signTransaction: (transaction: Transaction) => Promise<Transaction>;
      on: (event: string, callback: () => void) => void;
      off: (event: string, callback: () => void) => void;
      publicKey: PublicKey | null;
    };
  }
}

let cachedRpcUrl: string | null = null;

async function getRpcUrl(): Promise<string> {
  if (cachedRpcUrl) return cachedRpcUrl;
  
  try {
    const response = await fetch("/api/config");
    if (response.ok) {
      const config = await response.json();
      if (config.rpcUrl) {
        cachedRpcUrl = config.rpcUrl;
        return cachedRpcUrl;
      }
    }
  } catch (error) {
    console.warn("Failed to fetch RPC config, using fallback");
  }
  
  return "https://api.mainnet-beta.solana.com";
}

export async function getConnectionAsync(): Promise<Connection> {
  const rpcUrl = await getRpcUrl();
  return new Connection(rpcUrl, "confirmed");
}

export function getConnection(): Connection {
  const rpcUrl = cachedRpcUrl || "https://api.mainnet-beta.solana.com";
  return new Connection(rpcUrl, "confirmed");
}

export function getPBTCMint(): PublicKey {
  return new PublicKey(PBTC_CONFIG.mint);
}

export async function getTokenBalance(
  connection: Connection,
  ownerAddress: string
): Promise<number> {
  try {
    const owner = new PublicKey(ownerAddress);
    const mint = getPBTCMint();
    const ata = await getAssociatedTokenAddress(mint, owner);
    
    const account = await getAccount(connection, ata);
    return Number(account.amount) / Math.pow(10, PBTC_CONFIG.decimals);
  } catch {
    return 0;
  }
}

export interface TransferResult {
  success: boolean;
  signature?: string;
  error?: string;
}

export async function createPBTCTransfer(
  connection: Connection,
  senderAddress: string,
  recipientAddress: string,
  amount: number
): Promise<Transaction> {
  const sender = new PublicKey(senderAddress);
  const recipient = new PublicKey(recipientAddress);
  const mint = getPBTCMint();
  
  const senderATA = await getAssociatedTokenAddress(mint, sender);
  const recipientATA = await getAssociatedTokenAddress(mint, recipient);
  
  const transaction = new Transaction();
  
  try {
    await getAccount(connection, recipientATA);
  } catch {
    transaction.add(
      createAssociatedTokenAccountInstruction(
        sender,
        recipientATA,
        recipient,
        mint
      )
    );
  }
  
  const amountInBaseUnits = BigInt(Math.floor(amount * Math.pow(10, PBTC_CONFIG.decimals)));
  
  transaction.add(
    createTransferInstruction(
      senderATA,
      recipientATA,
      sender,
      amountInBaseUnits,
      [],
      TOKEN_PROGRAM_ID
    )
  );
  
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.lastValidBlockHeight = lastValidBlockHeight;
  transaction.feePayer = sender;
  
  return transaction;
}

export async function sendPBTCPayment(
  recipientAddress: string,
  amount: number,
  memo?: string
): Promise<TransferResult> {
  if (!window.solana?.isPhantom) {
    return { success: false, error: "Phantom wallet not found" };
  }
  
  if (!window.solana.publicKey) {
    return { success: false, error: "Wallet not connected" };
  }
  
  try {
    const connection = await getConnectionAsync();
    const senderAddress = window.solana.publicKey.toString();
    
    const balance = await getTokenBalance(connection, senderAddress);
    if (balance < amount) {
      return { 
        success: false, 
        error: `Insufficient PBTC balance. You have ${balance.toFixed(4)} PBTC but need ${amount} PBTC.` 
      };
    }
    
    const transaction = await createPBTCTransfer(
      connection,
      senderAddress,
      recipientAddress,
      amount
    );
    
    if (memo) {
      transaction.add(
        new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: new PublicKey(senderAddress),
            toPubkey: new PublicKey(senderAddress),
            lamports: 0,
          })
        )
      );
    }
    
    const result = await window.solana.signAndSendTransaction(transaction);
    
    await connection.confirmTransaction({
      signature: result.signature,
      blockhash: transaction.recentBlockhash!,
      lastValidBlockHeight: transaction.lastValidBlockHeight!,
    });
    
    return { success: true, signature: result.signature };
  } catch (error) {
    console.error("Payment error:", error);
    const message = error instanceof Error ? error.message : "Transaction failed";
    return { success: false, error: message };
  }
}

export async function verifyTransactionOnChain(
  signature: string,
  expectedRecipient: string,
  expectedAmount: number
): Promise<{ verified: boolean; error?: string }> {
  try {
    const connection = getConnection();
    const tx = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });
    
    if (!tx) {
      return { verified: false, error: "Transaction not found" };
    }
    
    if (tx.meta?.err) {
      return { verified: false, error: "Transaction failed" };
    }
    
    const postBalances = tx.meta?.postTokenBalances || [];
    const preBalances = tx.meta?.preTokenBalances || [];
    
    const recipientPost = postBalances.find(
      (b) => b.owner === expectedRecipient && b.mint === PBTC_CONFIG.mint
    );
    
    if (!recipientPost) {
      return { verified: false, error: "Recipient not found in transaction" };
    }
    
    const recipientPre = preBalances.find(
      (b) => b.owner === expectedRecipient && b.mint === PBTC_CONFIG.mint
    );
    
    const postAmount = parseFloat(recipientPost.uiTokenAmount?.uiAmountString || "0");
    const preAmount = parseFloat(recipientPre?.uiTokenAmount?.uiAmountString || "0");
    const receivedAmount = postAmount - preAmount;
    
    if (Math.abs(receivedAmount - expectedAmount) > 0.0001) {
      return { 
        verified: false, 
        error: `Amount mismatch: expected ${expectedAmount}, received ${receivedAmount}` 
      };
    }
    
    return { verified: true };
  } catch (error) {
    console.error("Verification error:", error);
    return { verified: false, error: "Failed to verify transaction" };
  }
}
