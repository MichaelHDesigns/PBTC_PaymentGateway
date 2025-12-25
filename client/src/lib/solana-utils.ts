import { Connection, PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import { 
  getAssociatedTokenAddress, 
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getAccount,
  createAssociatedTokenAccountInstruction,
  getMint
} from "@solana/spl-token";
import { PBTC_CONFIG, type TokenConfig, getTokenById } from "@shared/schema";

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
        return config.rpcUrl;
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

export function getTokenMint(token: TokenConfig): PublicKey | null {
  if (token.type === "native" || !token.mintAddress) {
    return null;
  }
  return new PublicKey(token.mintAddress);
}

export function getTokenProgramId(token: TokenConfig): PublicKey {
  if (token.tokenProgram === "token-2022") {
    return TOKEN_2022_PROGRAM_ID;
  }
  return TOKEN_PROGRAM_ID;
}

export async function getTokenBalance(
  connection: Connection,
  ownerAddress: string,
  token?: TokenConfig
): Promise<number> {
  try {
    const owner = new PublicKey(ownerAddress);
    
    if (!token || token.type === "native") {
      const balance = await connection.getBalance(owner);
      return balance / 1e9;
    }
    
    if (!token.mintAddress) return 0;
    
    const mint = new PublicKey(token.mintAddress);
    const programId = getTokenProgramId(token);
    const ata = await getAssociatedTokenAddress(mint, owner, false, programId);
    
    // Fetch actual decimals from the blockchain to ensure accuracy
    let decimals = token.decimals;
    try {
      const mintInfo = await getMint(connection, mint, undefined, programId);
      decimals = mintInfo.decimals;
      console.log(`Token ${token.symbol}: blockchain decimals = ${decimals}, config decimals = ${token.decimals}, program: ${token.tokenProgram}`);
    } catch (mintError) {
      console.warn(`Could not fetch mint info for ${token.symbol}, using config decimals:`, mintError);
    }
    
    const account = await getAccount(connection, ata, undefined, programId);
    const balance = Number(account.amount) / Math.pow(10, decimals);
    console.log(`Token ${token.symbol} balance: ${balance} (raw: ${account.amount}, decimals: ${decimals})`);
    return balance;
  } catch (error) {
    console.error(`Error getting ${token?.symbol || 'token'} balance:`, error);
    return 0;
  }
}

export interface TransferResult {
  success: boolean;
  signature?: string;
  error?: string;
}

export async function createSPLTransfer(
  connection: Connection,
  senderAddress: string,
  recipientAddress: string,
  amount: number,
  token: TokenConfig
): Promise<Transaction> {
  if (token.type === "native" || !token.mintAddress) {
    throw new Error("Cannot create SPL transfer for native token");
  }
  
  const sender = new PublicKey(senderAddress);
  const recipient = new PublicKey(recipientAddress);
  const mint = new PublicKey(token.mintAddress);
  const programId = getTokenProgramId(token);
  
  // Fetch actual decimals from blockchain
  let decimals = token.decimals;
  try {
    const mintInfo = await getMint(connection, mint, undefined, programId);
    decimals = mintInfo.decimals;
    console.log(`Transfer: using blockchain decimals ${decimals} for ${token.symbol}, program: ${token.tokenProgram}`);
  } catch (mintError) {
    console.warn(`Could not fetch mint info for ${token.symbol}, using config decimals:`, mintError);
  }
  
  const senderATA = await getAssociatedTokenAddress(mint, sender, false, programId);
  const recipientATA = await getAssociatedTokenAddress(mint, recipient, false, programId);
  
  const transaction = new Transaction();
  
  try {
    await getAccount(connection, recipientATA, undefined, programId);
  } catch {
    transaction.add(
      createAssociatedTokenAccountInstruction(
        sender,
        recipientATA,
        recipient,
        mint,
        programId
      )
    );
  }
  
  const amountInBaseUnits = BigInt(Math.floor(amount * Math.pow(10, decimals)));
  console.log(`Transfer amount: ${amount} ${token.symbol} = ${amountInBaseUnits} base units (decimals: ${decimals})`);
  
  transaction.add(
    createTransferInstruction(
      senderATA,
      recipientATA,
      sender,
      amountInBaseUnits,
      [],
      programId
    )
  );
  
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.lastValidBlockHeight = lastValidBlockHeight;
  transaction.feePayer = sender;
  
  return transaction;
}

export async function createPBTCTransfer(
  connection: Connection,
  senderAddress: string,
  recipientAddress: string,
  amount: number
): Promise<Transaction> {
  const pbtcToken: TokenConfig = {
    id: "pbtc",
    name: PBTC_CONFIG.name,
    symbol: PBTC_CONFIG.symbol,
    decimals: PBTC_CONFIG.decimals,
    type: "spl",
    mintAddress: PBTC_CONFIG.mint,
    icon: "pbtc",
    tokenProgram: "spl-token"
  };
  return createSPLTransfer(connection, senderAddress, recipientAddress, amount, pbtcToken);
}

export async function sendTokenPayment(
  recipientAddress: string,
  amount: number,
  tokenId: string
): Promise<TransferResult> {
  const token = getTokenById(tokenId);
  if (!token) {
    return { success: false, error: `Unknown token: ${tokenId}` };
  }
  
  if (token.type === "native") {
    return sendSOLPayment(recipientAddress, amount);
  }
  
  return sendSPLPayment(recipientAddress, amount, token);
}

export async function sendSPLPayment(
  recipientAddress: string,
  amount: number,
  token: TokenConfig
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
    
    const balance = await getTokenBalance(connection, senderAddress, token);
    if (balance < amount) {
      return { 
        success: false, 
        error: `Insufficient ${token.symbol} balance. You have ${balance.toFixed(4)} ${token.symbol} but need ${amount} ${token.symbol}.` 
      };
    }
    
    const transaction = await createSPLTransfer(
      connection,
      senderAddress,
      recipientAddress,
      amount,
      token
    );
    
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

export async function sendPBTCPayment(
  recipientAddress: string,
  amount: number,
  _memo?: string
): Promise<TransferResult> {
  const pbtcToken: TokenConfig = {
    id: "pbtc",
    name: PBTC_CONFIG.name,
    symbol: PBTC_CONFIG.symbol,
    decimals: PBTC_CONFIG.decimals,
    type: "spl",
    mintAddress: PBTC_CONFIG.mint,
    icon: "pbtc",
    tokenProgram: "spl-token"
  };
  return sendSPLPayment(recipientAddress, amount, pbtcToken);
}

export async function sendSOLPayment(
  recipientAddress: string,
  amount: number
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
    
    const balance = await connection.getBalance(new PublicKey(senderAddress));
    const balanceInSOL = balance / 1e9;
    const estimatedFees = 0.00005;
    const totalRequired = amount + estimatedFees;
    
    if (balanceInSOL < totalRequired) {
      return { 
        success: false, 
        error: `Insufficient SOL balance. You have ${balanceInSOL.toFixed(6)} SOL but need approximately ${totalRequired.toFixed(6)} SOL (${amount} + fees).` 
      };
    }
    
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: new PublicKey(senderAddress),
        toPubkey: new PublicKey(recipientAddress),
        lamports: Math.round(amount * 1e9),
      })
    );
    
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    transaction.feePayer = new PublicKey(senderAddress);
    
    const result = await window.solana.signAndSendTransaction(transaction);
    
    await connection.confirmTransaction({
      signature: result.signature,
      blockhash: transaction.recentBlockhash!,
      lastValidBlockHeight: transaction.lastValidBlockHeight!,
    });
    
    return { success: true, signature: result.signature };
  } catch (error) {
    console.error("SOL Payment error:", error);
    const message = error instanceof Error ? error.message : "Transaction failed";
    return { success: false, error: message };
  }
}

