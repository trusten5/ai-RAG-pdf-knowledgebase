"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      let result;
      if (isSignUp) {
        result = await supabase.auth.signUp({ email, password });
      } else {
        result = await supabase.auth.signInWithPassword({ email, password });
      }

      if (result.error) {
        setErrorMsg(result.error.message);
      } else if (!isSignUp) {
        router.push("/manager");
      } else {
        setErrorMsg("Sign up successful! Please check your email to verify your account.");
      }
    } catch {
      setErrorMsg("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-xl p-10 animate-fadeIn">
        <h2 className="text-2xl text-accent font-bold mb-8 text-center text-foreground">
          {isSignUp ? "Create your account" : "Sign in to Thrust"}
        </h2>
        <form onSubmit={handleAuth} className="flex flex-col gap-5">
          <div>
            <label htmlFor="email" className="block text-muted-strong mb-1 text-sm font-medium">
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              required
              id="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-background border border-muted text-foreground focus:outline-none focus:border-accent transition"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-muted-strong mb-1 text-sm font-medium">
              Password
            </label>
            <input
              type="password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              required
              id="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-background border border-muted text-foreground focus:outline-none focus:border-accent transition"
            />
          </div>
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500 text-red-600 rounded p-2 text-sm text-center">
              {errorMsg}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg font-semibold bg-accent text-background hover:bg-accent-hover transition disabled:opacity-70"
          >
            {loading ? (isSignUp ? "Creating Account..." : "Signing In...") : isSignUp ? "Sign Up" : "Sign In"}
          </button>
        </form>
        <div className="text-center mt-6">
          <button
            type="button"
            className="text-accent hover:underline text-sm"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg(null);
            }}
          >
            {isSignUp
              ? "Already have an account? Sign In"
              : "Don't have an account? Sign Up"}
          </button>
        </div>
        <div className="text-center mt-4">
          <Link href="/" className="text-muted text-xs hover:underline">
            &larr; Back to landing
          </Link>
        </div>
      </div>
    </div>
  );
}
