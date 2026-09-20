"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  HelpCircle,
  Shield,
  Lock,
  Trophy,
  LogOut,
  Menu,
  X,
  BookOpen,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/teams", label: "Teams", icon: Users },
  { href: "/admin/questions", label: "Questions", icon: HelpCircle },
  { href: "/admin/rounds", label: "Rounds", icon: Lock },
  { href: "/admin/proctoring", label: "Proctoring", icon: Shield },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.authenticated || d.role !== "admin") {
          router.replace("/login");
        }
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  return (
    <div className="flex h-dvh overflow-hidden" style={{ background: "var(--color-bg)" }}>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-60 flex flex-col border-r
        transition-transform duration-300 ease-out
        lg:static lg:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
        style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: "var(--color-border)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, var(--color-palette-burgundy), var(--color-palette-crimson))" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <rect x="1" y="1" width="6" height="6" rx="1" fill="white" opacity="0.9" />
              <rect x="9" y="1" width="6" height="6" rx="1" fill="white" opacity="0.5" />
              <rect x="1" y="9" width="6" height="6" rx="1" fill="white" opacity="0.5" />
              <rect x="9" y="9" width="6" height="6" rx="1" fill="white" opacity="0.25" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm truncate" style={{ color: "var(--color-text-primary)" }}>
              Data Structathon
            </p>
            <p className="text-xs" style={{ color: "var(--color-accent)" }}>Admin Panel</p>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}
            style={{ color: "var(--color-text-secondary)" }}>
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <ul className="flex flex-col gap-0.5">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                    style={{
                      color: active ? "var(--color-accent)" : "var(--color-text-secondary)",
                      background: active ? "var(--color-accent-light)" : "transparent",
                    }}
                  >
                    <Icon size={17} />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-3 border-t" style={{ borderColor: "var(--color-border)" }}>
          <button className="btn btn-ghost btn-sm w-full justify-start gap-3" disabled={loggingOut}
            onClick={handleLogout}>
            <LogOut size={16} />
            {loggingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-auto">
        {/* Top bar for mobile */}
        <div className="flex items-center gap-3 px-4 py-3 border-b lg:hidden"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
          <button onClick={() => setSidebarOpen(true)} style={{ color: "var(--color-text-secondary)" }}>
            <Menu size={22} />
          </button>
          <span className="font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>
            Admin Panel
          </span>
        </div>

        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
