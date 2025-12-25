import { useState, useCallback, useEffect } from "react";
import { sendPBTCPayment, sendSOLPayment } from "../utils/solana";
import { PBTC_CONFIG } from "../config";
import type { PBTCCheckoutProps, PaymentType } from "../types";

function truncateAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

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
  solAmount,
}: CheckoutModalProps) {
  const [connected, setConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<"pending" | "processing" | "confirmed" | "failed">("pending");
  const [signature, setSignature] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [paymentType, setPaymentType] = useState<PaymentType>("PBTC");

  const currentAmount = paymentType === "SOL" && solAmount ? solAmount : amount;
  const currentSymbol = paymentType === "SOL" ? "SOL" : PBTC_CONFIG.symbol;

  useEffect(() => {
    if (window.solana?.publicKey) {
      setConnected(true);
      setPublicKey(window.solana.publicKey.toString());
    }
  }, []);

  const connect = useCallback(async () => {
    if (!window.solana) {
      window.open("https://phantom.app/", "_blank");
      return;
    }
    try {
      const result = await window.solana.connect();
      setConnected(true);
      setPublicKey(result.publicKey.toString());
    } catch (error) {
      console.error("Connection error:", error);
    }
  }, []);

  const handlePayment = useCallback(async () => {
    if (!connected || !publicKey) {
      await connect();
      return;
    }

    setProcessing(true);
    setStatus("processing");
    setErrorMessage(null);

    try {
      const paymentResult = paymentType === "SOL"
        ? await sendSOLPayment(merchantWallet, currentAmount)
        : await sendPBTCPayment(merchantWallet, currentAmount, memo);

      if (!paymentResult.success || !paymentResult.signature) {
        throw new Error(paymentResult.error || "Transaction failed");
      }

      setSignature(paymentResult.signature);
      setStatus("confirmed");
      onSuccess?.(paymentResult.signature);
    } catch (error) {
      setStatus("failed");
      const err = error instanceof Error ? error : new Error("Payment failed");
      setErrorMessage(err.message);
      onError?.(err);
    } finally {
      setProcessing(false);
    }
  }, [connected, publicKey, connect, merchantWallet, currentAmount, memo, onSuccess, onError, paymentType]);

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

  if (!open) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 50,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    }}>
      <div style={{
        backgroundColor: "white",
        borderRadius: "12px",
        maxWidth: "400px",
        width: "100%",
        margin: "16px",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      }}>
        <div style={{
          background: "linear-gradient(135deg, #9333ea20, transparent)",
          padding: "24px",
          borderTopLeftRadius: "12px",
          borderTopRightRadius: "12px",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "8px",
                backgroundColor: "#9333ea",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: "bold",
                fontSize: "18px",
              }}>
                {paymentType === "SOL" ? "S" : "P"}
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>
                  {paymentType === "SOL" ? "Solana Payment" : "PBTC Payment"}
                </h2>
                <p style={{ margin: 0, fontSize: "14px", color: "#666" }}>
                  {paymentType === "SOL" ? "Native SOL Transfer" : "Secure SPL Token Transfer"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: "24px" }}>
          {solAmount && status === "pending" && (
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <button
                onClick={() => setPaymentType("PBTC")}
                style={{
                  flex: 1,
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: paymentType === "PBTC" ? "none" : "1px solid #ddd",
                  backgroundColor: paymentType === "PBTC" ? "#9333ea" : "white",
                  color: paymentType === "PBTC" ? "white" : "#333",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                PBTC
              </button>
              <button
                onClick={() => setPaymentType("SOL")}
                style={{
                  flex: 1,
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: paymentType === "SOL" ? "none" : "1px solid #ddd",
                  backgroundColor: paymentType === "SOL" ? "#9333ea" : "white",
                  color: paymentType === "SOL" ? "white" : "#333",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                SOL
              </button>
            </div>
          )}

          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ fontSize: "32px", fontWeight: "bold" }}>
              {currentAmount.toLocaleString()} {currentSymbol}
            </div>
            <p style={{ color: "#666", margin: "4px 0 0" }}>
              {paymentType === "SOL" ? "Native Solana" : "Purple Bitcoin"}
            </p>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <div style={{
              padding: "12px",
              backgroundColor: "#f5f5f5",
              borderRadius: "8px",
              marginBottom: "8px",
            }}>
              <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>Recipient</p>
              <p style={{ margin: "4px 0 0", fontFamily: "monospace", fontSize: "14px" }}>
                {truncateAddress(merchantWallet, 8)}
              </p>
            </div>

            <div style={{
              padding: "12px",
              backgroundColor: "#f5f5f5",
              borderRadius: "8px",
            }}>
              <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>Reference</p>
              <p style={{ margin: "4px 0 0", fontFamily: "monospace", fontSize: "14px" }}>
                {reference}
              </p>
            </div>
          </div>

          {status === "confirmed" && signature && (
            <div style={{
              padding: "16px",
              backgroundColor: "#d4edda",
              borderRadius: "8px",
              marginBottom: "16px",
            }}>
              <p style={{ margin: 0, color: "#155724", fontWeight: 500 }}>Payment Confirmed!</p>
              <a
                href={`https://solscan.io/tx/${signature}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#155724", fontSize: "12px" }}
              >
                View on Solscan
              </a>
            </div>
          )}

          {status === "failed" && (
            <div style={{
              padding: "16px",
              backgroundColor: "#f8d7da",
              borderRadius: "8px",
              marginBottom: "16px",
            }}>
              <p style={{ margin: 0, color: "#721c24", fontWeight: 500 }}>Payment Failed</p>
              <p style={{ margin: "4px 0 0", color: "#721c24", fontSize: "14px" }}>
                {errorMessage}
              </p>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {status === "confirmed" ? (
              <button
                onClick={resetAndClose}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#9333ea",
                  color: "white",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Done
              </button>
            ) : (
              <>
                <button
                  onClick={handlePayment}
                  disabled={processing}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: processing ? "#ccc" : "#9333ea",
                    color: "white",
                    fontWeight: 500,
                    cursor: processing ? "not-allowed" : "pointer",
                  }}
                >
                  {processing
                    ? "Processing..."
                    : connected
                    ? `Pay ${currentAmount} ${currentSymbol}`
                    : "Connect Wallet"}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={processing}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #ddd",
                    backgroundColor: "white",
                    color: "#666",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </>
            )}
          </div>

          <p style={{
            textAlign: "center",
            fontSize: "12px",
            color: "#999",
            marginTop: "16px",
          }}>
            Non-custodial payment powered by Solana
          </p>
        </div>
      </div>
    </div>
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
}: PBTCCheckoutProps & { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: "12px 24px",
          borderRadius: "8px",
          border: "none",
          backgroundColor: "#9333ea",
          color: "white",
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        {children || `Pay ${amount} ${PBTC_CONFIG.symbol}`}
      </button>
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
      />
    </>
  );
}
