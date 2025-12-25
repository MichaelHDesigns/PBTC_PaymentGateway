import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { initPaymentSchema, verifyPaymentSchema, PBTC_CONFIG, getServerRpcUrl } from "@shared/schema";
import { Connection, PublicKey } from "@solana/web3.js";

const rpcUrl = getServerRpcUrl();
const connection = new Connection(rpcUrl, "confirmed");

interface VerificationResult {
  valid: boolean;
  error?: string;
  receivedAmount?: number;
  senderAddress?: string;
}

async function verifySOLTransactionOnChain(
  signature: string,
  merchantWallet: string,
  expectedAmount: number,
  expectedSender?: string
): Promise<VerificationResult> {
  try {
    const tx = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });

    if (!tx) {
      return { valid: false, error: "Transaction not found on-chain. It may still be processing." };
    }

    if (tx.meta?.err) {
      return { valid: false, error: "Transaction failed on-chain" };
    }

    const accountKeys = tx.transaction.message.getAccountKeys?.() || 
                        (tx.transaction.message as { staticAccountKeys?: PublicKey[] }).staticAccountKeys;
    
    if (!accountKeys) {
      return { valid: false, error: "Could not parse transaction accounts" };
    }

    const merchantIndex = Array.from({ length: accountKeys.length }, (_, i) => {
      const key = accountKeys.get ? accountKeys.get(i) : accountKeys[i];
      return key?.toString();
    }).findIndex(addr => addr === merchantWallet);

    if (merchantIndex === -1) {
      return { valid: false, error: "Merchant wallet not found in transaction" };
    }

    const preBalances = tx.meta?.preBalances || [];
    const postBalances = tx.meta?.postBalances || [];

    const preBalance = preBalances[merchantIndex] || 0;
    const postBalance = postBalances[merchantIndex] || 0;
    const receivedLamports = postBalance - preBalance;
    const receivedAmount = receivedLamports / 1e9;

    if (receivedAmount <= 0) {
      return { valid: false, error: "No positive SOL transfer to merchant detected" };
    }

    if (Math.abs(receivedAmount - expectedAmount) > 0.0001) {
      return { 
        valid: false, 
        error: `Amount mismatch: expected ${expectedAmount} SOL, received ${receivedAmount.toFixed(9)} SOL`,
        receivedAmount 
      };
    }

    const firstKey = accountKeys.get ? accountKeys.get(0) : accountKeys[0];
    const actualSender = firstKey?.toString();

    if (expectedSender && actualSender && actualSender !== expectedSender) {
      return { 
        valid: false, 
        error: `Sender mismatch: payment was locked to wallet ${expectedSender.slice(0, 8)}... but transaction was sent by ${actualSender.slice(0, 8)}...`,
        senderAddress: actualSender 
      };
    }

    return { valid: true, receivedAmount, senderAddress: actualSender };
  } catch (error) {
    console.error("SOL on-chain verification error:", error);
    return { valid: false, error: "Failed to verify SOL transaction on-chain. Please try again." };
  }
}

async function verifyPBTCTransactionOnChain(
  signature: string,
  merchantWallet: string,
  expectedAmount: number,
  expectedSender?: string
): Promise<VerificationResult> {
  try {
    const tx = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });

    if (!tx) {
      return { valid: false, error: "Transaction not found on-chain. It may still be processing." };
    }

    if (tx.meta?.err) {
      return { valid: false, error: "Transaction failed on-chain" };
    }

    const postBalances = tx.meta?.postTokenBalances || [];
    const preBalances = tx.meta?.preTokenBalances || [];

    const recipientPost = postBalances.find(
      (b) => b.owner === merchantWallet && b.mint === PBTC_CONFIG.mint
    );

    if (!recipientPost) {
      return { valid: false, error: "Merchant wallet not found in transaction token balances" };
    }

    const recipientPre = preBalances.find(
      (b) => b.owner === merchantWallet && b.mint === PBTC_CONFIG.mint
    );

    const postAmount = parseFloat(recipientPost.uiTokenAmount?.uiAmountString || "0");
    const preAmount = parseFloat(recipientPre?.uiTokenAmount?.uiAmountString || "0");
    const receivedAmount = postAmount - preAmount;

    if (receivedAmount <= 0) {
      return { valid: false, error: "No positive transfer to merchant detected" };
    }

    if (Math.abs(receivedAmount - expectedAmount) > 0.0001) {
      return { 
        valid: false, 
        error: `Amount mismatch: expected ${expectedAmount} PBTC, received ${receivedAmount} PBTC`,
        receivedAmount 
      };
    }

    let actualSender: string | undefined;
    
    for (const tokenBalance of preBalances) {
      if (tokenBalance.mint === PBTC_CONFIG.mint && tokenBalance.owner !== merchantWallet) {
        const preAmt = parseFloat(tokenBalance.uiTokenAmount?.uiAmountString || "0");
        const postMatch = postBalances.find(
          (p) => p.owner === tokenBalance.owner && p.mint === PBTC_CONFIG.mint
        );
        const postAmt = parseFloat(postMatch?.uiTokenAmount?.uiAmountString || "0");
        
        if (preAmt - postAmt > 0) {
          actualSender = tokenBalance.owner || undefined;
          break;
        }
      }
    }

    if (!actualSender) {
      const accountKeys = tx.transaction.message.getAccountKeys?.() || 
                          (tx.transaction.message as { staticAccountKeys?: PublicKey[] }).staticAccountKeys;
      
      if (accountKeys && accountKeys.length > 0) {
        const firstKey = accountKeys.get ? accountKeys.get(0) : accountKeys[0];
        actualSender = firstKey?.toString();
      }
    }

    if (expectedSender && actualSender && actualSender !== expectedSender) {
      return { 
        valid: false, 
        error: `Sender mismatch: payment was locked to wallet ${expectedSender.slice(0, 8)}... but transaction was sent by ${actualSender.slice(0, 8)}...`,
        senderAddress: actualSender 
      };
    }

    return { valid: true, receivedAmount, senderAddress: actualSender };
  } catch (error) {
    console.error("On-chain verification error:", error);
    return { valid: false, error: "Failed to verify transaction on-chain. Please try again." };
  }
}

