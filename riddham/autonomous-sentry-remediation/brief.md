# Product brief — Autonomous Sentry Remediation

**Workshop:** AGENT-DEV-2026 · **Owner:** Riddham · **Target:** week-4 showcase

Autonomous Sentry Remediation is an AWS-hosted agentic service that subscribes to Sentry issue webhooks for Capsule services. For each new (or re-occurring) issue, the agent fetches the issue + latest event from Sentry, redacts PHI, correlates application logs from Loki via `trace_id` and time window, identifies the true-root-cause stack frame, locates the offending code across the appropriate Capsule GitHub repo (resolved from the Sentry release tag), generates a minimal patch with a failing test that the patch makes pass, validates locally (lint + tests + type check), and opens a draft PR linked to the Sentry issue and the JIRA ticket. The human reviews and merges; the agent then monitors the Sentry issue for regression and rolls back automatically if the same fingerprint re-fires within a configurable window.

The system is designed for **human-out-of-the-loop on diagnosis and patch generation**, with the merge button as the single human gate.
