import React from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

type LayoutProps = { children: React.ReactNode };

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 bg-slate-50 dark:bg-slate-950">{children}</main>
      </div>
    </div>
  );
};
