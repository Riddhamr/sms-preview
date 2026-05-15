# Autonomous Sentry Remediation — Specification

**Status:** Draft v0.1 · **Workshop:** AGENT-DEV-2026 · **Owner:** Riddham · **Target:** week-4 showcase (May 2026)

---

## 1. Problem & goal

Production runtime exceptions at Capsule are handled by an entirely human loop today: Sentry alerts an on-call engineer, who reads the stack, greps logs, reproduces locally, writes a fix + test, opens a PR, gets review, and merges. The loop is slow, lossy, and re-paid every time a similar bug occurs.

**Goal:** compress that loop to "human-out-of-the-loop on diagnosis and patch", with the merge button as the single human gate. The agent owns everything from webhook to draft PR, plus post-merge regression watch.

---

## 2. Scope (v1)

**In scope**
- Python services on the Capsule platform (initial targets: TBD; see §16).
- Sentry-issue-triggered runs only (no log-based or alert-based triggers).
- App-code bugs (null deref, type errors, off-by-one, missing branch, wrong import, etc.).
- Multi-repo: agent picks the right repo per issue.
- Draft PR creation + JIRA transition.
- Post-merge regression watch with auto-revert on same fingerprint within 24h.

**Out of scope (v1)**
- Non-Python repos.
- Infra-class errors (OOM, image pull, network) → routed to oncall, not patched.
- Upstream/vendor errors → ticketed, not patched.
- Flake suppression (test-only bugs).
- Multi-issue / cross-repo fix bundles.
- Self-improvement / fine-tuning loop.
- Auto-merge on green CI (always human merge in v1).

---

## 3. Users & stakeholders

| Role | Interaction |
|---|---|
| Sentry | Event source — fires webhook on new / regressed issues. |
| Service owner | Reviews and merges the agent's PR; gets pinged on regression rollback. |
| On-call | Receives routed alerts for non-app-code errors (infra/upstream). |
| Riddham / workshop | Operates the agent; reads run logs; tunes prompts. |
| Eng leadership | Reads cost + success-rate metrics. |

---

## 4. System overview

```
 ┌──────────┐   webhook    ┌──────────────┐   enqueue   ┌──────────────┐
 │  Sentry  │ ───────────▶ │ API Gateway  │ ──────────▶ │  SQS (FIFO)  │
 └──────────┘              │   + Lambda   │             │  group=fp    │
                           │  (ingress)   │             └──────┬───────┘
                           └──────────────┘                    │
                                                               ▼
                                                  ┌─────────────────────────┐
                                                  │  ECS Fargate task        │
                                                  │  ┌────────────────────┐  │
                                                  │  │  Agent orchestrator │  │
                                                  │  │  (Claude Agent SDK) │  │
                                                  │  └─────────┬──────────┘  │
                                                  └────────────┼─────────────┘
                                                               │
       ┌───────────────────────────┬───────────────────────────┼────────────────────────────┐
       ▼                           ▼                           ▼                            ▼
  ┌──────────┐              ┌────────────┐              ┌────────────┐               ┌───────────┐
  │  Sentry  │              │   Loki     │              │  GitHub    │               │   JIRA    │
  │  (read)  │              │   (read)   │              │  (App, RW) │               │  (write)  │
  └──────────┘              └────────────┘              └────────────┘               └───────────┘

 Sidecar state:
   - DynamoDB: issue fingerprint dedup (24h TTL), run records
   - S3: full run.json artifacts (redacted)
   - CloudWatch: structured logs + metrics
   - Secrets Manager: tokens
```

---

## 5. Components

### 5.1 Ingress (Lambda behind API Gateway)
- Validates Sentry webhook signature.
- Extracts `issue_id`, `fingerprint`, `project`, `level`.
- Drops events that don't match the allowlist (level ≥ error, project ∈ allowlist).
- Looks up `fingerprint` in DynamoDB; drops if already enqueued in last 24h.
- Enqueues an SQS message with `group_id = fingerprint` to serialize.
- Returns 202 in < 1s.

