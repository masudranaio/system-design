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
