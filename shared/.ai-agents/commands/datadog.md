---
description: Quick reference for Datadog CLI commands
---

# Datadog CLI Quick Reference

## Commands Overview

| Command | Purpose |
|---------|---------|
| `logs search` | Search and filter logs |
| `logs agg` | Aggregate logs by facet |
| `logs tail` | Stream logs in real-time |
| `logs trace` | Find logs for a trace ID |
| `logs context` | Get logs around a timestamp |
| `logs patterns` | Group similar log messages |
| `logs compare` | Compare current vs previous period |
| `logs multi` | Run multiple queries in parallel |
| `metrics query` | Query timeseries metrics |
| `errors` | Quick error summary |
| `services` | List services with log activity |

## Log Search

```bash
datadog logs search --query "<query>" --from <time> [--limit <n>] [--pretty]
```

**Examples:**

```bash
# All errors in last hour
datadog logs search --query "status:error" --from 1h --pretty

# Errors for a specific service
datadog logs search --query "service:api status:error" --from 1h --pretty

# HTTP 500 errors
datadog logs search --query "@http.status_code:500" --from 30m --pretty

# Errors containing specific text
datadog logs search --query "status:error connection refused" --from 1h --pretty

# Exclude certain services
datadog logs search --query "status:error -service:healthcheck" --from 1h --pretty
```

## Log Aggregation

```bash
datadog logs agg --query "<query>" --facet <facet> --from <time> [--pretty]
```

**Common facets:** `status`, `service`, `host`, `@http.status_code`, `@error.kind`, `@http.method`

**Examples:**

```bash
# Count logs by status level
datadog logs agg --query "*" --facet status --from 1h --pretty

# Errors by service
datadog logs agg --query "status:error" --facet service --from 24h --pretty

# Requests by HTTP status code
datadog logs agg --query "service:api" --facet @http.status_code --from 1h --pretty

# Errors by error type
datadog logs agg --query "status:error" --facet @error.kind --from 6h --pretty
```

## Live Tail (Real-time)

```bash
datadog logs tail --query "<query>" [--interval <seconds>] [--pretty]
```

**Examples:**

```bash
# Stream all errors
datadog logs tail --query "status:error" --pretty

# Watch specific service
datadog logs tail --query "service:payment-api" --pretty

# Watch with custom poll interval
datadog logs tail --query "status:error" --interval 5 --pretty
```

## Trace Correlation

```bash
datadog logs trace --id "<trace-id>" [--from <time>] [--pretty]
```

**Example:**

```bash
datadog logs trace --id "abc123def456789" --from 24h --pretty
```

## Log Context

Get logs before/after a specific timestamp to understand what happened.

```bash
datadog logs context --timestamp "<iso-timestamp>" [--service <svc>] [--before <time>] [--after <time>] [--pretty]
```

**Examples:**

```bash
# 5 minutes before/after a timestamp
datadog logs context --timestamp "2024-01-15T10:30:00Z" --pretty

# Focused on one service
datadog logs context --timestamp "2024-01-15T10:30:00Z" --service api --before 10m --after 5m --pretty
```

## Error Summary

```bash
datadog errors [--from <time>] [--service <svc>] [--pretty]
```

**Examples:**

```bash
# All errors in last hour
datadog errors --from 1h --pretty

# Errors for specific service
datadog errors --service payment-api --from 24h --pretty
```

## Log Patterns

Group similar messages (replaces UUIDs, numbers, IPs with placeholders).

```bash
datadog logs patterns --query "<query>" --from <time> [--limit <n>] [--pretty]
```

**Examples:**

```bash
# Find error patterns
datadog logs patterns --query "status:error" --from 1h --pretty

# Patterns for a service
datadog logs patterns --query "service:api" --from 6h --limit 500 --pretty
```

## Period Comparison

Compare log counts: current period vs previous period.

```bash
datadog logs compare --query "<query>" --period <time> [--pretty]
```

**Examples:**

```bash
# Are errors increasing? Compare last hour to hour before
datadog logs compare --query "status:error" --period 1h --pretty

# Compare 500 errors over 6 hour periods
datadog logs compare --query "@http.status_code:500" --period 6h --pretty
```

## Multiple Queries

Run several queries in parallel.

```bash
datadog logs multi --queries "name1:query1,name2:query2" --from <time> [--pretty]
```

**Examples:**

```bash
# Errors vs warnings
datadog logs multi --queries "errors:status:error,warnings:status:warn" --from 1h --pretty

# Multiple services
datadog logs multi --queries "api:service:api,db:service:database,cache:service:redis" --from 1h --pretty
```

## Service Discovery

```bash
datadog services --from <time> [--pretty]
```

**Example:**

```bash
datadog services --from 24h --pretty
```

## Metrics Query

```bash
datadog metrics query --query "<aggregation>:<metric>{<tags>}" --from <time> [--pretty]
```

**Aggregations:** `avg`, `sum`, `min`, `max`, `count`

**Examples:**

```bash
# CPU usage across all hosts
datadog metrics query --query "avg:system.cpu.user{*}" --from 1h --pretty

# CPU for specific service
datadog metrics query --query "avg:system.cpu.user{service:api}" --from 1h --pretty

# Memory usage
datadog metrics query --query "avg:system.mem.used{*}" --from 1h --pretty

# Request count
datadog metrics query --query "sum:trace.http.request.hits{service:api}.as_count()" --from 1h --pretty

# Error rate
datadog metrics query --query "sum:trace.http.request.errors{service:api}.as_count()" --from 1h --pretty
```

## Query Syntax

| Operator | Example | Description |
|----------|---------|-------------|
| implicit AND | `service:api status:error` | Both conditions |
| `OR` | `status:error OR status:warn` | Either condition |
| `-` (NOT) | `-service:healthcheck` | Exclude matches |
| `*` wildcard | `service:api-*` | Prefix/suffix match |
| `>=` `<=` `>` `<` | `@http.status_code:>=400` | Numeric comparison |
| `[TO]` range | `@duration:[1000 TO 5000]` | Numeric range |
| `""` exact | `"connection refused"` | Exact phrase |

## Common Log Attributes

| Attribute | Description |
|-----------|-------------|
| `status` | Log level: `error`, `warn`, `info`, `debug` |
| `service` | Service name |
| `host` | Hostname |
| `@http.status_code` | HTTP response code |
| `@http.method` | GET, POST, PUT, DELETE, etc. |
| `@http.url` | Request URL |
| `@error.kind` | Error type/class |
| `@error.message` | Error message |
| `@trace_id` | Distributed trace ID |
| `@duration` | Request duration (nanoseconds) |

## Time Formats

- Relative: `30m`, `1h`, `6h`, `24h`, `7d`
- ISO 8601: `2024-01-15T10:30:00Z`

## Global Flags

| Flag | Description |
|------|-------------|
| `--pretty` | Human-readable colored output |
| `--output <file>` | Export results to JSON file |
| `--site <site>` | Datadog site (e.g., `datadoghq.eu`, `us5.datadoghq.com`) |

## Common Workflows

### Incident Triage

```bash
datadog errors --from 1h --pretty                                    # Overview
datadog logs compare --query "status:error" --period 1h --pretty     # Is this new?
datadog logs patterns --query "status:error" --from 1h --pretty      # What patterns?
datadog logs search --query "status:error service:api" --from 1h --pretty  # Drill down
datadog logs trace --id "TRACE_ID" --pretty                          # Follow trace
```

### Real-time Monitoring

```bash
datadog logs tail --query "status:error" --pretty
```

### Export for Analysis

```bash
datadog logs search --query "status:error" --from 24h --limit 1000 --output errors.json
```
