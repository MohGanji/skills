# Refactoring Techniques Catalog

The treatments prescribed in SKILL.md step 3 come from here. Each entry: the problem it cures → the move. Every technique is behavior-preserving and executed in small steps with tests green throughout.

## Composing Methods

Excessively long methods are the root of much evil; these recompose them.

- **Extract Method** — a code fragment that can be grouped and named → move it into a new method named for its intent; the name replaces the comment.
- **Inline Method** — a method body more obvious than its name, adding only indirection → replace calls with the body and delete it.
- **Extract Variable** — an expression too dense to read → split into intermediate variables whose names explain the parts.
- **Inline Temp** — a temp assigned once from a simple expression, adding nothing → replace uses with the expression itself.
- **Replace Temp with Query** — a temp holding an expression result used across the body → extract the expression into a query method and call it; unblocks Extract Method.
- **Split Temporary Variable** — one temp reused for unrelated purposes → one variable per purpose, each properly named.
- **Remove Assignments to Parameters** — a parameter reassigned inside the body → introduce a local variable instead; parameters stay what the caller passed.
- **Replace Method with Method Object** — a long method whose tangled locals defeat extraction → move it into a new class where locals become fields; then extract freely inside.
- **Substitute Algorithm** — an algorithm doing the job the hard way → replace the whole body with the clearer algorithm.

## Moving Features between Objects

Safely relocate functionality between classes and hide implementation details.

- **Move Method** — a method used by / using another class more than its own → move it there, leaving a delegation or nothing.
- **Move Field** — a field used mostly by another class → move it to that class.
- **Extract Class** — one class doing the work of two → split the coherent field/method cluster into a new class.
- **Inline Class** — a class that does almost nothing → move its members into its main user and delete it.
- **Hide Delegate** — clients reaching through object A to call B → give A a delegating method so clients stop knowing B exists.
- **Remove Middle Man** — a class that mostly forwards → make clients call the delegate directly.
- **Introduce Foreign Method** — a utility missing from a class you can't modify → write it in the client class taking the foreign object as a parameter; mark it as a foreign method.
- **Introduce Local Extension** — many utilities missing from an unmodifiable class → build a wrapper or subclass that collects them all.

## Organizing Data

Untangle data handling; replace primitives with rich domain types.

- **Self Encapsulate Field** — direct field access blocks flexibility in the owning class → access via getter/setter even internally.
- **Replace Data Value with Object** — a primitive carrying domain meaning and creeping logic → promote it to its own type owning that logic.
- **Change Value to Reference** — many identical copies of one conceptual object → replace with references to a single shared instance.
- **Change Reference to Value** — a small immutable thing managed by reference for no reason → make it a value object; equal by content.
- **Replace Array with Object** — an array whose slots mean different things → an object with a named field per slot.
- **Duplicate Observed Data** — domain data trapped in UI classes → separate domain from presentation and sync them via observation (doorway to Observer).
- **Change Unidirectional Association to Bidirectional** — both classes need each other but only one holds the link → add the back-reference, with one side owning link maintenance.
- **Change Bidirectional Association to Unidirectional** — a two-way link where one direction is unused → drop the unneeded direction and the coupling it carried.
- **Replace Magic Number with Symbolic Constant** — a bare literal with hidden meaning → a constant named for the meaning.
- **Encapsulate Field** — a public field → make it private, provide accessors.
- **Encapsulate Collection** — a getter handing out the raw mutable collection → return a read-only view; provide add/remove methods.
- **Replace Type Code with Class** — a type code that doesn't affect behavior → a class, so values are type-checked and named.
- **Replace Type Code with Subclasses** — a type code that switches behavior → a subclass per code value; pulls each behavior into its variant.
- **Replace Type Code with State/Strategy** — a behavior-switching type code that changes at runtime or the class is already subclassed → extract the code into a state/strategy object the host delegates to (doorway to State/Strategy).
- **Replace Subclass with Fields** — subclasses differing only in constant-returning methods → collapse to fields in the parent; delete the subclasses.

## Simplifying Conditional Expressions

Conditionals grow ever more complicated; these fight back.

- **Decompose Conditional** — a complex condition and branches → extract condition, then-branch, and else-branch into named methods.
- **Consolidate Conditional Expression** — several conditions yielding the same result → combine into one named condition.
- **Consolidate Duplicate Conditional Fragments** — identical code in every branch → move it outside the conditional.
- **Remove Control Flag** — a boolean steering loop/flow → use `break`, `continue`, or `return` instead.
- **Replace Nested Conditional with Guard Clauses** — nesting that hides the happy path → flatten with early returns for the special cases.
- **Replace Conditional with Polymorphism** — a conditional dispatching on type/variant → a method override per variant; the conditional disappears (doorway to State/Strategy).
- **Introduce Null Object** — repeated null/absence checks → a do-nothing default object with the real interface.
- **Introduce Assertion** — an assumption the code silently relies on → assert it, making the contract explicit.

## Simplifying Method Calls

Make interfaces between classes simpler and more honest.

- **Rename Method** — a name that doesn't say what the method does → rename it so it does.
- **Add Parameter** — a method needing data it can't reach → pass it in (prefer Introduce Parameter Object / Preserve Whole Object over long lists).
- **Remove Parameter** — a parameter no longer used → delete it.
- **Separate Query from Modifier** — one method that both returns a value and mutates state → split into a query and a command.
- **Parameterize Method** — several methods doing the same thing with different embedded values → one method taking the value as a parameter.
- **Replace Parameter with Explicit Methods** — a parameter that only selects a branch → one well-named method per branch.
- **Preserve Whole Object** — extracting several values from an object to pass separately → pass the object.
- **Replace Parameter with Method Call** — a caller computing an argument the callee could compute → let the callee call it.
- **Introduce Parameter Object** — a recurring parameter group → a named object carrying the group.
- **Remove Setting Method** — a setter on a field that should be set once → drop it; set via constructor.
- **Hide Method** — a method no external caller uses → reduce its visibility.
- **Replace Constructor with Factory Method** — construction needing logic beyond `new` (caching, subtype choice) → a factory method (doorway to Factory Method).
- **Replace Error Code with Exception** — special return values signaling failure → raise an exception carrying the failure.
- **Replace Exception with Test** — exceptions used for a condition the caller could check → test first; keep exceptions for the exceptional.

## Dealing with Generalization

Move functionality along inheritance hierarchies — or dissolve them.

- **Pull Up Field** — the same field in several subclasses → move it to the parent.
- **Pull Up Method** — the same method in several subclasses → move it to the parent.
- **Pull Up Constructor Body** — subclass constructors sharing setup → move the shared part into the parent constructor.
- **Push Down Field** — a parent field only some children use → move it into those children.
- **Push Down Method** — a parent method only some children use → move it into those children.
- **Extract Subclass** — features used only in some instances → a subclass for that case.
- **Extract Superclass** — two classes sharing fields/behavior → a common parent holding the shared parts.
- **Extract Interface** — several clients using the same slice of a class, or two classes sharing a role → name the role as an interface.
- **Collapse Hierarchy** — a parent and child barely different → merge them.
- **Form Template Method** — subclasses running the same algorithm with differing steps → skeleton in the parent, steps as overridable methods (doorway to Template Method).
- **Replace Inheritance with Delegation** — a subclass using little of its parent (Refused Bequest) → hold the parent as a field, delegate what's needed, sever the is-a.
- **Replace Delegation with Inheritance** — a class delegating nearly everything to another → inherit instead, if it truly is-a.
