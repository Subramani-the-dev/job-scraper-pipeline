# #24: HCLTech compliant route (sitemap + HTML detail pages)

Fetched 2026-10-26 from `careers.hcltech.com` with `curl -A 'job-pipeline-bot/1.0'`, honest UA only, 4+ s between requests, 9 requests total. Samples saved in the session scratchpad, not the repo.
Matching per #22/#23: group `User-agent: *`, longest match wins. Verdicts from a longest-match script over the saved robots.txt, not first-match.

## Verdict: viable with limits (poor fit)

Compliant fetching works, but the route gives no location in the sitemap, no posted date anywhere, and costs 2 requests per job. A full India pass is not possible inside one Run. Recommend deferring HCLTech (Company row, Source disabled) unless the 150-request cap is raised for it.

## 1. robots.txt and sitemap declaration

Source: `https://careers.hcltech.com/robots.txt` (HTTP 200, 252 bytes, 2026-10-26).

| Rule (`User-agent: *`) | |
|---|---|
| Disallow | `/applybutton/` `/talentcommunity/` `/mobile/talentcommunity/` `/emailsubscribe/` `/email/image/` `/services/` `/preapply/` `/error` `/unsubscribe/` `/reset/` |
| Allow | none |
| `Sitemap:` line | **none declared** |

The sitemap is not declared; `/sitemap.xml` is the SuccessFactors default and answers 200 (see 2).

