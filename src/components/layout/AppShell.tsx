"use client";

import type { ReactNode } from "react";
import { AppStateProvider } from "@/context/AppStateContext";
import { TopBar } from "./TopBar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <AppStateProvider>
      <div className="flex min-h-screen flex-col bg-[image:var(--page-gradient)] text-slate-900">
        <TopBar />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          {children}
        </main>
      </div>
    </AppStateProvider>
  );
}
