"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { BookOpen, Moon, Sun } from "lucide-react";

export function AuthLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    const theme = window.localStorage.getItem("reading-room-theme");
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, []);

  function toggleTheme() {
    const nextDark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", nextDark);
    window.localStorage.setItem("reading-room-theme", nextDark ? "dark" : "light");
  }

  return (
    <div className="min-h-dvh bg-background text-foreground lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(390px,0.92fr)]">
      <main className="flex min-h-dvh flex-col px-5 py-5 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between">
          <Link href="/login" className="inline-flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground"><BookOpen size={18} /></span>
            <span className="text-sm font-semibold tracking-tight">Reading Room Manager</span>
          </Link>
          <button type="button" aria-label="Toggle color theme" onClick={toggleTheme} className="grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Sun className="hidden size-[18px] dark:block" />
            <Moon className="size-[18px] dark:hidden" />
          </button>
        </header>
        <div className="flex flex-1 items-center justify-center py-10 sm:py-14">
          <div className="w-full max-w-md">{children}</div>
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span>© {new Date().getFullYear()} Reading Room Manager</span>
          <span>Secure access for your study centre</span>
        </footer>
      </main>

      <aside className="relative hidden min-h-dvh overflow-hidden border-l border-border bg-secondary/50 p-10 lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="absolute inset-0 opacity-40" aria-hidden="true" style={{ backgroundImage: "linear-gradient(to right, var(--color-border) 1px, transparent 1px), linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)", backgroundSize: "44px 44px", maskImage: "linear-gradient(to bottom, black, transparent 84%)" }} />
        <div className="relative flex items-center gap-2 text-xs font-medium text-muted-foreground"><span className="size-2 rounded-full bg-primary" /> One calm place to manage your reading room</div>
        <div className="relative mx-auto w-full max-w-lg">
          <div className="mb-8 max-w-md">
            <p className="text-xs font-semibold uppercase text-primary">Built for study spaces</p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">More time for learning. Less time on logistics.</h1>
            <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">Keep memberships, seat schedules, and collections in view, all from one reading-room workspace.</p>
          </div>
          <div className="rounded-xl border border-border bg-card/90 p-5 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-border pb-4"><div><p className="text-xs font-medium">Today at the reading room</p><p className="mt-1 text-[11px] text-muted-foreground">Workspace overview · demo preview</p></div><span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-medium text-primary">Open</span></div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[{ title: "North Wing", seats: [true, true, false, true, false, true] }, { title: "Garden Room", seats: [true, false, true, true, true, false] }, { title: "Study Hall", seats: [false, true, true, false, true, true] }].map((room) => <div key={room.title} className="rounded-lg border border-border p-3"><p className="truncate text-[10px] font-medium">{room.title}</p><div className="mt-3 grid grid-cols-3 gap-1.5">{room.seats.map((occupied, index) => <span key={index} className={`aspect-square rounded-sm border ${occupied ? "border-primary/30 bg-primary/15" : "border-border bg-background"}`} />)}</div><p className="mt-2 text-[9px] text-muted-foreground">{room.seats.filter(Boolean).length} seats in use</p></div>)}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-[10px] text-muted-foreground"><span>Seat availability updates as assignments change</span><span className="font-medium text-primary">Live view</span></div>
          </div>
        </div>
        <div className="relative flex justify-between text-[11px] text-muted-foreground"><span>Student-first operations</span><span>Simple, thoughtful workflows</span></div>
      </aside>
    </div>
  );
}