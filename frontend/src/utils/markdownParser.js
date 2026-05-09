/** Minimal markdown helper utilities for ClientIQ frontend components. */

export function splitSections(markdown = "") {
  return markdown.split(/^# /gm).filter(Boolean);
}
