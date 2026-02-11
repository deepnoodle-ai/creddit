# Design Principles Reference

## SOLID Principles

### Single Responsibility (SRP)

A module/class should have one reason to change, meaning one actor or stakeholder it serves.

**Test**: "If I describe this module's job, do I use the word 'and'?" If yes, consider splitting.

**Violation pattern**:
```
UserService → handles registration AND sends emails AND generates reports
```

**Fix**: Split into `RegistrationService`, `EmailNotifier`, `UserReportGenerator`.

**Nuance**: SRP is about change-axes, not about doing only one thing. A `JsonParser` does many steps but changes for one reason (JSON format changes).

### Open-Closed (OCP)

Modules should be extendable without modifying existing code.

**Primary mechanism**: Define behavior behind interfaces. New behavior = new implementation, not editing existing code.

```
# Instead of:
if type == "pdf": ...
elif type == "csv": ...
elif type == "xlsx": ...    # Must edit to add new format

# Define:
type Exporter interface { Export(data) }
# Then: PdfExporter, CsvExporter, XlsxExporter each implement it
# New format = new struct, no edits to existing code
```

**When to apply**: When you can anticipate a clear extension axis. Don't pre-engineer OCP for hypothetical changes.

### Liskov Substitution (LSP)

Subtypes must honor the behavioral contract of their parent type. Any code using a base type must work correctly with any subtype.

**Classic violation**: `Square` extending `Rectangle` — setting width on a Square also changes height, breaking Rectangle's contract.

**Practical test**: If subtype overrides a method and changes behavior in ways callers don't expect, LSP is violated.

### Interface Segregation (ISP)

Prefer focused interfaces over broad ones. Clients should not depend on methods they don't use.

**Violation**:
```
type DataStore interface {
    Read(id) → Item
    Write(item)
    Delete(id)
    BulkImport(items)
    RunMigration()
    GenerateReport()
}
```

**Fix**: Split by consumer need:
```
type Reader interface { Read(id) → Item }
type Writer interface { Write(item); Delete(id) }
type Admin  interface { BulkImport(items); RunMigration() }
```

**Go idiom**: Accept interfaces, return structs. Define interfaces at the call site (consumer), not the implementation site.

### Dependency Inversion (DIP)

High-level policy should not depend on low-level detail. Both should depend on abstractions.

**In practice**: Use cases define the interfaces they need (ports). Infrastructure implements them (adapters). The wiring happens at the composition root.

```
# usecases/ports.go — owned by use case layer
type OrderRepository interface { Save(order Order) error }

# adapters/postgres/order_repo.go — implements the interface
type PostgresOrderRepo struct { db *sql.DB }
func (r *PostgresOrderRepo) Save(order Order) error { ... }

# main.go — wires it
repo := postgres.NewOrderRepo(db)
useCase := usecases.NewCreateOrder(repo)
```

## Dependency Management

### Dependency Injection Approaches

| Approach                         | Description                            | Best For                                |
| -------------------------------- | -------------------------------------- | --------------------------------------- |
| Constructor injection            | Pass deps as constructor args          | Default choice, explicit and testable   |
| Interface binding (DI container) | Framework resolves deps                | Large apps with many bindings (Java/C#) |
| Functional injection             | Pass deps as function args or closures | Functional languages, small services    |
| Wire/compile-time DI             | Code-generate the wiring               | Go (google/wire), Rust                  |

### Composition Root Pattern
- ONE place in the application creates all concrete types and wires dependencies
- Usually `main()` or an app bootstrap function
- No other code should use `new ConcreteType()` for injectable dependencies
- This is where you choose Postgres vs. SQLite, real email vs. mock, etc.

### Dependency Direction Rules
- Dependencies flow from outer (infra) to inner (domain), never the reverse
- If a domain type needs to call infra, define an interface in the domain layer
- Circular dependencies between modules indicate a design problem. Fix options:
  1. Extract shared types into a new module both depend on
  2. Use events/callbacks instead of direct calls
  3. Merge the modules (they may be one concern)

## Module Coupling and Cohesion

### Coupling Spectrum (best → worst)
1. **No coupling** — modules are completely independent
2. **Data coupling** — modules share only simple data (primitives, DTOs)
3. **Stamp coupling** — modules share composite data structures
4. **Control coupling** — one module passes a flag that controls another's behavior
5. **Content coupling** — one module reaches into another's internals

**Goal**: Stay at data coupling or stamp coupling. If you see control or content coupling, refactor.

### Cohesion Spectrum (best → worst)
1. **Functional** — all elements contribute to a single well-defined task
2. **Sequential** — output of one element feeds into the next
3. **Communicational** — elements operate on the same data
4. **Procedural** — elements follow an execution order but aren't related
5. **Logical** — elements do similar things but are unrelated (e.g., a "utils" grab-bag)
6. **Coincidental** — elements are grouped arbitrarily

**Goal**: Aim for functional or sequential cohesion. If a module has logical or coincidental cohesion, split it.

### Detecting Bad Boundaries
- **Shotgun surgery**: One feature change requires edits in many modules
- **Divergent change**: One module changes for many different reasons
- **Feature envy**: A class uses more methods from another class than its own
- **Shared mutable state**: Multiple modules read/write the same data structure

## Interface Design

### API Surface Principles
- **Minimal surface**: Export only what external consumers need
- **Semantic naming**: Interface names describe capability, not implementation (`Storer` not `DatabaseClient`)
- **Error contracts**: Define what errors an interface can return and what they mean
- **Idempotency**: State whether operations are idempotent in the contract

### Go-Specific Interface Guidance
```go
// Define interfaces where they're USED, not where they're implemented
// In the consumer package:
type UserFinder interface {
    FindByID(ctx context.Context, id string) (*User, error)
}

// Accept the narrowest interface possible
func NewOrderService(users UserFinder) *OrderService { ... }
```

### General Interface Guidelines
- Prefer composition of small interfaces over inheritance of large ones
- An interface with >5 methods is a smell — consider splitting
- If every implementation has the same method body, it should be a default/base implementation, not an interface method
- Interfaces should represent capabilities, not objects (`Readable`, `Closable` not `File`)
