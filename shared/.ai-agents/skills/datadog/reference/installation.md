# Datadog CLI Reference

A CLI tool for AI agents to debug and triage using Datadog logs and metrics.

## Setup

### Running the CLI

```bash
bunx @ctdio/datadog-cli <command>

# Or create an alias for convenience
alias datadog="npx @ctdio/datadog-cli"
```

### Environment Variables (Required)

```bash
export DD_API_KEY="your-api-key"
export DD_APP_KEY="your-app-key"
```

Get keys from: https://app.datadoghq.com/organization-settings/api-keys

### For Non-US Datadog Sites

Use `--site` flag:

```bash
npx @ctdio/datadog-cli logs search --query "*" --site datadoghq.eu
```
