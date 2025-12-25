import { type User, type InsertUser, type PaymentRequest, type InsertPaymentRequest } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createPaymentRequest(payment: InsertPaymentRequest, expectedPayer?: string, paymentType?: string): Promise<PaymentRequest>;
  getPaymentByReference(reference: string): Promise<PaymentRequest | undefined>;
  getPaymentBySignature(signature: string): Promise<PaymentRequest | undefined>;
  updatePaymentStatus(reference: string, status: string, signature?: string): Promise<PaymentRequest | undefined>;
  updatePaymentType(reference: string, paymentType: string): Promise<PaymentRequest | undefined>;
  setExpectedPayer(reference: string, payerWallet: string): Promise<PaymentRequest | undefined>;
  getPaymentsByMerchant(merchantWallet: string): Promise<PaymentRequest[]>;
  getAllPayments(): Promise<PaymentRequest[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private payments: Map<string, PaymentRequest>;
  private signatureIndex: Map<string, string>;

  constructor() {
    this.users = new Map();
    this.payments = new Map();
    this.signatureIndex = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createPaymentRequest(payment: InsertPaymentRequest, expectedPayer?: string, paymentType?: string): Promise<PaymentRequest> {
    const id = randomUUID();
    const paymentRequest: PaymentRequest = {
      id,
      merchantWallet: payment.merchantWallet,
      amount: payment.amount,
      reference: payment.reference,
      memo: payment.memo || null,
      status: "pending",
      signature: null,
      expectedPayer: expectedPayer || null,
      paymentType: paymentType || "PBTC",
      createdAt: new Date(),
    };
    this.payments.set(payment.reference, paymentRequest);
    return paymentRequest;
  }

  async getPaymentByReference(reference: string): Promise<PaymentRequest | undefined> {
    return this.payments.get(reference);
  }

  async getPaymentBySignature(signature: string): Promise<PaymentRequest | undefined> {
    const reference = this.signatureIndex.get(signature);
    if (reference) {
      return this.payments.get(reference);
    }
    return undefined;
  }

  async updatePaymentStatus(
    reference: string, 
    status: string, 
    signature?: string
  ): Promise<PaymentRequest | undefined> {
    const payment = this.payments.get(reference);
    if (!payment) return undefined;
    
    payment.status = status;
    if (signature) {
      payment.signature = signature;
      this.signatureIndex.set(signature, reference);
    }
    this.payments.set(reference, payment);
    return payment;
  }

  async setExpectedPayer(reference: string, payerWallet: string): Promise<PaymentRequest | undefined> {
    const payment = this.payments.get(reference);
    if (!payment) return undefined;
    
    if (payment.expectedPayer && payment.expectedPayer !== payerWallet) {
      return undefined;
    }
    
    payment.expectedPayer = payerWallet;
    this.payments.set(reference, payment);
    return payment;
  }

  async updatePaymentType(reference: string, paymentType: string): Promise<PaymentRequest | undefined> {
    const payment = this.payments.get(reference);
    if (!payment) return undefined;
    
    payment.paymentType = paymentType;
    this.payments.set(reference, payment);
    return payment;
  }

  async getPaymentsByMerchant(merchantWallet: string): Promise<PaymentRequest[]> {
    if (!merchantWallet) {
      return Array.from(this.payments.values());
    }
    return Array.from(this.payments.values()).filter(
      (payment) => payment.merchantWallet === merchantWallet
    );
  }

  async getAllPayments(): Promise<PaymentRequest[]> {
    return Array.from(this.payments.values());
  }
}

export const storage = new MemStorage();
