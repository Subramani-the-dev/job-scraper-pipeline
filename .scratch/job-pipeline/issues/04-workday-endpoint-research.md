Type: research
Status: resolved

## Question

Confirm the exact Workday CxS job-search endpoint shape used by career pages: the `/wday/cxs/<tenant>/<site>/jobs` request (method, headers, auth/cookies if any, pagination/offset params, request body shape) and the response JSON shape (field names for title, location, posting id, posted date, description/detail-fetch). Verify by inspecting at least two real Workday-hosted career sites (e.g. a company like Accenture or Capgemini's careers site) via the browser's network tab, not from memory. Note how the tenant and site slug are discoverable from a company's public careers URL, since that's what turns "company name" into "Source config" for every Workday-hosted company in the registry.

## Answer

Verified live against two independent Workday-hosted sites (Hitachi on `wd1`, KBR on `wd5`) by
inspecting actual network traffic — not from memory. Note: Accenture and Capgemini, suggested as
examples above, turned out **not** to be Workday-hosted (guessed tenant slugs for both hit
Workday's generic maintenance page); Hitachi and KBR were found instead via a
`site:myworkdayjobs.com` search.

**Endpoint shape**:
- Search/list: `POST https://<tenant>.<wdN>.myworkdayjobs.com/wday/cxs/<tenant>/<site>/jobs`
  — body `{"appliedFacets":{}, "limit":20, "offset":0, "searchText":"<query>"}` (empty
  `searchText` = full list; `appliedFacets` keys are facet-parameter names from the response's
  `facets` block). Response: `{total, jobPostings:[{title, externalPath, locationsText,
  postedOn, bulletFields:[reqId]}], facets:[...]}`.
- Detail/full description: `GET .../wday/cxs/<tenant>/<site>/job/<slug from externalPath>` →
  `{jobPostingInfo:{id, title, jobDescription (HTML), location, additionalLocations[],
  startDate (ISO date), jobReqId, externalUrl, ...}, hiringOrganization, similarJobs[]}`. Use
  `jobReqId`/`bulletFields[0]` (e.g. `R0118403`) as the stable dedupe id, and detail's `startDate`
  for the real posted-on date — the list call's `postedOn` is only a relative string ("Posted
  Yesterday").
- **No auth needed**: confirmed by calling the endpoint directly with only
  `Accept`/`Content-Type: application/json` headers and no cookies/CSRF token — still returned
  200 with full data. The site's own frontend sends an `X-CALYPSO-CSRF-TOKEN` header, but it's
  not enforced.
- **Tenant/site derivation**: from a company's public Workday URL
  `https://<tenant>.<wdN>.myworkdayjobs.com/<locale>/<site>`, `<tenant>` is the subdomain
  (lowercase), `<site>` is the path segment after the locale, case-sensitive as it appears in the
  URL. Find a company's URL via `site:myworkdayjobs.com <company>` search — don't guess tenant
  names, since a wrong guess returns Workday's generic maintenance page rather than a 404.

Full findings with raw request/response examples, headers, and an observed pagination quirk
(`total` unreliable on non-zero `offset`) are on the `research/workday-endpoint` branch at
`.scratch/job-pipeline/research/workday-cxs-endpoint.md`. That branch isn't merged into `main`,
so view it with:

```
git show research/workday-endpoint:.scratch/job-pipeline/research/workday-cxs-endpoint.md
```

Note: a concurrent session on this repo swept that same file into one of its own commits on a
different branch (`research/greenhouse-lever-ashby-api`) while this research was in progress; the
file is readable from either branch via the `git show` form above.
