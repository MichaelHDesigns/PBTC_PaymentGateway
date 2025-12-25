# @pbtc/payments

Non-custodial payment gateway for PBTC and SOL on Solana.

## Installation

```bash
npm install @pbtc/payments
```

## Usage

```jsx
import { PBTCCheckout, PBTCCheckoutButton } from '@pbtc/payments';

// Simple button that opens checkout modal
function App() {
  return (
    <PBTCCheckoutButton
      amount={25}
      merchantWallet="YOUR_SOLANA_WALLET"
      reference="ORDER_123"
      onSuccess={(signature) => console.log('Paid:', signature)}
      solAmount={0.1} // Optional: Enable SOL payments
    />
  );
}

// Or use the modal directly
function App() {
  const [open, setOpen] = useState(false);
  
  return (
    <>
      <button onClick={() => setOpen(true)}>Pay Now</button>
      <PBTCCheckout
        open={open}
        onOpenChange={setOpen}
        amount={25}
        merchantWallet="YOUR_SOLANA_WALLET"
        reference="ORDER_123"
        onSuccess={(signature) => console.log('Paid:', signature)}
        solAmount={0.1}
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
| `reference` | string | Yes | Unique payment reference |
| `memo` | string | No | Payment description |
| `onSuccess` | function | No | Called with signature on success |
| `onError` | function | No | Called with error on failure |
| `solAmount` | number | No | If set, enables SOL payment option |

## Utilities

```js
import { sendPBTCPayment, sendSOLPayment, getConnection } from '@pbtc/payments';

// Direct PBTC transfer
const result = await sendPBTCPayment(recipientWallet, amount, memo);

// Direct SOL transfer
const result = await sendSOLPayment(recipientWallet, amount);

// Get Solana connection
const connection = getConnection();
```

## License

MIT
