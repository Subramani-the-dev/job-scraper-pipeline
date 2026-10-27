# Research: Workday CxS job-search endpoint shape

Ticket: `.scratch/job-pipeline/issues/04-workday-endpoint-research.md`

## Method

Live inspection via browser (mcp__Claude_Browser__*), not memory/guesswork. Two independent,
real Workday-hosted career sites were opened and their network traffic inspected:

1. **Hitachi** — `https://hitachi.wd1.myworkdayjobs.com/en-US/hitachi`
2. **KBR** — `https://kbr.wd5.myworkdayjobs.com/en-US/KBR_Careers`

Both found via a DuckDuckGo `site:myworkdayjobs.com` search (Google blocked the search with a
CAPTCHA interstitial; Bing's results were junk/unrelated). Direct guesses at well-known
consulting-firm tenant slugs (`accenture.wd3...`, `capgemini.wd3...`) both hit Workday's generic
"Workday is currently unavailable" maintenance page — i.e. those two companies are **not**
actually on `myworkdayjobs.com` (Accenture runs its own in-house job search; Capgemini uses a
different ATS front end), confirming tenant/site slugs must be discovered per-company, not
guessed from the company name.

## 1. How `<tenant>` and `<site>` are derived from a public careers URL

A Workday-hosted career site's public URL has the shape:

```
https://<tenant>.<wdN>.myworkdayjobs.com/<locale>/<site>
```

Examples observed:
- `https://hitachi.wd1.myworkdayjobs.com/en-US/hitachi` → tenant=`hitachi`, site=`hitachi`, data center=`wd1`
- `https://kbr.wd5.myworkdayjobs.com/en-US/KBR_Careers` → tenant=`kbr`, site=`KBR_Careers`, data center=`wd5`

Rules confirmed by matching the URL against the actual `/wday/cxs/...` calls the page made:
- `<tenant>` = the subdomain immediately before `.wdN.myworkdayjobs.com`, **lowercase**, used
  lowercase in the API path regardless of how it's capitalized anywhere else.
- `<site>` = the path segment that follows the locale segment (`/en-US/`) in the public URL,
  used **exactly as it appears in the URL, case-sensitive** (`hitachi` stayed lowercase;
  `KBR_Careers` kept its mixed case). This is Workday's "career site" identifier and is
  independent of the tenant name (a tenant can have multiple named career sites).
- `<wdN>` (the data-center number, e.g. `wd1`, `wd3`, `wd5`) is **not** part of the `/wday/cxs/`
  API path — the API path uses only `wday/cxs/<tenant>/<site>/...` and is called from the same
  origin (`https://<tenant>.<wdN>.myworkdayjobs.com`) that served the page. So to build a Source
  config for a new company: visit their public careers page, find where it lands on
  `*.myworkdayjobs.com`, and read `<tenant>`/`<wdN>`/`<site>` straight off that URL.

Practical way to confirm a guess or find it from scratch: web-search
`site:myworkdayjobs.com <company name>` (DuckDuckGo worked; Google needs a logged-in session to
avoid CAPTCHA) and take the resulting URL apart as above — don't guess tenant names blind, since
wrong tenant/site combos silently return Workday's generic maintenance page rather than a clear
404.

## 2. The job-search request

```
POST https://<tenant>.<wdN>.myworkdayjobs.com/wday/cxs/<tenant>/<site>/jobs
```

Observed directly in the network log on both sites, e.g.:
- `POST https://hitachi.wd1.myworkdayjobs.com/wday/cxs/hitachi/hitachi/jobs` → 200
- `POST https://kbr.wd5.myworkdayjobs.com/wday/cxs/kbr/KBR_Careers/jobs` → 200

### Headers

The site's own frontend sends:
```
Accept: application/json
Content-Type: application/json
Accept-Language: en-US
X-CALYPSO-CSRF-TOKEN: <uuid>
```

**Confirmed by direct test**: the CSRF token and all cookies are *not* actually required. A bare
`fetch` from the page's own origin with only `Accept`/`Content-Type: application/json` and no
`X-CALYPSO-CSRF-TOKEN` header and no cookies returned 200 with full results (tested live against
`kbr.wd5.myworkdayjobs.com`). The only cookies the site itself sets are non-auth
(`timezoneOffset`, `enablePrivacyTracking`) — there is no session/auth requirement to read job
postings. (A scraper should still send a realistic `User-Agent` and the `Content-Type: application/json`
header, and calling from the matching origin/referer is prudent to avoid generic bot-blocking,
but no credential or token exchange is needed.)

### Request body

```json
{
  "appliedFacets": {},
  "limit": 20,
  "offset": 0,
  "searchText": "engineer"
}
```

- `searchText`: free-text query string; empty string (`""`) returns the unfiltered full list.
- `limit` / `offset`: standard pagination — `limit` is page size (observed default 20, but
  confirmed overridable, e.g. tested with `limit: 5`), `offset` is the starting index into the
  full result set.
- `appliedFacets`: an object keyed by facet parameter name (e.g. `jobFamilyGroup`,
  `locationCountry`, `timeType`) whose values are arrays of the facet `id` strings taken from the
  `facets` block of a prior response — used to filter by category/location/job-type. Empty object
  = no filter.

**Observed quirk**: in one paginated test (`offset: 20`) the response's `total` field came back
as `0` even though `jobPostings` still contained real rows — `total` should not be trusted on
every page; re-derive the true count from an `offset: 0` call, or just keep paging until
`jobPostings` comes back empty.

### Response shape (search/list)

```json
{
  "total": 1832,
  "jobPostings": [
    {
      "title": "Project Management Office Manager",
      "externalPath": "/job/Richmond-Virginia/Program-Management-Office-Manager_R2130601",
      "locationsText": "Richmond, Virginia",
      "postedOn": "Posted Yesterday",
      "bulletFields": ["R2130601"]
    }
  ],
  "facets": [ { "facetParameter": "jobFamilyGroup", "descriptor": "Job Category", "values": [...] }, ... ]
}
```

Field mapping for the registry's Posting model:
- **title**: `jobPostings[].title` — note some rows (seen on the KBR site) omit `title` and
  `locationsText` entirely and carry only `externalPath` + `bulletFields`; treat those as
  optional/nullable.
- **location(s)**: `jobPostings[].locationsText` — a human-readable string, sometimes literally
  `"N Locations"` (e.g. `"2 Locations"`) rather than a real place name when a posting has
  multiple locations; the real list of locations is only available from the detail call
  (`location` + `additionalLocations[]`).
- **posting id**: the stable Workday requisition id, available two ways — `bulletFields[0]`
  on the list row (e.g. `"R0118403"`), and `jobReqId` on the detail call. This req id (e.g.
  `R0118403`) is the natural stable identifier to dedupe on, not the internal `id` GUID.
- **posted-on date**: `jobPostings[].postedOn` on the list call is a relative string ("Posted
  Yesterday", "Posted 30+ Days Ago") — not machine-parseable to a real date. The detail call's
  `startDate` (ISO `YYYY-MM-DD`, e.g. `"2026-01-23"`) is the actual postable date and should be
  used instead of trying to parse the list string.
- **external path/URL**: `jobPostings[].externalPath` is a relative path like
  `/job/Chennai-Tamil-Nadu-India/Project-Engineer---Primary-Engineering_R0118403`. The public,
  user-facing URL is `https://<tenant>.<wdN>.myworkdayjobs.com/<locale>/<site>/details/<slug>`
  (note: `details`, not `job`, in the public page URL) or equivalently the `externalUrl` field
  returned by the detail call, which gives the full canonical
  `https://<tenant>.<wdN>.myworkdayjobs.com/<site>/job/<slug>` form directly.

## 3. Fetching the full description (detail call)

```
GET https://<tenant>.<wdN>.myworkdayjobs.com/wday/cxs/<tenant>/<site>/job/<slug>
```

where `<slug>` is the last path segment of `externalPath` (e.g.
`Project-Engineer---Primary-Engineering_R0118403`). Observed directly:
`GET https://hitachi.wd1.myworkdayjobs.com/wday/cxs/hitachi/hitachi/job/Project-Engineer---Primary-Engineering_R0118403` → 200.

Response shape (trimmed):

```json
{
  "jobPostingInfo": {
    "id": "d57ccf28598b1001ec6a4ebb9d7a0000",
    "title": "Project Engineer - Primary Engineering",
    "jobDescription": "<p>...HTML...</p>",
    "location": "Chennai, Tamil Nadu, India",
    "additionalLocations": ["Bengaluru, Karnataka, India", "Vadodara, Gujarat, India"],
    "postedOn": "Posted 30+ Days Ago",
    "startDate": "2026-01-23",
    "timeType": "Full time",
    "jobReqId": "R0118403",
    "jobPostingId": "Project-Engineer---Primary-Engineering_R0118403",
    "jobPostingSiteId": "hitachi",
    "canApply": true,
    "posted": true,
    "externalUrl": "https://hitachi.wd1.myworkdayjobs.com/hitachi/job/Chennai-Tamil-Nadu-India/Project-Engineer---Primary-Engineering_R0118403"
  },
  "hiringOrganization": { "name": "HITACHI ENERGY TECHNOLOGY SERVICES PRIVATE LIMITED", "url": "" },
  "similarJobs": [ { "title": "...", "externalPath": "...", "startDate": "...", ... } ],
  "userAuthenticated": false
}
```

- **jobDescription** is raw HTML (needs stripping/sanitizing before storing/filtering on it).
- **jobReqId** is the stable id to key on (same value as the list call's `bulletFields[0]`).
- No auth required for this call either (tested unauthenticated, `userAuthenticated: false`).

## Summary for Source config

A Workday Source needs exactly three fields pulled from the company's public careers URL:
`tenant` (subdomain, lowercase), `site` (path segment after locale, case-sensitive), and
optionally the data-center host (`wdN.myworkdayjobs.com`) since it's part of the origin the
calls are made from. The adapter then does:

1. `POST /wday/cxs/<tenant>/<site>/jobs` with `{appliedFacets:{}, limit, offset, searchText:""}`,
   paging via `offset` until `jobPostings` is empty, to get `title`/`externalPath`/`bulletFields[0]`
   (= req id) per posting.
2. `GET /wday/cxs/<tenant>/<site>/job/<slug from externalPath>` per posting (or lazily, only for
   new postings) to get `jobDescription`, `startDate`, `location`/`additionalLocations`, and the
   canonical `externalUrl`.

No cookies, sessions, or CSRF tokens are needed for either call — this is an open, unauthenticated
JSON API on every site tested.
