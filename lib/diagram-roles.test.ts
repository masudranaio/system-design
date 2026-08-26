import { describe, it, expect } from "vitest";
import { classifyNodeRole, applyDiagramRoleClasses } from "./diagram-roles";

describe("classifyNodeRole", () => {
  it("classifies known role keywords case-insensitively", () => {
    expect(classifyNodeRole("Redis seat-hold cache")).toBe("cache");
    expect(classifyNodeRole("Postgres booking DB")).toBe("datastore");
    expect(classifyNodeRole("API Gateway")).toBe("network");
    expect(classifyNodeRole("Mobile client")).toBe("client");
    expect(classifyNodeRole("Notification Service")).toBe("service");
    expect(classifyNodeRole("Kafka events queue")).toBe("queue");
  });

  it("returns null for a label matching no known role", () => {
    expect(classifyNodeRole("Seat C12")).toBeNull();
  });

  it("prefers a specific role over the generic 'service' catch-all", () => {
    expect(classifyNodeRole("Cache service")).toBe("cache");
  });
});

describe("applyDiagramRoleClasses", () => {
  it("adds a diagram-role-* class only to nodes whose label matches a known role", () => {
    document.body.innerHTML = `
      <svg>
        <g class="node"><text>Redis Cache</text></g>
        <g class="node"><text>Seat Inventory Service</text></g>
        <g class="node"><text>Seat C12</text></g>
      </svg>
    `;
    const svg = document.querySelector("svg")!;
    applyDiagramRoleClasses(svg);

    const groups = svg.querySelectorAll("g.node");
    expect(groups[0].classList.contains("diagram-role-cache")).toBe(true);
    expect(groups[1].classList.contains("diagram-role-service")).toBe(true);
    expect(groups[2].classList.length).toBe(1); // only "node", nothing added
  });
});
