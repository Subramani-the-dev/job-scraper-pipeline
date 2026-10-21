# Research for #21: ATS and scrapable route for 28 more companies

Date of all live checks: 2026-10-21. Method for every claim is stated inline: `curl` = plain HTTP request from a dev laptop (no stealth, browser-like `User-Agent` only), `Chrome` = the Claude-in-Chrome browser used only to read a page's network log or text, `robots` = the host's own `robots.txt`. Anything not verified is labelled **UNVERIFIED**.

Endpoint shapes for the already-known kinds are reused from #5 (Workday `cxs`), #6 (Greenhouse/Lever/Ashby), #16 (Oracle HCM), #17 (SuccessFactors) and #18 (RippleHire) and only the live config values are confirmed here.

## Summary table

"Loc filter" = can location be filtered server-side to India / Chennai / Bangalore / Hyderabad. "HTTP" = works with plain HTTP from `curl`. Counts are live postings seen on 2026-10-21.

| # | Company | Grouping | Platform | Source kind | Config | HTTP or browser | Bot-protected | Loc filter |
|---|---|---|---|---|---|---|---|---|
| 1 | Freshworks | Product/SaaS | SmartRecruiters | **SMARTRECRUITERS (new)** | company id `Freshworks` | HTTP | no | yes, `country=in` (34 jobs) |
| 2 | Zoho | Product/SaaS | Zoho Recruit | **ZOHO_RECRUIT (new)** | `careers.zohocorp.com/jobs/Careers` (+ `/rss`) | HTTP | no | n/a (9 postings, all Tamil Nadu) |
| 3 | Chargebee | Product/SaaS | SuccessFactors "classic" CSB | SUCCESSFACTORS | host `jobs.chargebee.com` | HTTP (HTML) | no | n/a (1 posting, US remote) |
| 4 | Kissflow | Product/SaaS | none (HubSpot CMS pages) | CUSTOM_HTML (see Impact) | `careers.kissflow.com` | HTTP (HTML) | no | n/a (2 postings) |
| 5 | Rocketlane | Product/SaaS | Kula | **KULA (new)** | `careers.kula.ai/rocketlane` | HTTP (HTML + JSON-LD) | no | not needed (43 postings) |
| 6 | Facilio | Product/SaaS | none (own Nuxt site) | CUSTOM_HTML | `facilio.com/careers/` | HTTP (HTML) | no | n/a (1 posting, Chennai) |
| 7 | Uniphore | Product/SaaS | Workday | WORKDAY | `uniphore.wd503` / `uniphore` / `Uniphore` | HTTP | no | yes via `locations` facet (Chennai 2, Bangalore 4) |
| 8 | Vue.ai (Mad Street Den) | Product/SaaS | Darwinbox | **DARWINBOX (new)** | `msd.darwinbox.in` | **browser only** | **yes, Cloudflare WAF blocks `curl`** | n/a (0 postings now) |
| 9 | Ramco Systems | Product/SaaS | none (HubSpot page, inline JS data) | CUSTOM_HTML | `ramco.com/careers/jobs-by-locations` | HTTP (HTML) | no | n/a (14 postings, 7 India) |
| 10 | GoFrugal | Product/SaaS | none found | none | n/a | n/a | n/a | n/a |
| 11 | BankBazaar | Product/SaaS | none (email only) | none | n/a | n/a | n/a | n/a |
| 12 | Matrimony.com | Product/SaaS | PeopleStrong | **PEOPLESTRONG (new)** | `matrimonycareers.peoplestrong.com` | HTTP (JSON API; request body only partly known) | Imperva on the host, API reachable by `curl` | UI shows worksite filter; 0 postings now |
| 13 | Temenos | Product/SaaS | Workday | WORKDAY | `temenos.wd103` / `temenos` / `Temenoscareers` | HTTP | no | 19 postings total, none in India |
| 14 | PayPal | Global/GCC | Eightfold (PCSX) | **EIGHTFOLD (new)** | `paypal.eightfold.ai`, domain `paypal.com` | HTTP | careers.pypl.com is Cloudflare-blocked; Eightfold host is not | yes, `location=India` (14 of 336) |
| 15 | Walmart Global Tech | Global/GCC | own Next.js site + GraphQL | none usable | `careers.walmart.com` | n/a | `robots.txt` disallows `/api` and `/results` | server-side filter exists in the UI, but the route is robots-disallowed |
| 16 | Comcast | Global/GCC | Workday (TalentBrew front end) | WORKDAY | `comcast.wd115` / `comcast` / `Comcast_Careers` | HTTP | no | yes via location facet (Chennai 15) |
| 17 | Amazon | Global/GCC | amazon.jobs own JSON | CUSTOM_JSON | `www.amazon.jobs/en/search.json` | HTTP | no | yes (India 2,382; Chennai filter) |
| 18 | athenahealth | Global/GCC | Workday | WORKDAY | `athenahealth.wd1` / `athenahealth` / `External` | HTTP | marketing site Akamai-blocked, Workday not | yes via `locations` facet (Chennai 27) |
| 19 | Verizon | Global/GCC | Workday | WORKDAY | `verizon.wd12` / `verizon` / `verizon-careers` | HTTP | marketing site Cloudflare-blocked, Workday not | yes via `locations` facet |
| 20 | Ford (GTBC) | Global/GCC | Oracle HCM (TalentBrew front end) | ORACLE_HCM | `efds.fa.em5.oraclecloud.com` / `CX_1` | HTTP | `corporate.ford.com` Akamai-blocked, Oracle host not | yes (India 8 of 858) |
| 21 | Mr. Cooper | Global/GCC | unknown (site now Rocket's) | none (`failed: blocked`) | `careers.rocket.com` | n/a | **yes, Akamai Bot Manager 403** | n/a |
| 22 | Caterpillar | Global/GCC | unknown (Umbraco "jobboard") | none (`failed: blocked`) | `careers.caterpillar.com` | browser loads it, `curl` does not | **yes, Cloudflare challenge** | UI has it (India 82), API unreachable by `curl` |
| 23 | Citi | Bank | Workday (TalentBrew front end) | WORKDAY | `citi.wd5` / `citi` / `2` | HTTP | no | yes (India 896, Chennai 117) |
| 24 | Barclays | Bank | Workday (TalentBrew front end) | WORKDAY | `barclays.wd3` / `barclays` / `External_Career_Site_Barclays` | HTTP | no | yes by location ids (no country facet) |
| 25 | Bank of America | Bank | own JSON servlet | CUSTOM_JSON | `careers.bankofamerica.com/services/jobssearchservlet` | HTTP | no | yes (India 144, Chennai 39) |
| 26 | Standard Chartered | Bank | SuccessFactors "unify" CSB | SUCCESSFACTORS (unify) | `jobs.standardchartered.com` | HTTP | Imperva on `sc.com` only | yes, but the JSON route is robots-disallowed |
| 27 | BNY | Bank | Oracle HCM | ORACLE_HCM | `eofe.fa.us2.oraclecloud.com` / `BNY-Careers` | HTTP | no | yes (India 152 of 1,386) |
| 28 | Wells Fargo | Bank | Workday | WORKDAY | `wf.wd1` / `wf` / `WellsFargoJobs` | HTTP | `wellsfargojobs.com` Cloudflare-blocked, Workday not | yes (India 68) |

Result: 23 companies have a usable plain-HTTP route (Vue.ai needs a browser and is likely `failed: blocked` under #4, so effectively 22), 5 have none (GoFrugal, BankBazaar, Walmart, Mr. Cooper, Caterpillar).

## Reusable finding: marketing-site blocks do not imply ATS blocks

Four companies (PayPal, Verizon, Wells Fargo, athenahealth) return 403 / "Just a moment" / "Access Denied" to `curl` on their corporate careers page, but their ATS host answers plain HTTP. The ATS was located by (a) the `search-job-apply-url` meta tag or links on a reachable sibling page, or (b) a web search for the ATS host, and then confirmed against the vendor endpoint plus the hiring-organization name in a detail response. The link from the blocked marketing page to that ATS host is **UNVERIFIED** for those four (the marketing page could not be read).

Also reusable: TalentBrew (Radancy) is the front end for Comcast, Citi, Barclays and Ford. Its `robots.txt` says `Disallow:/search-jobs/` on Comcast, Citi and Ford, so do not scrape TalentBrew; use the Workday / Oracle back end named in each job's `search-job-apply-url` meta tag (verified for Comcast and Barclays; Citi and Ford via links on the home page).

---

## Per-company detail

### 1. Freshworks: SmartRecruiters (new Source kind SMARTRECRUITERS)

- Found: `https://www.freshworks.com/company/careers/` (curl, HTTP 200) links to `https://careers.smartrecruiters.com/Freshworks` and sub-pages `/Freshworks/corporate|cxg|gtm|pd`.
- Config: company identifier `Freshworks` (case as shown).
- List: `GET https://api.smartrecruiters.com/v1/companies/Freshworks/postings?limit=100&offset=0&country=in` (curl, 200, no auth). Response: `{offset, limit, totalFound, content[]}`. Each item: `id` (numeric string, stable id), `name`, `refNumber`, `releasedDate` (ISO, the posted date), `location{city,region,country,fullLocation,remote,hybrid,latitude,longitude}`, `department`, `function`, `typeOfEmployment`, `experienceLevel`, `customField[]`, `ref`.
- Pagination: `limit` (max 100 used successfully) and `offset`; compare `offset+limit` to `totalFound`.
- Detail: `GET https://api.smartrecruiters.com/v1/companies/Freshworks/postings/{id}`: adds `jobAd.sections{companyDescription, jobDescription, qualifications, additionalInformation}` (HTML), `postingUrl`, `applyUrl`.
- Counts: 125 total, 34 with `country=in` (cities Bengaluru, Chennai, Hyderabad). Filter is server-side, verified.
- Bot protection: none seen. robots for `api.smartrecruiters.com` not checked; the Posting API is SmartRecruiters' documented public API (**vendor docs not re-read in this pass, UNVERIFIED**).
- Cost per Run (India): 1 list page + 34 detail calls = about 35 requests.

### 2. Zoho: Zoho Recruit (new Source kind ZOHO_RECRUIT)

- Found: `https://www.zoho.com/careers/` links to `https://careers.zohocorp.com/candidateportal`; the portal home is `https://careers.zohocorp.com/jobs/Careers` (curl 200, `<title>Zoho Corp Careers`).
- List: `GET https://careers.zohocorp.com/jobs/Careers/rss` (curl 200, RSS 2.0). 9 `<item>`s: `<title>`, `<link>` = `https://careers.zohocorp.com/jobs/Careers/{id}/{slug}?source=RSS`, `<guid>` = the 18-digit `{id}`, `<description>` (CDATA HTML with Category, Location, and the full job description), `<pubDate>`.
- Posted-date caveat: `pubDate` values seen are 2022-06-24 and 2025-09-29, i.e. these are evergreen role postings and the date is not a real "posted on". The channel `<ttl>` is 5.
- Location: every item says "Tamil Nadu Tamil Nadu India" (curl, grep of all 9). The HTML page also embeds the same data as `Job_Openings` JSON in a `pageJson` hidden input.
- No pagination seen (9 items in one response). Whether Zoho Recruit pages RSS at larger counts is **UNVERIFIED**.
- robots (`careers.zohocorp.com/robots.txt`, curl): `Allow: /jobs`, `/recruit/downloadrssfeed`, `/careers`.
- Bot protection: none seen.

### 3. Chargebee: SuccessFactors classic CSB (kind SUCCESSFACTORS)

- The `chargebee.com/company/careers/join-us/` page (Chrome text) only says "Explore our LinkedIn Jobs", and no ATS link is in the HTML (curl + grep). A first pass therefore looked like "none found". Probing `careers.chargebee.com` showed it 301-redirects to `https://jobs.chargebee.com/`, which is a SuccessFactors Career Site Builder site (`career44.sapsf.com` / `hcm44.sapsf.com` assets, body class `coreCSB`, no `reactWidgetLoader`, so the "classic" HTML theme of #17).
- List: `GET https://jobs.chargebee.com/search/?q=&locationsearch=` is server-rendered: "Results 1 - 1 of 1". `https://jobs.chargebee.com/sitemap.xml` lists the single job `https://jobs.chargebee.com/job/Remote-Principal%2C-Revenue-Solutions-Field-CFO/59796044/` (lastmod 2026-10-17).
- Detail: the job page has schema.org microdata (`itemprop datePosted` = "Thu Oct 15 02:00:00 UTC 2026", `hiringOrganization`, `addressCountry` = US). Job id is the numeric path segment `59796044`.
- Only 1 posting, US remote. No India roles at the moment.
- The SuccessFactors `company=` code was **not captured** (the apply link path `/talentcommunity/apply/` is robots-disallowed and was not followed). It is not needed for HTML scraping.
- robots: `Disallow: /services/`, `/applybutton/`, `/talentcommunity/`, `/preapply/` (curl). HTML `/search/` and `/job/` are allowed.

### 4. Kissflow: no ATS, HubSpot CMS pages (kind CUSTOM_HTML)

- `kissflow.com/careers/` redirects to `https://careers.kissflow.com/` (curl). Listing page contains anchors `class="career-in-row"`: 2 currently (`/solution-advisor`, `/client-director`).
- Detail page `https://careers.kissflow.com/client-director`: fields "Experience: 14 - 18 years", "Work Location: Chennai&Delhi&Mumbai". No JSON-LD / `datePosted` (grep count 0). Apply is an inline HubSpot form.
- `https://careers.kissflow.com/sitemap.xml` has 79 URLs with `lastmod` 2026-07-16, but only 2 appear on the live listing, so the sitemap includes stale / unlisted pages. Do not use the sitemap as the posting list.
- No posted date available, so freshness must come from first-seen time.
- robots: only HubSpot preview paths disallowed (curl).

### 5. Rocketlane: Kula (new Source kind KULA)

- `rocketlane.com/careers` is a 404; the home page links `https://careers.kula.ai/rocketlane`; `careers.rocketlane.com` 301-redirects there (curl).
- List: `GET https://careers.kula.ai/rocketlane` is server-rendered (Next.js app router). 43 anchors of the form `/rocketlane/{id}-{slug}` (e.g. `/rocketlane/12595-lead-product-designer`). Cards show location text such as "Chennai, Tamil Nadu, India". No JSON list endpoint was found (the site's `/api/` is robots-disallowed, so none was probed).
- Detail: `GET https://careers.kula.ai/rocketlane/{id}-{slug}` carries `<script type="application/ld+json">` JobPosting with `title`, `description` (HTML), `datePosted` (e.g. `2026-05-26T07:38:29.000Z`), `employmentType`, `identifier.value` (= the numeric id `12595`), `hiringOrganization`.
- robots (`careers.kula.ai/robots.txt`): `Disallow: /api/`, `/*/portal`. `sitemap.xml` is a 404.
- Bot protection: none seen.
- Cost per Run: 1 list + up to 43 details.

### 6. Facilio: no ATS, own Nuxt site (kind CUSTOM_HTML)

- `https://facilio.com/careers/` (curl 200). The `#openings` block lists roles by team tabs; 1 role at check time: "Product Marketing Manager, Marketing, Chennai", link `/careers/product-marketing-manager-connected-cmms/`.
- Detail page has no JSON-LD (`datePosted` count 0) and no ATS apply host; applications are on-page.
- `facilio.com/sitemap.xml` only lists `/careers/`, not the individual roles.

### 7. Uniphore: Workday (WORKDAY)

- `https://www.uniphore.com/careers/` links `https://uniphore.wd503.myworkdayjobs.com/Uniphore` (curl).
- Config: host `uniphore.wd503.myworkdayjobs.com`, tenant `uniphore`, site `Uniphore`. `POST /wday/cxs/uniphore/Uniphore/jobs` with `{}` facets returned `total: 37` (curl).
- Location facet `locations`: `India - Bangalore` (4), `India - Chennai` (2) (ids `a9915d38cb07100cb34d33ce139d0000`, `a9915d38cb07100cb34d01e7ecbe0000`). Not needed given the small total.

### 8. Vue.ai (Mad Street Den): Darwinbox (new Source kind DARWINBOX)

- `vue.ai/careers` is a 404. The Vue.ai site footer says "A Mad Street Den brand" and its "Careers" nav link points to `careers.m2pfintech.com` (M2P Fintech, a sibling brand, not Vue.ai; that site is a Next.js app with no ATS host in its HTML, **not investigated further**). The parent `https://www.madstreetden.com/careers` links to `https://msd.darwinbox.in/ms/candidate/careers?apply=1` (curl).
- Platform: Darwinbox, tenant `msd`. The page is an Angular SPA; Chrome network log shows `GET https://msd.darwinbox.in/ms/candidateapi/job?page=1&limit=10` and `.../ms/candidateapi/job/filters`, `.../getLandingPage`, `.../companyinfo`.
- Response shape (Chrome `fetch`, same origin): `{"status":"success","message":{"jobscount":0,"jobs":[]}}`. **Currently 0 postings**, so the job object fields (id, posted date) are **UNVERIFIED**.
- Bot protection: a `curl` of the same API URL returned a Cloudflare "Sorry, you have been blocked ... You are unable to access darwinbox.in" page. The HTML shell loads Cloudflare Turnstile (`challenges.cloudflare.com/turnstile`). A real Chrome session works. Under #4 (no stealth) a plain HTTP Source is `failed: blocked`; only a CUSTOM_PLAYWRIGHT attempt could work and is **UNVERIFIED**. With 0 postings the value is low in any case.

### 9. Ramco Systems: no ATS, HubSpot page with inline JS data (kind CUSTOM_HTML)

- `https://www.ramco.com/careers` links `https://www.ramco.com/careers/jobs-by-locations` (curl).
- The listing HTML embeds `const jobData = [ {...}, ... ]` (a JS literal rendered from HubDB). 14 entries; `"location" : "India"` on 7, others United States, Philippines, Malaysia, Asia Pacific, Europe. Fields per entry: `page_path`, `job_title`, `job_code`, `job_level`, `location`, `location_coordinates`, `experience`, `skills`, `sbu`, `roles_responsibilities`, `job_status`, `priority`, `hr_spoc`, `hiring_manager`, `qualification`. No posted date.
- Detail URL pattern from the page JS: `/careers/jobs-by-locations/{page_path}`. Id = `page_path`.
- Parsing needs a small JS-literal parser (backtick strings). robots: `Allow: /`; only `/search*` and preview paths disallowed (curl).

### 10. GoFrugal: none found

- `gofrugal.com/careers.html` and `/careers` are 404s (curl). The About page's "Check our job openings" button links to `https://www.zoho.com/careers/` (curl + grep), which is Zoho's own careers page, not a GoFrugal job source (looks like a copy-paste error on their site).
- `gofrugal.zohorecruit.com/careers` and `/jobs/Careers` return the same "Page does not exist" body as a made-up tenant (`zzqqnotreal.zohorecruit.com`), so GoFrugal has no Zoho Recruit portal. `careers.gofrugal.com` and `jobs.gofrugal.com` do not resolve. `developers.gofrugal.com` did not connect (a web search says it lists 2 developer roles: **UNVERIFIED**, host unreachable from here).
- Verdict: none found.

### 11. BankBazaar: none found

- `https://www.bankbazaar.com/careers.html` (curl 200): "Open positions at BankBazaar ... write to careers[@]bankbazaar[dot]com with the CV". No job listing, no ATS link.

### 12. Matrimony.com: PeopleStrong (new Source kind PEOPLESTRONG)

- `https://www.matrimony.com/careers` links `https://matrimonycareers.peoplestrong.com/portal/job/joblist` (curl). That path serves the Angular shell with HTTP 404 status; the working UI route is `/job/joblist` (Chrome).
- API seen in Chrome: `POST https://matrimonycareers.peoplestrong.com/api/cp/rest/altone/cp/jobs/v1?offset=0&limit=45` (plus `GET .../cp/master/worksite`, `/orgunit`, `/functionalArea`, `/employeecategory`, `/session`). From the app bundle: `jobs/v1?offset={o}&limit={l}{extra}` with a POST body of search filters.
- `curl -X POST` with body `{}` returned `{"totalRecords":0,"response":null,"solrSearch":true}`; the UI says "No Jobs Available". **0 postings now**, so the item fields (id, posted date) and the real request body are **UNVERIFIED**.
- Bot protection: the host sits behind Imperva (`X-CDN: Imperva`, `_Incapsula_Resource`), but the API call from `curl` returned 200 JSON.

### 13. Temenos: Workday (WORKDAY)

- `https://www.temenos.com/about-us/careers/` links `https://temenos.wd103.myworkdayjobs.com/en-US/Temenoscareers` (curl).
- Config: host `temenos.wd103.myworkdayjobs.com`, tenant `temenos`, site `Temenoscareers`. `POST /wday/cxs/temenos/Temenoscareers/jobs` returned `total: 19` (curl). The location facet shows no India / Chennai / Bangalore / Hyderabad entry (script grep over all facet values). Sample postings are London, Cairo, Bucharest, Madrid. So no India jobs at the moment.

### 14. PayPal: Eightfold PCSX (new Source kind EIGHTFOLD)

- `careers.pypl.com` returns Cloudflare "Just a moment..." 403 to curl. `https://paypal.eightfold.ai/careers` (curl 200, title "Careers at PayPal", page config `domain: paypal.com`) is the job site; **the link from careers.pypl.com to it is UNVERIFIED** (marketing page unreadable).
- robots (`paypal.eightfold.ai/robots.txt`): `Disallow: /` with explicit `Allow: /careers`, `/api/pcsx`, `/api/apply`, `/api/career_hub`. A sitemap index is declared.
- List: `GET https://paypal.eightfold.ai/api/pcsx/search?domain=paypal.com&query=&location=India&start=0&sort_by=timestamp` (curl 200, no auth). Response `{status, data{positions[], count, filterDef, ...}}`. Each position: `id` (numeric, stable), `displayJobId` (e.g. `R0138487`), `name`, `locations[]`, `standardizedLocations[]`, `postedTs` (epoch seconds, the posted date), `department`, `workLocationOption`, `positionUrl`.
- Pagination: `start=N`, 10 per page (page size not settable in my test). `count` is the total: 336 unfiltered, 14 with `location=India`, 2 with `location=Chennai`.
- Detail: `GET https://paypal.eightfold.ai/api/pcsx/position_details?position_id={id}&domain=paypal.com&hl=en` returns the position plus `jobDescription`, `publicUrl` (`https://paypal.eightfold.ai/careers/job/{id}`).
- Note: the older `/api/apply/v2/jobs?domain=paypal.com` returned `{"message": "Not authorized for PCSX"}` (HTTP 403); use the `/api/pcsx/` routes.
- Cost per Run (India): 2 list pages + 14 detail calls = about 16.

### 15. Walmart Global Tech: none usable (`failed: blocked`, robots)

- `careers.walmart.com` (curl 200) is a Next.js site. In Chrome, opening `.../us/en/results?searchQuery=&jobCountry=India` shows the data comes from `POST https://careers.walmart.com/api/graphql`.
- robots (`careers.walmart.com/robots.txt`): `Disallow: /api`, `/us/en/results`, `/results`, `/cms`. So the only list/search route is explicitly disallowed; I did not call it.
- The permitted alternative is `https://careers.walmart.com/sitemap.xml`, which lists 15,475 `/us/en/jobs/R-{number}` detail URLs with no location or date. A detail page is 1 request each, so filtering to India would need thousands of requests (the budget is 150 per Source). Detail pages returned HTTP 200 to curl but carry no JSON-LD `JobPosting`.
- Workday guesses (`walmart.wd1|wd3|wd5` with sites `WalmartExternal|External|WalmartGlobalTech`) all returned HTTP 422 on the `cxs` endpoint, i.e. no such tenant/site; a web search found no Walmart Workday URL.
- Verdict: none found within the rules; record as `failed: blocked` (robots). Revisit only if Walmart publishes a feed.

### 16. Comcast: Workday behind TalentBrew (WORKDAY)

- `jobs.comcast.com` is Radancy TalentBrew (43 `talentbrew` hits in the HTML); robots `Disallow:/search-jobs/`, so do not scrape it.
- Each job page carries `<meta name="search-job-apply-url" content="https://comcast.wd115.myworkdayjobs.com/Comcast_Careers/job/India---Chennai-Comcast-India-Engineering-Cent/...">` (curl on `/job/chennai/quality-and-automation-engineer-2/45483/102163078336`).
- Config: host `comcast.wd115.myworkdayjobs.com`, tenant `comcast`, site `Comcast_Careers`. `POST /wday/cxs/comcast/Comcast_Careers/jobs` returned `total: 644` (curl). (Note the unusual `wd115` pod; guessing `wd1`/`wd5` fails.)
- Location facet `locations`: "India - Chennai, Comcast India Engineering Cent" id `38d640cf23a801a77c75bc4e7e27460c` (15), "India - Virtual - Karnataka DTA" id `57d82fd571ea106272c80aa399990000` (1). Server-side filter works the same way as in #5.

### 17. Amazon: custom JSON (kind CUSTOM_JSON)

- `GET https://www.amazon.jobs/en/search.json?result_limit=100&offset=0&normalized_country_code%5B%5D=IND&sort=recent` (curl 200, no auth, no cookies).
- Response: `{hits, jobs[], facets, ...}`. Per job: `id_icims` (stable id), `title`, `location`, `normalized_location`, `city`, `state`, `country_code`, `posted_date` ("October 20, 2026" text), `updated_time`, `job_path`, `job_category`, `description`, `basic_qualifications`, `preferred_qualifications`, `team`, `business_category`. The description is included in the list response, so no detail call is needed.
- Pagination: `offset` + `result_limit`; `result_limit=100` works. Unfiltered `hits` is capped at 10000.
- Location filtering (verified): `normalized_country_code[]=IND` gives hits 2,382; adding `normalized_city_name[]=Chennai` gives hits 160 (the first results included "Gurgaon - Virtual", so the city filter is not strictly city-only, **precision UNVERIFIED**); `category[]=software-development` plus IND gives 396. Parameters that did NOT filter: `country[]=IND` and `loc_query=...` (hits stayed at 10000 and results were Sydney / Seattle).
- Cost per Run: 24 list requests for all of India at 100 per page; 2-4 for a category or city slice.
- robots (`amazon.jobs/robots.txt`): only `/internal` paths disallowed (curl).

### 18. athenahealth: Workday (WORKDAY)

- `athenahealth.com/careers` returns Akamai "Access Denied" to curl. The tenant was found by testing `athenahealth.wd1.myworkdayjobs.com/External`; the `cxs` endpoint returns real data (`total: 86`) and a detail response has `hiringOrganization.name = "athena India"`, `externalUrl https://athenahealth.wd1.myworkdayjobs.com/External/job/Chennai-India/Implementation-Senior-Analyst_R15557`. **Link from the marketing site UNVERIFIED.**
- Config: host `athenahealth.wd1.myworkdayjobs.com`, tenant `athenahealth`, site `External`.
- Location facet `locations`: "Chennai India" id `9fd490983a8e4b408de388231b464f68` (27), "Bangalore - Whitefield India" id `b722f00e6f5d0157cb3e16d24b1d4bca` (8), "Pune India" id `2e0d3ffd97d3012112754c17574077a0` (3). Applying the Chennai facet returned `total: 27` (curl).

### 19. Verizon: Workday (WORKDAY)

- `mycareer.verizon.com` returns Cloudflare "Just a moment..." to curl. Found by testing `verizon.wd12.myworkdayjobs.com/verizon-careers`: `cxs` returned `total: 1257`; a detail response has `hiringOrganization.name = "1803 Vz Data Svcs India Pvt. Ltd."`. **Link from the marketing site UNVERIFIED.**
- Config: host `verizon.wd12.myworkdayjobs.com`, tenant `verizon`, site `verizon-careers`.
- `locations` facet (also lists US sites, filter by id): "Chennai, India" id `4466d54cbeba1000c05cff9bdacc0000` (16), "Hyderabad, India" id `4466d54cbeba1000c066b6f377040000` (16), "Bangalore, India" id `4466d54cbeba1000c057b4c460500000` (6). There is no country facet here; the detail response does carry `country{descriptor:"India"}`. Applying the Chennai facet returned `total: 16`.

### 20. Ford (GTBC): Oracle HCM behind TalentBrew (ORACLE_HCM)

- `corporate.ford.com/careers.html` returns Akamai "Access Denied". `https://www.careers.ford.com/en` (curl 200) is TalentBrew ("Working at Ford Motor Company"); its robots says `Disallow:/search-jobs/`. The page links `https://apply.ford.com/en/sites/CX_1/my-profile/sign-in`, and `apply.ford.com` 302-redirects to `efds.fa.em5.oraclecloud.com` (curl).
- Config: host `efds.fa.em5.oraclecloud.com`, site `CX_1`. The REST path on the vanity host `apply.ford.com` redirects to an Oracle error page; always use the `efds.fa.em5.oraclecloud.com` host. Endpoint shape is exactly #16 (`recruitingCEJobRequisitions` ... `findReqs;siteNumber=CX_1,...`): `TotalJobsCount` 858 (curl).
- Location filter: `selectedLocationsFacet=300000000425349` (India) returned `TotalJobsCount` 8 (e.g. "Associate, Employee Relations, Chennai, Tamil Nadu, India", posted 2026-10-21). The India id was read from the `locationsFacet` of a `keyword="Chennai"` query, because the unfiltered facet list is capped at the top 25 locations and India is not in it. Chennai id: `300000844568980`.

### 21. Mr. Cooper: none (`failed: blocked`)

- `https://www.mrcooper.com/careers` redirects to `https://www.mrcooper.com/` (curl 200, content now Rocket-branded). A web search showed `careers.mrcooper.com/us/en/...` pages (Phenom-style paths, **platform UNVERIFIED**). `careers.mrcooper.com/us/en/search-results` 301-redirects to `https://careers.rocket.com/in/en/search-results`, which answers HTTP 403 "Rocket Mortgage - Unable to Process Request" and sets Akamai Bot Manager cookies (`_abck`, `bm_sz`). `careers.rocket.com/sitemap.xml` is also 403.
- No alternative ATS host found. Verdict: `failed: blocked` under #4. (Mr. Cooper now sits under Rocket Companies; the registry name may need revisiting. Reason for the rebrand is from the redirect only.)

### 22. Caterpillar: none (`failed: blocked`)

- `www.caterpillar.com/en/careers.html` returns Akamai "Access Denied". `https://careers.caterpillar.com/en/` returns 403, and `.../umbraco/jobboard/CandidateJobs/GetRecentJobs?culture=en` returns the Cloudflare "Just a moment..." challenge to curl.
- In real Chrome the page works (`https://careers.caterpillar.com/en/jobs/?search=&country=India` shows "Displaying 1 to 20 of 82 matching jobs", with country, region, location and career-area filters); the site is an Umbraco "jobboard" (`/phb/app.js`), **ATS behind it UNVERIFIED**. Under #4 this is `failed: blocked`.
- `careers.caterpillar.com/robots.txt` and the 21 MB `sitemap.xml` are served to curl (11,292 `<loc>`, 894 matching `/en/jobs/`), but job detail pages are blocked, so the sitemap is not enough.
- Caterpillar Workday guesses (`caterpillar.wd1|wd5` with `CaterpillarCareers|External|Caterpillar`) returned 422 (no such site).

### 23. Citi: Workday (WORKDAY)

- `https://jobs.citi.com/` (curl 200; TalentBrew front end, robots `Disallow:/search-jobs/`) links `https://citi.wd5.myworkdayjobs.com/en-US/2/userHome`.
- Config: host `citi.wd5.myworkdayjobs.com`, tenant `citi`, site `2` (the site name is literally the digit 2). `robots.txt` on that host disallows the HTML UI path `/2/` and `/refreshFacet/` but not `/wday/cxs/`.
- `total` for an unfiltered query reads 2000, which appears to be a cap: the `workerSubType` facet counts add up to 4,041.
- Facets: `Country_and_Jurisdiction` India id `c4f78be1a8f14da0ab49ce1162348a5e` (896); `locations`: Chennai Tamil Nadu India `6669335a15de0115dd9ef81b6100486e` (117), "Bangalore Karnataka India" `6669335a15de01fedf305f1a61009067` (23) + "Bangaluru Karnataka India" `644b48927904102a660f8352dc280000` (14) (two spellings), Hyderabad `6669335a15de01141218c61f6100517e` (1), Pune (384), Mumbai (220), Gurgaon (39) + Gurugram (34).
- Applying `{"Country_and_Jurisdiction":["c4f7..."]}` returned `total: 896`; applying the Chennai location id returned `total: 117` (curl).
- Budget impact: India = 45 list pages (at 20) + 896 detail calls, far over 150. Chennai only = 6 + 117 = 123, fits. See Impact.

### 24. Barclays: Workday behind TalentBrew (WORKDAY)

- `search.jobs.barclays` is TalentBrew. Its `robots.txt` is a bare `User-agent: *` (no Disallow, so HTML scraping would be permitted), and `/search-jobs/India` reports 296 results (19 pages of 15), but a job page's `search-job-apply-url` meta points to Workday: `https://barclays.wd3.myworkdayjobs.com/External_Career_Site_Barclays/job/Pune-Gera-Commerzone-SEZ/India-Channels-SME_JR-0000111712-1/apply` (curl). Prefer Workday for consistency with the other Workday Sources.
- Config: host `barclays.wd3.myworkdayjobs.com`, tenant `barclays`, site `External_Career_Site_Barclays`. `cxs` returned `total: 690` (curl).
- No country facet. Location ids (`locations` facet): Pune, Gera Commerzone SEZ `112c05428201100163763bd6ad400000` (168), Gurugram DLF Downtown `253dfca5ccfc10016b1361f46cfe0000` (37), Chennai DLF IT Park `112c05428201100163788a5627320000` (30), Bengaluru Maruthi Onyx `1110a9ca6540100196e1f0c315e90000` (22), Noida Candor `112c0542820110016377c02c6ef00000` (22), Mumbai Nirlon (BX) `b8f75d1cb9781000cd91027a85e30000` (22) / (IB) `1ab48a98eb7c100163423aff71b80000` (9), Mumbai Altimus `1ab48a98eb7c1001634cf23b210c0000` (6), New Delhi `112c0542820110016377af553b050000` (3), Ceejay House Mumbai (2), Prestige Meridian Bengaluru (2). Sum is about 323, in line with the 296 on the TalentBrew page. Barclays has no Hyderabad site in the facet list.
- TalentBrew detail pages carry JSON-LD `datePosted` (e.g. `2026-08-27`) and `identifier` "JR-0000111712" (curl), useful as a fallback.

### 25. Bank of America: custom JSON servlet (CUSTOM_JSON)

- Found in the site's own JS (`clientlib-base.js`): `/services/jobssearchservlet?` with `search` modes `getAllJobs`, `jobsByCountry`, `jobsByCityCountry`, etc.
- India: `GET https://careers.bankofamerica.com/services/jobssearchservlet?start=0&rows=50&search=jobsByCountry&country=India` (curl 200) returns `totalMatches` 144. Chennai: `search=jobsByCityCountry&city=Chennai&country=India` returns 39. **Gotcha**: `search=getAllJobs&country=India` (and `location=`, `state=`, `searchedLocation=`) ignores the location and returns all 2,065 jobs.
- Fields per job in `jobsList[]`: `jobRequisitionId` (stable id), `postingTitle`, `postedDate` ("10/20/2026"), `externalPostedDate`, `city`, `state`, `country`, `location`, `jcrURL` (detail path `/en-us/job-detail/{id}/...`), `jobDescriptionExternal` (a field is present in the list objects; content not inspected), `division`, `lob`, `minYearsOfExperience`, etc.
- Pagination: `start` + `rows` (50 worked). robots: `Allow: /` (curl).
- Cost per Run: India = 3 requests at rows=50; Chennai = 1.

### 26. Standard Chartered: SuccessFactors "unify" CSB (SUCCESSFACTORS)

- `sc.com` is behind Imperva but readable; the careers link goes to `https://jobs.standardchartered.com/` (curl 200; body `coreCSB ... unify`, `reactWidgetLoader.js`, `j2w.searchResultsUnify.min.js`, so it is the "unify" theme from #17).
- #17 left the POST body unknown. Verified here (curl): fetch `https://jobs.standardchartered.com/search/` first (sets cookies; the page embeds `var CSRFToken = "<uuid>"`), then `POST https://jobs.standardchartered.com/services/recruiting/v1/jobs` with headers `Content-Type: application/json`, `X-CSRF-Token: <that uuid>`, cookies from the first request, body `{"locale":"en_GB","pageNumber":0,"keywords":"","location":"India","facetFilters":{},"brand":"","skills":[],"categoryId":0,"alertId":"","rcmCandidateId":""}`. Response `{jobSearchResult:[{response:{id, unifiedStandardTitle, unifiedUrlTitle, urlTitle, jobLocationShort[], jobLocationCountry[], unifiedStandardStart "07/10/2026" (dd/mm/yyyy), unifiedStandardEnd, mfield1, currency}}], totalJobs}`. 10 results per page (`pageNumber` 0-based). Counts: all 1,144; `location:"India"` 281; `location:"Chennai"` 76.
- **robots problem**: `jobs.standardchartered.com/robots.txt` has `Disallow: /services/`, which covers this endpoint. Using it breaches the site's robots. The HTML search page `/search/` is client-rendered (no job rows in the HTML).
- Compliant alternative (curl): `https://jobs.standardchartered.com/sitemap.xml` lists 1,162 job URLs of the form `/job/{City}-{Title}/{id}/` with `lastmod`; about 247 start with an Indian city name. Detail pages `GET /job/{slug}/{id}/` are server-rendered HTML (allowed by robots). That is about 250 detail requests for India, over the 150 budget, so it needs a Chennai / Bangalore / Hyderabad slice or multi-Run catch-up. Parsing of the detail HTML for description and posted date was **not tested**.
- Recommendation: treat the JSON route as not allowed unless the owner decides otherwise; use sitemap + HTML.

### 27. BNY: Oracle HCM (ORACLE_HCM)

- `https://www.bny.com/corporate/global/en/about-us/careers/work-with-us.html` (curl) links `https://eofe.fa.us2.oraclecloud.com/hcmUI/CandidateExperience/en/sites/BNY-Careers`.
- Config: host `eofe.fa.us2.oraclecloud.com`, site `BNY-Careers`. List endpoint exactly as #16: `TotalJobsCount` 1,386 (curl); `PostedDate` e.g. `2026-10-21`; `Id` e.g. `83136`.
- Location filter: `...,selectedLocationsFacet=300000000378365,...` (India) returned `TotalJobsCount` 152 (first rows Pune). The `locationsFacet` also shows "MH, India" id `300000028453879` (142). No Chennai entry in the facet at check time.
- Cost per Run: 7 list pages at 25 + 152 detail calls = about 159, slightly over 150.

### 28. Wells Fargo: Workday (WORKDAY)

- `wellsfargojobs.com` returns Cloudflare "Just a moment..." to curl. Found by testing `wf.wd1.myworkdayjobs.com/WellsFargoJobs`: `cxs` `total: 1470` (curl); a detail response has `hiringOrganization.name = "I01 Wells Fargo International Solutions Private LTD"` and `externalUrl https://wd1.myworkdaysite.com/recruiting/wf/WellsFargoJobs/job/Hyderabad-India/...` (the `myworkdaysite.com` variant, same tenant). **Link from the marketing site UNVERIFIED.**
- Config: host `wf.wd1.myworkdayjobs.com`, tenant `wf`, site `WellsFargoJobs`.
- Facets: `locationCountry` India id `c4f78be1a8f14da0ab49ce1162348a5e` (68); `locations`: "Bengaluru, India" `bddaef21b52c01016acd172f97db0000` (48), "Hyderabad, India" `bddaef21b52c01016acaf37b87fe0000` (26). Applying the India facet via `locationCountry` returned `total: 68` (using `Country_and_Jurisdiction` returned HTTP 400, so the facet parameter name differs per tenant: read it from the `facets` block).

---

## Impact on the design

### New Source kinds

Confirmed new platforms with verified plain-HTTP routes:

| New kind | Company | Route |
|---|---|---|
| SMARTRECRUITERS | Freshworks | public JSON Posting API; `releasedDate`; filter `country=in` |
| EIGHTFOLD | PayPal | `/api/pcsx/search` + `/api/pcsx/position_details`; `postedTs`; filter `location=` |
| ZOHO_RECRUIT | Zoho (GoFrugal was a false lead) | RSS 2.0 at `/jobs/Careers/rss`; dates unreliable |
| KULA | Rocketlane | SSR HTML list + JSON-LD on detail (`datePosted`) |

New platforms found but not usable under #4, or with no live data to verify the shape:

| New kind | Company | Status |
|---|---|---|
| DARWINBOX | Vue.ai / Mad Street Den | Cloudflare WAF blocks `curl`; works in a real browser; 0 postings now |
| PEOPLESTRONG | Matrimony.com | API reachable, request body and item fields unverified; 0 postings now |

Existing kinds extended: SUCCESSFACTORS gains one more "classic" tenant (Chargebee) and a verified "unify" request body (Standard Chartered: needs page fetch for cookies + CSRF header, but its path is robots-disallowed). CUSTOM_JSON gains Amazon and Bank of America (two bespoke endpoint shapes). Workday gains 9 tenants, Oracle HCM gains 2 (BNY, Ford).

Gap in the 7-kind list: Kissflow, Facilio and Ramco have no API, only HTML (Ramco has JSON-ish data inline in the page). The kinds list only has CUSTOM_JSON (plain HTTP) and CUSTOM_PLAYWRIGHT. These three, plus SuccessFactors classic, show the need either for a plain-HTTP HTML kind (CUSTOM_HTML, using `fetch` + a parser, no browser) or for routing them through CUSTOM_PLAYWRIGHT. Recommend adding CUSTOM_HTML since none of them needs JS execution (verified: all content is in the raw `curl` response).

Adapter design notes worth carrying into #4:
- Do not scrape TalentBrew front ends (Comcast, Citi, Ford: `Disallow:/search-jobs/`); read the back-end ATS from `search-job-apply-url`.
- robots.txt must be a checked precondition per route, not just per site: Walmart (`/api`, `/results`) and Standard Chartered (`/services/`) have a working JSON route that robots forbids.
- Workday facet parameter names differ per tenant (`locationCountry` at Wells Fargo, `Country_and_Jurisdiction` at Citi, none at Barclays/Verizon); an adapter config should carry a per-Source "location facet" (parameter + ids) discovered from the `facets` block, not hard-coded.
- Oracle HCM `locationsFacet` is capped to the top 25 locations; get an id by running a `keyword=` query and reading the facet from that response (done for Ford).
- Workday pods vary (`wd1`, `wd3`, `wd5`, `wd12`, `wd103`, `wd115`, `wd503`); a wrong tenant or site gives HTTP 422 on `cxs`, which is a cheap existence check.

### Company.category enum (#3)

Three groupings need adding next to the original four before seeding. Suggested values, mirroring the ticket's wording:

- `PRODUCT_SAAS_HOMEGROWN` (13 companies: #1-13)
- `GLOBAL_PRODUCT_GCC` (9 companies: #14-22)
- `BANK_FINTECH_GCC` (6 companies: #23-28)

### New Source count

Ticket estimate: about 50 + 28 = about 78 Sources. Of the 28, 5 have no route (GoFrugal, BankBazaar, Walmart, Mr. Cooper, Caterpillar), and Vue.ai is blocked for plain HTTP. If the registry seeds every company, 5-6 of the 78 will start as `failed: blocked` or `failed: none found`, leaving about 72 live Sources (about 22 of them new). Citi, Barclays, BofA etc. each stay one Source per company; no company needed two.

### Effect on the 50-minute run deadline (#9) and the 150-request / 10-minute budget (#4)

First-run request estimates for the India scope (list pages + one detail call per posting where the list lacks the description), from the counts above:

| Source | Approx. requests, India (or noted slice) |
|---|---|
| Amazon | 24 (descriptions included) |
| Bank of America | 3 |
| PayPal | 16 |
| Freshworks | 35 |
| Zoho / Chargebee / Kissflow / Facilio / Temenos / Uniphore / Matrimony | 1-5 each |
| Rocketlane | 44 |
| Ramco | 1-8 |
| Comcast (Chennai) | 16 |
| athenahealth / Verizon | about 40 each |
| Ford | 9 |
| Wells Fargo | 72 |
| **BNY** | **about 159 (over)** |
| **Citi** | **India about 940 (way over); Chennai only 123; Chennai + Bangalore 155 (over)** |
| **Barclays** | **India about 340 (over); Chennai + Bengaluru 52 + list = about 55 (fits)** |
| **Standard Chartered** | **about 250 via sitemap + HTML (over)** |

So four Sources (Citi, Barclays, BNY, Standard Chartered) cannot finish a first India-wide pass inside the per-Source budget, and a full India scope is not realistic for Citi. Options for the owner: restrict the location facet to Chennai / Bangalore / Hyderabad (fits for Citi Chennai, Barclays Chennai + Bengaluru), or fetch details only for postings not already stored (steady state after the first Run is small because only new `externalId`s need a detail call) and let the first Run spread over several Runs.

Wall time: the total across the 22 new live Sources is on the order of 1,300 requests on a first India-wide pass (about 700 if Citi is limited to Chennai and Barclays to its Chennai / Bengaluru slices). All hosts are different, so a politeness gap of about 2 seconds per host does not add across Sources. The 50-minute deadline is at risk only if Sources run serially: 22 new Sources at the 10-minute cap each is 220 Source-minutes worst case, versus about 50 Source-minutes at typical request counts and gaps. With the original roughly 50 Sources already needing concurrency to meet 50 minutes, adding about 56% more Sources keeps the deadline only if worker concurrency scales by about the same ratio, or if the four heavy Sources above are scoped as suggested. I did not have the #9 concurrency number, so this is a ratio estimate, **not a measured result**; revisit #9 with these per-Source numbers.

Unresolved (no usable route): GoFrugal, BankBazaar (none found), Walmart Global Tech (robots-disallowed GraphQL), Mr. Cooper (Akamai block), Caterpillar (Cloudflare block). Partly resolved: Vue.ai (Cloudflare WAF, 0 postings), Matrimony.com (0 postings, body unverified), Standard Chartered (works but robots-disallowed JSON route).
