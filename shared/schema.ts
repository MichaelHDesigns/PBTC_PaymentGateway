import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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

// PBTC Payment Types
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
});

export const initPaymentSchema = z.object({
  merchantWallet: z.string().min(32, "Valid Solana wallet address required"),
  amount: z.number().positive("Amount must be positive"),
  reference: z.string().min(1, "Reference is required"),
  memo: z.string().optional(),
  payerWallet: z.string().min(32, "Payer wallet is required").optional(),
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

// Payment checkout props
export interface PBTCCheckoutProps {
  amount: number;
  merchantWallet: string;
  reference: string;
  memo?: string;
  onSuccess?: (signature: string) => void;
  onError?: (error: Error) => void;
  onCancel?: () => void;
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
}

// PBTC Token Configuration
export const PBTC_CONFIG = {
  mint: "HfMbPyDdZH6QMaDDUokjYCkHxzjoGBMpgaUvpLWGbF5p", // Purple Bitcoin mint address
  decimals: 9,
  symbol: "PBTC",
  name: "Purple Bitcoin",
  network: "mainnet-beta" as const,
  rpcUrl: "https://solana-rpc.publicnode.com",
};

export function getServerRpcUrl(): string {
  return PBTC_CONFIG.rpcUrl;
}
