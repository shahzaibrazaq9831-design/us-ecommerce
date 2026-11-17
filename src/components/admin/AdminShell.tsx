"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ChartNoAxesCombined,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  ShoppingCart,
  Sparkles,
  Star,
  Tags,
  Users,
  X,
} from "lucide-react";
import { signOutAdminAction } from "@/actions/admin";
import CommandPalette from "./CommandPalette";
import NotificationsBell from "./NotificationsBell";
import ThemeToggle, { useAdminTheme } from "./ThemeToggle";
import { ToastProvider } from "./ToastProvider";
import { useStoredPreference } from "./useStoredPreference";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/brands", label: "Brands & occasions", icon: Sparkles },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/analytics", label: "Analytics", icon: ChartNoAxesCombined },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarContent({
  collapsed,
  pathname,
  onNavigate,
  reduce,
}: {
  collapsed: boolean;
  pathname: string;
  onNavigate?: () => void;
  reduce: boolean;
}) {
  return (
    <>
      <div className="admin-sidebar-brand">
        <span className="admin-brand-mark" aria-hidden="true">
          RE
        </span>
        {!collapsed ? (
          <span className="admin-brand-copy">
            <strong>Rung E Bahar</strong>
            <small>Studio admin</small>
          </span>
        ) : null}
      </div>

      <nav className="admin-sidebar-nav" aria-label="Admin sections">
        <p className="admin-nav-label">{collapsed ? "•••" : "MANAGE"}</p>
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`admin-nav-item ${active ? "is-active" : ""}`}
              aria-current={active ? "page" : undefined}
              title={collapsed ? item.label : undefined}
            >
              {active && !reduce ? (
                <motion.span
                  layoutId="admin-active-indicator"
                  className="admin-nav-indicator"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              ) : null}
              <Icon size={19} aria-hidden="true" />
              {!collapsed ? <span>{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>

      {!collapsed ? (
        <div className="admin-sidebar-foot">
          <span className="admin-sidebar-status-dot" aria-hidden="true" />
          <span>Store live · PKR</span>
        </div>
      ) : null}
    </>
  );
}

export default function AdminShell({
  children,
  email,
}: {
  children: ReactNode;
  email: string;
}) {
  const pathname = usePathname();
  const reduce = Boolean(useReducedMotion());
  const [collapsedValue, setCollapsedValue] = useStoredPreference(
    "admin-sidebar-collapsed",
    "false"
  );
  const collapsed = collapsedValue === "true";
  const [lastPath, setLastPath] = useState(pathname);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [theme, toggleTheme] = useAdminTheme();

  // Navigation closes transient overlays as part of the render that sees the
  // new path, rather than in an effect that would cascade another render.
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMobileOpen(false);
    setAvatarOpen(false);
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((value) => !value);
      }
      if (event.key === "Escape") {
        setSearchOpen(false);
        setMobileOpen(false);
        setAvatarOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("admin-body-lock", mobileOpen);
    return () => document.body.classList.remove("admin-body-lock");
  }, [mobileOpen]);

  const initials = email
    .split(/[@.\s]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <ToastProvider>
      <div
        className="admin-root"
        data-admin-theme={theme}
        data-collapsed={collapsed ? "true" : "false"}
      >
        <motion.aside
          className="admin-sidebar admin-sidebar-desktop"
          animate={{ width: collapsed ? 78 : 252 }}
          initial={false}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 360, damping: 38 }}
        >
          <SidebarContent collapsed={collapsed} pathname={pathname} reduce={reduce} />
          <button
            type="button"
            className="admin-sidebar-toggle"
            onClick={() => setCollapsedValue(collapsed ? "false" : "true")}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
            {!collapsed ? <span>Collapse</span> : null}
          </button>
        </motion.aside>

        <AnimatePresence>
          {mobileOpen ? (
            <>
              <motion.div
                className="admin-mobile-backdrop"
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileOpen(false)}
              />
              <motion.aside
                className="admin-sidebar admin-sidebar-mobile"
                initial={reduce ? false : { x: -280 }}
                animate={{ x: 0 }}
                exit={reduce ? { opacity: 0 } : { x: -280 }}
                transition={{ type: "spring", stiffness: 380, damping: 36 }}
              >
                <button
                  type="button"
                  className="admin-mobile-close"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close navigation"
                >
                  <X size={20} />
                </button>
                <SidebarContent
                  collapsed={false}
                  pathname={pathname}
                  onNavigate={() => setMobileOpen(false)}
                  reduce={reduce}
                />
              </motion.aside>
            </>
          ) : null}
        </AnimatePresence>

        <div className="admin-content">
          <header className="admin-topbar">
            <div className="admin-topbar-left">
              <button
                type="button"
                className="admin-icon-button admin-menu-button"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation"
              >
                <Menu size={20} />
              </button>
              <button
                type="button"
                className="admin-global-search"
                onClick={() => setSearchOpen(true)}
              >
                <Search size={17} aria-hidden="true" />
                <span>Search anything…</span>
                <kbd>Ctrl K</kbd>
              </button>
            </div>

            <div className="admin-topbar-right">
              <ThemeToggle theme={theme} toggle={toggleTheme} />
              <NotificationsBell />
              <div className="admin-avatar-wrap">
                <button
                  type="button"
                  className="admin-avatar"
                  onClick={() => setAvatarOpen((value) => !value)}
                  aria-label="Admin menu"
                  aria-expanded={avatarOpen}
                >
                  <span>{initials || "AD"}</span>
                  <ChevronDown size={14} aria-hidden="true" />
                </button>
                <AnimatePresence>
                  {avatarOpen ? (
                    <motion.div
                      className="admin-popover admin-avatar-menu"
                      initial={reduce ? false : { opacity: 0, y: -8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
                      transition={{ duration: 0.16 }}
                    >
                      <div className="admin-avatar-email">{email}</div>
                      <Link href="/admin/settings" className="admin-menu-row">
                        <Settings size={16} /> Store settings
                      </Link>
                      <form action={signOutAdminAction}>
                        <button type="submit" className="admin-menu-row is-danger">
                          <LogOut size={16} /> Sign out
                        </button>
                      </form>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          </header>

          <main className="admin-main-content" id="main-content">
            {children}
          </main>
        </div>

        <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      </div>
    </ToastProvider>
  );
}
