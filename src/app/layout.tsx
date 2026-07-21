import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ArcFlow | USDC payment decisions on Arc",
  description: "A transparent, user-approved USDC payment workflow for Arc Testnet.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
