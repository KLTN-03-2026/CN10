"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { AuthGuard } from "@/lib/protected-route";
import { Spinner } from "@/components/ui/spinner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type DocumentationSection = {
  _id: string;
  sectionId: string;
  title: string;
  content: string;
  icon?: string;
  order: number;
};

export default function DocumentationPage() {
  const [docs, setDocs] = useState<DocumentationSection[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const loadDocs = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/api/docs`);
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(
            payload?.error || payload?.message || "Failed to fetch docs",
          );
        }

        const sections: DocumentationSection[] = payload?.docs || [];
        setDocs(sections);

        if (sections.length > 0) {
          setActiveSectionId(sections[0].sectionId);
        }
      } catch (fetchError) {
        const message =
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to load documentation";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadDocs();
  }, []);

  const activeSection = useMemo(
    () => docs.find((item) => item.sectionId === activeSectionId) || null,
    [docs, activeSectionId],
  );

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <DashboardHeader />

        <div className="flex">
          <DashboardSidebar />

          <main className="min-w-0 flex-1 overflow-auto">
            <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
              <div className="mb-6 rounded-2xl border border-blue-500/20 bg-card/60 p-5 shadow-lg backdrop-blur sm:mb-8 sm:p-7">
                <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                  Documentation
                </h2>
                <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                  Knowledge base is loaded dynamically from MongoDB.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-8">
                <aside className="rounded-xl border border-border bg-card/50 p-3 sm:p-4 lg:sticky lg:top-6 lg:h-fit">
                  <p className="mb-3 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Sections
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-2">
                    {isLoading && (
                      <div className="col-span-full flex items-center justify-center rounded-xl border border-border bg-background/40 p-6">
                        <Spinner />
                      </div>
                    )}

                    {!isLoading && docs.length === 0 && (
                      <div className="col-span-full rounded-xl border border-border bg-background/40 p-4 text-sm text-muted-foreground">
                        No documentation sections found.
                      </div>
                    )}

                    {!isLoading &&
                      docs.map((tab) => {
                        const isActive = activeSectionId === tab.sectionId;
                        const shortDescription = tab.content
                          .replace(/\s+/g, " ")
                          .trim()
                          .slice(0, 72);

                        return (
                          <button
                            key={tab.sectionId}
                            type="button"
                            onClick={() => setActiveSectionId(tab.sectionId)}
                            className={`aspect-square rounded-xl border p-4 text-left transition ${
                              isActive
                                ? "border-blue-500/50 bg-blue-500/15 text-blue-100"
                                : "border-border bg-background/40 text-muted-foreground hover:bg-secondary hover:text-foreground"
                            }`}
                          >
                            <div className="flex h-full flex-col justify-between">
                              <div className="text-3xl">{tab.icon || "📘"}</div>
                              <div>
                                <p className="text-sm font-semibold">{tab.title}</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {shortDescription}
                                  {tab.content.length > 72 ? "..." : ""}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </aside>

                <article className="rounded-xl border border-border bg-card/50 p-5 sm:p-7">
                  <div className="prose prose-invert max-w-none prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground">
                    {isLoading && (
                      <div className="flex min-h-[240px] items-center justify-center">
                        <Spinner />
                      </div>
                    )}

                    {!isLoading && error && (
                      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                        {error}
                      </div>
                    )}

                    {!isLoading && !error && !activeSection && (
                      <div className="rounded-xl border border-border bg-background/40 p-4 text-sm text-muted-foreground">
                        No section selected.
                      </div>
                    )}

                    {!isLoading && !error && activeSection && (
                      <>
                        <h3>{activeSection.title}</h3>
                        <div className="whitespace-pre-wrap text-muted-foreground">
                          {activeSection.content}
                        </div>
                      </>
                    )}
                  </div>
                </article>
              </div>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
