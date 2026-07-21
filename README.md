# ArcFlow

ArcFlow is a transparent, user-approved USDC payment request prototype built for the Arc Programmable Money Hackathon, Agentic Economy track.

It demonstrates a narrow but real agentic commerce workflow:

1. A payee creates a payment request with an amount, purpose, and Arc address.
2. A deterministic policy engine explains whether the payment is inside the configured approval policy.
3. The payer connects a browser wallet, switches to Arc Testnet, and explicitly signs a native-USDC payment.
4. ArcFlow waits for one successful receipt, marks the transaction final, and links to ArcScan for independent verification.

## Why Arc

- Arc Testnet is EVM-compatible, so ArcFlow uses the standard browser-wallet JSON-RPC flow.
- Native USDC is used for the payment and gas.
- Arc provides deterministic finality, allowing a successful receipt to become a clear payment proof without waiting for multiple confirmations.

## Arc integration

| Item | Value |
| --- | --- |
| Network | Arc Testnet |
| Chain ID | `5042002` (`0x4CF4B2`) |
| RPC | `https://rpc.testnet.arc.network` |
| Explorer | `https://testnet.arcscan.app` |
| Faucet | [faucet.circle.com](https://faucet.circle.com) |
| Payment type | Native USDC EIP-1559 transaction |

The wallet configuration declares USDC with 6 display decimals. Native Arc transaction amounts use 18-decimal base units, as documented for Arc's gas token.
ArcFlow submits an EIP-1559 transaction with a 40 Gwei maximum fee and 1 Gwei priority fee to stay above Arc Testnet's documented 20 Gwei base-fee floor.

## Run locally

Prerequisites: Node.js 22+, MetaMask or another EIP-1193 compatible browser wallet, and Arc Testnet USDC from the [Circle Faucet](https://faucet.circle.com).

```bash
npm install
npm run dev
```

Open `http://localhost:3000`, connect a wallet, and approve Arc Testnet when prompted.

## Live links

- Live prototype: [arcflow-rose.vercel.app](https://arcflow-rose.vercel.app)
- Checkpoint presentation: [arcflow-rose.vercel.app/deck](https://arcflow-rose.vercel.app/deck)

## Demo path

1. Fund two test wallets with Arc Testnet USDC.
2. In ArcFlow, create a `5.00 USDC` request pointing to the payee wallet.
3. Copy the generated payment URL and open it in a browser profile using the payer wallet.
4. Connect the payer wallet and switch to Arc Testnet.
5. Confirm the payment details and select **Approve and pay on Arc**.
6. Sign the native-USDC transaction in the wallet.
7. Open the ArcScan receipt link after ArcFlow reports finality.

## Agent identity roadmap

The MVP contains a transparent, rules-based payment-policy agent. It is deliberately user-approved rather than autonomous. The next milestone is ERC-8004 registration on Arc Testnet; `public/agent-metadata.json` and the required registry addresses are documented in [docs/agent-identity-plan.md](docs/agent-identity-plan.md).

## Safety and scope

- This is a Testnet prototype, not a production payment product.
- ArcFlow never stores private keys and cannot send funds without an explicit wallet signature.
- The current policy is deliberately simple: payments at or below 25 USDC with enough visible balance are marked ready for user approval. This is a transparent demo policy, not financial advice.
- The MVP does not implement escrow, refunds, cross-chain routing, KYC, or automated payments.

## References

- [Arc Testnet connection](https://docs.arc.io/arc/references/connect-to-arc)
- [Arc agentic economy](https://docs.arc.io/build/agentic-economy)
- [Arc payments](https://docs.arc.io/build/payments)
- [App Kit send reference](https://docs.arc.io/app-kit/send)
