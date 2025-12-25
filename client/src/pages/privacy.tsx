import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowLeft } from "lucide-react";
import pbtcLogo from "@assets/pbtc_1766635861226.png";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-4">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <img src={pbtcLogo} alt="PBTC" className="w-7 h-7 sm:w-8 sm:h-8" />
              <span className="font-bold text-base sm:text-lg">PBTC Pay</span>
            </div>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-6 gap-2" data-testid="button-back-home">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </Link>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8" data-testid="text-privacy-title">
          Privacy Policy
        </h1>

        <div className="prose prose-sm sm:prose dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-lg sm:text-xl font-semibold mb-3">1. Information We Collect</h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              PBTC Payment Gateway is designed with privacy in mind. We collect minimal information 
              necessary to facilitate payment transactions. We do not collect personal identification 
              information, email addresses, or any KYC data.
            </p>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-semibold mb-3">2. Blockchain Data</h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              All transactions occur on the public Solana blockchain. Transaction data including 
              wallet addresses and amounts are publicly visible on the blockchain. This is inherent 
              to blockchain technology and not controlled by our service.
            </p>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-semibold mb-3">3. Wallet Information</h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              When you connect your wallet to make a payment, we temporarily access your public 
              wallet address to facilitate the transaction. We never have access to your private 
              keys or seed phrases. Your wallet remains under your full control at all times.
            </p>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-semibold mb-3">4. Payment References</h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Merchants may include reference IDs with payments to track orders. These references 
              are stored temporarily to verify payments but do not contain personal information 
              about the payer.
            </p>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-semibold mb-3">5. No Cookies or Tracking</h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              We do not use tracking cookies or analytics services. We do not track your browsing 
              behavior across websites or build user profiles.
            </p>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-semibold mb-3">6. Third-Party Services</h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Our service interacts with the Solana blockchain and wallet providers like Phantom. 
              These third-party services have their own privacy policies. We recommend reviewing 
              their privacy practices.
            </p>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-semibold mb-3">7. Data Security</h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Since we operate as a non-custodial service, we do not store sensitive financial data. 
              All cryptographic operations occur in your browser or wallet application. Transaction 
              security is provided by the Solana blockchain.
            </p>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-semibold mb-3">8. Your Rights</h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Since we collect minimal data, there is little personal information to request or delete. 
              Blockchain transactions are permanent and cannot be modified or deleted due to the 
              nature of distributed ledger technology.
            </p>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-semibold mb-3">9. Changes to This Policy</h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. Any changes will be posted on 
              this page with an updated revision date.
            </p>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-semibold mb-3">10. Contact Us</h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              If you have questions about this Privacy Policy, please contact us through our 
              GitHub repository.
            </p>
          </section>
        </div>

        <p className="text-xs sm:text-sm text-muted-foreground mt-8 sm:mt-12">
          Last updated: December 2024
        </p>
      </main>
    </div>
  );
}
