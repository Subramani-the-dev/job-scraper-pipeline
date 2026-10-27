# Research for #19: unprotected data routes for McKinsey, Tavant, Cognizant

Date of all live checks: 2026-10-23. Method for every claim is stated inline: `curl` = plain HTTP request from a dev laptop (no cookies, no proxy, no stealth, no challenge solving, browser-like `User-Agent` only, 3 s between requests), `Chrome` = the Claude-in-Chrome browser used only to load a page normally and read its network log, scripts or DOM, `robots` = the host's own `robots.txt`. Anything not verified is labelled **UNVERIFIED**. Context: #13 (McKinsey), #14 (Cognizant), #15 (Tavant), #4 (Adapter: no stealth, proxies or CAPTCHA solving; blocked Source returns `failed: blocked`).

## Summary table

| Company | Verdict | Route | Platform | HTTP or browser | robots |
|---|---|---|---|---|---|
| McKinsey Digital | **Usable (custom-json)** | `GET https://gateway.mckinsey.com/apigw-x0cceuow60/v1/api/jobs/search?pageSize=N&start=P` | Own Sitecore/Next.js site; job API on `gateway.mckinsey.com` (Cloudflare); apply on Avature (`mckinsey.avature.net`) | curl works | page host allows the path; API host's `robots.txt` returns 403 (unreadable) |
| Tavant | **Usable (custom-json)** | `POST https://public.zwayam.com/jobs/search` (multipart form) | Zwayam (`careers.tavant.com/tavant/`, Angular SPA) | curl works | `careers.tavant.com`: `Allow: /`; `public.zwayam.com/robots.txt` is 404 (no rules) |
| Cognizant | **Usable (custom-xml feed)** | `GET https://careers.cognizant.com/global-en/jobs/xml/` | Own site over Oracle Taleo (`cognizant.taleo.net`, section `Lateral`) | curl works | `User-agent: *` `Allow: /`; path not disallowed |

Result: all three have a plain-HTTP route. The protected thing in each case is the human-facing HTML page (Akamai on McKinsey, Cloudflare on Cognizant pages, Akamai sensor on Tavant); the data sits on another host or path that answers `curl`. Same pattern as the "marketing-site blocks do not imply ATS blocks" finding in #21. Posted date is the weak spot for McKinsey (see below).

---

## 1. McKinsey Digital: usable JSON API (new kind or CUSTOM_JSON)

### Page and protection
- `curl https://www.mckinsey.com/robots.txt` and `/careers/search-jobs` fail with `curl: (92)` (HTTP/2 stream reset) on repeated tries, default UA and browser UA. So the `www.mckinsey.com` host is **blocked** to plain HTTP (Akamai: the page posts Akamai sensor data to an obfuscated path and loads `/akam/...`, seen in Chrome network log). `curl`, Chrome, 2026-10-23.
- The same page loads normally in Chrome and `robots.txt` is readable there. Rules for `*`: disallows `/search`, `/content/`, `/RSS/`, etc.; `/careers/...` and `/api/...` are **not** disallowed; sitemap `https://www.mckinsey.com/sitemap.xml` (not fetchable with `curl`, so job-URL enumeration via sitemap = blocked/not usable). Chrome, 2026-10-23.

### The XHR the page calls
- Chrome network log on `/careers/search-jobs` shows `GET https://gateway.mckinsey.com/apigw-x0cceuow60/v1/api/jobs/masterdata`. The page's JS chunks hold the paths `/api/jobs/search`, `/api/jobs/details`, `/api/jobs/suggestions`, `/api/jobs/masterdata` (found by reading the loaded `_next/static/chunks` scripts in Chrome).
- `gateway.mckinsey.com` is served by Cloudflare, not the Akamai that protects `www`. `curl` with no cookies and no `Origin`/`Referer`: `masterdata` returns 200 JSON (regions/cities/countries).

