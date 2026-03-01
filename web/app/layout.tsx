import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BillSleeve — Bill & Warranty Manager",
  description:
    "Offline, zero-API bill management with automatic warranty registration. Your receipts, secured and automated.",
};

import { ClerkProvider } from '@clerk/nextjs'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${geist.className} bg-zinc-950 text-white antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
