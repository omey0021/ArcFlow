# ArcFlow - Checkpoint 2 Presentation

Copy this into Google Slides or Canva. Keep it to five slides.

## Slide 1 - ArcFlow

**Transparent USDC payment decisions on Arc**

Agentic Economy Track | Arc Programmable Money Hackathon

ArcFlow turns a payment request into a transparent, user-approved, Arc-verifiable USDC settlement.

## Slide 2 - The problem

- Independent builders and small teams need simple payment flows with clear proof of who paid, why, and when.
- Generic crypto transfers have little transaction context and often leave users unsure whether a payment has truly settled.
- Autonomous agents increase the need for transparent decision policies and explicit human approvals.

## Slide 3 - The solution

1. Create a USDC payment request with payee, address, amount, and purpose.
2. ArcFlow runs a visible policy check and explains its recommendation.
3. The payer approves the transaction in their own wallet.
4. ArcFlow records one successful Arc receipt as final and exposes ArcScan proof.

## Slide 4 - Arc integration

- **Arc Testnet:** Chain ID 5042002, EVM-compatible browser-wallet flow.
- **Native USDC:** the payment and gas use the same stable unit of account.
- **Deterministic finality:** ArcFlow treats a successful confirmation as final payment proof.
- **ArcScan:** independent, public verification of payment receipt.

## Slide 5 - MVP progress and roadmap

**Checkpoint 2 build**

- Browser wallet connection and Arc Testnet switching
- Native-USDC payment request flow
- Transparent policy decision log
- Final receipt and ArcScan proof link

**Next**

- Complete a live testnet payment demonstration
- Publish hosted demo and recorded walkthrough
- Explore Circle App Kit or Circle Wallets for future managed-wallet and cross-chain flows
