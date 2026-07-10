/** Shared flat, editorial design tokens for the IntelBox frontend. */

export const color = {
  bg: "#ffffff",
  bgMuted: "#f7f7f5",
  text: "#0a0a0a",
  textSecondary: "#57534e",
  textMuted: "#8a8a86",
  border: "#e7e5e0",
  accent: "#1d4ed8",
  accentSoft: "#eef2ff",
  success: "#15803d",
  successSoft: "#f0fdf4",
  warning: "#b45309",
  warningSoft: "#fffbeb",
  danger: "#b91c1c",
  dangerSoft: "#fef2f2",
};

export const font = {
  sans: "'Inter', 'Helvetica Neue', Arial, sans-serif",
};

export const card = {
  background: color.bg,
  border: `1px solid ${color.border}`,
  borderRadius: 16,
  padding: 28,
};

export const statusColor = {
  pending: { fg: color.textMuted, bg: color.bgMuted },
  running: { fg: color.warning, bg: color.warningSoft },
  completed: { fg: color.success, bg: color.successSoft },
  failed: { fg: color.danger, bg: color.dangerSoft },
};

export const pageShell = {
  minHeight: "100vh",
  background: color.bg,
  color: color.text,
  fontFamily: font.sans,
};