export async function verifyTransactionOnChain(
  signature: string,
  expectedRecipient: string,
  expectedAmount: number,
  tokenId?: string
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
    
    const token = tokenId ? getTokenById(tokenId) : getTokenById("pbtc");
    
    if (!token || token.type === "native") {
      const preBalances = tx.meta?.preBalances || [];
      const postBalances = tx.meta?.postBalances || [];
      const accountKeys = tx.transaction.message.getAccountKeys().staticAccountKeys;
      
      for (let i = 0; i < accountKeys.length; i++) {
        if (accountKeys[i].toString() === expectedRecipient) {
          const received = (postBalances[i] - preBalances[i]) / 1e9;
          if (Math.abs(received - expectedAmount) < 0.0001) {
            return { verified: true };
          }
        }
      }
      return { verified: false, error: "Amount or recipient mismatch" };
    }
    
    const postBalances = tx.meta?.postTokenBalances || [];
    const preBalances = tx.meta?.preTokenBalances || [];
    
    const recipientPost = postBalances.find(
      (b) => b.owner === expectedRecipient && b.mint === token.mintAddress
    );
    
    if (!recipientPost) {
      return { verified: false, error: "Recipient not found in transaction" };
    }
    
    const recipientPre = preBalances.find(
      (b) => b.owner === expectedRecipient && b.mint === token.mintAddress
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
