import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Vitest's `globals` option is off (see vitest.config.ts), so
// @testing-library/react's built-in auto-cleanup — which only registers
// itself when it finds a global `afterEach` — never fires on its own.
// Register it explicitly so each test starts from an empty DOM; without
// this, multiple `render()` calls across `it()` blocks in the same file
// leak markup between tests.
afterEach(() => {
  cleanup();
});

// jsdom doesn't implement ResizeObserver, but cmdk (shadcn's Command
// primitive, used by SearchDialog) needs it to measure list content.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// jsdom doesn't implement scrollIntoView either, and cmdk calls it when
// the highlighted item changes.
if (typeof Element.prototype.scrollIntoView === "undefined") {
  Element.prototype.scrollIntoView = function scrollIntoView() {};
}

// jsdom doesn't implement IntersectionObserver either, and
// TableOfContents needs it to track which heading is in view.
if (typeof globalThis.IntersectionObserver === "undefined") {
  globalThis.IntersectionObserver = class IntersectionObserver {
    constructor(_callback: IntersectionObserverCallback) {}
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
    root = null;
    rootMargin = "";
    thresholds = [];
  } as unknown as typeof IntersectionObserver;
}
