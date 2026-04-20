# TypeScript Google Style Guide – Documentation Reference

Complete reference for documenting TypeScript code following the [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html).

## File Structure

Files must follow this order, with **exactly one blank line** between each section that is present:

1. Copyright / license JSDoc (if required)
2. `@fileoverview` JSDoc (if present)
3. Imports
4. Implementation

### `@fileoverview` JSDoc

```ts
/**
 * @fileoverview Utilities for authenticating users against OAuth2 and LDAP
 * backends. Provides a unified interface for token validation and session
 * management.
 */

import {Injectable} from '@angular/core';
import {UserSession} from './user-session';
```

---

## JSDoc Comments

Use JSDoc (`/** ... */`) for all public API documentation. Use `//` for implementation-level inline comments.

### Basic Rules

- JSDoc comments go **before** any decorators.
- Every exported symbol **must** have a JSDoc comment.
- The first sentence is a concise summary. Use imperative mood and end with a period.
- Wrap lines at 80 characters; wrapped lines are **not** indented.

```ts
// GOOD
/** Fetches user profile data from the remote API. */
export function fetchUserProfile(userId: string): Promise<UserProfile> { ... }

// BAD – missing JSDoc on exported symbol
export function fetchUserProfile(userId: string): Promise<UserProfile> { ... }
```

### Multi-line JSDoc

```ts
/**
 * Calculates the shortest path between two nodes using Dijkstra's algorithm.
 *
 * This implementation uses a min-heap priority queue for O((V + E) log V)
 * time complexity. All edge weights must be non-negative.
 *
 * @param graph - Weighted directed graph with non-negative edge weights.
 * @param source - Starting node identifier.
 * @param target - Destination node identifier.
 * @returns The shortest path cost, or `Infinity` if no path exists.
 * @throws {RangeError} If `source` or `target` are not present in the graph.
 *
 * @example
 * ```ts
 * const cost = shortestPath(myGraph, 'A', 'Z');
 * console.log(cost); // 42
 * ```
 */
export function shortestPath(
    graph: Graph, source: string, target: string): number { ... }
```

### JSDoc Tags Reference

| Tag | Usage |
|-----|-------|
| `@param name - desc` | Document a parameter |
| `@returns desc` | Document the return value |
| `@throws {Type} desc` | Document thrown errors |
| `@template T` | Document a generic type parameter |
| `@deprecated reason` | Mark a symbol as deprecated |
| `@example` | Provide a usage example (use fenced code block) |
| `@see` | Cross-reference related symbols |
| `@override` | Indicate method overrides (optional but helpful) |

### Parameter Property Comments

When using TypeScript constructor parameter properties, document them with `@param`:

```ts
export class UserService {
  /**
   * @param httpClient - HTTP client for making API requests.
   * @param config - Application configuration object.
   */
  constructor(
      private readonly httpClient: HttpClient,
      private readonly config: AppConfig) {}
}
```

---

## Classes

### Class JSDoc

```ts
/**
 * Manages a pool of database connections with automatic reconnection.
 *
 * Provides a thread-safe connection pool for PostgreSQL databases. Handles
 * reconnection and query retries transparently.
 *
 * @example
 * ```ts
 * const pool = new ConnectionPool({host: 'localhost', port: 5432});
 * await pool.connect();
 * const rows = await pool.query('SELECT * FROM users');
 * ```
 */
export class ConnectionPool {
  /** Maximum number of simultaneous connections. */
  readonly maxConnections: number;

  /** Whether the pool is currently connected to the database. */
  get isConnected(): boolean { ... }

  /**
   * Executes a SQL query and returns all matching rows.
   *
   * @param sql - Parameterized SQL query string.
   * @param params - Positional parameters for the query.
   * @returns Array of row objects; empty array if no rows match.
   * @throws {Error} If the pool is not connected.
   */
  async query(sql: string, params: unknown[] = []): Promise<Row[]> { ... }
}
```

### Class Member Rules

- Use `private` (TypeScript visibility), never `#privateField` syntax.
- Mark never-reassigned properties with `readonly`.
- Use parameter properties to avoid boilerplate initializers.
- Initialize fields at declaration when not using a parameter property.
- Never use `public` modifier except for non-readonly constructor parameter properties.

