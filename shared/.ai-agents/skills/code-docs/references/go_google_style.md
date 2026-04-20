# Go Google Style Comments

Complete reference for Go documentation comments, following Google's Go Style Guide and effective godoc practices.

## Basic Principles

- Comments should explain **what** and **why**, not **how** (code shows how)
- Every exported (public) identifier should have a doc comment
- Comments are full sentences with proper punctuation
- First sentence is a summary starting with the declared name

## Package Comments

### Basic Package Comment

Place before the package declaration, typically in a `doc.go` file:

```go
// Package auth provides authentication and authorization utilities.
//
// This package supports multiple authentication backends including
// OAuth2, API keys, and LDAP. It provides a unified interface for
// validating credentials and managing user sessions.
//
// Basic usage:
//
// authenticator := auth.New(auth.Config{
//  Backend: auth.OAuth2,
//  ClientID: "your-client-id",
// })
// if err := authenticator.Verify(token); err != nil {
//  log.Fatal(err)
// }
package auth
```

### Package Comment in Main File

For simple packages without `doc.go`:

```go
// Package stringutil provides string manipulation utilities.
//
// It includes functions for common string operations like
// reversing, trimming, and case conversion.
package stringutil

import "strings"
```

## Function Comments

### Basic Function

```go
// Add returns the sum of two integers.
func Add(a, b int) int {
 return a + b
}
```

### Function with Parameters

```go
// CalculateDistance returns the Euclidean distance between two points.
// The points are represented as (x, y) coordinate pairs.
func CalculateDistance(x1, y1, x2, y2 float64) float64 {
 dx := x2 - x1
 dy := y2 - y1
 return math.Sqrt(dx*dx + dy*dy)
}
```

### Function with Error Return

```go
// ReadConfig reads and parses the configuration file at the given path.
//
// It returns an error if the file cannot be read or contains invalid YAML.
// Environment variables in the config file are automatically expanded.
func ReadConfig(path string) (*Config, error) {
 data, err := os.ReadFile(path)
 if err != nil {
  return nil, fmt.Errorf("read config: %w", err)
 }

 var config Config
 if err := yaml.Unmarshal(data, &config); err != nil {
  return nil, fmt.Errorf("parse config: %w", err)
 }

 return &config, nil
}
```

### Function with Multiple Return Values

```go
// Divide returns the quotient and remainder of a divided by b.
//
// It returns an error if b is zero.
func Divide(a, b int) (quotient, remainder int, err error) {
 if b == 0 {
  return 0, 0, errors.New("division by zero")
 }
 return a / b, a % b, nil
}
```

### Function with Example

```go
// ParseDuration parses a duration string and returns a time.Duration.
//
// Valid time units are "ns", "us", "ms", "s", "m", "h".
//
// Example usage:
//
// d, err := ParseDuration("1h30m")
// if err != nil {
//  log.Fatal(err)
// }
// fmt.Println(d) // Output: 1h30m0s
func ParseDuration(s string) (time.Duration, error) {
 return time.ParseDuration(s)
}
```

## Type Comments

### Struct

```go
// User represents a user account in the system.
//
// Users can have different roles and permissions. The IsActive field
// determines whether the user can log in.
type User struct {
 // ID is the unique identifier for the user.
 ID int64

 // Username is the user's unique login name.
 Username string

 // Email is the user's email address.
 Email string

 // IsActive indicates whether the user account is enabled.
 IsActive bool

 // CreatedAt is the timestamp when the account was created.
 CreatedAt time.Time
}
```

### Interface

```go
// Storage defines the interface for data persistence operations.
//
// Implementations must be safe for concurrent use by multiple goroutines.
type Storage interface {
 // Get retrieves the value for the given key.
 // It returns ErrNotFound if the key doesn't exist.
 Get(ctx context.Context, key string) ([]byte, error)

 // Set stores a value with the given key.
 // If the key already exists, the value is overwritten.
 Set(ctx context.Context, key string, value []byte) error

 // Delete removes the key and its value.
 // It returns no error if the key doesn't exist.
 Delete(ctx context.Context, key string) error

 // Close releases any resources held by the storage.
 Close() error
}
```

### Type Alias

```go
// UserID is a unique identifier for a user.
type UserID int64

// Email represents a validated email address.
type Email string
```

### Custom Type

```go
// Status represents the current state of a task.
type Status int

const (
 // StatusPending indicates the task hasn't started.
 StatusPending Status = iota

 // StatusRunning indicates the task is currently executing.
 StatusRunning

 // StatusCompleted indicates the task finished successfully.
 StatusCompleted

 // StatusFailed indicates the task encountered an error.
 StatusFailed
)
```

## Method Comments

```go
// Config holds database connection configuration.
type Config struct {
 Host     string
 Port     int
 Database string
}

// DSN returns the data source name for connecting to the database.
//
// The DSN format is "host:port/database".
func (c *Config) DSN() string {
 return fmt.Sprintf("%s:%d/%s", c.Host, c.Port, c.Database)
}

// Validate checks that all required configuration fields are set.
//
// It returns an error if any required field is missing or invalid.
func (c *Config) Validate() error {
 if c.Host == "" {
  return errors.New("host is required")
 }
 if c.Port <= 0 || c.Port > 65535 {
  return errors.New("port must be between 1 and 65535")
 }
 if c.Database == "" {
  return errors.New("database is required")
 }
 return nil
}
```

