import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowLeft } from "lucide-react";
import pbtcLogo from "@assets/pbtc_1766635861226.png";

export default function Terms() {
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

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8" data-testid="text-terms-title">
          Terms of Service
        </h1>

        <div className="prose prose-sm sm:prose dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-lg sm:text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              By accessing and using the PBTC Payment Gateway, you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-semibold mb-3">2. Description of Service</h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              PBTC Payment Gateway is a non-custodial payment solution that enables merchants to accept 
              Purple Bitcoin (PBTC) and SOL payments on the Solana blockchain. We do not hold, control, 
              or have access to any funds transferred through our service.
            </p>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-semibold mb-3">3. Non-Custodial Nature</h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              All payments are processed directly on the Solana blockchain. Users maintain full control 
              of their wallets and private keys at all times. PBTC Payment Gateway never has access to 
              your funds or private keys.
            </p>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-semibold mb-3">4. User Responsibilities</h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Users are responsible for maintaining the security of their wallet credentials and ensuring 
              they are sending payments to the correct addresses. Users must verify transaction details 
              before confirming any payment.
            </p>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-semibold mb-3">5. Merchant Responsibilities</h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Merchants integrating PBTC Payment Gateway are responsible for compliance with applicable 
              laws and regulations in their jurisdiction. Merchants must provide accurate wallet addresses 
              for receiving payments.
            </p>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-semibold mb-3">6. No Warranty</h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              The service is provided "as is" without warranties of any kind. We do not guarantee 
              uninterrupted or error-free operation of the service. Blockchain transactions are 
              irreversible and we cannot reverse or modify any completed transactions.
            </p>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-semibold mb-3">7. Limitation of Liability</h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              PBTC Payment Gateway shall not be liable for any direct, indirect, incidental, or 
              consequential damages arising from the use of this service, including but not limited 
              to loss of funds due to user error or blockchain network issues.
            </p>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-semibold mb-3">8. Changes to Terms</h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              We reserve the right to modify these terms at any time. Continued use of the service 
              after changes constitutes acceptance of the modified terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-semibold mb-3">9. Contact</h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              For questions about these Terms of Service, please contact us through our GitHub repository.
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
