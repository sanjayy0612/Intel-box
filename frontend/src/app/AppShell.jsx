/** The workspace shell: persistent rail, one content column, theme control.
 *
 *  The rail glyphs are mono characters rather than an icon set -- the app has no
 *  icon language, and inventing one for six links would be decoration.
 */

import React, { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";

import { useTheme } from "../theme/theme";
import styles from "./AppShell.module.css";

const NAV = [
  { to: "/app", label: "Dashboard", glyph: "≡" },
  { to: "/research/new", label: "New research", glyph: "+" },
  { to: "/companies", label: "Companies", glyph: "▤" },
  { to: "/outreach", label: "Outreach", glyph: "→" },
  { to: "/tracker", label: "Tracker", glyph: "◷" },
  { to: "/settings", label: "Settings", glyph: "⚙" },
];

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const { theme, toggle } = useTheme();

  return (
    <div className={`${styles.shell} ${collapsed ? styles.shellCollapsed : ""}`}>
      <a className={`${styles.skipLink} t-body-sm`} href="#main">
        Skip to content
      </a>

      <div className={styles.rail}>
        <Link to="/app" className={styles.brand}>
          <span className={styles.mark} aria-hidden="true" />
          <span className={`${styles.brandName} t-h3`}>IntelBox</span>
        </Link>

        <nav className={styles.nav} aria-label="Workspace">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navActive : ""}`
              }
              title={collapsed ? item.label : undefined}
            >
              <span className={styles.navGlyph} aria-hidden="true">
                {item.glyph}
              </span>
              <span className={styles.navLabel}>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.railFooter}>
          <button type="button" className={styles.railButton} onClick={toggle}>
            <span className={styles.navGlyph} aria-hidden="true">
              {theme === "dark" ? "☀" : "☾"}
            </span>
            <span className={styles.railLabel}>
              {theme === "dark" ? "Light theme" : "Dark theme"}
            </span>
          </button>
          <button
            type="button"
            className={`${styles.railButton} ${styles.collapseToggle}`}
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Expand the navigation rail" : "Collapse the navigation rail"}
          >
            <span className={styles.navGlyph} aria-hidden="true">
              {collapsed ? "»" : "«"}
            </span>
            <span className={styles.railLabel}>Collapse</span>
          </button>
        </div>
      </div>

      <main className={styles.main} id="main">
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
