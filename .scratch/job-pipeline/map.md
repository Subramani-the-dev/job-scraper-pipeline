# Job Posting Pipeline — Map

Label: wayfinder:map

## Destination

A locked, build-ready spec for a personal job-posting pipeline: scrape ~46 companies via per-ATS adapters (Workday, Greenhouse/Lever/Ashby, custom/Playwright), normalize and dedupe every posting into Postgres, filter and alert (Telegram) only on new matches, and a Next.js dashboard for manual saved/applied/ignored tracking plus per-company scrape health — built last. No code is written in this map; a separate build phase (`/new-project`, `/scaffold`, `/feature`) executes the finished spec.

## Notes

**Domain model**: Company —has many→ Source (one ATS endpoint: Workday tenant+site / Greenhouse board token / Lever/Ashby slug / custom career-page URL) —worked by→ Adapter (shared code per ATS type, many Sources per Adapter). Each Run (one Adapter execution against one Source, timestamped, status + count) produces/updates Posting rows — identity is Company + stable ATS job id, falling back to Company + URL when no stable id exists; content edits update the row in place and never trigger a re-alert. A Match is a Posting satisfying the active FilterConfig, always computed live at query/alert time and never stored, so tightening or loosening filters never requires re-scraping and never retroactively fires an old alert. Tracking Status (saved/applied/ignored/unset) is set by hand in the dashboard. A Run Anomaly (a Source that normally returns postings suddenly returns zero) is its own distinct Telegram message, separate from the job digest.

**Standing decisions** (settled while charting this map — treat as given, not open, in every child ticket):
- Filters: keywords (frontend, react, full stack, software engineer, sde, backend, react native, app dev) match against title+description; cities (Chennai, Bangalore, Hyderabad); experience >2y, esp. 2–5y. All live-editable from the dashboard (a FilterConfig row) — never a redeploy.
- Notifications: one Telegram bot, one chat, one digest per Run (not per-posting); Run Anomalies get a separate, distinct message.
- Auth: needed, but kept minimal — one shared password via env var + session cookie. No IdP, no user accounts, no multi-tenancy, ever, per the personal-use-only scope below.
- Infra: Neon Postgres + Prisma. GitHub Actions cron every 2 hours runs scrape→dedupe→filter→alert — sequential requests, 2–5s delay between every request across the whole run (not parallel; not Vercel Cron, which can't comfortably run the Playwright adapters). Next.js dashboard deployed separately (e.g. Vercel), reading the same DB.
- Repo layout: `server/` = scraper package (adapters, registry config, Prisma schema, GH Actions entrypoint — a batch job, no Express, so route→controller→service doesn't apply, but Adapter/service separation does). `client/` = Next.js dashboard; its own API routes are its server.
- Dashboard state: React Query for server state (Postings, mutating Tracking Status); Redux Toolkit — not Zustand — for client UI state. (Flagged conflict with the user's Zustand request, resolved in favor of the standing global React convention in `~/.claude/CLAUDE.md`.)
- Global standing rules from `~/.claude/CLAUDE.md` apply throughout the eventual build: strict TypeScript (no `any`, no `as` casts), Prisma pinned to v5.x, response envelope `{status, data?, message?}`, routes versioned `/api/v1/...`, lowercase filenames with standard suffixes, no barrel files, DB query pushdown (filter/sort/paginate in the query, never in JS).

**Skills to consult per ticket**: `grilling` + `domain-modeling` for any architecture/schema ticket; `research` for ATS-shape investigation. The project's own `skills/node.md` / `skills/react.md` don't exist yet — this map precedes scaffolding.

## Decisions so far

- [Workday endpoint research](.scratch/job-pipeline/issues/04-workday-endpoint-research.md): Workday's CxS job-search API (`POST /wday/cxs/<tenant>/<site>/jobs`, detail via `GET .../job/<slug>`) is open and unauthenticated (no cookies/CSRF needed), confirmed live against Hitachi and KBR; tenant = subdomain before `.wdN.myworkdayjobs.com`, site = URL path segment after the locale, both read straight off a company's public careers URL.
- [Greenhouse/Lever/Ashby API research](.scratch/job-pipeline/issues/05-greenhouse-lever-ashby-api-research.md): all three are public, unauthenticated, unpaginated-per-company JSON APIs (`boards-api.greenhouse.io/v1/boards/{token}/jobs`, `api.lever.co/v0/postings/{site}?mode=json`, `api.ashbyhq.com/posting-api/job-board/{name}`) with no documented rate limits — confirmed against each platform's docs and a live board.
- [Company registry](issues/01-company-registry.md): 50 companies (1 duplicate) across 4 categories the user supplied; no ATS confirmed yet — see tickets 11-14.

## Not yet specified

- Which companies actually land on the Playwright/custom-site path vs. an existing adapter can't be answered precisely until tickets 11-14 report back.
- Exact GitHub Actions secrets list and Vercel env var list — sharpens once the Neon-provisioning task and the Telegram-bot task both report back their values.

## Out of scope

- AI-assisted job application (tailored resume/cover-letter blurbs, full autonomous auto-apply) — explicitly deferred; a possible future "phase 2" effort if ever revisited, not a resumption of this map.
- Public/multi-tenant SaaS hosting — this is a personal, single-user tool only; no user accounts, no billing, no abuse-prevention design.
