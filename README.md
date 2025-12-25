# PBTC Payment Gateway

A non-custodial payment gateway for Purple Bitcoin (PBTC) SPL token and native SOL on Solana.

![PBTC Logo](attached_assets/pbtc_1766635861226.png)

## Features

- **Non-custodial**: Users pay directly from their wallet to merchant wallets
- **Dual Currency**: Accept both PBTC (SPL token) and native SOL
- **Mobile Responsive**: Works on all devices
- **On-chain Verification**: Backend API to verify payments
- **Security**: Wallet locking, transaction replay prevention, sender verification

## Quick Start

### Run the Demo

```bash
git clone https://github.com/MichaelHDesigns/PBTC_PaymentGateway
cd PBTC_PaymentGateway
npm install
npm run dev
```

Open http://localhost:5000 to see the demo.

---

## Integrate Into Your Project

### Step 1: Copy Component Files

Copy these files from the cloned repo into your project:

```
client/src/components/pbtc-checkout.tsx
client/src/lib/wallet-context.tsx
shared/schema.ts
```

### Step 2: Install Dependencies

```bash
npm install @solana/web3.js @solana/spl-token bs58 buffer
```

### Step 3: Use the Component

```jsx
import { PBTCCheckout } from "./components/pbtc-checkout";
import { useState } from "react";

function CheckoutPage() {
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

### Step 4: Verify Payments (Backend)

```javascript
const response = await fetch('/api/verify-payment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    reference: 'ORDER_123',
    merchantWallet: 'YOUR_WALLET',
    expectedAmount: 25
  })
});

const { paid, signature } = await response.json();
if (paid) {
  // Unlock content, fulfill order, etc.
}
```

---

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
