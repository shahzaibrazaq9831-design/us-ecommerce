"use client";

import { Moon, Sun } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useStoredPreference } from "./useStoredPreference";

export type AdminTheme = "dark" | "light";

export function useAdminTheme(): [AdminTheme, () => void] {
  const [saved, setSaved] = useStoredPreference("admin-theme", "dark");
  const theme: AdminTheme = saved === "light" ? "light" : "dark";

  return [theme, () => setSaved(theme === "dark" ? "light" : "dark")];
}

export default function ThemeToggle({
  theme,
  toggle,
}: {
  theme: AdminTheme;
  toggle: () => void;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.button
      type="button"
      onClick={toggle}
      whileTap={reduce ? undefined : { scale: 0.92 }}
      className="admin-icon-button"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </motion.button>
  );
}