```ts
// GOOD
export class Authenticator {
  private readonly sessions = new Map<string, Session>();

  constructor(
      private readonly config: AuthConfig,
      public tokenStore: TokenStore) {}  // public allowed here (not readonly)
}

// BAD
export class Authenticator {
  public sessions = new Map<string, Session>();  // unnecessary public
  private readonly config: AuthConfig;

  constructor(config: AuthConfig) {
    this.config = config;  // unnecessary – use parameter property
  }
}
```

### Getters and Setters

Getters must be pure functions (no observable side effects).

```ts
export class Temperature {
  private wrappedCelsius = 0;

  /**
   * Temperature in Celsius.
   *
   * @returns Current temperature in degrees Celsius.
   */
  get celsius(): number {
    return this.wrappedCelsius;
  }

  /**
   * Sets temperature using a Celsius value.
   *
   * @param value - Temperature in degrees Celsius.
   */
  set celsius(value: number) {
    this.wrappedCelsius = value;
  }

  /**
   * Temperature converted to Fahrenheit.
   *
   * @returns Equivalent temperature in degrees Fahrenheit.
   */
  get fahrenheit(): number {
    return this.wrappedCelsius * 9 / 5 + 32;
  }
}
```

---

## Interfaces

Use interfaces to define structural types. Prefer interfaces over `type` aliases for object shapes.

```ts
/**
 * Configuration options for the authentication service.
 *
 * All fields are optional; omitted fields use the service defaults.
 */
export interface AuthConfig {
  /** OAuth2 client identifier issued by the authorization server. */
  clientId?: string;

  /** Token expiry in seconds. Defaults to 3600. */
  tokenTtl?: number;

  /**
   * Custom token validation function.
   *
   * @param token - Raw token string to validate.
   * @returns `true` if the token is valid, `false` otherwise.
   */
  validateToken?: (token: string) => boolean;
}
```

Do **not** prefix interface names with `I` (e.g. avoid `IAuthConfig`). Name the interface after what it expresses.

---

## Functions

### Named Functions (module-level)

Prefer function declarations over arrow functions for named top-level functions.

```ts
/**
 * Parses a JWT token and returns its decoded payload.
 *
 * Does not verify the token signature. Use `verifyToken` for authenticated
 * contexts.
 *
 * @param token - Base64-encoded JWT string.
 * @returns Decoded payload object.
 * @throws {SyntaxError} If the token is malformed.
 *
 * @example
 * ```ts
 * const payload = parseToken(rawToken);
 * console.log(payload.sub); // 'user-123'
 * ```
 */
export function parseToken(token: string): TokenPayload { ... }
```

### Async Functions

```ts
/**
 * Fetches paginated results from the search API.
 *
 * Automatically retries on transient failures (HTTP 5xx) up to three times
 * with exponential backoff.
 *
 * @param query - Search query string.
 * @param options - Pagination and filter options.
 * @returns Promise resolving to a page of search results.
 * @throws {HttpError} On non-retryable HTTP errors (e.g. 401, 403, 404).
 *
 * @example
 * ```ts
 * const results = await searchApi('typescript', {page: 1, limit: 20});
 * ```
 */
export async function searchApi(
    query: string, options: SearchOptions = {}): Promise<SearchPage> { ... }
```

### Generator Functions

Attach `*` to the `function` keyword and to `yield`:

```ts
/**
 * Yields items from the source iterable in batches.
 *
 * @param source - Iterable of items to batch.
 * @param size - Number of items per batch. Must be greater than zero.
 * @yields Arrays of up to `size` items. The final batch may be smaller.
 * @throws {RangeError} If `size` is less than 1.
 *
 * @example
 * ```ts
 * for (const batch of batchOf([1, 2, 3, 4, 5], 2)) {
 *   console.log(batch); // [1, 2], [3, 4], [5]
 * }
 * ```
 */
export function* batchOf<T>(source: Iterable<T>, size: number): Generator<T[]> {
  if (size < 1) throw new RangeError('size must be >= 1');
  let batch: T[] = [];
  for (const item of source) {
    batch.push(item);
    if (batch.length === size) {
      yield* [batch];
      batch = [];
    }
  }
  if (batch.length > 0) yield* [batch];
}
```

