import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWallet, truncateAddress } from "@/lib/wallet-context";
import { sendPBTCPayment } from "@/lib/solana-utils";
import { useToast } from "@/hooks/use-toast";
import { PBTC_CONFIG, type PBTCCheckoutProps, type TransactionStatus } from "@shared/schema";
import { Wallet, Copy, Check, ExternalLink, Shield, Loader2, AlertCircle, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface CheckoutModalProps extends PBTCCheckoutProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PBTCCheckout({
  amount,
  merchantWallet,
  reference,
  memo,
  onSuccess,
  onError,
  onCancel,
  open,
  onOpenChange,
}: CheckoutModalProps) {
  const { connected, connecting, publicKey, connect, isPhantomInstalled } = useWallet();
  const { toast } = useToast();
  const [status, setStatus] = useState<TransactionStatus>("pending");
  const [signature, setSignature] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const copyToClipboard = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please copy manually",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handlePayment = useCallback(async () => {
    if (!connected || !publicKey) {
      await connect();
      return;
    }

    setProcessing(true);
    setStatus("processing");
    setErrorMessage(null);

    try {
      const createResponse = await apiRequest("POST", "/api/payments/create", {
        merchantWallet,
        amount,
        reference,
        memo: memo || `PBTC Payment - ${reference}`,
        payerWallet: publicKey,
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.error || "Failed to create payment request");
      }

      const paymentResult = await sendPBTCPayment(merchantWallet, amount, memo);

      if (!paymentResult.success || !paymentResult.signature) {
        throw new Error(paymentResult.error || "Transaction failed");
      }

      const confirmResponse = await apiRequest("POST", "/api/payments/confirm", {
        reference,
        signature: paymentResult.signature,
        senderWallet: publicKey,
      });

      if (!confirmResponse.ok) {
        const errorData = await confirmResponse.json();
        throw new Error(errorData.error || "Failed to confirm payment");
      }

      setSignature(paymentResult.signature);
      setStatus("confirmed");

      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });

      toast({
        title: "Payment Successful!",
        description: `${amount} ${PBTC_CONFIG.symbol} sent to merchant`,
      });

      onSuccess?.(paymentResult.signature);
    } catch (error) {
      setStatus("failed");
      const err = error instanceof Error ? error : new Error("Payment failed");
      setErrorMessage(err.message);
      
      toast({
        title: "Payment Failed",
        description: err.message,
        variant: "destructive",
      });
      
      onError?.(err);
    } finally {
      setProcessing(false);
    }
  }, [connected, publicKey, connect, merchantWallet, amount, reference, memo, toast, onSuccess, onError]);

  const handleCancel = useCallback(() => {
    setStatus("pending");
    setSignature(null);
    setErrorMessage(null);
    onOpenChange(false);
    onCancel?.();
  }, [onOpenChange, onCancel]);

  const resetAndClose = useCallback(() => {
    setStatus("pending");
    setSignature(null);
    setErrorMessage(null);
    onOpenChange(false);
  }, [onOpenChange]);

  const handleRetry = useCallback(() => {
    setStatus("pending");
    setErrorMessage(null);
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 pb-4">
          <DialogHeader className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">P</span>
                </div>
                <div>
                  <DialogTitle className="text-lg font-semibold" data-testid="text-checkout-title">
                    PBTC Payment
                  </DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    Secure SPL Token Transfer
                  </DialogDescription>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                <Shield className="w-3 h-3 mr-1" />
                Secure
              </Badge>
            </div>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          <div className="text-center py-4">
            <div className="text-4xl font-bold text-foreground" data-testid="text-payment-amount">
              {amount.toLocaleString()} {PBTC_CONFIG.symbol}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Purple Bitcoin</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/50">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Recipient Wallet</p>
                <p className="font-mono text-sm truncate" data-testid="text-merchant-wallet">
                  {truncateAddress(merchantWallet, 8)}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => copyToClipboard(merchantWallet, "Wallet address")}
                data-testid="button-copy-wallet"
              >
                {copied === "Wallet address" ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>

            <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/50">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Reference ID</p>
                <p className="font-mono text-sm" data-testid="text-reference">
                  {reference}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => copyToClipboard(reference, "Reference ID")}
                data-testid="button-copy-reference"
              >
                {copied === "Reference ID" ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>

            {connected && publicKey && (
              <div className="flex items-center justify-between gap-4 p-3 rounded-lg border border-green-500/20 bg-green-500/5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Connected Wallet</p>
                    <p className="font-mono text-sm truncate" data-testid="text-connected-wallet">
                      {truncateAddress(publicKey, 6)}
                    </p>
                  </div>
                </div>
                <Wallet className="w-4 h-4 text-green-500 flex-shrink-0" />
              </div>
            )}
          </div>

          {status === "confirmed" && signature && (
            <div className="p-4 rounded-lg border border-green-500/20 bg-green-500/5 space-y-3">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium">Payment Confirmed</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-xs truncate text-muted-foreground">
                  {truncateAddress(signature, 12)}
                </p>
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => copyToClipboard(signature, "Transaction")}
                    data-testid="button-copy-signature"
                  >
                    {copied === "Transaction" ? (
                      <Check className="w-3 h-3 text-green-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => window.open(`https://solscan.io/tx/${signature}`, "_blank")}
                    data-testid="button-view-explorer"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {status === "failed" && (
            <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5 space-y-2">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Payment Failed</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {errorMessage || "Transaction could not be completed. Please try again."}
              </p>
            </div>
          )}

          {!isPhantomInstalled && !connected && (
            <div className="p-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5 space-y-2">
              <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Wallet Required</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Install Phantom wallet to make PBTC payments. Click the button below to get started.
              </p>
            </div>
          )}

          <div className="space-y-3 pt-2">
            {status === "confirmed" ? (
              <Button
                className="w-full h-12 text-base"
                onClick={resetAndClose}
                data-testid="button-done"
              >
                Done
              </Button>
            ) : status === "failed" ? (
              <>
                <Button
                  className="w-full h-12 text-base"
                  onClick={handleRetry}
                  data-testid="button-retry"
                >
                  Try Again
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={handleCancel}
                  data-testid="button-cancel"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  className="w-full h-12 text-base"
                  onClick={handlePayment}
                  disabled={processing || connecting}
                  data-testid="button-pay"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing Payment...
                    </>
                  ) : connecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting Wallet...
                    </>
                  ) : connected ? (
                    `Pay ${amount} ${PBTC_CONFIG.symbol}`
                  ) : isPhantomInstalled ? (
                    <>
                      <Wallet className="w-4 h-4 mr-2" />
                      Connect Wallet to Pay
                    </>
                  ) : (
                    <>
                      <Wallet className="w-4 h-4 mr-2" />
                      Install Phantom Wallet
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={handleCancel}
                  disabled={processing}
                  data-testid="button-cancel"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
            <Shield className="w-3 h-3" />
            <span>Non-custodial payment powered by Solana</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PBTCCheckoutButton({
  amount,
  merchantWallet,
  reference,
  memo,
  onSuccess,
  onError,
  onCancel,
  children,
}: PBTCCheckoutProps & { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="h-12 px-6"
        data-testid="button-open-checkout"
      >
        {children || `Pay ${amount} ${PBTC_CONFIG.symbol}`}
      </Button>
      <PBTCCheckout
        amount={amount}
        merchantWallet={merchantWallet}
        reference={reference}
        memo={memo}
        onSuccess={onSuccess}
        onError={onError}
        onCancel={onCancel}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
