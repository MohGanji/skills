# Design Patterns Reference

Consulted only from SKILL.md step 4, when a treatment naturally lands on a pattern. Each entry: intent, **Apply when** (the justification), **Avoid when** (the misuse). A pattern is justified only if an Apply clause matches the code as it exists today, no Avoid clause holds, and no plain refactoring cures the smell with less structure. A pattern applied without justification is itself a finding (Speculative Generality).

## Creational

- **Factory Method** — defer which concrete type gets created to a dedicated method/subclass. *Apply when*: construction requires logic (subtype choice, reuse/caching) or callers must stay decoupled from concrete types; the natural landing of Replace Constructor with Factory Method. *Avoid when*: a plain constructor works — it just adds a level of indirection.
- **Abstract Factory** — create whole families of related objects without naming concrete classes. *Apply when*: the code juggles multiple product families that must stay consistent (per-platform, per-tenant). *Avoid when*: only one family exists or products don't vary together.
- **Builder** — construct complex objects step by step, same steps, different representations. *Apply when*: telescoping constructors, many optional parts, or multi-stage assembly. *Avoid when*: the object is simple — named/default arguments or a literal do the job.
- **Prototype** — clone existing objects without coupling to their classes. *Apply when*: object creation is expensive or configuration-heavy and copies are the natural source. *Avoid when*: construction is trivial; deep-copy semantics add hidden complexity.
- **Singleton** — one instance, globally accessible. *Apply when*: a genuinely single shared resource must have exactly one access point. *Avoid when*: almost always otherwise — it's global state that hides dependencies and resists testing; prefer explicit injection. Treat existing singletons with suspicion, not as precedent.

## Structural

- **Adapter** — convert one interface into another the client expects. *Apply when*: integrating an existing/foreign class whose interface doesn't fit; the structured form of Introduce Local Extension. *Avoid when*: you control both sides — just change the interface.
- **Bridge** — split a class varying along two independent dimensions into abstraction + implementation hierarchies. *Apply when*: subclass count is multiplying as dimensions combine (shape × renderer). *Avoid when*: only one dimension varies — it's pure overhead.
- **Composite** — compose objects into trees and treat leaves and containers uniformly. *Apply when*: the domain is genuinely recursive (parts containing parts) and clients want to ignore the difference. *Avoid when*: there is no real hierarchy; forcing a common interface overgeneralizes.
- **Decorator** — layer behavior onto an object by wrapping it, at runtime, stackably. *Apply when*: combinations of optional behaviors would explode a subclass tree. *Avoid when*: one fixed extension suffices; deep wrapper stacks obscure identity and order-dependence.
- **Facade** — one simple entry point over a complex subsystem. *Apply when*: clients repeat the same multi-step subsystem choreography; the legitimate face of Middle Man. *Avoid when*: it grows into a god object coupled to everything — keep facades thin.
- **Flyweight** — share common state between masses of similar objects to save memory. *Apply when*: profiling shows object volume is a real memory problem. *Avoid when*: anywhere memory isn't measured as the problem — this is purely an optimization pattern.
- **Proxy** — a stand-in controlling access to the real object (lazy init, permissions, caching, remoting). *Apply when*: access itself needs managing and the client shouldn't know. *Avoid when*: the service is simple and local — the indirection buys nothing.

## Behavioral

- **Chain of Responsibility** — pass a request along handlers until one takes it. *Apply when*: the handler set or order must vary at runtime, or handlers shouldn't know each other. *Avoid when*: there's one fixed handler; beware requests silently falling off the chain's end.
- **Command** — reify an operation as an object. *Apply when*: operations must be queued, scheduled, undone, or passed around as data. *Avoid when*: a direct call (or a first-class function) does the job.
- **Iterator** — traverse a collection without exposing its internals. *Apply when*: a custom structure needs traversal the language can't provide. *Avoid when*: built-in iteration already covers it — nearly always in modern languages.
- **Mediator** — centralize chaotic many-to-many component communication into one coordinator. *Apply when*: components are tangled in mutual references (Inappropriate Intimacy at scale). *Avoid when*: interaction is simple — a mediator for two components is bureaucracy; watch for the mediator becoming the new god object.
- **Memento** — snapshot an object's state for later restore without breaking encapsulation. *Apply when*: undo/rollback over meaningful state. *Avoid when*: state is huge or snapshots frequent — memory cost bites.
- **Observer** — let an open set of subscribers react to events. *Apply when*: the notifying object must not know who listens (the landing of Duplicate Observed Data). *Avoid when*: subscribers are fixed and known — direct calls are clearer; notification order and forgotten unsubscribes breed subtle bugs.
- **State** — let behavior change with internal state via one object per state. *Apply when*: fat state-conditionals in many methods and runtime state transitions; the landing of Replace Type Code with State/Strategy. *Avoid when*: two states and one conditional — overkill.
- **Strategy** — swap interchangeable algorithm variants behind one interface. *Apply when*: several genuine variants selected at runtime; the landing of Replace Conditional with Polymorphism for algorithm choice. *Avoid when*: variants are few and stable — a conditional or a passed function is simpler.
- **Template Method** — fix an algorithm's skeleton, let subclasses fill in steps. *Apply when*: several classes run the same sequence with differing steps; the landing of Form Template Method. *Avoid when*: steps vary too much or inheritance lock-in hurts — prefer Strategy/composition.
- **Visitor** — add operations across a class hierarchy without touching the classes. *Apply when*: the hierarchy is stable and operations keep multiplying. *Avoid when*: the hierarchy still grows — every new element class breaks every visitor.