### 5.2 Queue + dedup
- SQS FIFO with message group per fingerprint → no double-processing.
- DynamoDB `fingerprint` table, `ttl = first_seen + 24h`, fields: `last_run_id`, `last_pr_url`, `status`.

### 5.3 Agent orchestrator (Fargate task)
- Container with: Python 3.11, `claude-agent-sdk`, `gh`, `git`, `pytest`, ruff, mypy.
- Runs the §6 pipeline as a single agent loop with structured tool access.
- Hard timeout: 15 minutes per run.
- Hard token budget per run: 500k input + 100k output (configurable).

### 5.4 Tools the agent can call (via SDK)
| Tool | Purpose | Backing |
|---|---|---|
| `sentry_get_issue` | issue + latest event | Sentry REST (token in Secrets Manager) |
| `loki_query` | logs around event time / trace_id | logcli over VPN endpoint |
| `repo_resolve` | Sentry release → owner/repo + sha | parse release tag, fallback map |
| `repo_read_file` | read source at sha | GitHub App content API |
| `repo_search` | symbol/grep in repo | GitHub code search |
| `repo_git_blame` | recent changes on file lines | GitHub blame API |
| `local_clone_and_test` | shallow clone, apply patch, run tests | subprocess; sandboxed working dir |
| `pr_open` | open draft PR, link issue+jira | GitHub App |
| `jira_transition` | move ticket to Code Review | Atlassian API |
| `sentry_watch` | poll Sentry for regression | Sentry REST |

Each tool call is logged with input/output (redacted) to S3 as part of `run.json`.

### 5.5 Redaction layer
- Runs in the agent process before any LLM call sees raw Sentry/Loki content.
- **Allowlist** of fields that pass through: `exception.type`, `exception.value`, `stacktrace.frames[*].filename/function/lineno/abs_path/in_app`, `tags.{release,environment,trace_id,server_name}`, `request.{method,url_path,status_code}`, `contexts.runtime`, `breadcrumbs[*].category/level/message[redacted]`.
- Everything else dropped or hashed (`user.id` → `sha256(user.id)[:12]`).
- Allowlist + redactor unit-tested against fixtures from clearrx / pharmakon.

### 5.6 Patch validator
- Shallow clone target repo at the buggy sha into a tmp workspace.
- Apply candidate patch.
- Run: `ruff check`, `mypy` (if configured), `pytest <test_file_path>`.
- A patch is "valid" iff: pre-patch the new test fails, post-patch it passes, no other tests regress, lint/type clean.
- Validator runs are timeboxed (5 min) per attempt; max 2 attempts per issue.

### 5.7 PR opener
- Branch name: `sentry-bot/<issue_id>-<short-slug>`.
- PR title: `[sentry-bot] fix: <one-line summary>`.
- PR body template includes:
  - Sentry issue link + fingerprint
  - JIRA ticket link
  - Root-cause summary (from diagnosis step)
  - Diff explanation
  - Test added
  - Validator output (lint/test logs, truncated)
  - "How I diagnosed this" — chain of evidence from Loki + blame
- Opens as **draft**. Tags reviewers from `CODEOWNERS` if present, otherwise service owner from config map.
- Comments on the Sentry issue with the PR URL.

### 5.8 Regression monitor
- After merge (detected via PR webhook → small Lambda updating DynamoDB), schedule a 24h watch on the Sentry issue fingerprint.
- If `events_in_24h > 0` post-merge with same fingerprint:
  - Open a revert PR (`git revert <merge_sha>`), draft.
  - Reopen Sentry issue with a comment.
  - Page service owner.

---

## 6. End-to-end sequence

For one webhook delivery:

