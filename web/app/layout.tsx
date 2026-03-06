import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Navbar } from "@/components/ui/navbar";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BillSleeve — Bill & Warranty Manager",
  description:
    "Offline, zero-API bill management with automatic warranty registration. Your receipts, secured and automated.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-black text-white antialiased`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
export const dynamic = 'force-dynamic';

