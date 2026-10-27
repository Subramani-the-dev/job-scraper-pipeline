# Greenhouse, Lever, Ashby public job-board API research

Research for `.scratch/job-pipeline/issues/05-greenhouse-lever-ashby-api-research.md`.
Branch: `research/greenhouse-lever-ashby-api`.

Method: read each platform's own developer docs (primary source, linked below), then
spot-checked the live endpoint with curl against a real board (Greenhouse, Ashby) or the
platform's own official demo board (Lever, since no real company's public Lever slug could
be found still live — see Lever notes).

---

## Greenhouse — Job Board API

**Primary source:** https://docs.greenhouse.io/job-board.html (developers.greenhouse.io/job-board.html
301-redirects here)

**Base URL / token mapping:** `https://boards-api.greenhouse.io/v1/boards/{board_token}`.
`board_token` is the same slug that appears in the public careers URL
`boards.greenhouse.io/{board_token}` (or the newer `job-boards.greenhouse.io/{board_token}`).

**Auth:** None for any GET endpoint — the docs state Job Board data is public. (Only the
`POST /jobs/{id}` application-submission endpoint needs Basic Auth with a Base64-encoded API key;
irrelevant to scraping.)

**Key endpoints:**
- `GET /v1/boards/{board_token}/jobs` — list all jobs. Optional `content=true` adds `content`
  (HTML description), `departments`, and `offices` to each item (omitted by default).
- `GET /v1/boards/{board_token}/jobs/{job_id}` — single job. Adds `company_name`,
  `first_published`, `application_deadline`, `content`, plus optional `questions` /
  `pay_transparency` fields.
- `/offices`, `/departments`, `/sections`, `/education/*` — supporting taxonomy endpoints.
- Every GET accepts `callback=` for JSONP.

**Response field names (job):**
- `id` — Greenhouse job-post id (stable, usable as our posting id)
- `title`
- `location.name` — free-text location string (not structured)
- `absolute_url` — the public posting URL
- `updated_at` — last-updated timestamp (list response's only timestamp)
- `first_published` — closest thing to a "posted date" (only on the single-job endpoint, not
  the list endpoint — confirmed live, see spot-check)
- `content` — HTML description (only with `content=true`)
- `departments` / `offices` — arrays (only with `content=true`)
- `requisition_id`, `internal_job_id`, `language`, `metadata`, `data_compliance` — secondary fields

**Pagination:** None on `/jobs` — confirmed live: GitLab's board (`gitlab`) returned all 232 open
jobs in a single unpaginated response. (Only the `/education/*` lookup endpoints document a
`page` cursor; irrelevant to job scraping.)

**Rate limits:** Not documented on this page at all. No stated RPS cap, no 429 guidance.

**Live spot-check:** `curl https://boards-api.greenhouse.io/v1/boards/gitlab/jobs` — 200 OK,
232 jobs, exact fields as documented (`id`, `title`, `location.name`, `absolute_url`,
`updated_at`, `first_published`, `metadata`, etc.). With `?content=true` on a single-job fetch,
`content`, `departments`, `offices` appeared as documented, plus a few undocumented AI-disclaimer
fields (`ai_disclaimer`, `include_ai_disclaimer`, `ai_opt_out_request_url`) that are harmless
extras to ignore.

---

## Lever — Postings API (v0)

**Primary source:** https://github.com/lever/postings-api (the official Lever docs at
`hire.lever.co/developer/documentation` only cover the authenticated v1 Data API and explicitly
point to this repo: *"you should use the Lever Postings API instead of the Lever Data API"*).

**Base URL / slug mapping:**
- Global: `https://api.lever.co/v0/postings/{SITE}`
- EU-hosted accounts: `https://api.eu.lever.co/v0/postings/{SITE}`
- `SITE` is the company's Lever site name (usually the company name, no spaces — e.g. the
  official demo site is `leverdemo`).
- Single posting: `GET /v0/postings/{SITE}/{POSTING-ID}`.
- HTTPS only.

**Auth:** None for GET/list/single-posting. (Only the apply-flow `POST /v0/postings/{SITE}/{id}?key=APIKEY`
needs a Super-Admin-issued API key — irrelevant to scraping.)

**Output mode:** `mode=json` (recommended for scraping) vs. `mode=html` / `mode=iframe` for
embedding. The `Accept` header picks a default if `mode` is omitted; always pass `mode=json`
explicitly to be safe.

**Query parameters:** `skip`, `limit` (pagination — see below), `location` / `commitment` /
`team` / `department` (filters, OR'd when repeated, case-sensitive), `level`, `group` (one of
`location`/`commitment`/`team` to bucket results).

**Response field names (posting):**
- `id` — posting id
- `text` — the job title (there is **no field literally named `title`**)
- `categories.location`, `categories.team`, `categories.department`, `categories.commitment`,
  `categories.allLocations`
- `hostedUrl` — Lever-hosted posting page (closest thing to a canonical posting URL)
- `applyUrl` — Lever-hosted application form
- `description` / `descriptionPlain` (+ `opening`/`openingPlain`, `descriptionBody`/`descriptionBodyPlain`,
  `additional`/`additionalPlain`) — HTML/plaintext description pieces
- `lists` — array of `{text, content}` supplementary bullet lists
- `workplaceType` — `unspecified` / `on-site` / `remote` / `hybrid`
- `country` — ISO 3166-1 alpha-2 or null
- `salaryRange` / `salaryDescription` — when the company publishes comp
- `createdAt` — epoch-ms timestamp. **Not documented on the GitHub page at all, but present on
  every record in the live spot-check** — use it as the posted-date field; it's the only
  candidate.

