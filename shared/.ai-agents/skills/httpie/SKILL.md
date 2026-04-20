---
name: httpie
description: >
  Use this skill whenever the user wants to make HTTP requests, test APIs, call REST endpoints,
  debug web services, or interact with any HTTP/HTTPS API using the HTTPie CLI tool (`http` command).
  Trigger this skill for any request involving: sending GET/POST/PUT/PATCH/DELETE requests, testing
  API endpoints, sending JSON or form data, working with authentication (Bearer token, Basic auth),
  uploading files, downloading responses, managing sessions, inspecting request/response headers,
  or piping HTTP calls in shell scripts. Use this skill even when the user just says "call the API",
  "send a request", "hit this endpoint", or "test with httpie" ¿ don't wait for explicit httpie mention.
license: mit
compatibility: opencode
---

# HTTPie CLI Skill

HTTPie is a modern, human-friendly HTTP client for the command line. The main command is `http` (or `https` for HTTPS-only).

## Installation

```bash
# pip (recommended)
pip install httpie

# brew (macOS)
brew install httpie

# apt (Debian/Ubuntu)
sudo apt install httpie
```

Verify: `http --version`

---

## Request Syntax

```
http [METHOD] URL [REQUEST_ITEMS...]
```

- **METHOD** is optional: defaults to `GET` when no data, `POST` when data is present
- **URL**: scheme defaults to `http://`; use `:3000` as shorthand for `localhost:3000`

---

## Request Items ¿ Key Separators

| Separator | Type                                        | Example                                          |
| --------- | ------------------------------------------- | ------------------------------------------------ |
| `=`       | JSON string field (or form field with `-f`) | `name=Jean`                                      |
| `:=`      | Raw JSON value (non-string)                 | `active:=true`, `count:=42`, `tags:='["a","b"]'` |
| `==`      | URL query parameter                         | `search==httpie`                                 |
| `:`       | HTTP header                                 | `Authorization:Bearer TOKEN`                     |
| `@`       | File upload (form/multipart)                | `file@./report.pdf`                              |
| `=@`      | File content as string field                | `body=@./message.txt`                            |
| `:=@`     | File content as raw JSON                    | `config:=@./config.json`                         |

---

## Common Examples

### GET requests

```bash
# Simple GET
http GET https://api.example.com/users

# With query params
http GET https://api.example.com/users search==alice limit==10

# Shorthand (method inferred)
http https://api.example.com/users

# Localhost shorthand
http :8080/health
```

### POST with JSON (default)

```bash
# String and non-string fields
http POST https://api.example.com/users \
  name="Jean-Jacques" \
  email="jj@example.com" \
  active:=true \
  roles:='["admin","user"]'

# Inline raw JSON body (pipe it in)
echo '{"name":"test"}' | http POST https://api.example.com/users
```

### PUT / PATCH / DELETE

```bash
http PUT https://api.example.com/users/42 name="Updated"
http PATCH https://api.example.com/users/42 email="new@example.com"
http DELETE https://api.example.com/users/42
```

### Form data (`-f`)

```bash
http -f POST https://api.example.com/login username=admin password=secret
```

### File upload (multipart)

```bash
http -f POST https://api.example.com/upload file@./document.pdf title="My Doc"
```

---

## Authentication

```bash
# Basic auth
http -a username:password https://api.example.com/secure

# Bearer token
http -A bearer -a TOKEN https://api.example.com/secure

# Prompt for password (don't expose it in shell history)
http -a username https://api.example.com/secure
```

---

## Headers

```bash
# Custom headers
http GET https://api.example.com/data \
  Accept:application/json \
  X-Request-Id:abc-123 \
  Authorization:"Bearer $(cat token.txt)"
```

---

## Output Control

```bash
# Show full exchange (request + response)
http -v GET https://api.example.com/users

# Only response headers
http -h GET https://api.example.com/users

# Only response body
http -b GET https://api.example.com/users

# Show request headers + response body
http --print=Hb GET https://api.example.com/users
# Flags: H=request headers, B=request body, h=response headers, b=response body, m=metadata

# No color / formatting (useful in scripts)
http --pretty=none GET https://api.example.com/users

# Check HTTP status (exit non-zero on 4xx/5xx)
http --check-status GET https://api.example.com/users
```

---

## Download Files

```bash
# Download and auto-name
http --download https://example.com/file.zip

# Download to specific path
http --download -o /tmp/output.zip https://example.com/file.zip

# Resume interrupted download
http --download --continue -o /tmp/output.zip https://example.com/file.zip
```

---

## Sessions (Persist cookies & auth)

```bash
# Create/use named session (stored in ~/.config/httpie/sessions/)
http --session=myapi POST https://api.example.com/login username=admin password=secret
http --session=myapi GET https://api.example.com/profile

# Read-only session (don't update it)
http --session-read-only=myapi GET https://api.example.com/data
```

---

## Useful Flags

```bash
--offline          # Build and print request without sending it (dry-run)
--follow           # Follow redirects
--timeout=10       # Set timeout in seconds (default: 0 = no timeout)
--proxy=http:http://proxy:8080  # Use a proxy
--verify=no        # Skip SSL certificate verification (¿¿ dev only)
--cert=./cert.pem  # Client TLS certificate
--stream           # Stream response body (useful for SSE / long-polling)
--quiet            # Suppress output except errors
```

---

## Scripting Patterns

### Avoid stdin conflicts in scripts

When running HTTPie in a script or CI pipeline where stdin may not be a TTY, add `--ignore-stdin` to avoid the "body from stdin and key=value cannot be mixed" error:

```bash
http --ignore-stdin POST https://api.example.com/users name=test active:=true
```

### Use in shell pipelines

```bash
# Extract a field with jq
TOKEN=$(http POST https://api.example.com/auth username=admin password=secret \
  --pretty=none -b | jq -r '.token')

# Pass token to next call
http GET https://api.example.com/profile "Authorization:Bearer $TOKEN"
```

### Exit codes with --check-status

```bash
if http --check-status --quiet GET https://api.example.com/health; then
  echo "API is up"
else
  echo "API returned error"
fi
```

### Offline dry-run (inspect before sending)

```bash
http --offline POST https://api.example.com/users name=test active:=true
```

---

## HTTPie vs curl Equivalents

| Goal         | HTTPie                        | curl                                                                      |
| ------------ | ----------------------------- | ------------------------------------------------------------------------- |
| GET request  | `http GET url`                | `curl url`                                                                |
| POST JSON    | `http POST url key=val`       | `curl -X POST -H 'Content-Type: application/json' -d '{"key":"val"}' url` |
| Bearer auth  | `http -A bearer -a TOKEN url` | `curl -H 'Authorization: Bearer TOKEN' url`                               |
| Show headers | `http -h url`                 | `curl -I url`                                                             |
| Verbose      | `http -v url`                 | `curl -v url`                                                             |

---

## Configuration

HTTPie config lives at `~/.config/httpie/config.json`:

```json
{
  "default_options": ["--style=monokai", "--pretty=all", "--check-status"]
}
```

---

## Tips

- **Always quote values with spaces**: `description='hello world'`
- **Escape colons in field names**: `field\:name=value`
- **GCP/cloud APIs**: use `http -A bearer -a "$(gcloud auth print-access-token)" ...`
- **Pipe JSON input**: `cat payload.json | http POST https://api.example.com/endpoint`
- **Debug CI pipelines**: use `--offline` to validate request shape without actually calling the API
- **Combine with `jq`** for powerful JSON manipulation in scripts