---

## Enums

```ts
/**
 * Support level available for a given feature or user tier.
 *
 * Values are ordered by ascending capability.
 */
export enum SupportLevel {
  /** No support available. */
  NONE,
  /** Basic email support with SLA of 5 business days. */
  BASIC,
  /** Priority phone and chat support with SLA of 4 hours. */
  ADVANCED,
}
```

Always compare enum values explicitly; never coerce to boolean:

```ts
// GOOD
if (level !== SupportLevel.NONE) { ... }

// BAD
if (level) { ... }  // SupportLevel.NONE is 0 = falsy; this is a bug
```

---

## Type Aliases

Use `type` for unions, intersections, and mapped types; use interfaces for object shapes.

```ts
/** A user identifier – either a numeric database ID or a UUID string. */
export type UserId = number | string;

/** Read-only version of a partial configuration object. */
export type PartialConfig = Readonly<Partial<AppConfig>>;
```

---

## Naming Conventions

| Category | Style | Example |
|----------|-------|---------|
| Class | `UpperCamelCase` | `UserService` |
| Interface | `UpperCamelCase` | `AuthConfig` |
| Type alias | `UpperCamelCase` | `UserId` |
| Enum | `UpperCamelCase` | `SupportLevel` |
| Enum value | `CONSTANT_CASE` | `SUPPORT_LEVEL.NONE` |
| Decorator | `UpperCamelCase` | `@Component` |
| Function | `lowerCamelCase` | `fetchUser()` |
| Method | `lowerCamelCase` | `this.connect()` |
| Variable | `lowerCamelCase` | `const userId` |
| Parameter | `lowerCamelCase` | `function f(userId)` |
| Module-level constant | `CONSTANT_CASE` | `const MAX_RETRIES = 3` |
| Private class constant | `CONSTANT_CASE` static | `private static readonly MAX = 5` |
| Observable (convention) | `lowerCamelCase$` | `const user$` |

### Rules

- Use only ASCII letters, digits, and underscores (underscores only for constants and test names).
- Do **not** prefix or suffix with `_` (no `_private`, no `private_`).
- Do **not** prefix interfaces with `I` (no `IFoo`).
- Do **not** use `opt_` for optional parameters.
- `_` alone as an identifier is disallowed (use a descriptive name or omit the parameter).

---

## Imports and Exports

### Import Style

```ts
// Named import – preferred for frequently used or clearly named symbols
import {Component, OnInit} from '@angular/core';

// Namespace import – preferred when using many symbols from a large API
import * as path from 'path';

// Type-only import – use when the symbol is only referenced as a type
import type {UserProfile} from './user-profile';

// Mixed inline type import
import {type Foo, Bar} from './foo';
```

### Export Style

Always use **named exports**. Never use `export default`.

```ts
// GOOD
export class UserService { ... }
export const MAX_RETRIES = 3;
export function validateEmail(email: string): boolean { ... }

// BAD
export default class UserService { ... }  // default exports disallowed
export let counter = 0;  // mutable export disallowed
```

Use `export type` when re-exporting a type:

```ts
export type {UserProfile} from './user-profile';
```

---

## What to Document

### Always Document

- All exported functions, classes, interfaces, types, enums, and constants
- All constructor parameters (via `@param` when using parameter properties)
- All class properties that are not self-evident from their names
- Thrown errors (`@throws`)
- Return values for non-trivial functions (`@returns`)

### Consider Documenting

- Complex private methods (use `//` comments, not JSDoc)
- Non-obvious type constraints or invariants
- Performance characteristics of algorithms
- Side effects of functions

### Do Not Document

- Trivial getters/setters where the name is fully self-explanatory
- Override methods that purely delegate to `super` without changes
- Implementation details already obvious from types and code

---

## Inline Comments

Use `//` for inline and block implementation comments (not JSDoc):

