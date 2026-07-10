/** Minimal markdown helper utilities for IntelBox frontend components. */

export function splitSections(markdown = "") {
  return markdown.split(/^# /gm).filter(Boolean);
}
