# ArcFlow Agent Identity Plan

ArcFlow's current MVP uses a transparent in-app payment-policy agent. It never executes a payment autonomously: the connected wallet owner must explicitly sign each transaction.

## Planned onchain agent identity

The next integration step is to register the payment-policy agent using Arc's ERC-8004 IdentityRegistry.

| Item | Value |
| --- | --- |
| Network | Arc Testnet |
| IdentityRegistry | `0x8004A818BFB912233c491871b3d84c89A494BD9e` |
| ReputationRegistry | `0x8004B663056A597Dffe9eCcC1965A193B7388713` |
| ValidationRegistry | `0x8004Cb1BF31DAf7788923b405b754f57acEB4272` |
| Metadata | `public/agent-metadata.json` (host it first, then supply its HTTPS/IPFS URI) |

## Registration flow

1. Deploy ArcFlow so `agent-metadata.json` has a public URI, or pin the metadata to IPFS.
2. Create/fund an Arc Testnet owner wallet with test USDC from the Circle Faucet.
3. Call `register(metadataURI)` on the IdentityRegistry from the owner wallet.
4. Record the returned transaction and minted agent identity in the ArcFlow audit log.
5. For reputation or validation, use an independent validator wallet. The owner must not self-attest.

Reference: [Register your first AI agent](https://docs.arc.io/arc/tutorials/register-your-first-ai-agent).