**Pagination:** `skip` + `limit` (no documented default limit, no total-count or next-page
link field — caller must page by incrementing `skip` until a short page comes back).

**Rate limits:** None documented for GET/list. Application-submission POSTs are capped at
2/sec (429 above that) — not relevant to our read-only scraping but worth remembering if we ever
build an apply-bot.

**CORS / visibility:** CORS only allowed from the company's own domain(s). Only `published`
postings are visible through the API.

**Live spot-check:** Could not find a real company whose public Lever postings endpoint still
resolves — tried `netflix`, `box`, `canva`, `attentive`, `carta`, `affirm`, `figma`, `eventbrite`,
`lyft`, `reddit`, `twitch`, `epicgames`, `brex`, `ramp`, `plaid`, `robinhood`; all 404
("Document not found"). This matches a documented/observed industry pattern: many Lever
customers disable the public postings feed or use a vanity apply domain instead of the default
slug. **Lever's own official demo/sandbox site (`leverdemo`) is live and matches the docs
exactly** — confirmed `id`, `text`, `categories`, `hostedUrl`, `applyUrl`, `description*`,
`lists`, `workplaceType`, `country`, `salaryRange`, and the undocumented `createdAt` field, all
present on a real record. For the adapter, plan to confirm each company's actual Lever slug by
checking their live careers page rather than guessing from the company name.

---

## Ashby — Public Job Board API

**Primary source:** https://developers.ashbyhq.com/docs/public-job-posting-api

**Base URL / slug mapping:** `GET https://api.ashbyhq.com/posting-api/job-board/{JOB_BOARD_NAME}`.
`JOB_BOARD_NAME` is the last path segment of the company's hosted board URL
(`jobs.ashbyhq.com/{JOB_BOARD_NAME}`), found in Ashby admin under **Admin → Theme (Job Board)**.

**Auth:** Not stated on this page, and confirmed live — no key, header, or token needed; a bare
GET returns full data. (Ashby's separate authenticated REST API, used for jobs/candidates/
applications/offers/webhooks management, is a different host path and needs an API key from
Settings → API — irrelevant to scraping.)

**Query parameters:** `includeCompensation=true|false` — adds a `compensation` object per job
when true. No other documented parameters.

**Response field names (job):**
- `title`
- `location` — free-text location string; `address.postalAddress` gives structured
  `addressLocality` / `addressRegion` / `addressCountry` when available; `secondaryLocations[]`
  for additional locations
- `jobUrl` — Ashby-hosted posting page (closest thing to id/URL per the docs)
- `applyUrl` — application-form URL
- `publishedAt` — ISO datetime of last publish; use as the posted-date field
- `descriptionHtml` / `descriptionPlain`
- `department`, `team`, `employmentType` (`FullTime`/`PartTime`/`Intern`/`Contract`/`Temporary`),
  `isRemote`, `workplaceType` (`OnSite`/`Remote`/`Hybrid`), `isListed`
- `compensation` — only with `includeCompensation=true`
- Top-level envelope: `{"apiVersion": "1", "jobs": [...]}`

**Important correction vs. the docs — confirmed live:** the docs don't list a dedicated job
`id` field (closest documented identifiers are `jobUrl`/`applyUrl`). The **live response does
include an `id` field** — a stable UUID per job (e.g. Ramp's board returns
`"id":"34413f8d-26bf-4bbc-8ade-eb309a0e2245"`). Use `id` as the stable posting identifier; it's
more robust than parsing one out of `jobUrl`.

**Pagination:** None — confirmed live. Ramp's board (`api.ashbyhq.com/posting-api/job-board/ramp`)
returned all 167 open jobs in one unpaginated response, matching the (undocumented but
widely-observed) "whole board in one call" behavior.

**Rate limits:** Not documented on this page.

**Live spot-check:** `curl https://api.ashbyhq.com/posting-api/job-board/ramp` — 200 OK, 167
jobs, fields exactly as above (`id`, `title`, `department`, `team`, `employmentType`, `location`,
`secondaryLocations`, `publishedAt`, `isListed`, `isRemote`, `workplaceType`, `address`,
`jobUrl`, `applyUrl`, `descriptionHtml`, `descriptionPlain`).

---

## Cross-platform summary for the adapter design ticket

| | Greenhouse | Lever | Ashby |
|---|---|---|---|
| URL pattern | `boards-api.greenhouse.io/v1/boards/{token}/jobs` | `api.lever.co/v0/postings/{site}?mode=json` | `api.ashbyhq.com/posting-api/job-board/{name}` |
| Auth | None | None | None |
| Title field | `title` | `text` | `title` |
| Stable id | `id` | `id` | `id` (undocumented but present) |
| Posting URL | `absolute_url` | `hostedUrl` | `jobUrl` |
| Location | `location.name` (string) | `categories.location` (string) | `location` (string) + structured `address` |
| Posted date | `first_published` (single-job endpoint only; list has `updated_at`) | `createdAt` (undocumented epoch-ms) | `publishedAt` (ISO datetime) |
| Description | `content` (needs `content=true`) | `description`/`descriptionPlain` | `descriptionHtml`/`descriptionPlain` |
| Pagination | None (whole board per call) | `skip`/`limit` (optional, uncapped by default) | None (whole board per call) |
| Documented rate limit | None | None (GET); 2/sec on apply POSTs only | None |

All three are confirmed safe to poll with a single unauthenticated GET per company per run,
consistent with the map's 2–5s inter-request delay — none requires pagination handling for a
typical company-sized board, though the Lever adapter should still support `skip`/`limit` in
case a company's board ever exceeds one page's worth of postings (no documented page size to
assume, so treat an unexpectedly short/empty page as "no more results" rather than relying on a
fixed limit).
