import "@testing-library/jest-dom/vitest";

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
