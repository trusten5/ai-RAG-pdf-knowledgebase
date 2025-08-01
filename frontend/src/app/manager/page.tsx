"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import AskThrustPanel from "@/components/AskThrustPanel";

interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string;
  updated_at: string;
  created_at: string;
}

export default function ManagerPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.replace("/login");
      } else {
        setUser(user);
        await fetchProjects(user.id);
      }
      setLoadingAuth(false);
    });
    // eslint-disable-next-line
  }, []);

  async function fetchProjects(userId: string) {
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      setError("Failed to load projects.");
      setProjects([]);
    } else {
      setProjects(data || []);
      setError(null);
    }
    setLoading(false);
  }

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    setError(null);

    const { data, error } = await supabase
      .from("projects")
      .insert([
        {
          user_id: user.id,
          title: newTitle.trim(),
          description: newDesc.trim(),
        },
      ])
      .select()
      .single();

    if (error || !data) {
      setError("Failed to create project.");
    } else {
      setProjects((prev) => [data, ...prev]);
      setShowModal(false);
      setNewTitle("");
      setNewDesc("");
      router.push(`/dashboard/${data.id}`);
    }
    setCreating(false);
  }

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted bg-background">
        Checking authentication...
      </div>
    );
  }

  return (
    <main className="min-h-screen pt-32 px-4 max-w-4xl mx-auto">
      <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground mb-1 tracking-tight">
            Project Manager
          </h1>
          <div className="text-muted-strong text-base">
            {user ? `Signed in as ${user.email}` : "Loading user..."}
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-2 rounded-xl bg-accent text-background font-semibold hover:bg-accent-hover shadow transition"
        >
          + New Project
        </button>
      </div>

      {/* Global Ask Thrust Chat */}
      {user && (
        <div className="mb-14">
          <AskThrustPanel userId={user.id} mode="global" />
        </div>
      )}

      {error && <div className="mb-4 text-red-500 text-center">{error}</div>}
      {loading ? (
        <div className="text-muted text-lg text-center mt-20 animate-pulse">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="text-muted text-lg text-center mt-20">
          No projects found.<br />Start by creating a new project.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          {projects.map((proj) => (
            <Link
              key={proj.id}
              href={`/dashboard/${proj.id}`}
              className="block bg-card border border-muted rounded-2xl p-6 shadow-lg hover:border-accent group transition"
            >
              <div className="text-xl font-semibold text-foreground group-hover:text-accent transition">
                {proj.title}
              </div>
              {proj.description && (
                <div className="mt-2 text-muted text-sm">{proj.description}</div>
              )}
              <div className="mt-4 text-xs text-muted-strong">
                Last updated: {proj.updated_at ? proj.updated_at.split("T")[0] : ""}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center transition-all">
          <form
            onSubmit={handleCreateProject}
            className="bg-background border border-muted rounded-2xl shadow-2xl p-8 w-full max-w-md animate-fadeIn"
          >
            <h2 className="text-xl font-bold mb-6 text-foreground">Create New Project</h2>
            <div className="mb-5">
              <label htmlFor="title" className="block text-muted-strong mb-2 text-sm font-medium">
                Project Title
              </label>
              <input
                id="title"
                type="text"
                required
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-muted text-foreground focus:outline-none focus:border-accent transition"
                maxLength={80}
                autoFocus
              />
            </div>
            <div className="mb-5">
              <label htmlFor="desc" className="block text-muted-strong mb-2 text-sm font-medium">
                Description (optional)
              </label>
              <textarea
                id="desc"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-muted text-foreground focus:outline-none focus:border-accent transition"
                maxLength={200}
                rows={2}
              />
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button
                type="submit"
                disabled={creating}
                className="px-5 py-2 rounded-lg bg-accent text-background font-semibold hover:bg-accent-hover transition disabled:opacity-70"
              >
                {creating ? "Creating..." : "Create Project"}
              </button>
              <button
                type="button"
                className="px-5 py-2 rounded-lg border border-muted text-muted hover:text-foreground transition"
                onClick={() => setShowModal(false)}
                disabled={creating}
              >
                Cancel
              </button>
            </div>
            {error && <div className="mt-4 text-red-600 text-center text-sm">{error}</div>}
          </form>
        </div>
      )}
    </main>
  );
}
