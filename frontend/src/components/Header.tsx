"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function Header() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-muted shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link
          href={user ? "/manager" : "/"}
          className="text-2xl font-extrabold tracking-tight text-accent hover:opacity-90 transition"
        >
          Thrust
        </Link>
        <nav className="space-x-6 text-sm">
          {!user ? (
            <>
              <Link href="/" className="hover:text-accent transition">Home</Link>
              <Link href="/about" className="hover:text-accent transition">About</Link>
              <Link href="/login" className="hover:text-accent transition font-semibold">Login</Link>
            </>
          ) : (
            <>
              <Link href="/manager" className="hover:text-accent transition font-semibold">Manager</Link>
              <Link href="/profile" className="hover:text-accent transition font-semibold">Profile</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
