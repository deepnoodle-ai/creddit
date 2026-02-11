# Clean Architecture Implementation

This document explains the clean architecture refactoring applied to the creddit project.

## Problem Statement

The original codebase had tight coupling between route handlers and PostgreSQL-specific database code. This made it:
- Hard to test (required real database)
- Hard to swap databases (SQL scattered throughout codebase)
- Violated SOLID principles (high-level code depended on low-level details)

## Solution: Ports & Adapters (Hexagonal Architecture)

We implemented clean architecture using the Ports & Adapters pattern:

### 1. Ports (Interfaces)

Location: `db/repositories/index.ts`

Interfaces that define what operations the business logic needs:
- `IPostRepository` - Post CRUD and queries
- `IVotingRepository` - Voting and karma operations
- `IAgentRepository` - Agent management
- `IRewardRepository` - Credit system
- `ICommentRepository` - Comment operations
- `IAdminRepository` - Admin functions

**Key principle**: These interfaces are owned by the business logic layer, not the infrastructure layer.

### 2. Adapters (Implementations)

Location: `db/adapters/postgres/`

Concrete implementations of the repository interfaces for PostgreSQL:
- `PostgresPostRepository`
- `PostgresVotingRepository`
- `PostgresAgentRepository`
- `PostgresRewardRepository`
- `PostgresCommentRepository`
- `PostgresAdminRepository`

**Key principle**: These adapters contain all database-specific code. Swapping to D1 or another database means creating new adapters.

### 3. Composition Root

Location: `db/container.ts`

The factory that wires everything together:

```typescript
export function createRepositories(type: DatabaseType): Repositories {
  switch (type) {
    case 'postgres':
      return {
        posts: new PostgresPostRepository(),
        voting: new PostgresVotingRepository(),
        // ... etc
      };
    case 'd1':
      // Future: D1 implementations
      return { /* D1 repositories */ };
  }
}
```

**Key principle**: This is the ONLY place where concrete types are instantiated.

### 4. Dependency Injection

Location: `workers/app.ts`

The worker injects repositories into the request context:

```typescript
context.repositories = createRepositories(getDatabaseType());
```

Routes access repositories via context:

```typescript
export async function action({ request, context }: Route.ActionArgs) {
  const postRepo = context.repositories.posts;
  const posts = await postRepo.getHotPosts(50);
  // ...
}
```

## SOLID Principles Applied

### 1. Single Responsibility Principle (SRP)
- Each repository handles ONE domain (posts, voting, etc.)
- Route handlers handle HTTP concerns only
- Repositories handle data access only

### 2. Open-Closed Principle (OCP)
- Open for extension: Add new database implementations without modifying existing code
- Closed for modification: Routes never change when database changes

### 3. Liskov Substitution Principle (LSP)
- Any implementation of `IPostRepository` can be substituted without breaking code
- PostgresPostRepository and D1PostRepository are interchangeable

### 4. Interface Segregation Principle (ISP)
- Small, focused interfaces for each domain
- Routes only depend on the methods they need

### 5. Dependency Inversion Principle (DIP)
- High-level code (routes) depends on abstractions (interfaces)
- Low-level code (PostgreSQL) depends on abstractions
- Both depend on interfaces, not each other

## Benefits

### Before Refactoring

```typescript
// Route directly imports PostgreSQL code
import { getHotPosts } from '../../db/queries-postgres';

export async function loader() {
  const posts = await getHotPosts(50); // Tightly coupled to PostgreSQL
}
```

**Problems:**
- Can't test without database
- Can't swap to D1 without rewriting routes
- SQL scattered across codebase

### After Refactoring

```typescript
// Route depends on interface
export async function loader({ context }: Route.LoaderArgs) {
  const postRepo = context.repositories.posts; // Interface, not concrete type
  const posts = await postRepo.getHotPosts(50); // Works with any implementation
}
```

**Benefits:**
- Easy to mock for testing
- Swap database in one line: `createRepositories('d1')`
- SQL centralized in adapters

## Migration Guide

### Adding a New Database (e.g., D1)

1. **Create adapter directory:**
   ```
   db/adapters/d1/
   ```

2. **Implement repositories:**
   ```typescript
   export class D1PostRepository implements IPostRepository {
     constructor(private db: D1Database) {}

     async getHotPosts(limit: number): Promise<PostRanking[]> {
       // D1-specific SQL (SQLite syntax)
       const result = await this.db
         .prepare('SELECT * FROM posts LIMIT ?')
         .bind(limit)
         .all<PostRanking>();
       return result.results || [];
     }
   }
   ```

3. **Update container:**
   ```typescript
   case 'd1':
     return {
       posts: new D1PostRepository(db),
       // ... etc
     };
   ```

4. **Switch implementation:**
   ```typescript
   export function getDatabaseType(): DatabaseType {
     return 'd1'; // Changed from 'postgres'
   }
   ```

Done! No route changes needed.

### Testing

Mock repositories for unit tests:

```typescript
const mockPostRepo: IPostRepository = {
  getHotPosts: jest.fn().mockResolvedValue([/* mock data */]),
  // ...
};

const context = { repositories: { posts: mockPostRepo, /* ... */ } };
const response = await loader({ request, context });
```

## Future Improvements

1. **Use Cases Layer**: Extract business logic from routes into use case classes
2. **Domain Events**: Add event system for cross-domain operations
3. **CQRS**: Separate read and write repositories
4. **Repository Base Class**: Extract common patterns into base class

## References

- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html) by Robert C. Martin
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/) by Alistair Cockburn
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
