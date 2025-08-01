import type { Metadata } from "next";
import { Urbanist } from "next/font/google";
import "./globals.css";
import AppShell from "../components/AppShell";

const urbanist = Urbanist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Thrust | AI Analyst Assistant",
  description: "AI that reads like your best analyst.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${urbanist.variable} bg-background text-foreground font-sans antialiased`}>
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
