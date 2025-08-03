"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import posthog from "@/app/instrumentation-client";
import type { User } from "@supabase/supabase-js";

interface UserProfile {
  membership_tier: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    posthog.capture("profile_page_view");

    const fetchUserAndProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);

      const { data, error } = await supabase
        .from("profiles")
        .select("membership_tier")
        .eq("id", user.id)
        .single();

      if (!error) {
        setProfile(data);
      }
    };

    fetchUserAndProfile();
  }, [router]);

  const handleSignOut = async () => {
    posthog.capture("sign_out", { user_id: user?.id, email: user?.email });
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
        <p className="text-sm text-muted mb-2 text-center">
          Logged in as <span className="font-medium">{user.email}</span>
        </p>
        <p className="text-sm text-muted mb-8 text-center">
          Access Level:{" "}
          <span className="font-medium">
            {profile?.membership_tier || "Unassigned"}
          </span>
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
