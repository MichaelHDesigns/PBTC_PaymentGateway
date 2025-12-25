# PBTC Payment Gateway

A non-custodial payment gateway for Solana SPL tokens and native SOL.

![PBTC Logo](attached_assets/pbtc_1766635861226.png)

## Features

- **Non-custodial**: Users pay directly from their wallet to merchant wallets
- **Multi-Token Support**: Accept SOL, PBTC, USDC, ARMY, BULLISH, SILVER (configurable via tokens.json)
- **Mobile Responsive**: Fully responsive design works on all devices
- **ID Card Style Checkout**: Sleek payment modal with gradient header design
- **Token Selector**: Users choose which token to pay with from a dropdown
- **On-chain Verification**: Backend API to verify payments
- **Security**: Wallet locking, transaction replay prevention, sender verification
- **Legal Pages**: Includes Terms of Service and Privacy Policy pages

## Supported Tokens

Configure tokens in `shared/tokens.json`. Default supported tokens:

| Token | Symbol | Type | Program | Mint Address |
|-------|--------|------|---------|--------------|
| Solana | SOL | Native | - | - |
| Purple Bitcoin | PBTC | SPL | spl-token | `HfMbPyDdZH6QMaDDUokjYCkHxzjoGBMpgaUvpLWGbF5p` |
| USD Coin | USDC | SPL | spl-token | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` |
| Army Gang | ARMY | SPL | token-2022 | `CQkZbu9s3ZZMusqAfh4Cpp8fBu1rKnntvvW1XS1zpump` |
| Bullish Degen | BULLISH | SPL | spl-token | `C2omVhcvt3DDY77S2KZzawFJQeETZofgZ4eNWWkXpump` |
| Silver Coin | SILVER | SPL | token-2022 | `DVguBpgnixDwVcM654YiaLCMNiY2cdUYJXJK3u9Gpump` |

### Token Programs

The gateway supports both Solana token programs:

- **spl-token**: The original SPL Token Program (most tokens including USDC, PBTC)
- **token-2022**: The Token Extensions Program (newer tokens, often from pump.fun)

## Pages

- `/` - Landing page with live demo
- `/terms` - Terms of Service
- `/privacy` - Privacy Policy

## Quick Start

### Clone the Repository

```bash
git clone https://github.com/MichaelHDesigns/PBTC_PaymentGateway
cd PBTC_PaymentGateway
```

### Install and Run (Development)

```bash
npm install && npm run dev
```

### Install and Run (Production)

```bash
npm install && npm run build && npm start
```

Open http://localhost:5000 to see the demo.

---

## Token Configuration (tokens.json)

All supported tokens are defined in `shared/tokens.json`. This makes it easy to add, remove, or modify tokens without changing code.

### tokens.json Structure

```json
{
  "tokens": [
    {
      "id": "sol",
      "name": "Solana",
      "symbol": "SOL",
      "decimals": 9,
      "type": "native",
      "mintAddress": null,
      "icon": "solana",
      "tokenProgram": null
    },
    {
      "id": "pbtc",
      "name": "Purple Bitcoin",
      "symbol": "PBTC",
      "decimals": 9,
      "type": "spl",
      "mintAddress": "HfMbPyDdZH6QMaDDUokjYCkHxzjoGBMpgaUvpLWGbF5p",
      "icon": "pbtc",
      "tokenProgram": "spl-token"
    },
    {
      "id": "usdc",
      "name": "USD Coin",
      "symbol": "USDC",
      "decimals": 6,
      "type": "spl",
      "mintAddress": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      "icon": "usdc",
      "tokenProgram": "spl-token"
    },
    {
      "id": "army",
      "name": "Army Gang",
      "symbol": "ARMY",
      "decimals": 6,
      "type": "spl",
      "mintAddress": "CQkZbu9s3ZZMusqAfh4Cpp8fBu1rKnntvvW1XS1zpump",
      "icon": "army",
      "tokenProgram": "token-2022"
    },
    {
      "id": "bullish",
      "name": "Bullish Degen",
      "symbol": "BULLISH",
      "decimals": 6,
      "type": "spl",
      "mintAddress": "C2omVhcvt3DDY77S2KZzawFJQeETZofgZ4eNWWkXpump",
      "icon": "bullish",
      "tokenProgram": "spl-token"
    },
    {
      "id": "silver",
      "name": "Silver Coin",
      "symbol": "SILVER",
      "decimals": 6,
      "type": "spl",
      "mintAddress": "DVguBpgnixDwVcM654YiaLCMNiY2cdUYJXJK3u9Gpump",
      "icon": "silver",
      "tokenProgram": "token-2022"
    }
  ]
}
```

### Token Configuration Fields

| Field | Description |
|-------|-------------|
| `id` | Unique identifier used in code (lowercase) |
| `name` | Display name shown to users |
| `symbol` | Token ticker symbol |
| `decimals` | Token decimal places (9 for SOL/PBTC, 6 for USDC/USDT) |
| `type` | `"native"` for SOL, `"spl"` for SPL tokens |
| `mintAddress` | SPL token mint address (null for SOL) |
| `icon` | Icon identifier for styling |
| `tokenProgram` | `"spl-token"` for regular SPL, `"token-2022"` for Token Extensions, `null` for native SOL |

### Adding a New Token

1. Open `shared/tokens.json`
2. Add a new token object to the `tokens` array:

```json
{
  "id": "mytoken",
  "name": "My Token",
  "symbol": "MTK",
  "decimals": 9,
  "type": "spl",
  "mintAddress": "YOUR_TOKEN_MINT_ADDRESS",
  "icon": "mytoken",
  "tokenProgram": "spl-token"
}
```

**Note**: Check the token on Solscan to determine the correct `tokenProgram`:
- If "Owner Program" shows "Token Program" use `"spl-token"`
- If "Owner Program" shows "Token 2022 Program" use `"token-2022"`

3. Optionally add an icon in `pbtc-checkout.tsx` TokenIcon component
4. Rebuild and restart the app

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
    sol: 0.1,       // 0.1 SOL
    pbtc: 25,       // 25 PBTC  
    usdc: 10,       // 10 USDC
    army: 1000,     // 1000 ARMY
    bullish: 500,   // 500 BULLISH
    silver: 100,    // 100 SILVER
  }}
  enabledTokens={["sol", "pbtc", "usdc", "army", "bullish", "silver"]}
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

## Wallet Support

Supports **Phantom Wallet**. Users need Phantom installed to make payments.

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, Node.js
- **Blockchain**: Solana web3.js, SPL Token

## Scripts

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run dev` | Start development server with hot reload |

## License

MIT License - See [LICENSE](LICENSE) file for details.

### Attribution

This project was created by **MichaelHDesigns**. If you use this payment gateway in your project, we kindly ask that you credit the original author. A simple mention in your README, documentation, or credits page is appreciated!

## Links

- [GitHub](https://github.com/MichaelHDesigns/PBTC_PaymentGateway)
- [PBTC on Solscan](https://solscan.io/token/HfMbPyDdZH6QMaDDUokjYCkHxzjoGBMpgaUvpLWGbF5p)