## Constants and Variables

### Constants

```go
// DefaultTimeout is the default request timeout duration.
const DefaultTimeout = 30 * time.Second

// Maximum allowed values.
const (
 // MaxRetries is the maximum number of retry attempts.
 MaxRetries = 3

 // MaxConcurrency is the maximum number of concurrent operations.
 MaxConcurrency = 100
)
```

### Variables

```go
// ErrNotFound is returned when a requested resource doesn't exist.
var ErrNotFound = errors.New("not found")

// Common error values.
var (
 // ErrInvalidInput is returned for invalid input parameters.
 ErrInvalidInput = errors.New("invalid input")

 // ErrTimeout is returned when an operation times out.
 ErrTimeout = errors.New("operation timed out")

 // ErrUnauthorized is returned for authentication failures.
 ErrUnauthorized = errors.New("unauthorized")
)
```

## Advanced Patterns

### Constructor Function

```go
// NewClient creates a new API client with the given configuration.
//
// The client maintains an internal connection pool and is safe for
// concurrent use by multiple goroutines.
//
// Example:
//
// client := NewClient(Config{
//  BaseURL: "https://api.example.com",
//  APIKey:  "your-key",
// })
// defer client.Close()
func NewClient(cfg Config) *Client {
 return &Client{
  config: cfg,
  http:   &http.Client{Timeout: 30 * time.Second},
 }
}
```

### Options Pattern

```go
// Option configures a Client.
type Option func(*Client)

// WithTimeout returns an Option that sets the request timeout.
func WithTimeout(d time.Duration) Option {
 return func(c *Client) {
  c.timeout = d
 }
}

// WithRetries returns an Option that sets the number of retry attempts.
func WithRetries(n int) Option {
 return func(c *Client) {
  c.retries = n
 }
}

// NewClient creates a new Client with the given options.
//
// Example:
//
// client := NewClient(
//  WithTimeout(60*time.Second),
//  WithRetries(5),
// )
func NewClient(opts ...Option) *Client {
 c := &Client{
  timeout: DefaultTimeout,
  retries: 3,
 }
 for _, opt := range opts {
  opt(c)
 }
 return c
}
```

### Context-Aware Functions

```go
// FetchUser retrieves user data from the API.
//
// The operation respects the context's deadline and cancellation.
// It returns an error if the context is cancelled or the request fails.
func FetchUser(ctx context.Context, userID int64) (*User, error) {
 req, err := http.NewRequestWithContext(
  ctx,
  "GET",
  fmt.Sprintf("/users/%d", userID),
  nil,
 )
 if err != nil {
  return nil, err
 }

 // ... implementation
}
```

### Generic Functions

```go
// Map applies a function to each element of a slice and returns a new slice.
//
// The function f is called once for each element in the input slice.
// The order of elements is preserved.
//
// Example:
//
// nums := []int{1, 2, 3}
// doubled := Map(nums, func(n int) int { return n * 2 })
// // doubled is []int{2, 4, 6}
func Map[T, U any](slice []T, f func(T) U) []U {
 result := make([]U, len(slice))
 for i, v := range slice {
  result[i] = f(v)
 }
 return result
}
```

## Error Documentation

### Custom Error Types

```go
// ValidationError represents a data validation failure.
//
// It includes the field that failed validation and the reason.
type ValidationError struct {
 Field  string
 Reason string
}

// Error returns a string representation of the validation error.
func (e *ValidationError) Error() string {
 return fmt.Sprintf("validation failed for field %s: %s", e.Field, e.Reason)
}
```

### Error Wrapping

```go
// ProcessFile reads and processes a file.
//
// It returns an error if the file cannot be read, parsed, or processed.
// Errors from lower-level operations are wrapped with additional context.
func ProcessFile(path string) error {
 data, err := os.ReadFile(path)
 if err != nil {
  return fmt.Errorf("read file %s: %w", path, err)
 }

 if err := validate(data); err != nil {
  return fmt.Errorf("validate file %s: %w", path, err)
 }

 return nil
}
```

## Code Examples in Comments

### Simple Example

```go
// Reverse returns a reversed copy of the string.
//
// Example:
//
// s := Reverse("hello")
// // s is "olleh"
func Reverse(s string) string {
 runes := []rune(s)
 for i, j := 0, len(runes)-1; i < j; i, j = i+1, j-1 {
  runes[i], runes[j] = runes[j], runes[i]
 }
 return string(runes)
}
```

### Multi-line Example

```go
// Server provides an HTTP server for the API.
//
// Example usage:
//
// srv := &Server{
//  Addr:    ":8080",
//  Handler: handler,
// }
//
// if err := srv.Start(); err != nil {
//  log.Fatal(err)
// }
// defer srv.Shutdown(context.Background())
type Server struct {
 Addr    string
 Handler http.Handler
}
```

## Special Sections

### Deprecated

