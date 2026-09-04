# Code Smells Catalog

The sweep in SKILL.md step 2 tests code against every entry here. Each smell: **Signs** (how to spot it), **Treatment** (techniques from REFACTORINGS.md, in preference order), **Ignore when** (legitimate cases — check before recording a finding).

## Bloaters

Code, methods, and classes grown so large they are hard to work with. Bloat accumulates gradually — nobody writes a 500-line function on day one.

### Long Method

- **Signs**: a function long enough that you must scroll or hold sections in your head; segments that need a comment to explain what they do; more than one level of abstraction mixed in one body. ~10 lines is the scrutiny threshold, not a hard rule.
- **Treatment**: Extract Method for every segment that deserves a name. When local variables/parameters block extraction: Replace Temp with Query, Introduce Parameter Object, or Preserve Whole Object first. When nothing else works: Replace Method with Method Object. Conditionals: Decompose Conditional. Loop bodies: Extract Method.
- **Ignore when**: virtually never; the performance cost of extra calls is negligible in modern runtimes.

### Large Class

- **Signs**: a class/module with many responsibilities, many fields, many methods; you describe it with "and".
- **Treatment**: Extract Class for a coherent field/method cluster; Extract Subclass for behavior only used in some cases; Extract Interface for each distinct client-facing role; for UI classes holding domain data, Duplicate Observed Data.
- **Ignore when**: rarely; deliberate cohesive facades over a subsystem can be large but must stay organized.

### Primitive Obsession

- **Signs**: primitives standing in for domain concepts (currency as float, phone as string, ranges as two ints); constants/string field names used as type codes; simulating structures with arrays/maps.
- **Treatment**: Replace Data Value with Object. Type codes: Replace Type Code with Class, with Subclasses, or with State/Strategy (when the code affects behavior). Field groups traveling together: Extract Class or Introduce Parameter Object. Replace Array with Object. Magic numbers: Replace Magic Number with Symbolic Constant.
- **Ignore when**: genuinely performance-critical inner loops where object wrappers measurably cost.

### Long Parameter List

- **Signs**: more than three or four parameters; flags steering the body; callers assembling values the callee could derive.
- **Treatment**: Replace Parameter with Method Call when the callee can compute it; Preserve Whole Object when values come from one object; Introduce Parameter Object for recurring groups.
- **Ignore when**: merging parameters would create an unwanted dependency between the callee and a class it shouldn't know.

### Data Clumps

- **Signs**: the same group of variables recurring together across signatures and fields (host+port+timeout, start+end); delete one and the rest lose meaning.
- **Treatment**: Extract Class for the clump; then Introduce Parameter Object / Preserve Whole Object at call sites.
- **Ignore when**: bundling would couple modules that are deliberately independent.

## Object-Orientation Abusers

Incomplete or incorrect application of the paradigm's own tools — the language offers polymorphism and the code answers with conditionals.

### Switch Statements

- **Signs**: the same conditional dispatch (switch, if/else chain, type-code map, `instanceof`/type checks) repeated in multiple places; adding a variant means finding every copy.
- **Treatment**: Extract Method then Move Method to put the conditional where it belongs. Type-based dispatch: Replace Type Code with Subclasses or with State/Strategy, then Replace Conditional with Polymorphism. A null/absent branch: Introduce Null Object. Parameter-value dispatch: Replace Parameter with Explicit Methods.
- **Ignore when**: a single simple switch doing one job in one place — polymorphism for one conditional is over-engineering; dispatch inside a factory choosing which class to create is the pattern working as intended.

### Temporary Field

- **Signs**: fields populated only in certain circumstances and empty otherwise; readers must know when a field is "on".
- **Treatment**: Extract Class for the temporary fields plus the code operating on them (often becoming Replace Method with Method Object); Introduce Null Object to replace the emptiness checks.
- **Ignore when**: rarely.

### Refused Bequest

- **Signs**: a subclass using only a fraction of what it inherits; overridden methods that throw, no-op, or contradict the parent's contract.
- **Treatment**: if inheritance was just for code reuse, Replace Inheritance with Delegation. If the hierarchy is right but the split is wrong, Extract Superclass so the child inherits only what it honors.
- **Ignore when**: rarely.

### Alternative Classes with Different Interfaces

- **Signs**: two classes/modules doing the same job with different method names and shapes, so callers can't swap them.
- **Treatment**: Rename Method, Add Parameter, Parameterize Method, and Move Method until the interfaces align; then Extract Superclass (or shared interface) and delete the leftover duplication.
- **Ignore when**: unifying isn't feasible — e.g. the alternatives live in third-party libraries you don't control.

## Change Preventers

One desired change forces many edits in many places. These are the highest-interest debt: they tax every future change.

### Divergent Change

- **Signs**: one class edited for many unrelated reasons — a new payment type touches it, and so does a logging format change. Many reasons to change one class.
- **Treatment**: Extract Class per reason-to-change; if classes share behavior after the split, Extract Superclass / Extract Subclass.
- **Ignore when**: rarely.

### Shotgun Surgery

