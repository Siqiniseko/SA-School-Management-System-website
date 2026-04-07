import React from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col max-w-[calc(100vw-16rem)]">
        <Topbar />
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-6xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