```go
// OldFunction is deprecated. Use NewFunction instead.
//
// Deprecated: This function will be removed in version 2.0.
// Use NewFunction which provides better performance and error handling.
func OldFunction() {
 // implementation
}
```

### Experimental

```go
// ExperimentalFeature provides new functionality.
//
// Warning: This is an experimental API and may change in future versions.
// Do not use in production code.
func ExperimentalFeature() {
 // implementation
}
```

### Internal Details

```go
// optimizeQuery improves query performance through caching.
//
// This is an internal optimization and should not be called directly.
// It's automatically invoked by Query when appropriate.
func (c *Client) optimizeQuery(sql string) string {
 // implementation
}
```

## Complete Example: Full Package

```go
// Package cache provides an in-memory cache with TTL support.
//
// This package implements a thread-safe cache that automatically expires
// entries after a configurable time-to-live (TTL). It's designed for
// caching API responses, database queries, and other expensive operations.
//
// Basic usage:
//
// c := cache.New(cache.Config{
//  DefaultTTL: 5 * time.Minute,
//  MaxSize:    1000,
// })
//
// c.Set("user:123", userData)
// if value, ok := c.Get("user:123"); ok {
//  // use cached value
// }
package cache

import (
 "sync"
 "time"
)

// Config holds cache configuration.
type Config struct {
 // DefaultTTL is the default time-to-live for cache entries.
 DefaultTTL time.Duration

 // MaxSize is the maximum number of entries to store.
 // When exceeded, the least recently used entries are evicted.
 MaxSize int
}

// Cache provides thread-safe in-memory caching with TTL.
//
// All methods are safe for concurrent use by multiple goroutines.
type Cache struct {
 mu      sync.RWMutex
 entries map[string]*entry
 config  Config
}

// entry represents a single cache entry.
type entry struct {
 value     interface{}
 expiresAt time.Time
}

// New creates a new Cache with the given configuration.
//
// If DefaultTTL is zero, entries never expire.
// If MaxSize is zero, the cache has no size limit.
func New(cfg Config) *Cache {
 return &Cache{
  entries: make(map[string]*entry),
  config:  cfg,
 }
}

// Get retrieves a value from the cache.
//
// It returns the value and true if found and not expired,
// or nil and false otherwise.
func (c *Cache) Get(key string) (interface{}, bool) {
 c.mu.RLock()
 defer c.mu.RUnlock()

 e, ok := c.entries[key]
 if !ok {
  return nil, false
 }

 if !e.expiresAt.IsZero() && time.Now().After(e.expiresAt) {
  return nil, false
 }

 return e.value, true
}

// Set stores a value in the cache with the default TTL.
//
// If an entry with the same key exists, it's overwritten.
func (c *Cache) Set(key string, value interface{}) {
 c.SetWithTTL(key, value, c.config.DefaultTTL)
}

// SetWithTTL stores a value with a custom TTL.
//
// If ttl is zero, the entry never expires.
func (c *Cache) SetWithTTL(key string, value interface{}, ttl time.Duration) {
 c.mu.Lock()
 defer c.mu.Unlock()

 var expiresAt time.Time
 if ttl > 0 {
  expiresAt = time.Now().Add(ttl)
 }

 c.entries[key] = &entry{
  value:     value,
  expiresAt: expiresAt,
 }

 c.evictIfNeeded()
}

// Delete removes an entry from the cache.
//
// It does nothing if the key doesn't exist.
func (c *Cache) Delete(key string) {
 c.mu.Lock()
 defer c.mu.Unlock()

 delete(c.entries, key)
}

// Clear removes all entries from the cache.
func (c *Cache) Clear() {
 c.mu.Lock()
 defer c.mu.Unlock()

 c.entries = make(map[string]*entry)
}

// evictIfNeeded removes expired and LRU entries if needed.
//
// Must be called with c.mu held.
func (c *Cache) evictIfNeeded() {
 // implementation
}
```

## Best Practices

### DO

✅ Start with the declared name:

```go
// NewClient creates... (not "Creates a new client")
// Config holds... (not "This type holds configuration")
```

✅ Use complete sentences with proper punctuation
✅ Document what errors can be returned
✅ Include examples for non-obvious usage
✅ Keep comments up to date with code changes
✅ Use consistent terminology

### DON'T

❌ Repeat obvious information:

```go
// BAD: Add adds two numbers
func Add(a, b int) int

// GOOD: Add returns the sum of two integers
func Add(a, b int) int
```

❌ Write vague descriptions:

```go
// BAD: ProcessData processes the data
func ProcessData(data []byte) error

// GOOD: ProcessData validates and normalizes the input data
func ProcessData(data []byte) error
```

❌ Forget to document errors:

```go
// BAD
func ReadFile(path string) ([]byte, error)

// GOOD: ReadFile reads and returns the file contents.
// It returns an error if the file doesn't exist or can't be read.
func ReadFile(path string) ([]byte, error)
```

## Formatting Rules

- Start comment with `//` followed by space
- First sentence starts with declared name
- Use blank line to separate paragraphs
- Indent code examples with tab
- Keep lines under 80 characters
- End sentences with period