- **Signs**: one conceptual change requires small edits scattered across many classes; miss one and the bug ships. One reason changes many classes (the inverse of Divergent Change).
- **Treatment**: Move Method and Move Field to gather the scattered behavior into one home; if that empties a class, Inline Class.
- **Ignore when**: rarely.

### Parallel Inheritance Hierarchies

- **Signs**: adding a subclass in one hierarchy forces a mirror subclass in another; matching name prefixes across the two trees.
- **Treatment**: de-duplicate by having one hierarchy's instances refer to the other's, then Move Method and Move Field until one hierarchy disappears.
- **Ignore when**: merging would create worse coupling than the parallelism — sometimes the lesser evil.

## Dispensables

Pointless code whose absence makes everything cleaner. The treatment is mostly deletion; the courage is in doing it.

### Comments

- **Signs**: comments explaining *what* code does — compensating for bad names or opaque blocks.
- **Treatment**: Extract Variable to name the expression; Extract Method to name the block; Rename Method until no explanation is needed; Introduce Assertion where the comment states an assumed invariant.
- **Ignore when**: the comment explains *why* (rationale, constraint, warning) rather than *what*, or documents a genuinely complex algorithm.

### Duplicate Code

- **Signs**: identical or structurally-equal code in more than one place — same class, sibling classes, or unrelated modules; subtly divergent copies of what was once one thing.
- **Treatment**: same class: Extract Method. Sibling classes: Extract Method + Pull Up Field / Pull Up Method / Pull Up Constructor Body; similar-but-not-identical: Form Template Method; same job different algorithm: Substitute Algorithm. Unrelated classes: Extract Superclass or Extract Class. Duplicated conditionals: Consolidate Conditional Expression / Consolidate Duplicate Conditional Fragments.
- **Ignore when**: below the rule of three, when unification would couple modules that must stay independent — a little duplication is cheaper than the wrong abstraction.

### Lazy Class

- **Signs**: a class that no longer earns its upkeep — shrunk by refactoring or built for plans that never came.
- **Treatment**: Inline Class; near-useless hierarchy layers: Collapse Hierarchy.
- **Ignore when**: it exists to mark a real seam that imminent, concrete work will fill.

### Data Class

- **Signs**: fields and getters/setters and nothing else — a data holder whose behavior lives in other classes that poke at it.
- **Treatment**: Encapsulate Field / Encapsulate Collection; then Move Method and Extract Method to bring the behavior that uses the data into the class; Remove Setting Method and Hide Method for what should be immutable/internal.
- **Ignore when**: DTOs, records, and rows at serialization/API boundaries are legitimately behavior-free.

### Dead Code

- **Signs**: unreachable branches, unused parameters/fields/methods/classes, features nobody calls; found by coverage, grep, or the compiler.
- **Treatment**: delete it. Trailing structure: Inline Class, Collapse Hierarchy, Remove Parameter. Version control remembers.
- **Ignore when**: rarely.

### Speculative Generality

- **Signs**: "we might need it someday" — unused hooks, abstract layers with one implementation, parameters nobody passes, generics with one instantiation.
- **Treatment**: Collapse Hierarchy for pointless abstraction layers; Inline Class for unneeded delegation; Inline Method and Remove Parameter for unused flexibility.
- **Ignore when**: the extension points are the product — frameworks and libraries whose callers are unseen third parties.

## Couplers

Excessive coupling between classes — or what happens when coupling is replaced with excessive delegation.

### Feature Envy

- **Signs**: a method more interested in another object's data than its own — chains of foreign getters feeding local computation.
- **Treatment**: Move Method to where the data lives; if only part of the method is envious, Extract Method that part first, then move it.
- **Ignore when**: behavior is deliberately separated from data — Strategy, Visitor, and similar patterns make this trade knowingly.

### Inappropriate Intimacy

- **Signs**: two classes groping each other's internals — accessing private-ish fields, bidirectional references, each unusable without the other.
- **Treatment**: Move Method / Move Field to put things where they belong; Extract Class for the shared tangle + Hide Delegate to formalize access; Change Bidirectional Association to Unidirectional; if the intimacy is parent-child, Replace Delegation with Inheritance (or the reverse where inheritance was the mistake).
- **Ignore when**: rarely.

### Message Chains

- **Signs**: `a.getB().getC().getD().doIt()` — the caller navigates the object graph, coupling itself to every hop.
- **Treatment**: Hide Delegate on the chain's origin; or Extract Method the chain's consumer and Move Method it toward the end of the chain.
- **Ignore when**: fluent builders and internal DSLs are chains by design; over-applying Hide Delegate manufactures Middle Men.

### Middle Man

- **Signs**: a class whose methods mostly just forward to another class.
- **Treatment**: Remove Middle Man — let callers talk to the real object.
- **Ignore when**: the delegation is deliberate: Facade, Proxy, Adapter, and decoupling layers that isolate callers from a volatile dependency.

### Incomplete Library Class

- **Signs**: a library almost does what you need, you can't modify it, and workarounds are spreading through your code.
- **Treatment**: one or two missing behaviors: Introduce Foreign Method (with a comment marking it as such); wholesale gaps: Introduce Local Extension (wrapper or subclass collecting all the additions).
- **Ignore when**: the wrapper would cost more than living with scattered calls — judgment call on volume.
