# Python Google Style Docstrings

Complete reference for Google Style Python docstrings, based on the [Google Python Style Guide](https://google.github.io/styleguide/pyguide.html).

## Basic Structure

```python
"""One-line summary (imperative mood, ending with period).

Extended description (optional). Can span multiple paragraphs.
Use proper grammar and punctuation.

Attributes:
    attribute_name: Description of the attribute.

Example:
    >>> code_example()
    expected_output
"""
```

## Module Docstrings

Place at the top of the file, after any shebang and before imports:

```python
#!/usr/bin/env python3
"""Module for handling user authentication.

This module provides classes and functions for authenticating users
against various backend systems including LDAP, OAuth, and API keys.

Typical usage example:

    authenticator = Authenticator(config)
    if authenticator.verify(username, password):
        print("Login successful")
"""

import os
import sys
```

## Class Docstrings

```python
class User:
    """Represents a user in the system.

    The User class encapsulates user data and provides methods
    for authentication, authorization, and profile management.

    Attributes:
        username: A string representing the user's unique identifier.
        email: A string containing the user's email address.
        is_active: A boolean indicating if the user account is active.
        created_at: A datetime object with account creation timestamp.

    Example:
        >>> user = User("john_doe", "john@example.com")
        >>> user.is_active
        True
    """

    def __init__(self, username: str, email: str):
        """Initialize a new User.

        Args:
            username: Unique identifier for the user.
            email: User's email address.

        Raises:
            ValueError: If username is empty or email is invalid.
        """
        self.username = username
        self.email = email
        self.is_active = True
        self.created_at = datetime.now()
```

## Function/Method Docstrings

### Basic Function

```python
def calculate_distance(point1: tuple[float, float],
                       point2: tuple[float, float]) -> float:
    """Calculate Euclidean distance between two points.

    Args:
        point1: First point as (x, y) coordinates.
        point2: Second point as (x, y) coordinates.

    Returns:
        The Euclidean distance between the two points.

    Example:
        >>> calculate_distance((0, 0), (3, 4))
        5.0
    """
    dx = point2[0] - point1[0]
    dy = point2[1] - point1[1]
    return math.sqrt(dx**2 + dy**2)
```

### Function with Exceptions

```python
def read_config(path: str) -> dict[str, Any]:
    """Read and parse configuration file.

    Reads a YAML configuration file and returns the parsed content
    as a dictionary. Supports environment variable expansion.

    Args:
        path: Path to the configuration file.

    Returns:
        Dictionary containing parsed configuration data.

    Raises:
        FileNotFoundError: If the config file doesn't exist.
        yaml.YAMLError: If the file contains invalid YAML.
        PermissionError: If the file cannot be read due to permissions.

    Example:
        >>> config = read_config("/etc/app/config.yaml")
        >>> config["database"]["host"]
        'localhost'
    """
    with open(path, 'r') as f:
        return yaml.safe_load(f)
```

### Generator Function

```python
def fibonacci(n: int) -> Iterator[int]:
    """Generate Fibonacci sequence up to n terms.

    Args:
        n: Number of terms to generate.

    Yields:
        Next number in the Fibonacci sequence.

    Raises:
        ValueError: If n is negative.

    Example:
        >>> list(fibonacci(5))
        [0, 1, 1, 2, 3]
    """
    if n < 0:
        raise ValueError("n must be non-negative")

    a, b = 0, 1
    for _ in range(n):
        yield a
        a, b = b, a + b
```

### Async Function

```python
async def fetch_user_data(user_id: int) -> dict[str, Any]:
    """Fetch user data from the API asynchronously.

    Args:
        user_id: Unique identifier of the user.

    Returns:
        Dictionary containing user data including profile, preferences,
        and activity history.

    Raises:
        HTTPError: If the API request fails.
        asyncio.TimeoutError: If the request times out.

    Example:
        >>> data = await fetch_user_data(12345)
        >>> data["username"]
        'john_doe'
    """
    async with aiohttp.ClientSession() as session:
        async with session.get(f"/api/users/{user_id}") as response:
            return await response.json()
```

## Section Formats

### Args Section

```python
def create_user(username: str,
                email: str,
                age: int = None,
                role: str = "user",
                **kwargs) -> User:
    """Create a new user account.

    Args:
        username: Unique username (3-20 characters, alphanumeric).
        email: Valid email address.
        age: User's age in years. Defaults to None (not specified).
        role: User role (user, admin, moderator). Defaults to "user".
        **kwargs: Additional user attributes.
            tags (list[str]): User tags for categorization.
            metadata (dict): Custom metadata dictionary.

    Returns:
        Newly created User object.
    """
```

### Returns Section

```python
def search_users(query: str) -> list[User]:
    """Search for users matching the query.

    Args:
        query: Search query string.

    Returns:
        List of User objects matching the query, sorted by relevance.
        Returns empty list if no matches found.
    """
```

Multiple return values:

```python
def divide(a: float, b: float) -> tuple[float, float]:
    """Divide two numbers.

    Args:
        a: Dividend.
        b: Divisor.

    Returns:
        A tuple containing:
            - Quotient (a / b)
            - Remainder (a % b)
    """
    return a / b, a % b
```

### Raises Section

```python
def validate_email(email: str) -> bool:
    """Validate email address format.

    Args:
        email: Email address to validate.

    Returns:
        True if email format is valid, False otherwise.

    Raises:
        TypeError: If email is not a string.
        ValueError: If email is an empty string.
    """
```

### Yields Section (Generators)

```python
def batch_processor(items: list[Any], batch_size: int) -> Iterator[list[Any]]:
    """Process items in batches.

    Args:
        items: List of items to process.
        batch_size: Number of items per batch.

    Yields:
        List of items for each batch. Last batch may be smaller than
        batch_size if items don't divide evenly.

    Example:
        >>> for batch in batch_processor(range(10), 3):
        ...     print(batch)
        [0, 1, 2]
        [3, 4, 5]
        [6, 7, 8]
        [9]
    """
```

### Example Section

```python
def merge_dicts(dict1: dict, dict2: dict) -> dict:
    """Merge two dictionaries with dict2 taking precedence.

    Args:
        dict1: First dictionary.
        dict2: Second dictionary (values override dict1).

    Returns:
        Merged dictionary.

    Example:
        >>> d1 = {"a": 1, "b": 2}
        >>> d2 = {"b": 3, "c": 4}
        >>> merge_dicts(d1, d2)
        {"a": 1, "b": 3, "c": 4}

    Note:
        This function does not modify the input dictionaries.
    """
```

### Note/Warning Sections

```python
def cache_data(key: str, value: Any, ttl: int = 3600) -> None:
    """Cache data with expiration.

    Args:
        key: Cache key.
        value: Value to cache (must be JSON serializable).
        ttl: Time to live in seconds. Defaults to 3600 (1 hour).

    Note:
        This function uses an in-memory cache. Data will be lost
        when the application restarts.

    Warning:
        Large values may impact memory usage. Consider using
        external cache for values larger than 1MB.
    """
```

## Type Hints Integration

With type hints, you can be more concise:

```python
def process_order(order_id: int,
                  items: list[str],
                  discount: float = 0.0) -> bool:
    """Process a customer order.

    Args:
        order_id: Unique order identifier.
        items: List of item SKUs to order.
        discount: Discount percentage (0.0 to 1.0). Defaults to 0.0.

    Returns:
        True if order processed successfully, False otherwise.
    """
```

Types are already specified, so Args can focus on semantics, not types.

## Complex Types

```python
from typing import Optional, Union, Callable

def register_callback(
    event: str,
    callback: Callable[[dict[str, Any]], None],
    priority: int = 0
) -> Optional[str]:
    """Register an event callback.

    Args:
        event: Event name to listen for (e.g., "user.login").
        callback: Function to call when event fires. Must accept
            a single dictionary argument containing event data.
        priority: Callback priority (higher = called first).
            Defaults to 0.

    Returns:
        Callback ID if registration successful, None if event
        doesn't exist.

    Example:
        >>> def on_login(data):
        ...     print(f"User {data['username']} logged in")
        >>> callback_id = register_callback("user.login", on_login)
    """
```

## Property Docstrings

```python
class Temperature:
    """Temperature with unit conversion."""

    def __init__(self, celsius: float):
        """Initialize temperature.

        Args:
            celsius: Temperature in Celsius.
        """
        self._celsius = celsius

    @property
    def fahrenheit(self) -> float:
        """Temperature in Fahrenheit.

        Returns:
            Temperature converted to Fahrenheit.
        """
        return self._celsius * 9/5 + 32

    @fahrenheit.setter
    def fahrenheit(self, value: float) -> None:
        """Set temperature using Fahrenheit.

        Args:
            value: Temperature in Fahrenheit.
        """
        self._celsius = (value - 32) * 5/9
```

## Magic Methods

```python
class Vector:
    """2D vector with mathematical operations."""

    def __init__(self, x: float, y: float):
        """Initialize vector.

        Args:
            x: X coordinate.
            y: Y coordinate.
        """
        self.x = x
        self.y = y

    def __add__(self, other: "Vector") -> "Vector":
        """Add two vectors.

        Args:
            other: Vector to add.

        Returns:
            New Vector representing the sum.

        Example:
            >>> v1 = Vector(1, 2)
            >>> v2 = Vector(3, 4)
            >>> v3 = v1 + v2
            >>> (v3.x, v3.y)
            (4, 6)
        """
        return Vector(self.x + other.x, self.y + other.y)

    def __repr__(self) -> str:
        """Return string representation.

        Returns:
            String in format "Vector(x, y)".
        """
        return f"Vector({self.x}, {self.y})"
```

## Class with Multiple Methods

```python
class DatabaseConnection:
    """Manages database connections with connection pooling.

    This class provides a thread-safe connection pool for PostgreSQL
    databases. It handles automatic reconnection and query retries.

    Attributes:
        host: Database host address.
        port: Database port number.
        database: Database name.
        pool_size: Maximum number of connections in pool.
        is_connected: Boolean indicating connection status.

    Example:
        >>> db = DatabaseConnection("localhost", 5432, "mydb")
        >>> db.connect()
        >>> result = db.query("SELECT * FROM users")
        >>> db.close()
    """

    def __init__(self, host: str, port: int, database: str,
                 pool_size: int = 10):
        """Initialize database connection.

        Args:
            host: Database server hostname or IP.
            port: Database server port.
            database: Name of database to connect to.
            pool_size: Maximum connections in pool. Defaults to 10.

        Raises:
            ValueError: If pool_size is less than 1.
        """
        if pool_size < 1:
            raise ValueError("pool_size must be at least 1")

        self.host = host
        self.port = port
        self.database = database
        self.pool_size = pool_size
        self.is_connected = False

    def connect(self, timeout: int = 30) -> None:
        """Establish database connection.

        Creates connection pool and verifies connectivity.

        Args:
            timeout: Connection timeout in seconds. Defaults to 30.

        Raises:
            ConnectionError: If unable to connect to database.
            TimeoutError: If connection attempt exceeds timeout.
        """
        # Implementation
        pass

    def query(self, sql: str, params: tuple = None) -> list[dict]:
        """Execute SQL query and return results.

        Args:
            sql: SQL query string.
            params: Query parameters for parameterized queries.
                Defaults to None.

        Returns:
            List of dictionaries, one per result row.
            Returns empty list if query returns no rows.

        Raises:
            RuntimeError: If not connected to database.
            psycopg2.Error: If query execution fails.

        Example:
            >>> results = db.query(
            ...     "SELECT * FROM users WHERE age > %s",
            ...     (18,)
            ... )
        """
        # Implementation
        pass

    def close(self) -> None:
        """Close database connection and cleanup resources.

        Closes all pooled connections and releases resources.
        Safe to call multiple times.
        """
        # Implementation
        pass
```

## Best Practices

### DO

✅ Start with a one-line summary (imperative mood)
✅ Use proper grammar and complete sentences
✅ Document all parameters and return values
✅ Include examples for non-trivial functions
✅ Keep docstrings up to date with code changes
✅ Document exceptions that can be raised
✅ Use consistent terminology

### DON'T

❌ Repeat what's obvious from the code:

```python
# BAD
def add(a: int, b: int) -> int:
    """Add a and b and return the result."""
    return a + b

# GOOD
def add(a: int, b: int) -> int:
    """Compute the sum of two integers."""
    return a + b
```

❌ Write vague descriptions:

```python
# BAD
def process_data(data):
    """Process the data."""
    pass

# GOOD
def process_data(data: list[dict]) -> list[dict]:
    """Normalize and validate user data records.

    Converts all string fields to lowercase, removes duplicates,
    and validates email formats.
    """
    pass
```

❌ Forget to document exceptions:

```python
# BAD
def read_file(path: str) -> str:
    """Read file contents."""
    with open(path) as f:  # Can raise FileNotFoundError!
        return f.read()

# GOOD
def read_file(path: str) -> str:
    """Read and return file contents.

    Raises:
        FileNotFoundError: If file doesn't exist.
        PermissionError: If file cannot be read.
    """
    with open(path) as f:
        return f.read()
```

## Formatting Rules

- First line: One-line summary ending with period
- Blank line after summary if extended description exists
- Sections in order: Extended description → Args → Returns → Yields → Raises → Example → Note/Warning
- Use 4-space indentation for section content
- Parameter descriptions start with capital letter, end with period
- Keep line length under 80 characters (wrap long lines)
