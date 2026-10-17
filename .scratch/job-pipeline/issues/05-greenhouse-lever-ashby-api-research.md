Type: research
Status: resolved

## Question

Confirm the public job-board JSON API shapes for Greenhouse, Lever, and Ashby: the request URL pattern for each (board token / company slug based), whether any auth is required (expect none — these are public read APIs), the response field names for title, location, posting id/URL, posted date, and description, and any documented rate limits. These three cover the "smaller studios" segment of the registry (e.g. companies like Sahaj, Equal Experts, Tavant) and are expected to be the easiest adapters to build.

## Answer

All three are public, unauthenticated, single-GET-per-company JSON APIs — confirmed against
each platform's own developer docs and spot-checked live (GitLab on Greenhouse, Ramp on Ashby;
Lever's own `leverdemo` sandbox, since no real company's public Lever slug could be found still
live by trial).

- **Greenhouse** — `GET https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs`, no auth.
  Fields: `id`, `title`, `location.name`, `absolute_url`, `updated_at` (list) /
  `first_published` (single-job endpoint, closest to "posted date"), `content` (needs
  `content=true`). No pagination — one call returns the whole board (232 jobs for GitLab). No
  documented rate limit.
- **Lever** — `GET https://api.lever.co/v0/postings/{site}?mode=json`, no auth. Fields: `id`,
  `text` (title — there's no field literally called `title`), `categories.location`,
  `hostedUrl`, `description`/`descriptionPlain`, and an undocumented-but-present `createdAt`
  (epoch ms) as the posted-date field. Supports `skip`/`limit` pagination (uncapped by docs). No
  documented GET rate limit (apply-POSTs are capped at 2/sec, irrelevant to scraping). Many real
  companies have disabled or moved off this endpoint — confirm each company's actual slug from
  their live careers page rather than guessing.
- **Ashby** — `GET https://api.ashbyhq.com/posting-api/job-board/{name}`, no auth. Fields:
  `title`, `location` (+ structured `address`), `jobUrl`, `publishedAt`, `descriptionHtml`/
  `descriptionPlain`. Docs don't mention a job `id` field, but live responses do include one (a
  stable UUID) — use it as the posting id. No pagination (167 jobs for Ramp in one call). No
  documented rate limit.

Full findings, docs sources, and a cross-platform comparison table are committed on branch
`research/greenhouse-lever-ashby-api` at
`.scratch/job-pipeline/research/05-greenhouse-lever-ashby-api-research.md`. That branch isn't
merged into `main`, so the file won't show up here — view it with:

```
git show research/greenhouse-lever-ashby-api:.scratch/job-pipeline/research/05-greenhouse-lever-ashby-api-research.md
```

or `git checkout research/greenhouse-lever-ashby-api` to browse it directly.
