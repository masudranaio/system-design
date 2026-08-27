import { Network, Box, Building2, MessageSquare, type LucideIcon } from "lucide-react";

/**
 * One icon per top-level nav section, keyed by the section title produced by
 * `buildNavTree`. Shared between the sidebar and the homepage module cards
 * so the same icon always means the same section.
 */
export const SECTION_ICONS: Record<string, LucideIcon> = {
  "High-Level Design": Network,
  "Low-Level Design": Box,
  "Case Studies": Building2,
  "Interview Prep": MessageSquare,
};

/** Tailwind class fragments per track, so the sidebar, homepage, and
 *  lesson header can all reach the same line color. Full class strings
 *  (not interpolated fragments) — Tailwind v4 only sees literals. */
export const SECTION_TRACK: Record<
  string,
  { text: string; bg: string; border: string }
> = {
  "High-Level Design": { text: "text-track-hld", bg: "bg-track-hld/12", border: "border-track-hld" },
  "Low-Level Design": { text: "text-track-lld", bg: "bg-track-lld/12", border: "border-track-lld" },
  "Case Studies": { text: "text-track-case-studies", bg: "bg-track-case-studies/12", border: "border-track-case-studies" },
  "Interview Prep": { text: "text-track-interview", bg: "bg-track-interview/12", border: "border-track-interview" },
};

export const FALLBACK_TRACK = { text: "text-ink-muted", bg: "bg-line", border: "border-line" };
