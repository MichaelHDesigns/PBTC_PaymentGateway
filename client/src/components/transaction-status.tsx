import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { truncateAddress } from "@/lib/wallet-context";
import { PBTC_CONFIG, type TransactionDetails, type TransactionStatus as TxStatus } from "@shared/schema";
import { Check, Clock, Loader2, AlertCircle, ExternalLink, Copy } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface TransactionStatusProps {
  transaction: TransactionDetails;
}

const statusConfig: Record<TxStatus, { 
  icon: typeof Check; 
  color: string; 
  bgColor: string; 
  label: string;
  badgeVariant: "default" | "secondary" | "destructive" | "outline";
}> = {
  pending: {
    icon: Clock,
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-500/10",
    label: "Pending",
    badgeVariant: "outline",
  },
  processing: {
    icon: Loader2,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500/10",
    label: "Processing",
    badgeVariant: "secondary",
  },
  confirmed: {
    icon: Check,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-500/10",
    label: "Confirmed",
    badgeVariant: "default",
  },
  failed: {
    icon: AlertCircle,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    label: "Failed",
    badgeVariant: "destructive",
  },
};

export function TransactionStatus({ transaction }: TransactionStatusProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const config = statusConfig[transaction.status];
  const Icon = config.icon;

  const copySignature = async () => {
    try {
      await navigator.clipboard.writeText(transaction.signature);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "Transaction signature copied",
      });
    } catch {
      toast({
        title: "Failed to copy",
        variant: "destructive",
      });
    }
  };

  const openExplorer = () => {
    window.open(`https://solscan.io/tx/${transaction.signature}`, "_blank");
  };

  return (
    <Card className="w-full" data-testid={`card-transaction-${transaction.reference}`}>
      <CardHeader className="pb-2 sm:pb-3">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <CardTitle className="text-sm sm:text-base font-medium">Transaction Status</CardTitle>
          <Badge variant={config.badgeVariant} className="gap-1 text-xs" data-testid="badge-tx-status">
            <Icon className={`w-3 h-3 ${transaction.status === "processing" ? "animate-spin" : ""}`} />
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        <div className={`p-3 sm:p-4 rounded-lg ${config.bgColor} flex items-center gap-2 sm:gap-3`}>
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${config.color} ${transaction.status === "processing" ? "animate-spin" : ""} ${transaction.status === "pending" ? "animate-pulse-soft" : ""}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm sm:text-base" data-testid="text-tx-amount">
              {transaction.amount.toLocaleString()} {PBTC_CONFIG.symbol}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              To: {truncateAddress(transaction.merchantWallet, 6)}
            </p>
          </div>
        </div>

        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
            <span className="text-muted-foreground">Signature</span>
            <div className="flex items-center gap-1">
              <span className="font-mono text-xs truncate max-w-[120px] sm:max-w-none" data-testid="text-tx-signature">
                {truncateAddress(transaction.signature, 8)}
              </span>
              <Button
                size="icon"
                variant="ghost"
                onClick={copySignature}
                className="h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0"
                data-testid="button-copy-tx-signature"
              >
                {copied ? (
                  <Check className="w-3 h-3 text-green-500" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
            <span className="text-muted-foreground">Reference</span>
            <span className="font-mono text-xs truncate max-w-[140px] sm:max-w-none" data-testid="text-tx-reference">
              {transaction.reference}
            </span>
          </div>

          {transaction.confirmations !== undefined && (
            <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
              <span className="text-muted-foreground">Confirmations</span>
              <span className="font-mono text-xs" data-testid="text-tx-confirmations">
                {transaction.confirmations}
              </span>
            </div>
          )}

          {transaction.timestamp && (
            <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
              <span className="text-muted-foreground">Time</span>
              <span className="text-xs" data-testid="text-tx-timestamp">
                {new Date(transaction.timestamp).toLocaleString()}
              </span>
            </div>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={openExplorer}
          data-testid="button-view-explorer"
        >
          <ExternalLink className="w-4 h-4" />
          View on Solscan
        </Button>
      </CardContent>
    </Card>
  );
}

interface TransactionProgressProps {
  status: TxStatus;
}

export function TransactionProgress({ status }: TransactionProgressProps) {
  const steps: TxStatus[] = ["pending", "processing", "confirmed"];
  const currentIndex = steps.indexOf(status);

  return (
    <div className="flex items-center justify-between w-full max-w-xs mx-auto">
      {steps.map((step, index) => {
        const isCompleted = currentIndex > index;
        const isCurrent = currentIndex === index;
        const config = statusConfig[step];
        const Icon = config.icon;

        return (
          <div key={step} className="flex items-center">
            <div
              className={`
                w-8 h-8 rounded-full flex items-center justify-center
                ${isCompleted ? "bg-green-500" : isCurrent ? config.bgColor : "bg-muted"}
                transition-colors duration-300
              `}
            >
              {isCompleted ? (
                <Check className="w-4 h-4 text-white" />
              ) : (
                <Icon
                  className={`w-4 h-4 ${isCurrent ? config.color : "text-muted-foreground"} ${isCurrent && step === "processing" ? "animate-spin" : ""}`}
                />
              )}
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-0.5 w-12 mx-1 ${isCompleted ? "bg-green-500" : "bg-muted"} transition-colors duration-300`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
