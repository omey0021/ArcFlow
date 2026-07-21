"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

type PaymentRequest = {
  id: string;
  payeeName: string;
  recipient: string;
  amount: string;
  purpose: string;
};

type Receipt = PaymentRequest & {
  payer: string;
  txHash: string;
  finalizedAt: string;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

const ARC_CHAIN_ID = "0x4CF4B2";
const ARC_RPC = "https://rpc.testnet.arc.network";
const ARC_EXPLORER = "https://testnet.arcscan.app";
const USDC_DECIMALS = 18;
const MAX_AUTO_APPROVAL_USDC = 25;
// Arc Testnet requires EIP-1559 fees above its documented 20 Gwei base-fee floor.
const MAX_FEE_PER_GAS = "0x9502f900"; // 40 Gwei
const MAX_PRIORITY_FEE_PER_GAS = "0x3b9aca00"; // 1 Gwei

function shortAddress(value: string) {
  return value ? `${value.slice(0, 6)}...${value.slice(-4)}` : "Not connected";
}

function toBaseUnits(amount: string) {
  const [whole, fraction = ""] = amount.trim().split(".");
  const padded = `${fraction.replace(/\D/g, "").slice(0, USDC_DECIMALS)}${"0".repeat(USDC_DECIMALS)}`.slice(0, USDC_DECIMALS);
  return `0x${(BigInt(whole || "0") * 10n ** BigInt(USDC_DECIMALS) + BigInt(padded || "0")).toString(16)}`;
}

function fromBaseUnits(value: string) {
  const amount = BigInt(value);
  const whole = amount / 10n ** BigInt(USDC_DECIMALS);
  const fraction = (amount % 10n ** BigInt(USDC_DECIMALS)).toString().padStart(USDC_DECIMALS, "0").slice(0, 2);
  return `${whole}.${fraction}`;
}

function loadRequestFromUrl(): PaymentRequest | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const recipient = params.get("to");
  const amount = params.get("amount");
  if (!recipient || !amount) return null;
  return {
    id: params.get("id") || crypto.randomUUID(),
    payeeName: params.get("payee") || "ArcFlow recipient",
    recipient,
    amount,
    purpose: params.get("purpose") || "ArcFlow payment request",
  };
}

