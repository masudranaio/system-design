import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Next.js 16 auto-generates/appends an AI-agent-rules block to CLAUDE.md
  // on every `next dev` run. This repo's CLAUDE.md is hand-authored and
  // explicitly off-limits to automated edits (see the app-shell plan's
  // Global Constraints), so this is disabled.
  agentRules: false,
};

export default nextConfig;
