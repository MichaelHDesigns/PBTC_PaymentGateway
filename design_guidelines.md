# PBTC Payment Gateway Design Guidelines

## Design Approach
**System-Based with Crypto-Native Enhancement**
- Primary inspiration: Stripe's payment flows + Phantom wallet aesthetics
- Design system foundation: Clean, functional interface prioritizing trust and clarity
- Key principle: Developer-friendly with enterprise-level polish

## Core Design Elements

### Typography
- **Primary Font**: Inter (Google Fonts) - modern, highly legible
- **Monospace**: JetBrains Mono - for wallet addresses, transaction hashes
- **Hierarchy**:
  - H1: text-4xl font-bold (main headings)
  - H2: text-2xl font-semibold (section headers)
  - H3: text-xl font-medium (component titles)
  - Body: text-base (primary content)
  - Small: text-sm (metadata, labels)
  - Mono: text-sm font-mono (addresses, codes)

### Layout System
**Tailwind Spacing Primitives**: Use units of 2, 4, 6, 8, 12, 16
- Component padding: p-6 to p-8
- Section spacing: gap-6, gap-8
- Container margins: mx-4, mx-8
- Consistent rhythm maintains professional appearance

### Component Library

#### Payment Checkout Modal
- **Size**: max-w-md centered modal
- **Structure**: 
  - Header with PBTC logo and "Secure Payment" text
  - Amount display (large, prominent - text-3xl font-bold)
  - Merchant wallet (truncated with copy button)
  - Reference ID (small, mono font)
  - Connected wallet indicator with icon
  - Primary CTA button (full-width, h-12)
  - Security badge/trust indicators at bottom
- **Spacing**: p-8 with gap-6 between sections

#### Transaction Status Component
- **States**: Pending → Processing → Confirmed → Complete
- **Visual Progress**: Linear progress bar or animated checkmarks
- **Details Panel**: 
  - Transaction signature (truncated, copyable)
  - Block confirmation count
  - Timestamp
  - Amount transferred
  - Explorer link

#### Documentation Pages
- **Layout**: Two-column (sidebar navigation + content)
- **Sidebar**: w-64, sticky navigation
- **Content**: max-w-3xl with generous line-height (leading-relaxed)
- **Code Blocks**: Syntax highlighting, copy button, rounded corners
- **API Reference**: Table format with method, parameters, response columns

#### Demo/Landing Page
- **Hero**: 60vh height, centered content
  - Main headline highlighting "Accept PBTC in Minutes"
  - Subheading explaining no-custody model
  - Two CTAs: "View Docs" + "Try Demo"
  - Background: Subtle gradient mesh or abstract Solana-themed graphic
- **Features**: 3-column grid (grid-cols-1 md:grid-cols-3)
  - Icon + Title + Description cards
  - Features: Non-Custodial, Developer-First, Instant Settlement
- **Live Demo Section**: Interactive payment component preview
- **Integration Guide**: Step-by-step with code snippets
- **Footer**: Links, GitHub, documentation, social

### Visual Elements

#### Icons
- **Library**: Heroicons (outline for UI, solid for states)
- **Key Icons**: 
  - Wallet, check-circle, clock, shield-check, clipboard, external-link
  - Custom PBTC logo placeholder where needed

#### Buttons
- **Primary**: Full-width for payment actions, h-12, rounded-lg, font-semibold
- **Secondary**: Outlined style for cancel/back actions
- **Icon Buttons**: Square (h-10 w-10) for copy, close, expand actions
- **States**: Clear hover and active states, disabled state with reduced opacity

#### Status Indicators
- **Transaction States**: 
  - Pending: Pulsing indicator
  - Processing: Animated spinner
  - Confirmed: Static checkmark
  - Failed: Alert icon
- **Wallet Connection**: Green dot for connected, gray for disconnected

#### Cards
- **Payment Card**: Elevated shadow, rounded-xl, p-6
- **Feature Cards**: Subtle border, hover lift effect, rounded-lg, p-6
- **Info Cards**: Lighter background, rounded-lg, p-4

### Crypto-Specific Patterns

#### Wallet Addresses
- **Display**: Truncate middle (e.g., "3Kx...9zT")
- **Full Address**: Tooltip on hover
- **Copy Function**: Icon button with success feedback

#### Transaction Hashes
- **Format**: Monospace font, truncated with ellipsis
- **Action**: Click to copy, external link to Solana Explorer

#### Amount Display
- **Format**: Bold, larger text with PBTC token symbol
- **USD Equivalent**: Smaller, muted text below (if available)

### Accessibility
- Sufficient contrast ratios for all text
- Focus indicators on all interactive elements
- Screen reader labels for icon-only buttons
- Keyboard navigation support for modal flows
- Clear error states with descriptive messages

### Animations
**Minimal and Purposeful**:
- Modal fade-in/out (150-200ms)
- Button hover state transitions (100ms)
- Transaction status changes (smooth fade between states)
- Success confirmation: Single checkmark animation
- No distracting scroll or parallax effects

### Images
**Hero Section Image**: Abstract visualization of Solana blockchain or cryptocurrency payment flow - modern, professional, not overly technical. Placement: Full-width background with gradient overlay for text legibility.

**Feature Icons/Illustrations**: Simple line illustrations or icons representing security, speed, and ease of integration.

## Page-Specific Guidelines

### Payment Checkout (Primary Component)
- Clean, distraction-free modal interface
- Clear visual hierarchy: Amount → Wallet → Action
- Trust indicators prominent but not overwhelming
- Mobile-responsive: Full-screen on mobile, modal on desktop

### Developer Documentation
- Clear navigation structure
- Generous code examples with syntax highlighting
- Quick-start section at top
- API reference in scannable table format
- Live component previews where possible

### Marketing/Demo Landing
- 5-6 sections total
- Breathing room between sections (py-16 to py-24)
- Multi-column layouts for features (3 columns desktop, 1 mobile)
- Live demo embedded in page, not separate
- Clear path from "interested" to "implementing"