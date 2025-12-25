import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import tokensConfig from "./tokens.json";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Token Configuration Types
export interface TokenConfig {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  type: "native" | "spl";
  mintAddress: string | null;
  icon: string;
}

// Export tokens from config
export const SUPPORTED_TOKENS: TokenConfig[] = tokensConfig.tokens as TokenConfig[];

// Get token by ID
export function getTokenById(id: string): TokenConfig | undefined {
  return SUPPORTED_TOKENS.find(t => t.id === id);
}

// Get token by symbol
export function getTokenBySymbol(symbol: string): TokenConfig | undefined {
  return SUPPORTED_TOKENS.find(t => t.symbol.toLowerCase() === symbol.toLowerCase());
}

// Get SPL tokens only
export function getSPLTokens(): TokenConfig[] {
  return SUPPORTED_TOKENS.filter(t => t.type === "spl");
}

// Payment Types - now supports any token ID
export type PaymentType = string;

// Payment Request Table
export const paymentRequests = pgTable("payment_requests", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  merchantWallet: text("merchant_wallet").notNull(),
  amount: real("amount").notNull(),
  reference: text("reference").notNull().unique(),
  memo: text("memo"),
  status: text("status").notNull().default("pending"),
  signature: text("signature"),
  expectedPayer: text("expected_payer"),
  paymentType: text("payment_type").notNull().default("pbtc"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPaymentRequestSchema = createInsertSchema(
  paymentRequests,
).omit({
  id: true,
  createdAt: true,
  signature: true,
  status: true,
  expectedPayer: true,
  paymentType: true,
});

export const initPaymentSchema = z.object({
  merchantWallet: z.string().min(32, "Valid Solana wallet address required"),
  amount: z.number().positive("Amount must be positive"),
  reference: z.string().min(1, "Reference is required"),
  memo: z.string().optional(),
  payerWallet: z.string().min(32, "Payer wallet is required").optional(),
  paymentType: z.string().default("pbtc"),
});

export type InsertPaymentRequest = z.infer<typeof insertPaymentRequestSchema>;
export type PaymentRequest = typeof paymentRequests.$inferSelect;

// Payment verification request/response types
export const verifyPaymentSchema = z.object({
  reference: z.string().min(1, "Reference is required"),
  merchantWallet: z.string().min(32, "Valid Solana wallet address required"),
  expectedAmount: z.number().optional(),
});

export type VerifyPaymentRequest = z.infer<typeof verifyPaymentSchema>;

export interface VerifyPaymentResponse {
  paid: boolean;
  signature?: string;
  amount?: number;
  timestamp?: string;
  error?: string;
}

// Payment checkout props - now with token amounts map
export interface TokenAmounts {
  [tokenId: string]: number;
}

export interface PBTCCheckoutProps {
  amount: number;
  merchantWallet: string;
  reference: string;
  memo?: string;
  onSuccess?: (signature: string) => void;
  onError?: (error: Error) => void;
  onCancel?: () => void;
  tokenAmounts?: TokenAmounts;
  enabledTokens?: string[];
}

// Transaction status types
export type TransactionStatus =
  | "pending"
  | "processing"
  | "confirmed"
  | "failed";

export interface TransactionDetails {
  signature: string;
  status: TransactionStatus;
  amount: number;
  merchantWallet: string;
  reference: string;
  timestamp?: string;
  confirmations?: number;
  tokenId?: string;
}

// Legacy PBTC Config for backward compatibility
export const PBTC_CONFIG = {
  mint: "HfMbPyDdZH6QMaDDUokjYCkHxzjoGBMpgaUvpLWGbF5p",
  decimals: 9,
  symbol: "PBTC",
  name: "Purple Bitcoin",
  network: "mainnet-beta" as const,
  rpcUrl: "https://solana-rpc.publicnode.com",
};

export function getServerRpcUrl(): string {
  return PBTC_CONFIG.rpcUrl;
}
