# Low-Level Design — Module Syllabus

Detailed lesson breakdown for `content/03-low-level-design/concepts/`.
Top-level progress lives in [`/SYLLABUS.md`](../../SYLLABUS.md); this
file is the authority on what each LLD lesson actually covers.

Researched primarily against AlgoMaster's LLD course, cross-checked against
HelloInterview's Low-Level Design "in a hurry" guide and its dedicated
Concurrency module — see the design spec's Reference sources for links.
Sub-topics are not separate HTML pages — one lesson page covers its whole
row unless noted otherwise.

Status: `[ ]` not started, `[~]` in progress, `[x]` done.

## Core set (build first)

| ID | Lesson | Sub-topics | Status |
|---|---|---|---|
| LLD-01 | OOP Fundamentals | Classes, Objects, Enums, Interfaces, Encapsulation, Abstraction, Inheritance, Polymorphism | [ ] |
| LLD-02 | Class Relationships | Association, Aggregation, Composition, Dependency, Realization | [ ] |
| LLD-03 | Design Principles | DRY, KISS, YAGNI, Law of Demeter, Separation of Concerns, Coupling & Cohesion, Composing Objects (composition over inheritance) | [ ] |
| LLD-03b | SOLID Principles | Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion | [ ] |
| LLD-04 | UML Diagrams | Class diagrams, Use case diagrams, Sequence diagrams, Activity diagrams, State machine diagrams | [ ] |
| LLD-05 | Database Design | ER modeling, Normalization, Schema design process, SQL vs NoSQL choice at the object level, Indexing for the specific case | [ ] |
| LLD-06 | Design Patterns — Creational | Singleton, Builder, Factory Method, Abstract Factory, Prototype | [ ] |
| LLD-07 | Design Patterns — Structural | Adapter, Facade, Decorator, Composite, Proxy, Bridge, Flyweight | [ ] |
| LLD-08 | Design Patterns — Behavioral | Strategy, Iterator, Observer, Command, State, Template Method, Chain of Responsibility, Visitor, Mediator, Memento | [ ] |
| LLD-08b | Design Patterns — Applied | Null Object, Repository, MVC, Dependency Injection, Specification, Game Loop — patterns that show up repeatedly in case studies but don't fit the classic GoF categories | [ ] |
| LLD-09 | Concurrency | Why concurrency shows up in LLD interviews; three problem categories — **Correctness** (check-then-act / read-modify-write races, solved with locks, atomic variables, thread confinement), **Coordination** (producer-consumer via bounded blocking queues, shared-state vs message-passing coordination), **Scarcity** (limiting access to finite resources via semaphores, object pools) | [ ] |
| LLD-09b | Concurrency Patterns | Thread Pool, Producer-Consumer — the two concurrency-specific design patterns interviews actually ask for | [ ] |

Note on LLD-09: added after a gap-check against HelloInterview's LLD
course, which has a full dedicated Concurrency module — this is a
standard way LLD interviews escalate difficulty ("now make it
thread-safe") and was missing from the original syllabus draft.

Note on LLD-03/03b and LLD-08/08b: kept split rather than merged because
AlgoMaster treats SOLID as its own section separate from the general design
principles list (11 lessons vs 15), and treats applied/non-GoF patterns
separately from the three classic categories — merging them would hide
that SOLID and Applied Patterns are substantial enough to warrant their own
lesson each.

## Progress

Core: 0 / 12 built.
