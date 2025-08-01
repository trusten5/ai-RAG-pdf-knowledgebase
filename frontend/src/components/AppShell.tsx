// components/AppShell.tsx
"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Only show Footer if not on /dashboard or any subpage of dashboard
  const showFooter = !pathname.startsWith("/dashboard");

  return (
    <>
      <Header />
      {children}
      {showFooter && <Footer />}
    </>
  );
}
