import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import { PBTCCheckout } from "@/components/pbtc-checkout";
import { TransactionStatus } from "@/components/transaction-status";
import { PBTC_CONFIG, type TransactionDetails } from "@shared/schema";
import { useWallet, truncateAddress } from "@/lib/wallet-context";
import { useToast } from "@/hooks/use-toast";
import {
  Wallet,
  Shield,
  Zap,
  Code,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Menu,
} from "lucide-react";
import { SiGithub, SiSolana } from "react-icons/si";
import pbtcLogo from "@assets/pbtc_1766635861226.png";

const DEMO_MERCHANT_WALLET = "EhPSjrUBDRfhFVzo5khir78mbuHu76rdVTonJdAKG7CD";
const GITHUB_URL = "https://github.com/MichaelHDesigns/PBTC_PaymentGateway";

export default function Landing() {
  const { connected, connecting, publicKey, connect, disconnect } = useWallet();
  const { toast } = useToast();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [demoAmount, setDemoAmount] = useState("25");
  const [solAmount] = useState(0.01);
  const [demoReference, setDemoReference] = useState(`PBTC_ORDER_${Date.now().toString(36).toUpperCase()}`);
  const [recentTransaction, setRecentTransaction] = useState<TransactionDetails | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const copyCode = async (code: string, label: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
      toast({ title: "Copied!", description: `${label} copied to clipboard` });
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const handlePaymentSuccess = (signature: string) => {
    setRecentTransaction({
      signature,
      status: "confirmed",
      amount: parseFloat(demoAmount),
      merchantWallet: DEMO_MERCHANT_WALLET,
      reference: demoReference,
      timestamp: new Date().toISOString(),
      confirmations: 1,
    });
    setDemoReference(`PBTC_ORDER_${Date.now().toString(36).toUpperCase()}`);
  };

  const scrollToDemo = () => {
    document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  const scrollToDocs = () => {
    document.getElementById("docs")?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  const componentCode = `<PBTCCheckout
  amount={${demoAmount}}
  merchantWallet="${truncateAddress(DEMO_MERCHANT_WALLET, 8)}"
  reference="${demoReference}"
  onSuccess={(sig) => console.log("Paid:", sig)}
/>`;

  const verifyCode = `// Verify payment on your backend
const response = await fetch('/api/verify-payment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    reference: '${demoReference}',
    merchantWallet: '${truncateAddress(DEMO_MERCHANT_WALLET, 8)}',
    expectedAmount: ${demoAmount}
  })
});

const { paid, signature } = await response.json();
if (paid) {
  // Unlock content, fulfill order, etc.
}`;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <img src={pbtcLogo} alt="PBTC" className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex-shrink-0" />
            <span className="font-semibold text-base sm:text-lg hidden xs:inline" data-testid="text-logo">
              PBTC Pay
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={scrollToDemo}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-demo"
            >
              Demo
            </button>
            <button
              onClick={scrollToDocs}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-docs"
            >
              Docs
            </button>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              data-testid="link-github"
            >
              <SiGithub className="w-4 h-4" />
              GitHub
            </a>
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <Button
              size="icon"
              variant="ghost"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              <Menu className="w-5 h-5" />
            </Button>
            {connected ? (
              <Button 
                variant="outline" 
                size="sm"
                onClick={disconnect} 
                className="hidden sm:flex"
                data-testid="button-disconnect"
              >
                <Wallet className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{truncateAddress(publicKey || "", 4)}</span>
                <span className="sm:hidden">Wallet</span>
              </Button>
            ) : (
              <Button 
                onClick={connect} 
                disabled={connecting} 
                size="sm"
                className="text-xs sm:text-sm"
                data-testid="button-connect"
              >
                <Wallet className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{connecting ? "Connecting..." : "Connect Wallet"}</span>
                <span className="sm:hidden">{connecting ? "..." : "Connect"}</span>
              </Button>
            )}
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t px-4 py-3 space-y-2 bg-background">
            <button
              onClick={scrollToDemo}
              className="block w-full text-left py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Demo
            </button>
            <button
              onClick={scrollToDocs}
              className="block w-full text-left py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Docs
            </button>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-left py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              GitHub
            </a>
            {connected && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={disconnect} 
                className="w-full sm:hidden"
              >
                <Wallet className="w-4 h-4 mr-2" />
                {truncateAddress(publicKey || "", 4)}
              </Button>
            )}
          </div>
        )}
      </header>

      <section className="relative py-12 sm:py-16 md:py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 animate-gradient" />
        <div className="absolute -top-40 -right-40 w-60 sm:w-80 h-60 sm:h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-60 sm:w-80 h-60 sm:h-80 bg-primary/5 rounded-full blur-3xl" />
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl mx-auto text-center space-y-4 sm:space-y-6">
            <Badge variant="secondary" className="mb-2 sm:mb-4" data-testid="badge-hero">
              <SiSolana className="w-3 h-3 mr-1" />
              Powered by Solana
            </Badge>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight" data-testid="text-hero-title">
              Accept{" "}
              <span className="text-primary">Purple Bitcoin</span>{" "}
              Payments in Minutes
            </h1>
            
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-2" data-testid="text-hero-subtitle">
              Non-custodial payment solution for PBTC. Easy integration, instant settlement, 
              no KYC required. Just drop in our component and start accepting payments.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 sm:pt-4">
              <Button 
                size="default"
                onClick={scrollToDemo} 
                className="w-full sm:w-auto gap-2" 
                data-testid="button-try-demo"
              >
                Try Live Demo
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button 
                size="default"
                variant="outline" 
                onClick={scrollToDocs}
                className="w-full sm:w-auto"
                data-testid="button-view-docs"
              >
                View Documentation
              </Button>
            </div>

            <button
              onClick={scrollToDemo}
              className="hidden sm:flex items-center justify-center gap-1 text-sm text-muted-foreground mt-8 md:mt-12 animate-bounce mx-auto"
              data-testid="button-scroll-down"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 md:py-24 border-t">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4" data-testid="text-features-title">
              Why Choose PBTC Pay?
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-2">
              Built for developers who want to accept PBTC without the complexity
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <Card className="hover-elevate" data-testid="card-feature-1">
              <CardHeader className="pb-2 sm:pb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2 sm:mb-3">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <CardTitle className="text-base sm:text-lg">Non-Custodial</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-xs sm:text-sm">
                  Users pay directly from their wallet to yours. We never hold funds.
                  No custody, no legal complexity.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="card-feature-2">
              <CardHeader className="pb-2 sm:pb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2 sm:mb-3">
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <CardTitle className="text-base sm:text-lg">Instant Settlement</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-xs sm:text-sm">
                  Solana-speed transactions. Funds arrive in your wallet within seconds.
                  No waiting, no chargebacks.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate sm:col-span-2 lg:col-span-1" data-testid="card-feature-3">
              <CardHeader className="pb-2 sm:pb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2 sm:mb-3">
                  <Code className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <CardTitle className="text-base sm:text-lg">Developer First</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-xs sm:text-sm">
                  Drop-in React component. Copy-paste integration. Full TypeScript support.
                  Get started in 5 minutes.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="demo" className="py-12 sm:py-16 md:py-24 bg-muted/30 border-t">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <Badge variant="secondary" className="mb-3 sm:mb-4">Interactive</Badge>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4" data-testid="text-demo-title">
              Live Demo
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-2">
              Try the payment flow yourself. Connect your wallet and experience the seamless checkout.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
            <Card data-testid="card-demo-config">
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="text-base sm:text-lg">Configure Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="demo-amount" className="text-sm">Amount ({PBTC_CONFIG.symbol})</Label>
                  <Input
                    id="demo-amount"
                    type="number"
                    value={demoAmount}
                    onChange={(e) => setDemoAmount(e.target.value)}
                    min="0.01"
                    step="0.01"
                    data-testid="input-demo-amount"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="demo-reference" className="text-sm">Reference ID</Label>
                  <Input
                    id="demo-reference"
                    value={demoReference}
                    onChange={(e) => setDemoReference(e.target.value)}
                    data-testid="input-demo-reference"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Merchant Wallet</Label>
                  <div className="p-2 sm:p-3 rounded-lg bg-muted/50 font-mono text-xs sm:text-sm truncate">
                    {truncateAddress(DEMO_MERCHANT_WALLET, 8)}
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={() => setCheckoutOpen(true)}
                  disabled={!demoAmount || parseFloat(demoAmount) <= 0}
                  data-testid="button-open-demo-checkout"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Pay with PBTC or SOL
                </Button>

                <div className="p-3 sm:p-4 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm font-medium">Component Code</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => copyCode(componentCode, "Component")}
                      data-testid="button-copy-component-code"
                    >
                      {copied === "Component" ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                  <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap text-muted-foreground">
                    {componentCode}
                  </pre>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4 sm:space-y-6">
              {recentTransaction ? (
                <TransactionStatus transaction={recentTransaction} />
              ) : (
                <Card className="flex items-center justify-center min-h-[200px] sm:min-h-[250px]" data-testid="card-demo-placeholder">
                  <CardContent className="text-center py-8 sm:py-16">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <Wallet className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium text-sm sm:text-base mb-1 sm:mb-2">No Recent Transactions</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground max-w-xs mx-auto">
                      Complete a payment to see the transaction details appear here
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card data-testid="card-how-it-works">
                <CardHeader className="pb-2 sm:pb-4">
                  <CardTitle className="text-base sm:text-lg">How It Works</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2 sm:space-y-3">
                    <li className="flex gap-2 sm:gap-3">
                      <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium flex items-center justify-center">
                        1
                      </span>
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        User opens checkout and connects their Phantom/Solflare wallet
                      </span>
                    </li>
                    <li className="flex gap-2 sm:gap-3">
                      <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium flex items-center justify-center">
                        2
                      </span>
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        SPL token transfer is created and signed by user
                      </span>
                    </li>
                    <li className="flex gap-2 sm:gap-3">
                      <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium flex items-center justify-center">
                        3
                      </span>
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        Transaction is confirmed on Solana blockchain
                      </span>
                    </li>
                    <li className="flex gap-2 sm:gap-3">
                      <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium flex items-center justify-center">
                        4
                      </span>
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        Your backend verifies payment and unlocks content/order
                      </span>
                    </li>
                  </ol>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section id="docs" className="py-12 sm:py-16 md:py-24 border-t">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <Badge variant="secondary" className="mb-3 sm:mb-4">Documentation</Badge>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4" data-testid="text-docs-title">
              Quick Start Guide
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-2">
              Get up and running with PBTC payments in just a few steps
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 md:space-y-8">
            <Card data-testid="card-docs-step-1">
              <CardHeader className="pb-2 sm:pb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary text-primary-foreground text-xs sm:text-sm font-medium flex items-center justify-center">
                    1
                  </span>
                  <CardTitle className="text-base sm:text-lg">Install the Package</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="p-3 sm:p-4 rounded-lg bg-muted/50 flex items-center justify-between gap-2 sm:gap-4">
                  <code className="font-mono text-xs sm:text-sm truncate">npm install @pbtc/payments</code>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => copyCode("npm install @pbtc/payments", "Install")}
                    className="flex-shrink-0"
                    data-testid="button-copy-install"
                  >
                    {copied === "Install" ? (
                      <Check className="w-3 h-3 text-green-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-docs-step-2">
              <CardHeader className="pb-2 sm:pb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary text-primary-foreground text-xs sm:text-sm font-medium flex items-center justify-center">
                    2
                  </span>
                  <CardTitle className="text-base sm:text-lg">Add the Checkout Component</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="p-3 sm:p-4 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground font-mono">React Component</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => copyCode(componentCode, "React")}
                      className="flex-shrink-0"
                      data-testid="button-copy-react"
                    >
                      {copied === "React" ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                  <pre className="text-xs sm:text-sm font-mono overflow-x-auto whitespace-pre-wrap text-muted-foreground">
                    {componentCode}
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-docs-step-3">
              <CardHeader className="pb-2 sm:pb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary text-primary-foreground text-xs sm:text-sm font-medium flex items-center justify-center">
                    3
                  </span>
                  <CardTitle className="text-base sm:text-lg">Verify Payments (Backend)</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="p-3 sm:p-4 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground font-mono">Node.js Backend</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => copyCode(verifyCode, "Backend")}
                      className="flex-shrink-0"
                      data-testid="button-copy-backend"
                    >
                      {copied === "Backend" ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                  <pre className="text-xs sm:text-sm font-mono overflow-x-auto whitespace-pre-wrap text-muted-foreground">
                    {verifyCode}
                  </pre>
                </div>
              </CardContent>
            </Card>

            <div className="text-center pt-2 sm:pt-4">
              <a href={`${GITHUB_URL}#readme`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="gap-2 w-full sm:w-auto" data-testid="button-full-docs">
                  <ExternalLink className="w-4 h-4" />
                  View Full Documentation
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 md:py-24 bg-muted/30 border-t">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold" data-testid="text-cta-title">
              Ready to Accept PBTC?
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground px-2">
              Join the growing ecosystem of merchants accepting Purple Bitcoin payments
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button className="w-full sm:w-auto gap-2" data-testid="button-get-started">
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Button>
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full sm:w-auto gap-2" data-testid="button-github-cta">
                  <SiGithub className="w-4 h-4" />
                  Star on GitHub
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-6 sm:py-8 border-t">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <img src={pbtcLogo} alt="PBTC" className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg" />
              <span className="text-xs sm:text-sm text-muted-foreground">
                PBTC Pay - Non-custodial payments
              </span>
            </div>
            <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Privacy
              </a>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>

      <PBTCCheckout
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        amount={parseFloat(demoAmount) || 0}
        merchantWallet={DEMO_MERCHANT_WALLET}
        reference={demoReference}
        memo={`Demo Payment - ${demoReference}`}
        onSuccess={handlePaymentSuccess}
        onError={(error) => {
          toast({
            title: "Payment Failed",
            description: error.message,
            variant: "destructive",
          });
        }}
        solAmount={solAmount}
      />
    </div>
  );
}