async function isTransactionAlreadyUsed(signature: string): Promise<boolean> {
  const existingPayment = await storage.getPaymentBySignature(signature);
  return existingPayment !== undefined && existingPayment.status === "confirmed";
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.post("/api/payments/create", async (req, res) => {
    try {
      const result = initPaymentSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          error: "Invalid payment request", 
          details: result.error.flatten() 
        });
      }

      const { merchantWallet, amount, reference, memo, payerWallet } = result.data;

      const existingPayment = await storage.getPaymentByReference(reference);
      if (existingPayment) {
        if (existingPayment.status === "confirmed") {
          return res.status(400).json({ 
            error: "Payment already completed" 
          });
        }
        
        if (payerWallet && existingPayment.expectedPayer && existingPayment.expectedPayer !== payerWallet) {
          return res.status(400).json({
            error: "This payment is locked to a different wallet",
            lockedWallet: existingPayment.expectedPayer.slice(0, 8) + "...",
          });
        }
        
        if (payerWallet && !existingPayment.expectedPayer) {
          await storage.setExpectedPayer(reference, payerWallet);
          existingPayment.expectedPayer = payerWallet;
        }
        
        return res.status(200).json({
          success: true,
          payment: existingPayment,
          message: "Existing pending payment returned",
        });
      }

      const payment = await storage.createPaymentRequest(
        { merchantWallet, amount, reference, memo },
        payerWallet
      );
      
      return res.status(201).json({
        success: true,
        payment: {
          id: payment.id,
          reference: payment.reference,
          amount: payment.amount,
          merchantWallet: payment.merchantWallet,
          status: payment.status,
          expectedPayer: payment.expectedPayer,
        },
      });
    } catch (error) {
      console.error("Error creating payment:", error);
      return res.status(500).json({ error: "Failed to create payment" });
    }
  });

  app.post("/api/payments/lock", async (req, res) => {
    try {
      const { reference, payerWallet } = req.body;
      
      if (!reference || !payerWallet) {
        return res.status(400).json({ 
          error: "Reference and payer wallet are required" 
        });
      }

      const payment = await storage.getPaymentByReference(reference);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      if (payment.status === "confirmed") {
        return res.status(400).json({ error: "Payment already completed" });
      }

      if (payment.expectedPayer && payment.expectedPayer !== payerWallet) {
        return res.status(400).json({
          error: "Payment already locked to a different wallet",
          lockedWallet: payment.expectedPayer.slice(0, 8) + "...",
        });
      }

      const updatedPayment = await storage.setExpectedPayer(reference, payerWallet);
      
      return res.json({
        success: true,
        payment: updatedPayment,
        message: "Payment locked to your wallet",
      });
    } catch (error) {
      console.error("Error locking payment:", error);
      return res.status(500).json({ error: "Failed to lock payment" });
    }
  });

  app.post("/api/payments/confirm", async (req, res) => {
    try {
      const { reference, signature, senderWallet, paymentType = "PBTC" } = req.body;
      
      if (!reference || !signature) {
        return res.status(400).json({ 
          error: "Reference and signature are required" 
        });
      }

      if (!senderWallet) {
        return res.status(400).json({ 
          error: "Sender wallet is required to verify the payment" 
        });
      }

      const payment = await storage.getPaymentByReference(reference);
      if (!payment) {
        return res.status(404).json({ error: "Payment request not found" });
      }

      if (payment.status === "confirmed" && payment.signature === signature) {
        return res.json({
          success: true,
          payment,
          message: "Payment already confirmed",
        });
      }

      if (payment.status === "confirmed" && payment.signature !== signature) {
        return res.status(400).json({
          success: false,
          error: "This payment was already completed with a different transaction",
        });
      }

      if (payment.expectedPayer && payment.expectedPayer !== senderWallet) {
        return res.status(400).json({
          success: false,
          error: `This payment is locked to wallet ${payment.expectedPayer.slice(0, 8)}... but you're trying to confirm from ${senderWallet.slice(0, 8)}...`,
        });
      }

      const usedByAnother = await isTransactionAlreadyUsed(signature);
      if (usedByAnother) {
        return res.status(400).json({
          success: false,
          error: "This transaction has already been used for another payment",
        });
      }

      const verifyFn = paymentType === "SOL" ? verifySOLTransactionOnChain : verifyPBTCTransactionOnChain;
      const verification = await verifyFn(
        signature,
        payment.merchantWallet,
        payment.amount,
        payment.expectedPayer || senderWallet
      );

      if (!verification.valid) {
        return res.status(400).json({
          success: false,
          error: verification.error || "Transaction verification failed",
          hint: "The transaction could not be verified. This may be because the transaction is still processing, or there was a mismatch with the expected sender/amount.",
        });
      }

      const updatedPayment = await storage.updatePaymentStatus(
        reference, 
        "confirmed", 
        signature
      );

      return res.json({
        success: true,
        payment: updatedPayment,
        verified: true,
        receivedAmount: verification.receivedAmount,
        verifiedSender: verification.senderAddress,
      });
    } catch (error) {
      console.error("Error confirming payment:", error);
      return res.status(500).json({ error: "Failed to confirm payment" });
    }
  });

  app.post("/api/verify-payment", async (req, res) => {
    try {
      const result = verifyPaymentSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          error: "Invalid verification request", 
          details: result.error.flatten() 
        });
      }

      const { reference, merchantWallet, expectedAmount } = result.data;

      const payment = await storage.getPaymentByReference(reference);
      
      if (!payment) {
        return res.json({
          paid: false,
          error: "Payment not found",
        });
      }

      if (payment.merchantWallet !== merchantWallet) {
        return res.json({
          paid: false,
          error: "Merchant wallet mismatch",
        });
      }

      if (expectedAmount !== undefined && payment.amount !== expectedAmount) {
        return res.json({
          paid: false,
          error: "Amount mismatch",
          expected: expectedAmount,
          actual: payment.amount,
        });
      }

      const isPaid = payment.status === "confirmed" && payment.signature;

      if (isPaid && payment.signature) {
        const verification = await verifyPBTCTransactionOnChain(
          payment.signature,
          payment.merchantWallet,
          payment.amount,
          payment.expectedPayer || undefined
        );

        return res.json({
          paid: verification.valid,
          signature: payment.signature,
          amount: payment.amount,
          timestamp: payment.createdAt?.toISOString(),
          status: payment.status,
          verified: verification.valid,
          verificationError: verification.error,
          payer: payment.expectedPayer,
        });
      }

      return res.json({
        paid: false,
        signature: payment.signature,
        amount: payment.amount,
        timestamp: payment.createdAt?.toISOString(),
        status: payment.status,
        expectedPayer: payment.expectedPayer,
      });
    } catch (error) {
      console.error("Error verifying payment:", error);
      return res.status(500).json({ 
        paid: false, 
        error: "Verification failed" 
      });
    }
  });

  app.post("/api/verify-onchain", async (req, res) => {
    try {
      const { signature, merchantWallet, expectedAmount, senderWallet } = req.body;

      if (!signature || !merchantWallet) {
        return res.status(400).json({
          verified: false,
          error: "Signature and merchant wallet are required",
        });
      }

      const verification = await verifyTransactionOnChain(
        signature,
        merchantWallet,
        expectedAmount || 0,
        senderWallet
      );

      return res.json({
        verified: verification.valid,
        error: verification.error,
        amount: verification.receivedAmount,
        senderAddress: verification.senderAddress,
      });
    } catch (error) {
      console.error("Error verifying on-chain:", error);
      return res.status(500).json({
        verified: false,
        error: "Verification failed",
      });
    }
  });

  app.get("/api/payments/:reference", async (req, res) => {
    try {
      const { reference } = req.params;
      const payment = await storage.getPaymentByReference(reference);
      
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      return res.json({ payment });
    } catch (error) {
      console.error("Error fetching payment:", error);
      return res.status(500).json({ error: "Failed to fetch payment" });
    }
  });

  app.get("/api/payments/merchant/:wallet", async (req, res) => {
    try {
      const { wallet } = req.params;
      const payments = await storage.getPaymentsByMerchant(wallet);
      
      return res.json({ payments });
    } catch (error) {
      console.error("Error fetching merchant payments:", error);
      return res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  app.get("/api/config", (_req, res) => {
    return res.json({
      token: {
        symbol: PBTC_CONFIG.symbol,
        name: PBTC_CONFIG.name,
        mint: PBTC_CONFIG.mint,
        decimals: PBTC_CONFIG.decimals,
      },
      network: PBTC_CONFIG.network,
      rpcUrl: rpcUrl,
    });
  });

  return httpServer;
}