### Route
- Request: `GET https://gateway.mckinsey.com/apigw-x0cceuow60/v1/api/jobs/search?pageSize=100&start=1` (curl, 200, `application/json`, no auth). Optional filters verified: `countries=India` (46 results), `cities=Chennai` (19), `q=digital` (185).
- Pagination: `start` is a 1-based **page number** (start=0 and 1 both give page 1; start=2 with pageSize=3 gave the next 3 ids). `pageSize=700` returned all 603 docs in one 4 MB response; a safer config is `pageSize=100` and `ceil(numFound/pageSize)` pages (7 requests).
- Response: `{numFound, start, httpStatus, statusMessage, requestId, docs[]}`. Each doc: `jobID` (string, stable id, unique across all 603), `title`, `friendlyURL` (e.g. `associate-15178`), `jobApplyURL` (`https://mckinsey.avature.net/careers/ApplicationMethods?folderId=<jobID>`), `interest` (e.g. `Consulting`, `Tech & AI`, `Technology & Digital`, `Analytics`), `interestCategory`, `cities[]`, `countries[]`, `continents[]`, `functions[]`, `industries[]`, `jobSkillGroup`, `whatYouWillDo` / `whoYouWillWorkWith` / `yourBackground` (HTML description), compensation fields.
- Counts 2026-10-23: 603 total, 46 with India in `countries`. By `interest`: Consulting 270, Tech & AI 113, Analytics 40, Technology & Digital 28 (others smaller). **UNVERIFIED** which `interest` values the owner means by "McKinsey Digital"; filter client-side on `interest`.
- Detail: `GET .../api/jobs/details?friendlyUrl=<friendlyURL>` (200, no auth; the first attempt with `jobID=` returned 400 naming the missing `friendlyUrl` parameter). It adds `jobOrderCreatedDate`, `status`, `typeOfRole`, `hiringLocations`, `jobRegion`.
- **Posted date**: only on the detail call, and the one sampled (`associate-15178`) returned `jobOrderCreatedDate: "2012-05-05"`, i.e. an evergreen requisition date, not a real posting date. So posted date is unreliable; use first-seen time. 603 detail calls would also bust the 150-request budget (#4), so skip details; the list already carries the full description.
- A `POST` to `/search` returned a Cloudflare "Attention Required" 403. Not pursued; recorded as blocked. Only the GET route is used.
- Alternative apply-side host `mckinsey.avature.net`: `robots.txt` readable (`Allow: /$`, portal paths marked for noindex); the `ApplicationMethods` URL answered 301 to curl. Not needed as a data source.

### Caveats
- `gateway.mckinsey.com/robots.txt` returns 403 (Cloudflare), so the API host's robots policy is **unknown**, not "allowed". The page host's robots does not disallow the `/api` or `/careers` paths. The gateway path embeds an API-gateway id (`apigw-x0cceuow60`) that could be rotated; the Adapter should treat a 4xx as `failed: blocked`/`failed: changed`.

### Source config
`custom-json`: base `https://gateway.mckinsey.com/apigw-x0cceuow60/v1/api/jobs/search`, page param `start` (1-based), size param `pageSize`, items at `docs`, total at `numFound`, id `jobID`, url `https://www.mckinsey.com/careers/search-jobs/jobs/<friendlyURL>` (**UNVERIFIED** that this is the public detail URL; `jobApplyURL` is verified), posted-date: none reliable.

---

## 2. Tavant: usable JSON API (Zwayam)

### Page and platform
- `careers.tavant.com/tavant/` answers `curl` with 200 (an Angular shell, `<app-root>`). Not blocked at the HTML level on 2026-10-23 despite #15's "Akamai bot-protected" note: the shell does include Akamai `BOOMR` beacon script but did not challenge `curl`. `curl`.
- `robots`: `User-agent: *` `Allow: /`, plus `Sitemap: http://zwayam.com/site-map.xml` (a generic host, not Tavant's; it answers 301). `https://careers.tavant.com/sitemap.xml` is 404. So there is **no usable sitemap**. `curl`.
- The platform is Zwayam (Info Edge): `main.*.js` holds `APIENDPOINT:"https://public.zwayam.com/"`, `COMPANYID:"MTU3Mzg="` (base64 of `15738`), `DOMAIN:"careers.tavant.com"`, and the API list `search:{v1:"jobs/search", ...}`. Read from the served bundle with `curl`.

### Route
- Chrome network log on `/tavant/jobslist` shows `POST https://public.zwayam.com/jobs/search` (200) and `GET https://public.zwayam.com/data-service/v1/company/supportedFileTypeAndSize/15738`.
- Direct call from `curl` works (200, JSON, no cookie/token):
  `POST https://public.zwayam.com/jobs/search` as `multipart/form-data` with fields
  - `filterCri` = `{"paginationStartNo":0,"selectedCall":"sort","sortCriteria":{"name":"modifiedDate","isAscending":false},"anyOfTheseWords":""}`
  - `domain` = `careers.tavant.com`
  - `companyId` = `MTU3Mzg=`
  (field set taken from the bundle's `searchJobsv1Params` default and `getFormDataFromJson`, which JSON-stringifies object fields into a multipart form.)
- Pagination: `filterCri.paginationStartNo` is a **0-based offset**, page size fixed at 10 (offset 10 returned the next 10; offset 30 returned 4 and `hasMoreData:false`).
- Response: `{code, data:{data[], facets, totalCount, hasMoreData, ...}}`. 2026-10-23: `totalCount` 34. Each hit is `{_index, _type, _source:{...}}`. Useful `_source` fields: `id` (numeric stable id, e.g. 599715), `refNumber`/`jobCode` (e.g. `17831`), `jobTitle`, `jobUrl` (slug), `mediumDescription` (HTML) and `mediumDescriptionWithoutHtml`, `role` (HTML), `location` / `locAgg` (`;`-separated), `jobLocationRecord[]` (`city`, `state`, `country`, `formattedLocation`), `departmentName`, `text1` (function), `text2` (region group such as `USA`), `yrsOfExperience`, `displayStatus` (`Open`).
- **Posted date**: `jobCreatedDate` (epoch ms), `createdDate`/`requisitionApprovedDate` (epoch ms), `createDate` (`"11-Feb-2025"`), and `modifiedDate` (epoch ms, changes on edits, so do not use as posted date). Prefer `jobCreatedDate`.
- Detail call not needed: the list already carries the full description. The public detail URL form is **UNVERIFIED**.
- robots: `careers.tavant.com` allows all; `public.zwayam.com/robots.txt` is 404 (no rules). Not disallowed.

### Source config
`custom-json`: `POST` multipart as above; items at `data.data[]._source`; total `data.totalCount`; id `_source.id`; posted `_source.jobCreatedDate`; offset field `paginationStartNo` step 10. India filter: none verified; filter client-side on `jobLocationRecord[].country`. (Facets list `State`, `Country`, `City`, so a server-side filter exists in the UI but its `filterCri` shape was **not** tested.)

---

## 3. Cognizant: usable XML feed; ATS is Oracle Taleo

### Page and protection
- `https://careers.cognizant.com/` and job detail pages (`/india-en/jobs/<id>/<slug>/`) return 403 "Just a moment..." (Cloudflare managed challenge) to `curl`. **Blocked**; detail pages on the careers site are not an option. `curl`, 2026-10-23.
- The same pages load in Chrome. The list page is server-rendered (no XHR to a JSON API in the network log; the search form is a plain `GET` form to `/india-en/jobs/#results`), so there is no page XHR to call. Chrome, 2026-10-23.
- `robots` (`curl` 200): `User-agent: *` `Allow: /`; some named bots get `Disallow: /en/jobs/` or `Disallow: /`; `sitemap:https://careers.cognizant.com/sitemap.xml`. No rule disallows `/global-en/jobs/xml/` for `*`.

### ATS identification
- A fetched job page (`/india-en/jobs/00069828491/...`, read through Chrome's `fetch`) contains the apply button `id="js-apply-external"` linking to `https://cognizant.taleo.net/careersection/Lateral/jobapply.ftl?job=00069828491`. So the underlying ATS is **Oracle Taleo** (tenant `cognizant`, career section `Lateral`; other sections from the Taleo sitemap index: `Cam`, `ukcampus`, `Naukri`, `INDIA_EREF`). Chrome DOM, `curl` on Taleo, 2026-10-23.
- Corroboration: `cognizant.taleo.net/careersection/Lateral/jobsearch.ftl` and `moresearch.ftl` answer 302 to `careers.cognizant.com/global-en/jobs/` (Taleo's own search UI is redirected to the Cognizant front end). The job number `00069828491` is the same in the feed, the careers URL and the Taleo URL. `curl`.
- **Conflict to note**: an earlier unmerged working note (`.scratch/job-pipeline/research/19-unprotected-routes-mckinsey-tavant-cognizant.md`, dated 2026-10-22, untracked) says the Apply link goes to `talent.cognizant.com`. The page I inspected linked to Taleo. Different jobs/locales may use different apply targets (**UNVERIFIED**); the Taleo link was read from one live page only. Either way the data route below does not depend on the ATS.

### Route 1 (recommended): XML job feed
- Request: `GET https://careers.cognizant.com/global-en/jobs/xml/` (`curl`, 200, `text/xml`, 11.6 MB, no cookie). Not challenged by Cloudflare. One request returns everything.
- Shape: `<source><publisher/><publisherUrl/><lastBuildDate/><job>...</job>...</source>`. Each `<job>` (CDATA values): `title`, `date`, `requisitionid`, `referencenumber`, `apijobid`, `url`, `company`, `city`, `state`, `country`, `postalcode`, `description` (HTML, full), `category`, `jobtype`, `remotetype`, `lastactivitydate`, `sourcename`.
- Counts 2026-10-23: 2,133 `<job>` entries, all with unique `requisitionid`; 598 have `country` = India (city values uppercase, e.g. `CHENNAI`/`Tamil Nadu`, `KOLKATA`/`West Bengal`). The Taleo `Lateral` sitemap lists 2,087 jobs; the feed matches the 2,133 shown on the careers site.
- id field: `requisitionid` (also the Taleo job number). Posted date: `date` (RFC 1123 string, e.g. `Fri, 23 Oct 2026 00:02:19 GMT`). Note the earliest `date` is 2026-01-02, and the sampled first job's `date` equals the build time, so `date` may be a refresh date and not the original posting date (**UNVERIFIED**; `lastactivitydate` also present).
- Cost: 11.6 MB per run is heavy but is one request; send `Accept-Encoding: gzip` if the server supports it (**UNVERIFIED**).

### Route 2 (fallback, partial): sitemaps
- `https://careers.cognizant.com/sitemap.xml` (`curl`, 200, 7.5 MB, 45,036 `<url>`): 2,151 job URLs per locale across 18 locales (e.g. `/india-en/jobs/<id>/<slug>/` with `lastmod`). It lists ids, slugs and `lastmod` only; the detail pages it points to are Cloudflare-blocked, so the sitemap alone yields no job data.
- Taleo: `https://cognizant.taleo.net/robots.txt` is 404 (no rules). `https://cognizant.taleo.net/careersection/sitemap.jss?portalcode=1&lang=en` (200 XML) lists the five section sitemaps; `...portalCode=Lateral&lang=en` has 2,087 `jobdetail.ftl?job=<id>` URLs. A Taleo detail page (`jobdetail.ftl?job=00069828491&lang=en`) is fetchable by `curl` (200) and carries the title, job number and description inside `api.fillList('requisitionDescriptionInterface', ...)` calls, but I found no location and no posted date in that HTML (loaded by script). So Taleo detail is a poor second source; the XML feed is better.
- Taleo REST search (`/careersection/rest/jobboard/searchjobs`) with a guessed portal id returned `careerSectionUnAvailable:true`. **UNVERIFIED**: the portal id was not known, so this is inconclusive rather than a confirmed block. Not pursued further.

### Source config
`custom-xml` (or CUSTOM_JSON-equivalent XML adapter): URL above; items `source/job`; id `requisitionid`; posted `date`; apply/detail URL `url`; location `city`/`state`/`country`. India slice by `country == "India"` (client-side, no server-side filter seen).

---

## Impact on the design

- All three companies leave the `custom-playwright` / `failed: blocked` list. #15's Tavant "needs stealth" note and #13's McKinsey "needs stealth" note were about the HTML pages only.
- Cognizant needs an XML parse step (new item shape, not JSON). Tavant needs multipart `POST`. McKinsey is a plain `GET` JSON (fits `custom-json` with `start` as a 1-based page number).
- Fragility notes for the Adapter: McKinsey's gateway path has an embedded id; Cloudflare 403 on `POST`/robots for the gateway shows that host is not unconditionally open; Cognizant's feed is 11.6 MB. Map any 403/challenge HTML on these routes to `failed: blocked`.
- Request budget (#4: 150 requests / 10 min per Source): McKinsey 7 (pageSize 100), Tavant 4 (34 jobs, 10 per page), Cognizant 1. All fit.
- Posted-date quality: Tavant `jobCreatedDate` good; Cognizant `date` uncertain; McKinsey none reliable (first-seen fallback).
