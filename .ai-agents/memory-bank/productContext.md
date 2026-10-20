# Product Context: OpenRouter Credits Extension

## Why this project exists
Users relying on OpenRouter as their LLM provider in OpenCode often run into unexpected session interruptions when their API key hits a spending limit or runs out of credits (HTTP 402 / 403 errors). Currently, OpenCode doesn't display the remaining credits or spending limit status in the UI, forcing users to switch out of OpenCode to a browser to check openrouter.ai/settings/keys.

## Problems Solved
- **Surprise Session Breakage**: Prevents models abruptly failing mid-task with 402 Payment Required or 403 Forbidden.
- **Blind Spending**: Provides transparent real-time visibility into how much credit is left, how much has been spent today/this week/month, and when budgets reset.
- **Key Limit vs Account Balance Confusion**: Clearly differentiates between per-key limits (`limit_remaining`) and account-level total credits (`total_credits - total_usage`).

## User Experience Goals
- **Glanceable**: A subtle, clean status badge in the OpenCode TUI footer showing credit balance (e.g., `🪙 $12.45` or `🪙 74.5/100` or `⚠️ Limit Reached`).
- **Interactive Details**: Clicking the badge or running `/openrouter` (or `/credits`) opens an informative dialog with complete financial and usage breakdown.
- **Zero Friction Setup**: Automatically uses the key already configured in OpenCode without asking the user to re-enter anything, while supporting overrides.
- **Agent Accessible**: Agents can check remaining budget before running expensive tasks via an agent tool.
