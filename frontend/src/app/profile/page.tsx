"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push("/login");
      else setUser(user);
    });
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full bg-card rounded-2xl shadow-xl p-10 text-foreground">
        <h1 className="text-2xl font-bold mb-4 text-center">Your Profile</h1>
        <p className="text-sm text-muted mb-8 text-center">
          Logged in as <span className="font-medium">{user.email}</span>
        </p>
        <button
          onClick={handleSignOut}
          className="w-full py-2 rounded-lg font-semibold bg-destructive text-background hover:bg-destructive-hover transition"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
