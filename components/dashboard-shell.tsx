"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  Armchair,
  BadgeIndianRupee,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  ChevronDown,
  ClipboardList,
  Clock3,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sparkles,
  Sun,
  UsersRound,
  UserRoundCheck,
  X,
  ChartNoAxesColumnIncreasing,
  Receipt,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const navigationGroups: { label: string; items: NavigationItem[] }[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/", icon: LayoutDashboard }],
  },
  {
    label: "Library",
    items: [
      { label: "Students", href: "/students", icon: UsersRound },
      { label: "Admissions", href: "/admissions", icon: ClipboardList },
      { label: "Rooms & Seats", href: "/rooms-seats", icon: Armchair },
      {
        label: "Seat Assignments",
        href: "/seat-assignments",
        icon: UserRoundCheck,
      },
      { label: "Time Slots", href: "/time-slots", icon: Clock3 },
      { label: "Memberships", href: "/memberships", icon: BadgeIndianRupee },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Fees & Payments", href: "/fees-payments", icon: CreditCard },
      { label: "Expenses", href: "/expenses", icon: Receipt },
      { label: "Reports", href: "/reports", icon: ChartNoAxesColumnIncreasing },
    ],
  },
  {
    label: "Workspace",
    items: [
      { label: "Staff", href: "/staff", icon: BriefcaseBusiness },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

const routeTitles = new Map(
  navigationGroups.flatMap((group) =>
    group.items.map((item) => [item.href, item.label] as const),
  ),
);
routeTitles.set("/subscription", "Subscription");

function getPageTitle(pathname: string) {
  if (pathname.startsWith("/students/")) return "Student details";
  return routeTitles.get(pathname) ?? "Dashboard";
}

type DashboardShellProps = {
  children: ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const pageTitle = getPageTitle(pathname);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("reading-room-theme");
    const useDarkTheme = savedTheme === "dark";
    document.documentElement.classList.toggle("dark", useDarkTheme);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileOpen]);

  function toggleTheme() {
    const useDarkTheme = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", useDarkTheme);
    window.localStorage.setItem(
      "reading-room-theme",
      useDarkTheme ? "dark" : "light",
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground md:flex">
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-[#15251c]/45 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        aria-label="Main navigation"
        className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[transform,width] duration-200 md:sticky md:top-0 md:h-screen md:w-[260px] md:translate-x-0 ${
          collapsed ? "md:w-[76px]" : ""
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
            <BookOpen aria-hidden="true" size={19} strokeWidth={2} />
          </span>
          <div className={`min-w-0 flex-1 ${collapsed ? "md:hidden" : ""}`}>
            <p className="truncate text-sm font-semibold">Reading Room</p>
            <p className="truncate text-[11px] text-muted-foreground">
              Management portal
            </p>
          </div>
          <button
            type="button"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setCollapsed((value) => !value)}
            className="hidden size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-foreground md:flex"
          >
            {collapsed ? (
              <PanelLeftOpen size={17} />
            ) : (
              <PanelLeftClose size={17} />
            )}
          </button>
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setMobileOpen(false)}
            className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-sidebar-accent md:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <nav
          className="flex-1 space-y-5 overflow-y-auto px-3 py-5"
          aria-label="Dashboard pages"
        >
          {navigationGroups.map((group) => (
            <div key={group.label}>
              <p
                className={`mb-2 px-2 text-[10px] font-semibold uppercase text-muted-foreground ${collapsed ? "md:hidden" : ""}`}
              >
                {group.label}
              </p>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active =
                    pathname === item.href ||
                    (item.href === "/students" &&
                      pathname.startsWith("/students/"));
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        title={collapsed ? item.label : undefined}
                        aria-current={active ? "page" : undefined}
                        className={`flex h-10 items-center gap-3 rounded-md px-2.5 text-[13px] font-medium transition-colors ${
                          active
                            ? "bg-sidebar-accent text-sidebar-primary"
                            : "text-sidebar-foreground hover:bg-sidebar-accent"
                        } ${collapsed ? "md:justify-center md:px-0" : ""}`}
                      >
                        <Icon
                          aria-hidden="true"
                          className="shrink-0"
                          size={18}
                          strokeWidth={1.8}
                        />
                        <span
                          className={`truncate ${collapsed ? "md:hidden" : ""}`}
                        >
                          {item.label}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <Link
            href="/subscription"
            onClick={() => setMobileOpen(false)}
            title={collapsed ? "Subscription" : undefined}
            aria-current={pathname === "/subscription" ? "page" : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-md bg-secondary px-2.5 text-[13px] font-medium text-secondary-foreground hover:bg-sidebar-accent ${
              collapsed ? "md:justify-center md:px-0" : ""
            }`}
          >
            <Sparkles aria-hidden="true" className="shrink-0" size={18} />
            <span className={collapsed ? "md:hidden" : ""}>Subscription</span>
            <ChevronDown
              aria-hidden="true"
              className={`ml-auto size-4 ${collapsed ? "md:hidden" : ""}`}
            />
          </Link>
          <div
            className={`mt-3 flex items-center gap-2 px-1 py-1 ${collapsed ? "md:hidden" : ""}`}
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#dce9df] text-xs font-semibold text-[#315d43]">
              AM
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">Admin Manager</p>
              <p className="truncate text-[10px] text-muted-foreground">
                admin@readingroom.in
              </p>
            </div>
            <LogOut
              aria-hidden="true"
              className="text-muted-foreground"
              size={15}
            />
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
          <div className="flex min-h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              aria-label="Open navigation menu"
              onClick={() => setMobileOpen(true)}
              className="grid size-9 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted md:hidden"
            >
              <Menu size={19} />
            </button>
            <div className="min-w-0 flex-1">
              <div className="hidden items-center gap-2 text-[11px] text-muted-foreground sm:flex">
                <span>Workspace</span>
                <span aria-hidden="true">/</span>
                <span className="text-foreground">{pageTitle}</span>
              </div>
              <h1 className="truncate text-[17px] font-semibold leading-tight">
                {pageTitle}
              </h1>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                aria-label="Notifications"
                title="Notifications"
                className="relative grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Bell aria-hidden="true" size={18} />
                <span className="absolute right-[8px] top-[7px] size-1.5 rounded-full bg-destructive ring-2 ring-card" />
              </button>
              <button
                type="button"
                aria-label="Toggle light and dark theme"
                title="Toggle theme"
                onClick={toggleTheme}
                className="grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Sun
                  aria-hidden="true"
                  className="hidden size-[18px] dark:block"
                />
                <Moon aria-hidden="true" className="size-[18px] dark:hidden" />
              </button>
              <div className="relative ml-1">
                <button
                  type="button"
                  aria-label="Open profile menu"
                  aria-expanded={profileOpen}
                  onClick={() => setProfileOpen((value) => !value)}
                  className="flex items-center gap-2 rounded-md p-1 hover:bg-muted"
                >
                  <span className="grid size-8 place-items-center rounded-full bg-[#dce9df] text-xs font-semibold text-[#315d43]">
                    AM
                  </span>
                  <span className="hidden text-left sm:block">
                    <span className="block text-xs font-medium">
                      Admin Manager
                    </span>
                    <span className="block text-[10px] text-muted-foreground">
                      Administrator
                    </span>
                  </span>
                  <ChevronDown
                    aria-hidden="true"
                    className="hidden text-muted-foreground sm:block"
                    size={14}
                  />
                </button>
                {profileOpen && (
                  <div className="absolute right-0 top-11 z-40 w-48 rounded-lg border border-border bg-popover p-1.5 text-popover-foreground shadow-lg">
                    <div className="px-2.5 py-2">
                      <p className="text-xs font-medium">Admin Manager</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        admin@readingroom.in
                      </p>
                    </div>
                    <div className="my-1 border-t border-border" />
                    <Link
                      href="/settings"
                      onClick={() => setProfileOpen(false)}
                      className="flex h-9 items-center gap-2 rounded-md px-2.5 text-xs hover:bg-muted"
                    >
                      <Settings size={15} /> Account settings
                    </Link>
                    <button
                      type="button"
                      onClick={() => setProfileOpen(false)}
                      className="flex h-9 w-full items-center gap-2 rounded-md px-2.5 text-left text-xs text-destructive hover:bg-muted"
                    >
                      <LogOut size={15} /> Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
