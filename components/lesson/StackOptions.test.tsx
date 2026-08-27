import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StackOptions } from "./StackOptions";

describe("StackOptions", () => {
  it("renders every row across the open-source, AWS, GCP, and when columns", () => {
    render(
      <StackOptions
        title="Availability counters"
        rows={[
          {
            component: "In-memory counter store",
            oss: "Redis",
            aws: "ElastiCache for Redis",
            gcp: "Memorystore for Redis",
            when: "Managed earns its cost once you need HA failover you don't want to operate.",
          },
          {
            component: "Durable event log",
            oss: "Kafka",
            aws: "MSK",
            gcp: "Pub/Sub",
            when: "Self-host only if you already run Kafka for something else.",
          },
        ]}
      />,
    );

    expect(screen.getByText("In-memory counter store")).toBeInTheDocument();
    expect(screen.getByText("Memorystore for Redis")).toBeInTheDocument();
    expect(screen.getByText("Durable event log")).toBeInTheDocument();
    expect(screen.getByText("Pub/Sub")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Self-host only if you already run Kafka for something else.",
      ),
    ).toBeInTheDocument();
  });

  it("gives the table an accessible name and a scoped header per column", () => {
    render(
      <StackOptions
        title="Ticket storage"
        rows={[
          {
            component: "Relational store",
            oss: "PostgreSQL",
            aws: "RDS for PostgreSQL",
            gcp: "Cloud SQL for PostgreSQL",
            when: "Managed from day one — nobody should hand-roll PITR backups.",
          },
        ]}
      />,
    );

    expect(
      screen.getByRole("table", { name: /Ticket storage/ }),
    ).toBeInTheDocument();
    for (const header of [
      "Component",
      "Open source",
      "AWS",
      "GCP",
      "When managed is worth it",
    ]) {
      expect(
        screen.getByRole("columnheader", { name: header }),
      ).toBeInTheDocument();
    }
  });
});
