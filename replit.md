# PBTC Payment Gateway

A non-custodial payment gateway for Solana SPL tokens and native SOL.

## Overview

This is a React application providing a payment checkout for multiple Solana tokens. 

**Quick Start:** Run `npm install` then `npm run build` then `npm start`

Key features:
- **Non-custodial**: Users pay directly from their wallet to merchant wallets
- **Multi-token support**: Accept SOL, PBTC, USDC, ARMY, BULLISH, SILVER (configurable via tokens.json)
- **Mobile responsive**: Works on all devices
- **On-chain verification**: Backend API to verify payments
- **No KYC required**: Permissionless payments

## Supported Tokens

Configured in `shared/tokens.json`:
- SOL (native Solana)
- PBTC (Purple Bitcoin) - Mint: `HfMbPyDdZH6QMaDDUokjYCkHxzjoGBMpgaUvpLWGbF5p`
- USDC - Mint: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
- ARMY (Army Gang) - Mint: `CQkZbu9s3ZZMusqAfh4Cpp8fBu1rKnntvvW1XS1zpump`
- BULLISH (Bullish Degen) - Mint: `C2omVhcvt3DDY77S2KZzawFJQeETZofgZ4eNWWkXpump`
- SILVER (Silver Coin) - Mint: `DVguBpgnixDwVcM654YiaLCMNiY2cdUYJXJK3u9Gpump`

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
- `client/src/components/pbtc-checkout.tsx` - Main checkout modal component with token selector
- `client/src/components/transaction-status.tsx` - Transaction status display
- `client/src/pages/landing.tsx` - Demo landing page
- `client/src/lib/wallet-context.tsx` - Phantom wallet integration
- `client/src/lib/solana-utils.ts` - Solana token transfer utilities
- `server/routes.ts` - Payment API endpoints
- `shared/schema.ts` - Data types and token configuration
- `shared/tokens.json` - Token definitions (add/remove tokens here)

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
  "paymentType": "pbtc"
}
```
- `paymentType`: Token ID from tokens.json (e.g., "sol", "pbtc", "usdc", "army", "bullish", "silver")

### POST /api/payments/lock
Lock an existing payment to a specific payer wallet (security feature to prevent replay attacks).
```json
{
  "reference": "ORDER_123",
  "payerWallet": "PAYER_WALLET_ADDRESS"
}
```

### POST /api/payments/confirm
Confirm a payment after transaction. Backend verifies the sender matches the locked wallet.
```json
{
  "reference": "ORDER_123",
  "signature": "TRANSACTION_SIGNATURE",
  "senderWallet": "PAYER_WALLET_ADDRESS",
  "paymentType": "pbtc"
}
```

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

## Security Features

The payment gateway includes several security measures to prevent fraud:

1. **Wallet Locking**: Payments are locked to specific payer wallets at creation time. Only the locked wallet can confirm the payment.
2. **Transaction Replay Prevention**: Each transaction signature can only be used for one payment. The backend tracks used signatures.
3. **Sender Verification**: On-chain verification checks that the actual sender in the transaction matches the expected payer.
4. **Amount Verification**: The exact expected amount is verified against the on-chain transfer.
5. **Duplicate Prevention**: Same reference cannot be used for multiple payments.

## Development

### Scripts

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run dev` | Start development server with hot reload |

The app runs on port 5000.

## Design System

- Purple-themed color palette (hue 271)
- Inter font for UI, JetBrains Mono for code/addresses
- Dark mode support with system preference detection
- See `design_guidelines.md` for detailed design specifications