export default function Home() {
  const [account, setAccount] = useState("");
  const [balance, setBalance] = useState("");
  const [networkReady, setNetworkReady] = useState(false);
  const [status, setStatus] = useState("Connect a browser wallet to begin.");
  const [request, setRequest] = useState<PaymentRequest | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [shareUrl, setShareUrl] = useState("");
  const [form, setForm] = useState({ payeeName: "", recipient: "", amount: "5.00", purpose: "" });

  const decision = useMemo(() => {
    if (!request) return null;
    const amount = Number(request.amount);
    const available = Number(balance || 0);
    const enoughBalance = !balance || available >= amount;
    return {
      approved: amount > 0 && amount <= MAX_AUTO_APPROVAL_USDC && enoughBalance,
      reason: amount > MAX_AUTO_APPROVAL_USDC
        ? `Needs extra review because it exceeds the ${MAX_AUTO_APPROVAL_USDC} USDC policy limit.`
        : !enoughBalance
          ? "Insufficient visible native USDC balance for this payment."
          : "Within the configured payment policy and ready for explicit user approval.",
    };
  }, [balance, request]);

  useEffect(() => {
    const incomingRequest = loadRequestFromUrl();
    if (incomingRequest) setRequest(incomingRequest);
  }, []);

  async function switchToArc() {
    if (!window.ethereum) throw new Error("No browser wallet found. Install MetaMask or another EIP-1193 wallet.");
    try {
      await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: ARC_CHAIN_ID }] });
    } catch (error) {
      const code = (error as { code?: number }).code;
      if (code !== 4902) throw error;
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: ARC_CHAIN_ID,
          chainName: "Arc Testnet",
          nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
          rpcUrls: [ARC_RPC],
          blockExplorerUrls: [ARC_EXPLORER],
        }],
      });
    }
    setNetworkReady(true);
  }

  async function refreshBalance(address = account) {
    if (!window.ethereum || !address) return;
    const raw = await window.ethereum.request({ method: "eth_getBalance", params: [address, "latest"] }) as string;
    setBalance(fromBaseUnits(raw));
  }

  async function connectWallet() {
    try {
      if (!window.ethereum) throw new Error("No browser wallet found. Install MetaMask or another EIP-1193 wallet.");
      setStatus("Requesting wallet connection...");
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" }) as string[];
      const connected = accounts[0] || "";
      if (!connected) throw new Error("No wallet account was returned.");
      setAccount(connected);
      await switchToArc();
      await refreshBalance(connected);
      setStatus("Wallet connected to Arc Testnet. Native USDC covers payment and gas.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not connect wallet.");
    }
  }

  function createRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^0x[a-fA-F0-9]{40}$/.test(form.recipient)) {
      setStatus("Enter a valid 0x recipient address.");
      return;
    }
    if (!Number(form.amount) || Number(form.amount) <= 0) {
      setStatus("Enter a payment amount greater than zero.");
      return;
    }
    const nextRequest: PaymentRequest = { id: crypto.randomUUID(), ...form };
    setRequest(nextRequest);
    const url = new URL(window.location.href);
    url.search = new URLSearchParams({ id: nextRequest.id, payee: nextRequest.payeeName, to: nextRequest.recipient, amount: nextRequest.amount, purpose: nextRequest.purpose }).toString();
    setShareUrl(url.toString());
    setStatus("Payment request created. Copy the link or pay it from this wallet.");
  }

  async function payRequest() {
    if (!request || !account || !window.ethereum) return;
    if (!networkReady) {
      await connectWallet();
      return;
    }
    if (!decision?.approved) {
      setStatus(decision?.reason || "Payment cannot be approved.");
      return;
    }
    try {
      setStatus("Confirm the native USDC payment in your wallet...");
      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [{
          from: account,
          to: request.recipient,
          value: toBaseUnits(request.amount),
          type: "0x2",
          maxFeePerGas: MAX_FEE_PER_GAS,
          maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
        }],
      }) as string;
      setStatus("Payment submitted. Waiting for Arc finality...");
      for (let attempt = 0; attempt < 30; attempt += 1) {
        const txReceipt = await window.ethereum.request({ method: "eth_getTransactionReceipt", params: [txHash] }) as { status?: string } | null;
        if (txReceipt?.status === "0x1") {
          const nextReceipt = { ...request, payer: account, txHash, finalizedAt: new Date().toISOString() };
          setReceipt(nextReceipt);
          localStorage.setItem(`arcflow-receipt-${request.id}`, JSON.stringify(nextReceipt));
          setStatus("Payment final on Arc. Your receipt is ready to verify on ArcScan.");
          await refreshBalance();
          return;
        }
        if (txReceipt?.status === "0x0") throw new Error("The payment transaction reverted.");
        await new Promise((resolve) => window.setTimeout(resolve, 1000));
      }
      throw new Error("Timed out while waiting for the payment receipt.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Payment could not be completed.");
    }
  }

  return (
    <main className="grid-lines min-h-screen px-5 py-6 md:px-10 md:py-9">
      <section className="mx-auto max-w-6xl">
        <header className="mb-12 flex flex-col gap-5 border-b border-[var(--line)] pb-7 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.25em] text-[#77e2b4]">Arc Testnet payment workflow</p>
            <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">Arc<span className="text-[#78a7ff]">Flow</span></h1>
          </div>
          <button onClick={connectWallet} className="rounded-full border border-[#8fb2ef]/40 bg-[#14284a] px-5 py-3 text-sm font-bold transition hover:bg-[#1b3767]">
            {account ? `Connected: ${shortAddress(account)}` : "Connect wallet"}
          </button>
        </header>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <Metric label="Network" value={networkReady ? "Arc Testnet" : "Connect wallet"} detail="Chain ID 5042002" />
          <Metric label="Native balance" value={balance ? `${balance} USDC` : "--"} detail="USDC pays gas on Arc" />
          <Metric label="Settlement" value="1 confirmation" detail="Deterministic finality" />
        </div>

        <p className="mb-8 rounded-xl border border-[#8fb2ef]/20 bg-[#0b1c36]/75 px-4 py-3 text-sm text-[#c2d2ec]">{status}</p>

        <div className="grid gap-7 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-2xl shadow-black/20">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#77e2b4]">01 / Payment decision</p>
            <h2 className="mb-6 text-2xl font-semibold">Create a transparent request</h2>
            <form onSubmit={createRequest} className="space-y-4">
              <Field label="Payee name"><input required value={form.payeeName} onChange={(event) => setForm({ ...form, payeeName: event.target.value })} placeholder="Maya Design Studio" /></Field>
              <Field label="Recipient address"><input required value={form.recipient} onChange={(event) => setForm({ ...form, recipient: event.target.value })} placeholder="0x..." /></Field>
              <Field label="Amount in USDC"><input required inputMode="decimal" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="5.00" /></Field>
              <Field label="Purpose"><textarea required rows={3} value={form.purpose} onChange={(event) => setForm({ ...form, purpose: event.target.value })} placeholder="Brand design milestone #1" /></Field>
              <button className="w-full rounded-xl bg-[#77e2b4] px-5 py-3 font-bold text-[#061128] transition hover:bg-[#a2f1ce]">Create payment request</button>
            </form>
            {shareUrl && <div className="mt-5 rounded-xl border border-[#8fb2ef]/20 bg-black/15 p-3 text-xs text-[#b9cbed]"><p className="mb-2 font-bold text-white">Shareable payment link</p><p className="break-all">{shareUrl}</p></div>}
          </section>

          <section className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-2xl shadow-black/20">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#78a7ff]">02 / User approval and proof</p>
            {!request ? <EmptyState /> : <PaymentCard request={request} decision={decision} receipt={receipt} onPay={payRequest} account={account} />}
          </section>
        </div>

        <section className="mt-7 rounded-3xl border border-[var(--line)] bg-[#0a1930]/75 p-6">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[#77e2b4]">How ArcFlow uses Arc</p>
          <div className="grid gap-4 md:grid-cols-3">
            <Info title="USDC-native payments" copy="The connected wallet submits a real native USDC payment on Arc Testnet. USDC also covers gas." />
            <Info title="Explicit user approval" copy="The policy engine produces a recommendation, but the wallet owner signs every payment." />
            <Info title="Auditable final receipt" copy="One successful receipt marks the payment final and exposes an independent ArcScan proof link." />
          </div>
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="rounded-2xl border border-[var(--line)] bg-[#0b1b34]/70 p-4"><p className="text-xs uppercase tracking-[0.15em] text-[var(--muted)]">{label}</p><p className="mt-2 text-xl font-bold">{value}</p><p className="mt-1 text-xs text-[#9db0d1]">{detail}</p></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-semibold text-[#d5e1f5]"><span className="mb-2 block">{label}</span><div className="[&>input]:w-full [&>input]:rounded-xl [&>input]:border [&>input]:border-[#8fb2ef]/20 [&>input]:bg-[#071426] [&>input]:px-3 [&>input]:py-3 [&>input]:text-white [&>textarea]:w-full [&>textarea]:rounded-xl [&>textarea]:border [&>textarea]:border-[#8fb2ef]/20 [&>textarea]:bg-[#071426] [&>textarea]:px-3 [&>textarea]:py-3 [&>textarea]:text-white">{children}</div></label>;
}

function EmptyState() {
  return <div className="flex min-h-96 flex-col justify-center rounded-2xl border border-dashed border-[#8fb2ef]/30 p-8"><p className="text-lg font-semibold">No payment request selected</p><p className="mt-2 max-w-md text-sm leading-6 text-[#9db0d1]">Create a request on the left. ArcFlow will make its deterministic policy recommendation before a wallet owner can approve the native USDC payment.</p></div>;
}

function PaymentCard({ request, decision, receipt, onPay, account }: { request: PaymentRequest; decision: { approved: boolean; reason: string } | null; receipt: Receipt | null; onPay: () => void; account: string }) {
  if (receipt) return <div className="rounded-2xl border border-[#77e2b4]/45 bg-[#0d2b2c]/55 p-6"><p className="text-sm font-bold uppercase tracking-[0.18em] text-[#77e2b4]">Payment final</p><h2 className="mt-3 text-3xl font-bold">{receipt.amount} USDC sent</h2><p className="mt-3 text-sm text-[#cae4d8]">{receipt.purpose}</p><ReceiptRow label="Payer" value={shortAddress(receipt.payer)} /><ReceiptRow label="Recipient" value={shortAddress(receipt.recipient)} /><ReceiptRow label="Finalized" value={new Date(receipt.finalizedAt).toLocaleString()} /><a className="mt-6 inline-block rounded-xl bg-[#77e2b4] px-4 py-3 text-sm font-bold text-[#061128]" href={`${ARC_EXPLORER}/tx/${receipt.txHash}`} target="_blank" rel="noreferrer">Verify on ArcScan</a></div>;
  return <div className="space-y-6"><div><p className="text-sm text-[#9db0d1]">Payment request</p><h2 className="mt-1 text-3xl font-bold">{request.amount} USDC</h2><p className="mt-2 text-lg">{request.payeeName}</p><p className="mt-2 text-sm leading-6 text-[#9db0d1]">{request.purpose}</p></div><div className="space-y-3 rounded-2xl border border-[#8fb2ef]/20 bg-[#071426]/75 p-4"><ReceiptRow label="Recipient" value={shortAddress(request.recipient)} /><ReceiptRow label="Wallet" value={shortAddress(account)} /><ReceiptRow label="Gas" value="Paid in native USDC" /></div><div className={`rounded-2xl border p-4 ${decision?.approved ? "border-[#77e2b4]/40 bg-[#0d2b2c]/50" : "border-[#f5c775]/40 bg-[#362911]/40"}`}><p className="text-sm font-bold">Policy recommendation: {decision?.approved ? "Ready for approval" : "Needs review"}</p><p className="mt-2 text-sm leading-6 text-[#b8cbe8]">{decision?.reason}</p></div><button onClick={onPay} disabled={!decision?.approved} className="w-full rounded-xl bg-[#78a7ff] px-5 py-4 font-bold text-[#07111f] transition hover:bg-[#a6c1ff] disabled:cursor-not-allowed disabled:opacity-45">{account ? "Approve and pay on Arc" : "Connect wallet to pay"}</button><p className="text-center text-xs text-[#8298ba]">This action always requires your wallet signature. ArcFlow cannot move funds without it.</p></div>;
}

function ReceiptRow({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between gap-3 border-b border-[#8fb2ef]/10 py-2 text-sm last:border-0"><span className="text-[#94a8c8]">{label}</span><span className="font-mono text-right text-[#eaf2ff]">{value}</span></div>; }

function Info({ title, copy }: { title: string; copy: string }) { return <article className="rounded-2xl border border-[#8fb2ef]/15 bg-[#071426]/65 p-4"><h3 className="font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-[#9db0d1]">{copy}</p></article>; }
