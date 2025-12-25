# PBTC Payment Gateway

A non-custodial payment gateway for Purple Bitcoin (PBTC) SPL token and native SOL on Solana.

![PBTC Logo](attached_assets/pbtc_1766635861226.png)

## Overview

PBTC Pay is a drop-in payment solution for accepting PBTC or SOL payments directly to your wallet. No intermediaries, no custody, no KYC.

### Key Features

- **Non-custodial**: Users pay directly from their wallet to merchant wallets
- **Dual Currency**: Accept both PBTC (SPL token) and native SOL
- **Developer-friendly**: Simple React component with easy integration
- **On-chain Verification**: Backend API endpoints to verify payments on-chain
- **Security**: Wallet locking, transaction replay prevention, sender verification
- **Mobile Responsive**: Works on all devices

## Quick Start

### Installation

```bash
npm install
```

### Running the Application

```bash
npm run dev
```

The app runs on port 5000 with hot reload enabled.

## Integration Guide

### React Component

Add the checkout component to your application:

```jsx
import { PBTCCheckout } from "@/components/pbtc-checkout";

function MyApp() {
  return (
    <PBTCCheckout
      amount={25}
      merchantWallet="YOUR_SOLANA_WALLET_ADDRESS"
      reference="ORDER_123"
      memo="Payment for order"
      onSuccess={(signature) => console.log("Paid:", signature)}
      onError={(error) => console.error("Error:", error)}
      solAmount={0.1} // Optional: Enable SOL payments
    />
  );
}
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `amount` | number | Yes | Amount in PBTC |
| `merchantWallet` | string | Yes | Solana wallet address to receive payment |
| `reference` | string | Yes | Unique order/payment reference |
| `memo` | string | No | Payment memo/description |
| `onSuccess` | function | No | Callback when payment succeeds |
| `onError` | function | No | Callback when payment fails |
| `solAmount` | number | No | If provided, enables SOL payment option |

## API Endpoints

### POST /api/payments/create

Create a new payment request.

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

**paymentType**: Either `"PBTC"` (default) or `"SOL"`

### POST /api/payments/confirm

Confirm a payment after transaction.

```json
{
  "reference": "ORDER_123",
  "signature": "TRANSACTION_SIGNATURE",
  "senderWallet": "PAYER_WALLET_ADDRESS",
  "paymentType": "PBTC"
}
```

### POST /api/verify-payment

Verify a payment by reference.

```json
{
  "reference": "ORDER_123",
  "merchantWallet": "WALLET_ADDRESS",
  "expectedAmount": 25
}
```

**Response:**

```json
{
  "paid": true,
  "signature": "TRANSACTION_SIGNATURE",
  "amount": 25,
  "verified": true
}
```

### POST /api/verify-onchain

Verify a transaction directly on-chain.

```json
{
  "signature": "TRANSACTION_SIGNATURE",
  "merchantWallet": "WALLET_ADDRESS",
  "expectedAmount": 25
}
```

## Security Features

1. **Wallet Locking**: Payments are locked to specific payer wallets at creation time
2. **Transaction Replay Prevention**: Each transaction signature can only be used once
3. **Sender Verification**: On-chain verification checks the actual sender matches expected payer
4. **Amount Verification**: Exact expected amount is verified against on-chain transfer
5. **Payment Type Validation**: Server validates payment type matches what was specified during creation

## PBTC Token Configuration

- **Mint Address**: `PBTCz8mujDAFSiSSoVF1c2hc2YfgSBc4zVNHqeEZzzy`
- **Decimals**: 9
- **Network**: Solana mainnet-beta

## Tech Stack

### Frontend
- React + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- TanStack Query
- Wouter (routing)

### Backend
- Express.js
- Solana web3.js
- In-memory storage (can be extended to database)

## Wallet Support

Currently supports **Phantom Wallet**. Users need Phantom installed to make payments.

## Environment Variables

No API keys required! The gateway uses public Solana RPC endpoints.

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Links

- [GitHub Repository](https://github.com/MichaelHDesigns/PBTC_PaymentGateway)
- [PBTC Token on Solscan](https://solscan.io/token/PBTCz8mujDAFSiSSoVF1c2hc2YfgSBc4zVNHqeEZzzy)
