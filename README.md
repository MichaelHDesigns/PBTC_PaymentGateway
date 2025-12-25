# PBTC Payment Gateway

A non-custodial payment gateway for Solana SPL tokens including PBTC, USDC, USDT, and native SOL.

![PBTC Logo](attached_assets/pbtc_1766635861226.png)

## Features

- **Non-custodial**: Users pay directly from their wallet to merchant wallets
- **Multi-Token Support**: Accept SOL, PBTC, USDC, USDT (configurable via tokens.json)
- **Mobile Responsive**: Fully responsive design works on all devices
- **ID Card Style Checkout**: Sleek payment modal with gradient header design
- **Token Selector**: Users choose which token to pay with from a dropdown
- **On-chain Verification**: Backend API to verify payments
- **Security**: Wallet locking, transaction replay prevention, sender verification
- **Legal Pages**: Includes Terms of Service and Privacy Policy pages

## Supported Tokens

| Token | Symbol | Type | Decimals |
|-------|--------|------|----------|
| Solana | SOL | Native | 9 |
| Purple Bitcoin | PBTC | SPL | 9 |
| USD Coin | USDC | SPL | 6 |
| Tether USD | USDT | SPL | 6 |

Tokens are configured in `shared/tokens.json`. Add or remove tokens by editing this file.

## Pages

- `/` - Landing page with live demo
- `/terms` - Terms of Service
- `/privacy` - Privacy Policy

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
client/src/lib/solana-utils.ts
shared/schema.ts
shared/tokens.json
```

### Step 2: Install Dependencies

```bash
npm install @solana/web3.js @solana/spl-token bs58 buffer
```

### Step 3: Wrap Your App with WalletProvider

```jsx
import { WalletProvider } from "./lib/wallet-context";

function App() {
  return (
    <WalletProvider>
      <YourApp />
    </WalletProvider>
  );
}
```

### Step 4: Use the Component

#### Basic Usage (PBTC only)

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
      />
    </>
  );
}
```

#### Multi-Token Support

```jsx
<PBTCCheckout
  open={open}
  onOpenChange={setOpen}
  merchantWallet="YOUR_SOLANA_WALLET"
  amount={25}
  reference="ORDER_123"
  tokenAmounts={{
    sol: 0.1,      // 0.1 SOL
    pbtc: 25,      // 25 PBTC  
    usdc: 10,      // 10 USDC
    usdt: 10,      // 10 USDT
  }}
  enabledTokens={["sol", "pbtc", "usdc", "usdt"]}
  onSuccess={(signature) => console.log("Paid:", signature)}
/>
```

### Step 5: Verify Payments (Backend)

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
| `open` | boolean | Yes | Controls modal visibility |
| `onOpenChange` | function | Yes | Called when modal should open/close |
| `amount` | number | Yes | Default amount (used when tokenAmounts not set) |
| `merchantWallet` | string | Yes | Solana wallet to receive payment |
| `reference` | string | Yes | Unique order/payment reference |
| `memo` | string | No | Payment description |
| `onSuccess` | function | No | Called with signature on success |
| `onError` | function | No | Called with error on failure |
| `onCancel` | function | No | Called when user cancels payment |
| `tokenAmounts` | object | No | Amount per token ID: `{ sol: 0.1, pbtc: 25, usdc: 10 }` |
| `enabledTokens` | string[] | No | Array of token IDs to enable: `["sol", "pbtc", "usdc"]` |
| `solAmount` | number | No | Legacy: If set, enables SOL payment option |

## Adding Custom Tokens

Edit `shared/tokens.json` to add new SPL tokens:

```json
{
  "tokens": [
    {
      "id": "mytoken",
      "name": "My Token",
      "symbol": "MTK",
      "decimals": 9,
      "type": "spl",
      "mintAddress": "YOUR_TOKEN_MINT_ADDRESS",
      "icon": "mytoken"
    }
  ]
}
```

## Token Configuration

Located in `shared/tokens.json`:

| Field | Description |
|-------|-------------|
| `id` | Unique identifier used in code |
| `name` | Display name |
| `symbol` | Token ticker symbol |
| `decimals` | Token decimal places |
| `type` | `"native"` for SOL, `"spl"` for SPL tokens |
| `mintAddress` | SPL token mint address (null for SOL) |
| `icon` | Icon identifier |

## Wallet Support

Supports **Phantom Wallet**. Users need Phantom installed to make payments.

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, Node.js
- **Blockchain**: Solana web3.js, SPL Token

## License

MIT

## Links

- [GitHub](https://github.com/MichaelHDesigns/PBTC_PaymentGateway)
- [PBTC on Solscan](https://solscan.io/token/HfMbPyDdZH6QMaDDUokjYCkHxzjoGBMpgaUvpLWGbF5p)