| # | Step | Tools | Output |
|---|---|---|---|
| 1 | Ingest webhook | — | SQS message |
| 2 | Pull issue + latest event | `sentry_get_issue` | redacted event JSON |
| 3 | Resolve repo | `repo_resolve` | `(owner, repo, sha)` |
| 4 | Pull logs around event | `loki_query` | log slice (trace_id-filtered if present) |
| 5 | Classify error category | LLM (Haiku) | `app_code` \| `infra` \| `upstream` \| `flake` |
| 5a| If not `app_code`: route + exit | `jira_transition` (optional) | report only |
| 6 | Identify true-root-cause frame | LLM (Sonnet) | `{file, line, function, reasoning}` |
| 7 | Pull code context + blame | `repo_read_file`, `repo_git_blame` | source + recent change history |
| 8 | Produce patch + failing test | LLM (Sonnet) | unified diff |
| 9 | Validate locally | `local_clone_and_test` | validator verdict + logs |
| 9a| If invalid: retry once with broader context (Opus 4.7 1M) | LLM | new diff |
| 10 | Open draft PR | `pr_open` | PR URL |
| 11 | Transition JIRA | `jira_transition` | — |
| 12 | Record run | DynamoDB + S3 | `run.json` |
| 13 | Schedule regression watch | — | watch entry |

---

## 7. Interfaces

### 7.1 Inbound webhook (Sentry → ingress)
Standard Sentry issue webhook (`issue.created`, `issue.resolved`, `issue.unresolved`). Signature verified via `Sentry-Hook-Signature`.

### 7.2 Outbound PR (agent → GitHub)
Draft PR per §5.7. Linked back to Sentry via comment, to JIRA via "Smart Commit"-style ticket reference in title.

### 7.3 Outbound JIRA transition
On PR open → `Code Review`. On merge → `Testing/QA`. (Reuses `jira-pr` skill semantics.)

### 7.4 Internal data model

**`fingerprint_dedup` (DynamoDB)**
```
pk: fingerprint (string)
first_seen: iso8601
last_run_id: uuid
last_pr_url: string | null
status: enum(enqueued, running, pr_open, merged, abandoned, reverted)
ttl: epoch (first_seen + 24h)
```

**`run_record` (DynamoDB + S3 pointer)**
```
pk: run_id (uuid)
fingerprint: string
issue_id: string
repo: string
started_at, finished_at: iso8601
verdict: enum(pr_opened, classified_out, patch_invalid, errored)
model_spend: { sonnet_tokens, haiku_tokens, opus_tokens }
artifact_s3: s3://.../run_id/run.json
```

---

## 8. Security & PHI

- **Allowlist redaction** (§5.5) is the only path from Sentry/Loki into LLM context. Default-deny.
- **Secrets:** AWS Secrets Manager. Rotated quarterly. No secrets in container env vars at rest — pulled at task start.
- **GitHub auth:** GitHub App, per-repo installation. Permissions: `contents:write`, `pull-requests:write`, `metadata:read`. No org-wide admin.
- **Logging:** redacted payloads only. `run.json` in S3 with bucket-level encryption + restricted IAM.
- **Network:** Fargate task in private VPC subnet; Loki reachable via VPC endpoint; egress through NAT for GitHub/Sentry/Anthropic.
- **Anthropic data:** prompt caching enabled; "do not train" header set per Capsule policy.

---

## 9. Observability

| Signal | Where | Used for |
|---|---|---|
| Structured logs | CloudWatch (per run_id) | Debugging |
| Pipeline step latency | CloudWatch metric | SLO |
| Verdict counters | CloudWatch metric | Success rate |
| Model spend | CloudWatch metric (per model) | Cost dashboard |
| `run.json` artifact | S3 | Post-hoc review, eval |
| Sentry-Bot self-errors | Sentry (own project) | Dogfood |

**Top SLOs (v1 targets)**
- Webhook → PR open p50: ≤ 8 min, p95: ≤ 15 min.
- Successful PR rate over eval set: ≥ 40% (see §11).
- Cost per attempt: ≤ $2 median.

---

## 10. Failure modes & policy

