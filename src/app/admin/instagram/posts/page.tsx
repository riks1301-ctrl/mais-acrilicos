"use client";

import { GenerateIdeasPanel } from "@/components/admin/instagram/GenerateIdeasPanel";
import { PostsList } from "@/components/admin/instagram/PostsList";
import { useState } from "react";

export default function InstagramPostsPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Posts do Instagram</h2>
        <p className="mt-1 text-slate-600">Ideias, legendas e análise comercial geradas pelo agente.</p>
      </div>
      <GenerateIdeasPanel onGenerated={() => setRefreshKey((k) => k + 1)} />
      <PostsList key={refreshKey} />
    </div>
  );
}
