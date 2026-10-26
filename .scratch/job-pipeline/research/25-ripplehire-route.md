# #25: RippleHire public route and robots.txt

Fetched 2026-10-26 with `curl -A 'job-pipeline-bot/1.0'`, no cookies, no redirect-following except where noted, 3 s between requests, about 50 requests total. Samples are in the scratchpad, not the repo.
No login, SAML flow, form or account was touched. Nothing a robots.txt could disallow was read, because no tenant robots.txt is readable (see section 3).

## Summary

- Each company's own careers page links to a public RippleHire URL: `https://<tenant>.ripplehire.com/candidate/?token=<TOKEN>&source=CAREERSITE#list`. It returns **200 text/html with no session**. The page is a JS shell; the data comes from JSON endpoints on the same host.
- **#23 mis-described `/ripplehire/careers`.** It does not go to a login. It 302s to `/candidate/careers`, which 302s to the tokenised public URL (LTIMindtree host excepted). Only `/` and `/robots.txt` on the tenant host hit the SAML redirect.
- **No readable robots.txt** exists for any tenant host. All four tenant hosts 302 `/robots.txt` to `/oauth2/authorization/<tenant>`. The only readable file is `www.ripplehire.com/robots.txt` (RippleHire's marketing site, a different host), which does not govern tenant hosts.
- The JSON list/detail routes work and give title, location, posted date, description. Request cost: Tredence fits the cap, Mphasis and LTM do not on a first run.
- **Verdicts: all three stay on hold under the settled rule** (login-redirect robots.txt = unreadable). The route itself is technically viable for Tredence and Mphasis; LTIMindtree should use host `ltm.ripplehire.com`. Details and the policy question below.

## 1. How each company links to RippleHire

| Tenant | Company page (fetched 2026-10-26) | Link found in HTML | Note |
|---|---|---|---|
| Tredence | `https://www.tredence.com/careers` (301 to `/careers/greatest-of-ai`, 200) | `https://tredence.ripplehire.com/candidate/?token=rzuz0vttMaz0VxxVzDiY&source=CAREERSITE#list` | same token #18 recorded |
| Mphasis | `https://careers.mphasis.com/` (302 to `/home.html`, 200) | `https://mphasis.ripplehire.com/ripplehire/careers` and (JS-escaped) `https://mphasis.ripplehire.com/candidate/?token=ty4DfyWddnOrtpclQeia&source=CAREERSITE#list` | `www.mphasis.com/home/careers.html` redirects to the home page and has no link |
| LTIMindtree (now "LTM") | `https://www.ltimindtree.com/careers/` (2 redirects to `https://www.ltm.com/careers`, 200) | `https://ltm.ripplehire.com/candidate/?token=xviyQvbnyYZdGtozXoNm&lang=en&source=CAREERSITE#list/geo=India` (also `ltimindtree.ripplehire.com/...` same token, and `ltm.ripplehire.com/...token=nP1GISU2A024qt3otg3V...#list/geo=Canada`) | company rebranded; current host is `ltm.ripplehire.com`. Several tokens are published (per-geo banners). |

Host, path, query: always `<tenant>.ripplehire.com`, `/candidate/`, `token`, `source=CAREERSITE`, optional `lang=en`. The `#list/geo=...` fragment is client-side only.

## 2. Does the public entry work without a session?

All calls: no cookies, `job-pipeline-bot/1.0`.

| Request | Result |
|---|---|
| `GET tredence.ripplehire.com/candidate/?token=rzuz...&source=CAREERSITE` | 200 `text/html;charset=UTF-8`, 15,863 B, JS shell (jQuery, require.js `candresource/candidate/require_main.js`), `<title>Tredence Careers ...`, no `noindex` meta |
| `GET mphasis.ripplehire.com/candidate/?token=ty4D...` | 200 html, 19,115 B |
| `GET ltm.ripplehire.com/candidate/?token=xviy...&lang=en` | 200 html, 15,966 B |
| `GET ltimindtree.ripplehire.com/candidate/?token=xviy...&lang=en` | 200 html, 15,966 B |
| `GET <tenant>.ripplehire.com/ripplehire/careers` (tredence, mphasis, ltm, ltimindtree) | 302 to `/candidate/careers` on the same host |
| `GET tredence / mphasis / ltm .ripplehire.com/candidate/careers` | 302 to `/candidate/?token=<TOKEN>&source=CAREERSITE#list` (ltm gives `kEskAFgVkDBlCoXZ8eUO`, a third token; totals match) |
| `GET ltimindtree.ripplehire.com/candidate/careers` | 200, **empty body** (0 B), matches #18's "broken tenant" note |
| `GET ltimindtree.ripplehire.com/` | 302 to `/oauth2/authorization/ltimindtree` (login; stopped, not followed) |

Redirect chain for token discovery: `/ripplehire/careers` -> `/candidate/careers` -> `/candidate/?token=...`, three requests, no login. A token can also be read straight from the company page link.

## 3. robots.txt

| URL | Result |
|---|---|
| `tredence.ripplehire.com/robots.txt` | 302 to `/oauth2/authorization/tredence` |
| `mphasis.ripplehire.com/robots.txt` | 302 to `/oauth2/authorization/mphasis` |
| `ltm.ripplehire.com/robots.txt` | 302 to `/oauth2/authorization/ltm` |
| `ltimindtree.ripplehire.com/robots.txt` | 302 to `/oauth2/authorization/ltimindtree` |
| `ripplehire.com/robots.txt` | 301 to `www.ripplehire.com/robots.txt` |
| `www.ripplehire.com/robots.txt` | **200 `text/plain`**, 165 B, `User-agent: *`, Disallow `/_hcms/preview/`, `/hs/manage-preferences/`, `/hs/preferences-center/`, `/*?*hs_preview=*`, `/*?*hsCacheBuster=*` |

- The tenant-host redirect was not followed past the first hop (a SAML login is out of bounds). #23 recorded the final hop as 200 HTML, so there is no `text/plain` file.
- The `www.ripplehire.com` file is HubSpot boilerplate for the marketing site. Per RFC 9309 a robots.txt applies only to its own scheme/host/port, so it does not cover `*.ripplehire.com` tenants. By longest-match its rules would not hit `/candidate/` anyway (none of the five patterns match), but that is not the governing file.
- No other host serves the candidate routes: list, detail and page all live on the tenant host.
- Result: **no readable robots.txt applies to the public route.** Under the #23 rule this is "unreadable".

## 4. Public JSON routes (same host as the entry, no session)

Observed on the page's own XHR endpoints. Without `Accept: application/json` they return XML (`JobPageVO`); with it, JSON.

| Step | Request | Returns |
|---|---|---|
| List, page 1 | `POST /candidate/candidatejobsearch`, form body `careerSiteUrlParams={"page":1,"search":"*:*","token":"<T>","source":"CAREERSITE","pagesize":10}&lang=en` | JSON object: `totalJobCount`, `jobVoList` (10), many facet counts |
| List, page n>=2 | `POST /candidate/candidatejobsearchpage`, same body with `"page":n` | **bare JSON array** of 10 jobs. `page:1` on this endpoint returns `[]`. |
| Detail | `GET /candidate/candidatejobdetail?token=<T>&jobSeq=<id>&source=CAREERSITE&lang=en` | `{jobVO:{...}}` |

- `pagesize` is effectively fixed at 10: `pagesize:100` returned 0 jobs on `candidatejobsearch` and `[]` on `candidatejobsearchpage` (Tredence, 2026-10-26).
- Without `token` the API returns HTTP 500 (#18, not retested).
- List fields: `jobSeq`, `jobTitle`, `jobLocation`, `locations`, `jobCode`, `jobReqExp`, `jobMinExp`/`jobMaxExp`, `numOfOpening`, `jobType`. `jobPostingDate` and `jobDesc` are null in list rows (confirmed Tredence). #18 said `jobLocation` was null in the list; it was populated on all three tenants today.
- Detail fields: `jobTitle`, `jobDesc` (HTML, 1.1-2 KB seen), `jobLocation`, `jobPostingDate` (`20-Aug-2026` form), `jobStatus` (`ACTIVE`), `jobCode`, `jobReqExp`, `jobType`.
- Apply URL: not in the payload. Use the public entry URL plus a fragment for the job. The exact `#detail/...` fragment was **not verified** (the shell JS was not read); the safe fallback is the entry URL with the `jobSeq` kept as `externalId`.

Request budget (cap 150 req / 10 min, gap 2-5 s per #22; 150 requests at 3 s is about 7.5 min, inside the window):

| Tenant | Jobs at fetch | List requests (10/page) | Detail requests (first run) | First-run total | Fits 150? |
|---|---|---|---|---|---|
| Tredence | 55 | 6 | 55 | 61 | Yes |
| Mphasis | 193 | 20 | 193 | 213 | No: needs 2 Runs or detail only for India |
| LTM | 1,454 (global, same count on both tokens) | 146 | 1,454 | 1,600 | No. List alone is 146 and carries no date or description. |

Steady state after the first run is list pages plus detail only for new `jobSeq` values, so Tredence and Mphasis fit; LTM still needs about 146 list pages per Run. A server-side location filter (the page uses `geo=India` in its hash) was **not tested**; it is the open lever for LTM and Mphasis.

## 5. Verdicts

| Source | Route | Verdict | Why |
|---|---|---|---|
| Tredence | `tredence.ripplehire.com/candidate/...` | **Hold** (technically viable) | public, no login, all fields; 61 req first run; robots.txt unreadable on the tenant host |
| Mphasis | `mphasis.ripplehire.com/candidate/...` | **Hold** (viable, budget issue) | same; 213 req first run needs splitting or an India filter |
| LTIMindtree | `ltm.ripplehire.com/candidate/...` (not `ltimindtree.` host) | **Hold** (viable, budget blocker) | same; 1,454 jobs. Registry must point at the `ltm.` host; `ltimindtree.ripplehire.com/candidate/careers` is empty. |

No Source is ruled out for lack of a public route. The only blocker is policy: RippleHire has no readable robots.txt for the tenant hosts, so the settled rule keeps all three on hold. A decision for #22/#25 follow-up: either keep the hold, or amend the rule to say "a robots.txt that redirects to a login, on a host whose public routes serve 200 without a session, counts as no robots.txt (allowed, warn)". That amendment is a policy call, not made here.

### Recommended adapter shape (if released)

- `kind` `RIPPLEHIRE`; `Source.config`: `{ host, entryUrl }` (host `ltm.ripplehire.com` for LTIMindtree). Token is not stored: read it each Run from the 302 `Location` of `GET /candidate/careers` (fall back to the token in `entryUrl`).
- Send `Accept: application/json`. List: `candidatejobsearch` for page 1, `candidatejobsearchpage` for page >= 2 (bare array), stop when `totalJobCount` is reached. Detail only for `jobSeq` not already stored.
- Map: `externalId`=`jobSeq`, `title`=`jobTitle`, `location`=`jobLocation`, `postedAt`=parse `jobPostingDate` (`DD-Mon-YYYY`), `description`=`jobDesc`, `url`=entry URL (+ job fragment once verified).
- Needs a first-run split or a location filter for Mphasis and LTM before they fit the 150-request cap.