```ts
export function processQueue(items: readonly Task[]): void {
  // Process items in FIFO order; priority inversion is handled upstream.
  for (const item of items) {
    // Skip cancelled tasks rather than throwing, to avoid partial failure.
    if (item.status === TaskStatus.CANCELLED) continue;
    runTask(item);
  }
}
```

---

## Decorators

JSDoc goes **before** the decorator, with no blank line between decorator and class/member:

```ts
/**
 * Root application module bootstrapping all feature modules.
 *
 * Import this module exactly once in `main.ts`.
 */
@NgModule({
  declarations: [AppComponent],
  bootstrap: [AppComponent],
})
export class AppModule {}

export class MyComponent {
  /** User display name shown in the header. */
  @Input() displayName = '';

  @Input()
  /** Whether the sidebar is currently expanded. */
  sidebarExpanded = false;
}
```

Only use decorators defined by a framework (Angular, Polymer, etc.). Do not define new decorators.

---

## Complete Example

```ts
/**
 * @fileoverview HTTP client wrapper with automatic retry and circuit breaking.
 *
 * Provides a typed, observable-friendly HTTP client built on top of the
 * Fetch API, with configurable retry policies and circuit-breaker support.
 */

import type {Observable} from 'rxjs';
import {RetryPolicy} from './retry-policy';

/**
 * Configuration for the HTTP client.
 */
export interface HttpClientConfig {
  /** Base URL prepended to all relative request paths. */
  baseUrl: string;

  /** Default timeout per request in milliseconds. Defaults to 10000. */
  timeoutMs?: number;

  /** Retry policy applied to failed requests. */
  retryPolicy?: RetryPolicy;
}

/**
 * A typed HTTP client with automatic retry and observability hooks.
 *
 * Wraps the Fetch API and adds retry logic, request/response logging,
 * and circuit-breaker integration.
 *
 * @example
 * ```ts
 * const client = new HttpClient({baseUrl: 'https://api.example.com'});
 * const user = await client.get<User>('/users/42');
 * ```
 */
export class HttpClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  /**
   * @param config - Client configuration options.
   */
  constructor(private readonly config: HttpClientConfig) {
    this.baseUrl = config.baseUrl;
    this.timeoutMs = config.timeoutMs ?? 10_000;
  }

  /**
   * Sends a GET request and returns the parsed response body.
   *
   * @template T - Expected shape of the response body.
   * @param path - URL path relative to `baseUrl`.
   * @param headers - Optional additional request headers.
   * @returns Promise resolving to the parsed response body.
   * @throws {HttpError} On non-2xx responses.
   * @throws {TimeoutError} If the request exceeds `timeoutMs`.
   */
  async get<T>(path: string, headers: Record<string, string> = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {headers, signal: this.makeSignal()});
    if (!response.ok) throw new HttpError(response.status, url);
    return response.json() as Promise<T>;
  }

  /**
   * Sends a POST request with a JSON body.
   *
   * @template T - Expected shape of the response body.
   * @param path - URL path relative to `baseUrl`.
   * @param body - Request payload; will be JSON-serialized.
   * @returns Promise resolving to the parsed response body.
   * @throws {HttpError} On non-2xx responses.
   */
  async post<T>(path: string, body: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(body),
      signal: this.makeSignal(),
    });
    if (!response.ok) throw new HttpError(response.status, url);
    return response.json() as Promise<T>;
  }

  /** Creates an AbortSignal that fires after `timeoutMs`. */
  private makeSignal(): AbortSignal {
    return AbortSignal.timeout(this.timeoutMs);
  }
}

/**
 * Maximum number of simultaneous connections to a single host.
 *
 * Exceeding this limit queues additional requests.
 */
export const MAX_CONNECTIONS_PER_HOST = 6;
```

---

## Formatting Rules

- Line length: 80 characters maximum.
- Indentation: 2 spaces (no tabs).
- Single quotes for string literals; template literals for interpolation.
- `const` by default; `let` only when reassignment is needed; never `var`.
- One variable per `const`/`let` declaration.
- No trailing semicolons on class declarations; semicolons required on class expressions.
- Method declarations separated from each other and from the constructor by one blank line.
- No blank lines at the start or end of a function body.