| Failure | Policy |
|---|---|
| Classified non-`app_code` | Exit with report; comment on Sentry; no PR. |
| Diagnosis can't pick a frame | Exit; comment on Sentry with reasoning trace; tag service owner. |
| Patch validator fails twice | Abandon; record in `run_record.verdict = patch_invalid`. |
| No tests exist in target file | Generate a new test file; if framework can't be inferred, abandon. |
| GitHub App not installed on target repo | Abandon; alert in #sentry-bot Slack. |
| Loki returns nothing | Continue with stacktrace-only diagnosis; flag low-confidence in PR body. |
| Token budget exceeded | Abandon current step; do not retry. |
| Regression detected post-merge | Auto-revert PR (draft), reopen Sentry issue, page owner. |

---

## 11. Eval

**Held-out set:** 10 historical resolved Sentry issues across 3+ services. For each: known fix commit, known test.

**Scoring per issue**
| Metric | Definition | v1 target |
|---|---|---|
| Root-cause hit | Diagnosis step's `(file, line)` is within ±5 lines of human-fix lines | ≥ 60% |
| File overlap | Patch touches the same file(s) as human fix | ≥ 70% |
| Test validity | Generated test exercises the actual bug (manual review) | ≥ 50% |
| End-to-end pass | "Would I merge this?" — manual review | ≥ 40% |

Eval set + scoring scripts live in `riddham/autonomous-sentry-remediation/eval/` (post-spec).

---

## 12. Cost & runtime budgets

| Budget | Limit |
|---|---|
| Tokens per run | 500k in + 100k out |
| Wall time per run | 15 min |
| Validator attempts | 2 |
| Tool-use iterations | 40 |
| $ per run (hard cap, ECS task killed) | $5 |

---

## 13. Milestones (4 weeks)

| Week | Deliverable | Demo |
|---|---|---|
| W1 | Skeleton: manual trigger CLI → end-to-end run on one repo, no webhook, no PR (report only). Redaction layer + Sentry fetch + Loki fetch + diagnosis. | Internal walkthrough. |
| W2 | Webhook ingress + SQS + dedup; multi-repo resolver; eval set curated (10 issues). | Show pipeline running on real webhook, still report-only. |
| W3 | Patch validator + PR open + JIRA transition + redaction hardening. Eval pass on ≥ 4/10. | First real draft PR opened in a sandbox repo. |
| W4 | Regression monitor + auto-revert. Cost/obs dashboards. Dress rehearsal. | Showcase: live PR from real Sentry issue. |

---

## 14. Open questions

1. **First target service** for the live demo — proposed candidates: `hermes`, `customer-dash`, `file-storage-service-v2`, `insula`. Owner sign-off needed.
2. **GitHub App ownership** — who registers and owns the `sentry-bot` GitHub App in the Capsule org? Approval path?
3. **Sentry webhook config** — org-level webhook with project filter, or per-project? (Org-level is simpler ops but needs IT.)
4. **AWS account** — does this live in `capsule-eng` or in a workshop sandbox account?
5. **JIRA project + transitions** — confirm we use the existing `jira-pr` skill semantics (`Code Review` / `Testing/QA`) for sentry-bot PRs.
6. **PR reviewer fallback** — when CODEOWNERS is missing, who's the default reviewer? Service owner map?
7. **Auto-revert mechanism** — `gh pr` cannot revert merged commits directly; we'll need a small worker that creates the revert PR. Confirm ownership.
8. **Eval set curation** — who labels the 10 historical fixes? Riddham + service owners, or self-curated from git log?

---

## 15. Decisions log

| Date | Decision | Notes |
|---|---|---|
| 2026-05-16 | PR-proposer (not auto-merge) for v1 | Lower risk; human merge gate. |
| 2026-05-16 | Sentry webhook trigger | Vs. manual / polled; user choice. |
| 2026-05-16 | Multi-repo from day 1 | Resolved via release tag + config fallback. |
| 2026-05-16 | Python 3.11 + Claude Agent SDK | Matches Capsule stack. |
| 2026-05-16 | AWS hosted: API GW + Lambda + SQS + ECS Fargate | Lambda too short for the agent loop. |
| 2026-05-16 | GitHub App over PAT | Multi-repo + scoped perms. |
| 2026-05-16 | Spec-only this round; no agent code | Workshop discipline. |
