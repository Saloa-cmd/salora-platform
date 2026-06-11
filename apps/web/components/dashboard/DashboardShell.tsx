"use client";

import type { ReactNode } from "react";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardTopBar } from "./DashboardTopBar";

type DashboardShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function DashboardShell({ title, subtitle, children }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--cream)]">
      <a href="#dashboard-content" className="skip-link">Skip to dashboard content</a>
      <div className="flex min-h-screen">
        <DashboardSidebar />
        <div className="min-w-0 flex-1">
          <DashboardTopBar title={title} subtitle={subtitle} />
          <main id="dashboard-content" className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
