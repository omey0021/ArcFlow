const slides = [
  {
    eyebrow: "Arc Programmable Money Hackathon",
    title: "ArcFlow",
    subtitle: "A transparent, user-approved USDC payment workflow built on Arc Testnet.",
    points: ["Agentic Economy Track", "Native USDC settlement", "Independent ArcFlow project"],
  },
  {
    eyebrow: "01 / The problem",
    title: "Payments need context, policy, and proof.",
    subtitle: "A wallet transfer alone does not explain why money moved, whether it met policy, or how a team can independently verify settlement.",
    points: ["Payment context is often scattered", "Approval intent is hard to audit", "Settlement proof should be simple to verify"],
  },
  {
    eyebrow: "02 / The product",
    title: "One clear path from request to final receipt.",
    subtitle: "ArcFlow creates a payment request, explains a deterministic policy outcome, and keeps the wallet owner in control of approval.",
    points: ["Create: payee, amount, address, purpose", "Review: visible policy recommendation", "Approve: wallet signature and ArcScan receipt"],
  },
  {
    eyebrow: "03 / Built on Arc",
    title: "USDC-native payments, designed for instant certainty.",
    subtitle: "ArcFlow uses an EVM browser-wallet flow on Arc Testnet and submits native-USDC EIP-1559 transactions.",
    points: ["Arc Testnet: Chain ID 5042002", "USDC funds the transfer and network fee", "One successful receipt becomes the final proof"],
  },
  {
    eyebrow: "04 / Checkpoint 2",
    title: "A working payment MVP with a clear next step.",
    subtitle: "The live prototype is ready for a funded-wallet test and a recorded ArcScan-verifiable settlement demo.",
    points: ["Browser wallet connection and Arc network switching", "Native-USDC request, policy, approval, and receipt", "Next: live testnet payment and ERC-8004 agent identity"],
  },
];

export default function DeckPage() {
  return (
    <main className="deck-page">
      <div className="deck-brand"><span className="deck-mark">A</span><span>ArcFlow</span><small>Built on Arc Testnet</small></div>
      <header className="deck-intro">
        <p>Checkpoint 2 presentation</p>
        <h1>ArcFlow</h1>
        <a href="/">Open live prototype</a>
      </header>
      <section className="deck-list">
        {slides.map((slide, index) => (
          <article className="deck-slide" key={slide.title}>
            <div className="deck-number">0{index + 1}</div>
            <div>
              <p className="deck-eyebrow">{slide.eyebrow}</p>
              <h2>{slide.title}</h2>
              <p className="deck-subtitle">{slide.subtitle}</p>
            </div>
            <ul>
              {slide.points.map((point) => <li key={point}>{point}</li>)}
            </ul>
          </article>
        ))}
      </section>
      <footer className="deck-footer">Independent project for Arc Testnet. ArcFlow is not affiliated with or endorsed by Arc or Circle.</footer>
    </main>
  );
}
