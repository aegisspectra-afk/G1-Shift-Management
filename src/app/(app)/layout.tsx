import { Suspense } from "react";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";

function AppLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] text-sm text-slate-500">
      טוען את מערכת הסידור…
    </div>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<AppLoading />}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}