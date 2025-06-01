"use client";

import { useState } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col particle-bg">
      <Header toggleSidebar={() => setSidebarOpen(true)} />
      <div className="flex flex-1">
        <Sidebar
          isOpen={sidebarOpen}
          closeSidebar={() => setSidebarOpen(false)}
        />
        <main className="flex-1 overflow-y-auto relative">
          <div className="container mx-auto p-6 relative z-10">
            <div className="glass-effect rounded-3xl p-8 min-h-[calc(100vh-200px)] fade-in-up">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
