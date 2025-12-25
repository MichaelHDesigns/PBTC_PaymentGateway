# PBTC Payment Gateway

A non-custodial payment gateway for Purple Bitcoin (PBTC) SPL token and native SOL on Solana.

## Overview

This is a React application providing a payment checkout for PBTC or SOL payments. 

**Quick Start:** Run `npm install` then `npm run dev`

Key features:
- **Non-custodial**: Users pay directly from their wallet to merchant wallets
- **Dual currency**: Accept both PBTC (SPL token) and native SOL
- **Mobile responsive**: Works on all devices
- **On-chain verification**: Backend API to verify payments
- **No KYC required**: Permissionless payments

## Project Architecture

### Frontend (client/)
- **React + TypeScript** with Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **State**: TanStack Query for server state
- **Routing**: Wouter

### Backend (server/)
- **Express.js** API server
- **In-memory storage** for payment tracking
- **Solana web3.js** for on-chain verification

### Key Files
- `client/src/components/pbtc-checkout.tsx` - Main checkout modal component
- `client/src/components/transaction-status.tsx` - Transaction status display
- `client/src/pages/landing.tsx` - Demo landing page
- `client/src/lib/wallet-context.tsx` - Phantom wallet integration
- `server/routes.ts` - Payment API endpoints
- `shared/schema.ts` - Data types and PBTC configuration

## API Endpoints

### POST /api/payments/create
Create a new payment request. Optionally locks the payment to a specific payer wallet.
```json
{
  "merchantWallet": "WALLET_ADDRESS",
  "amount": 25,
  "reference": "ORDER_123",
  "memo": "Payment description",
  "payerWallet": "PAYER_WALLET_ADDRESS",
  "paymentType": "PBTC"
}
```
- `paymentType`: Either "PBTC" (default) or "SOL"

### POST /api/payments/lock
Lock an existing payment to a specific payer wallet (security feature to prevent replay attacks).
```json
{
  "reference": "ORDER_123",
  "payerWallet": "PAYER_WALLET_ADDRESS"
}
```

### POST /api/payments/confirm
Confirm a payment after transaction. Backend verifies the sender matches the locked wallet and payment type.
```json
{
  "reference": "ORDER_123",
  "signature": "TRANSACTION_SIGNATURE",
  "senderWallet": "PAYER_WALLET_ADDRESS",
  "paymentType": "PBTC"
}
```
- The server validates that the `paymentType` matches what was specified during payment creation

### POST /api/verify-payment
Verify a payment by reference
```json
{
  "reference": "ORDER_123",
  "merchantWallet": "WALLET_ADDRESS",
  "expectedAmount": 25
}
```

### POST /api/verify-onchain
Verify a transaction on-chain
```json
{
  "signature": "TRANSACTION_SIGNATURE",
  "merchantWallet": "WALLET_ADDRESS",
  "expectedAmount": 25
}
```

## PBTC Token Configuration

Located in `shared/schema.ts`:
- Mint Address: `HfMbPyDdZH6QMaDDUokjYCkHxzjoGBMpgaUvpLWGbF5p`
- Decimals: 9
- Network: Solana mainnet-beta

## Security Features

The payment gateway includes several security measures to prevent fraud:

1. **Wallet Locking**: Payments are locked to specific payer wallets at creation time. Only the locked wallet can confirm the payment.
2. **Transaction Replay Prevention**: Each transaction signature can only be used for one payment. The backend tracks used signatures.
3. **Sender Verification**: On-chain verification checks that the actual sender in the transaction matches the expected payer.
4. **Amount Verification**: The exact expected amount is verified against the on-chain transfer.
5. **Duplicate Prevention**: Same reference cannot be used for multiple payments.

## Development

Run with: `npm run dev`

The app runs on port 5000 with hot reload enabled.

## Design System

- Purple-themed color palette (hue 271)
- Inter font for UI, JetBrains Mono for code/addresses
- Dark mode support with system preference detection
- See `design_guidelines.md` for detailed design specifications
