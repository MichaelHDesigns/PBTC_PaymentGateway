# PBTC Payment Gateway

A non-custodial payment gateway for Purple Bitcoin (PBTC) SPL token and native SOL on Solana.

![PBTC Logo](attached_assets/pbtc_1766635861226.png)

## Quick Start

1. Clone the repository
2. Run `npm install`
3. Run `npm run dev`
4. Open http://localhost:5000

## Features

- **Non-custodial**: Users pay directly from their wallet to merchant wallets
- **Dual Currency**: Accept both PBTC (SPL token) and native SOL
- **Mobile Responsive**: Works on all devices
- **On-chain Verification**: Backend API to verify payments
- **Security**: Wallet locking, transaction replay prevention, sender verification

## Using the Checkout Component

Add payments to any page:

```jsx
import { PBTCCheckout } from "@/components/pbtc-checkout";
import { useState } from "react";

function MyPage() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>Pay Now</button>
      
      <PBTCCheckout
        open={open}
        onOpenChange={setOpen}
        merchantWallet="YOUR_SOLANA_WALLET"
        amount={25}
        reference="ORDER_123"
        memo="Payment for order"
        onSuccess={(signature) => console.log("Paid:", signature)}
        onError={(error) => console.error("Error:", error)}
        solAmount={0.1}  // Optional: enables SOL payment option
      />
    </>
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `amount` | number | Yes | Amount in PBTC |
| `merchantWallet` | string | Yes | Solana wallet to receive payment |
| `reference` | string | Yes | Unique order/payment reference |
| `memo` | string | No | Payment description |
| `onSuccess` | function | No | Called with signature on success |
| `onError` | function | No | Called with error on failure |
| `solAmount` | number | No | If set, enables SOL payment option |

## API Endpoints

### POST /api/payments/create
Create a new payment request.

### POST /api/payments/confirm
Confirm a payment after transaction.

### POST /api/verify-payment
Verify a payment by reference.

### POST /api/verify-onchain
Verify a transaction directly on-chain.

## PBTC Token

- **Mint**: `HfMbPyDdZH6QMaDDUokjYCkHxzjoGBMpgaUvpLWGbF5p`
- **Decimals**: 9
- **Network**: Solana mainnet-beta

## Wallet Support

Supports **Phantom Wallet**. Users need Phantom installed to make payments.

## License

MIT

## Links

- [GitHub](https://github.com/MichaelHDesigns/PBTC_PaymentGateway)
- [PBTC on Solscan](https://solscan.io/token/HfMbPyDdZH6QMaDDUokjYCkHxzjoGBMpgaUvpLWGbF5p)