| Path | Rule hit | Verdict |
|---|---|---|
| `/sitemap.xml` | none | allowed |
| `/job/<slug>/<id>/` (sitemap form) | none | allowed |
| `/job/<slug>/<id>-en_US/` (redirect target) | none | allowed |
| `/services/recruiting/v1/jobs` | `/services/` | disallowed (as #23) |
| `/talentcommunity/apply/<id>/` (the Apply link) | `/talentcommunity/` | disallowed: never fetch, only store as a string/link |
| `/search/`, `/go/India/9553955/` | none | allowed (not fetched) |

## 2. Sitemap structure

Source: `https://careers.hcltech.com/sitemap.xml`, 2026-10-26. Flat `urlset`, not an index. `content-type: text/xml`, chunked, `cache-control: no-cache`.

| Item | Finding |
|---|---|
| Fetch | **Timed out at 40 s after 423,062 bytes** (stream was still running; server is slow generating it). Not retried or worked around. Analysis is on the truncated prefix: 2,281 complete `<url>` entries. |
| Total job URLs | Unknown, **at least 2,281**. Real total likely higher (global, all countries). |
| Entry shape | `<loc>https://careers.hcltech.com/job/<Slug>/<10-digit id>/</loc><lastmod>YYYY-MM-DD</lastmod><changefreq>daily</changefreq><priority>0.9</priority>` |
| `lastmod` | Present, but all 2,281 entries are `2026-10-24` (the generation day). Not a posting or update date: **useless for newest-first or incremental fetching**. |
| Location from sitemap/URL | **No.** Slug is the job title only; no city or country. India can only be known from the detail page. |
| URL id | The 10-digit id in the sitemap (e.g. `1341264155`) is not the page's job id. `GET` returns 302 to `/job/<slug>/<short id>-en_US/` (e.g. `69732-en_US`). The redirect is needed to learn the canonical id. |

Sitemap ids 302 (3 of 3 tested): `1357856755` to `120238-en_US`, `1341264155` to `69732-en_US`, `1362930755` to `141973-en_US`.

## 3. Detail page

Sources: `/job/Account-Manager/69732-en_US/` (HTTP 200, 128 KB) and `/job/Technical-Specialist/120238-en_US/` (HTTP 200, 117 KB), 2026-10-26.

- **No JSON-LD.** No `application/ld+json`, no `datePosted`, no `jobLocation`. HTML must be parsed.
- Markup has `<div class="jobDisplayShell" itemscope itemtype="http://schema.org/JobPosting">` with only two `itemprop`s: `title` and `description`. Nothing else is annotated.

| Field | Available? | Where |
|---|---|---|
| title | yes | `itemprop="title"` span; also `<title>`, `og:title` |
| description | yes (HTML) | `itemprop="description"` span (rich HTML) |
| location | yes, **unlabelled** | plain `<span class="rtltextaligneligible">` right after the title, free text e.g. `Paris, Ile-de-France`. Position-dependent, so fragile; country not separate. |
| posted date | **no** | not in markup, meta, or inline JS |
| requisition id | partial | canonical short id only: `link rel=canonical` and inline `jobID: 69732`. No business req number found. |
| apply URL | yes, link only | `/talentcommunity/apply/<jobID>/?locale=en_US` (path is robots-disallowed: store, do not fetch) |

Gotcha: the `Technical-Specialist/120238-en_US` page rendered as an empty shell (`<title> Job Details | HCLTech`, empty meta, no `jobDisplayShell`; 5 KB of visible text, all cookie banner). Likely a closed/unpublished job still listed in the sitemap (not confirmed). The adapter must treat "no `itemprop=title`" as a skipped posting, not a failure. Sample rate: 1 of 2 pages fetched was empty.

## 4. Request budget

Constraints: 150 requests / 10 min per Source (#4), 2-5 s global gap (#22). At 3 s gap, 150 requests = 7.5 min, so the cap (not time) binds.

| Step | Requests |
|---|---|
| Sitemap (1 slow request, over 40 s) | 1 per Run |
| Per job: sitemap URL to 302, then canonical URL 200 | 2 |
| Jobs fetchable per Run | (150 - 1) / 2 = **74** |
| First pass over >= 2,281 URLs (location unknown until fetched) | >= 4,562 requests = **>= 31 Runs** |
| After first pass, with lastmod useless | still need a change signal; every re-check costs the same |

- Incremental via `lastmod` is **not possible** (constant value). Only a seen-set of ids works: new URL in sitemap = new job, so steady state costs the sitemap + 2 per *new* job, but the baseline (#7) takes ~31+ Runs and India filtering is only after fetching, so ~85-90% of fetches (non-India) are wasted unless country mix is measured.
- Unknown: India share. Not measurable without fetching details. A cheaper alternative (not tried): `/go/India/9553955/` listing pages are allowed by robots.txt but were not fetched; may give an India-only list via HTML pagination. Worth one follow-up test before dropping the Source.
- The caching trick of remembering sitemap id to canonical id removes the 302 on later Runs (1 request per new job).

## 5. Recommended adapter shape (if pursued)

- Kind: plain-HTTP HTML (the #22 http-html kind), no JSON.
- List: `GET /sitemap.xml` (allow >= 120 s timeout for this one request; it was the only path to time out at 40 s), parse `<loc>`; diff against stored ids.
- Detail: for each unseen URL, follow the one 302, parse `itemprop=title`, `itemprop=description`, the span after the title for location; skip empty shells; keep India by location text.
- Ordering: no posted date, so use first-seen time; cap new details per Run at 74; spread baseline over Runs (conflicts with #7 "first ok Run" baseline rule: needs an explicit "baseline incomplete" state).
- Apply URL: store `/talentcommunity/apply/<id>/` as a link, never fetch.
- Recommendation: either test the `/go/India/9553955/` HTML listing first, or leave HCLTech as Company row without an active Source.

## Not done

- Full sitemap size, India share, and `/go/India/...` listing not measured (timeout rule, small request budget).
- No retry of the timed-out sitemap fetch.

## Follow-up: `/go/India/9553955/` listing (2026-10-26)

Fetched `https://careers.hcltech.com/go/India/9553955/` with `job-pipeline-bot/1.0` (robots.txt re-fetched first, 200; `/go/` is not disallowed). 2 requests, 4s apart.

- HTTP 200, 187,863 bytes, title "Explore Tech Careers in India | Find Your Spark".
- The static HTML holds **zero** `/job/...` links, no pagination markers, no result count, no posted dates. It is a country landing page, listing links to other `/go/<Country>/...` pages; job results are rendered client-side.
- No `Disallow` covers `/go/`. The disallowed `/services/` route (the JSON the page presumably calls) is the only data path.

Verdict: **not viable.** The listing needs a JS render (Playwright), and the data source it calls was not observed. It is likely the disallowed `/services/` route (unverified; not tested in a browser). Keep HCLTech as a Company row with no Source. The sitemap route stays "viable with limits, a poor fit" (see above).
