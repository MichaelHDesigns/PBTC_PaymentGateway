import { Connection, PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import { getAssociatedTokenAddress, createTransferInstruction, createAssociatedTokenAccountInstruction, getAccount } from "@solana/spl-token";
import { Buffer } from "buffer";
import { PBTC_CONFIG } from "../config";
import type { TransferResult } from "../types";

if (typeof window !== "undefined" && !(window as unknown as { Buffer?: typeof Buffer }).Buffer) {
  (window as unknown as { Buffer: typeof Buffer }).Buffer = Buffer;
}

let connectionInstance: Connection | null = null;

export function getConnection(): Connection {
  if (!connectionInstance) {
    connectionInstance = new Connection(PBTC_CONFIG.rpcUrl, "confirmed");
  }
  return connectionInstance;
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
    const connection = getConnection();
    const senderAddress = window.solana.publicKey.toString();
    const mintPubkey = new PublicKey(PBTC_CONFIG.mint);
    const senderPubkey = new PublicKey(senderAddress);
    const recipientPubkey = new PublicKey(recipientAddress);
    
    const senderATA = await getAssociatedTokenAddress(mintPubkey, senderPubkey);
    const recipientATA = await getAssociatedTokenAddress(mintPubkey, recipientPubkey);
    
    const transaction = new Transaction();
    
    try {
      await getAccount(connection, recipientATA);
    } catch {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          senderPubkey,
          recipientATA,
          recipientPubkey,
          mintPubkey
        )
      );
    }
    
    const transferAmount = BigInt(Math.round(amount * Math.pow(10, PBTC_CONFIG.decimals)));
    
    transaction.add(
      createTransferInstruction(
        senderATA,
        recipientATA,
        senderPubkey,
        transferAmount
      )
    );
    
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    transaction.feePayer = senderPubkey;
    
    const result = await window.solana.signAndSendTransaction(transaction);
    
    await connection.confirmTransaction({
      signature: result.signature,
      blockhash: transaction.recentBlockhash!,
      lastValidBlockHeight: transaction.lastValidBlockHeight!,
    });
    
    return { success: true, signature: result.signature };
  } catch (error) {
    console.error("PBTC Payment error:", error);
    const message = error instanceof Error ? error.message : "Transaction failed";
    return { success: false, error: message };
  }
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
    const connection = getConnection();
    const senderAddress = window.solana.publicKey.toString();
    
    const balance = await connection.getBalance(new PublicKey(senderAddress));
    const balanceInSOL = balance / 1e9;
    const estimatedFees = 0.00005;
    const totalRequired = amount + estimatedFees;
    
    if (balanceInSOL < totalRequired) {
      return { 
        success: false, 
        error: `Insufficient SOL balance. You have ${balanceInSOL.toFixed(6)} SOL but need approximately ${totalRequired.toFixed(6)} SOL.` 
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
