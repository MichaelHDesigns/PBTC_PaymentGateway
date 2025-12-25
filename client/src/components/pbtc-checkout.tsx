import { useState, useCallback, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWallet, truncateAddress } from "@/lib/wallet-context";
import { sendTokenPayment } from "@/lib/solana-utils";
import { useToast } from "@/hooks/use-toast";
import { SUPPORTED_TOKENS, type PBTCCheckoutProps, type TransactionStatus, type TokenConfig } from "@shared/schema";
import { Wallet, Copy, Check, ExternalLink, Shield, Loader2, AlertCircle, X, ChevronDown } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { SiSolana } from "react-icons/si";

interface CheckoutModalProps extends PBTCCheckoutProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  solAmount?: number;
}

function TokenIcon({ token, className = "w-4 h-4" }: { token: TokenConfig; className?: string }) {
  if (token.id === "sol") {
    return <SiSolana className={className} />;
  }
  if (token.id === "pbtc") {
    return <span className={`font-bold ${className.includes("w-5") ? "text-lg" : "text-sm"}`}>P</span>;
  }
  if (token.id === "usdc") {
    return <span className={`font-bold ${className.includes("w-5") ? "text-lg" : "text-sm"} text-blue-500`}>$</span>;
  }
  if (token.id === "usdt") {
    return <span className={`font-bold ${className.includes("w-5") ? "text-lg" : "text-sm"} text-green-500`}>$</span>;
  }
  return <span className={`font-bold ${className.includes("w-5") ? "text-lg" : "text-sm"}`}>{token.symbol[0]}</span>;
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
  solAmount,
  tokenAmounts,
  enabledTokens,
}: CheckoutModalProps) {
  const { connected, connecting, publicKey, connect, isPhantomInstalled } = useWallet();
  const { toast } = useToast();
  const [status, setStatus] = useState<TransactionStatus>("pending");
  const [signature, setSignature] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedTokenId, setSelectedTokenId] = useState<string>("pbtc");

  const availableTokens = useMemo(() => {
    if (enabledTokens && enabledTokens.length > 0) {
      return SUPPORTED_TOKENS.filter(t => enabledTokens.includes(t.id));
    }
    if (tokenAmounts) {
      return SUPPORTED_TOKENS.filter(t => tokenAmounts[t.id] !== undefined);
    }
    if (solAmount !== undefined) {
      return SUPPORTED_TOKENS.filter(t => t.id === "pbtc" || t.id === "sol");
    }
    return SUPPORTED_TOKENS.filter(t => t.id === "pbtc");
  }, [enabledTokens, tokenAmounts, solAmount]);

  const selectedToken = useMemo(() => {
    return availableTokens.find(t => t.id === selectedTokenId) || availableTokens[0];
  }, [availableTokens, selectedTokenId]);

  const currentAmount = useMemo(() => {
    if (tokenAmounts && tokenAmounts[selectedToken.id] !== undefined) {
      return tokenAmounts[selectedToken.id];
    }
    if (selectedToken.id === "sol" && solAmount !== undefined) {
      return solAmount;
    }
    return amount;
  }, [tokenAmounts, selectedToken, solAmount, amount]);

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
        amount: currentAmount,
        reference,
        memo: memo || `${selectedToken.symbol} Payment - ${reference}`,
        payerWallet: publicKey,
        paymentType: selectedToken.id,
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.error || "Failed to create payment request");
      }

      const paymentResult = await sendTokenPayment(merchantWallet, currentAmount, selectedToken.id);

      if (!paymentResult.success || !paymentResult.signature) {
        throw new Error(paymentResult.error || "Transaction failed");
      }

      const confirmResponse = await apiRequest("POST", "/api/payments/confirm", {
        reference,
        signature: paymentResult.signature,
        senderWallet: publicKey,
        paymentType: selectedToken.id,
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
        description: `${currentAmount} ${selectedToken.symbol} sent to merchant`,
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
  }, [connected, publicKey, connect, merchantWallet, currentAmount, selectedToken, reference, memo, toast, onSuccess, onError]);

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
      <DialogContent className="max-w-[calc(100vw-1rem)] sm:max-w-md w-full max-h-[90vh] p-0 gap-0 mx-2 sm:mx-auto rounded-xl border-2 shadow-2xl overflow-y-auto">
        <div className="flex flex-col">
          <div className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 p-3 sm:p-4 relative overflow-hidden sticky top-0 z-10">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgY3g9IjIwIiBjeT0iMjAiIHI9IjIiLz48L2c+PC9zdmc+')] opacity-50"></div>
            <DialogHeader className="space-y-0 relative z-10">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center text-white">
                    <TokenIcon token={selectedToken} className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-sm sm:text-base font-semibold text-white" data-testid="text-checkout-title">
                      {selectedToken.symbol} Payment
                    </DialogTitle>
                    <DialogDescription className="text-xs text-white/70">
                      {selectedToken.type === "native" ? "Native Transfer" : "SPL Token Transfer"}
                    </DialogDescription>
                  </div>
                </div>
                <Badge variant="secondary" className="text-[10px] sm:text-xs bg-white/20 text-white border-0">
                  <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                  Secure
                </Badge>
              </div>
            </DialogHeader>
          </div>

          <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
            {availableTokens.length > 1 && status === "pending" && (
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Pay with</label>
                <Select value={selectedTokenId} onValueChange={setSelectedTokenId}>
                  <SelectTrigger className="w-full" data-testid="select-token">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <TokenIcon token={selectedToken} className="w-4 h-4" />
                        <span>{selectedToken.symbol}</span>
                        <span className="text-muted-foreground">- {selectedToken.name}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {availableTokens.map((token) => (
                      <SelectItem key={token.id} value={token.id} data-testid={`select-token-${token.id}`}>
                        <div className="flex items-center gap-2">
                          <TokenIcon token={token} className="w-4 h-4" />
                          <span className="font-medium">{token.symbol}</span>
                          <span className="text-muted-foreground">- {token.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="text-center py-1 sm:py-2">
              <div className="text-xl sm:text-3xl font-bold text-foreground" data-testid="text-payment-amount">
                {currentAmount.toLocaleString()} {selectedToken.symbol}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                {selectedToken.name}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between gap-2 p-2 sm:p-2.5 rounded-lg bg-muted/50">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-muted-foreground">Recipient</p>
                  <p className="font-mono text-[11px] sm:text-xs truncate" data-testid="text-merchant-wallet">
                    {truncateAddress(merchantWallet, 4)}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 flex-shrink-0"
                  onClick={() => copyToClipboard(merchantWallet, "Wallet address")}
                  data-testid="button-copy-wallet"
                >
                  {copied === "Wallet address" ? (
                    <Check className="w-3 h-3 text-green-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-between gap-2 p-2 sm:p-2.5 rounded-lg bg-muted/50">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-muted-foreground">Reference</p>
                  <p className="font-mono text-[11px] sm:text-xs truncate" data-testid="text-reference">
                    {reference}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 flex-shrink-0"
                  onClick={() => copyToClipboard(reference, "Reference ID")}
                  data-testid="button-copy-reference"
                >
                  {copied === "Reference ID" ? (
                    <Check className="w-3 h-3 text-green-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </div>

            {connected && publicKey && (
              <div className="flex items-center justify-between gap-2 p-2 sm:p-2.5 rounded-lg border border-green-500/20 bg-green-500/5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground">Connected</p>
                    <p className="font-mono text-[11px] sm:text-xs truncate" data-testid="text-connected-wallet">
                      {truncateAddress(publicKey, 4)}
                    </p>
                  </div>
                </div>
                <Wallet className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
              </div>
            )}

            {status === "confirmed" && signature && (
              <div className="p-2 sm:p-3 rounded-lg border border-green-500/20 bg-green-500/5 space-y-2">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span className="font-medium text-sm">Payment Confirmed</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-[10px] sm:text-xs truncate text-muted-foreground">
                    {truncateAddress(signature, 8)}
                  </p>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
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
                      className="h-6 w-6"
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
              <div className="p-2 sm:p-3 rounded-lg border border-destructive/20 bg-destructive/5 space-y-1">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-medium text-sm">Payment Failed</span>
                </div>
                <p className="text-[11px] sm:text-xs text-muted-foreground">
                  {errorMessage || "Transaction could not be completed. Please try again."}
                </p>
              </div>
            )}

            {!isPhantomInstalled && !connected && (
              <div className="p-2 sm:p-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5 space-y-1">
                <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-medium text-sm">Wallet Required</span>
                </div>
                <p className="text-[11px] sm:text-xs text-muted-foreground">
                  Install Phantom wallet to make payments.
                </p>
              </div>
            )}

            <div className="space-y-2 pt-1">
              {status === "confirmed" ? (
                <Button
                  className="w-full h-9 sm:h-10 text-sm"
                  onClick={resetAndClose}
                  data-testid="button-done"
                >
                  Done
                </Button>
              ) : status === "failed" ? (
                <div className="flex gap-2">
                  <Button
                    className="flex-1 h-9 sm:h-10 text-sm"
                    onClick={handleRetry}
                    data-testid="button-retry"
                  >
                    Try Again
                  </Button>
                  <Button
                    variant="ghost"
                    className="h-9 sm:h-10 text-sm px-3"
                    onClick={handleCancel}
                    data-testid="button-cancel"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    className="flex-1 h-9 sm:h-10 text-sm"
                    onClick={handlePayment}
                    disabled={processing || connecting}
                    data-testid="button-pay"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                        Processing...
                      </>
                    ) : connecting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                        Connecting...
                      </>
                    ) : connected ? (
                      `Pay ${currentAmount} ${selectedToken.symbol}`
                    ) : isPhantomInstalled ? (
                      <>
                        <Wallet className="w-4 h-4 mr-1.5" />
                        Connect Wallet
                      </>
                    ) : (
                      <>
                        <Wallet className="w-4 h-4 mr-1.5" />
                        Install Phantom
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    className="h-9 sm:h-10 text-sm px-3"
                    onClick={handleCancel}
                    disabled={processing}
                    data-testid="button-cancel"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground pt-1">
              <Shield className="w-2.5 h-2.5 flex-shrink-0" />
              <span>Non-custodial payment on Solana</span>
            </div>
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
  solAmount,
  tokenAmounts,
  enabledTokens,
}: PBTCCheckoutProps & { children?: React.ReactNode; solAmount?: number }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="h-12 px-6"
        data-testid="button-open-checkout"
      >
        {children || `Pay Now`}
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
        solAmount={solAmount}
        tokenAmounts={tokenAmounts}
        enabledTokens={enabledTokens}
      />
    </>
  );
}
