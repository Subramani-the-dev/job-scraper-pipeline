# #23: robots.txt check on back-end ATS hosts

Fetched 2026-10-23 with `curl -A 'job-pipeline-bot/1.0'` (placeholder UA token, final string set when `ctx.http` is built).
Matching per #22: group naming our token, else `User-agent: *`; longest match wins, `Allow` wins ties; 404 = allowed.
Verdicts below come from a longest-match script run over the saved files, not by eye. Adapter paths tested are the list and detail routes from the research tickets.

## Summary

- 62 of 66 (host, path) pairs allowed. 4 disallowed, covering **3 Sources**: Freshworks, HCLTech, Standard Chartered.
- All Workday and Oracle HCM routes are allowed. Several hosts disallow only the HTML UI (Citi `/2/`, Verizon `/verizon-careers/`, all `/refreshFacet/`); `/wday/cxs/` is never disallowed.
- Two policy gaps (RippleHire login redirect, 4xx on robots.txt) were settled; see "Decisions".

## Disallowed routes (follow #22: compliant route or no Source)

| Source | Route | Rule hit | Compliant alternative |
|---|---|---|---|
| Freshworks (SMARTRECRUITERS) | `api.smartrecruiters.com/v1/companies/Freshworks/postings[/id]` | `User-agent: *` `Disallow: /` (only `LinkedInBot` is allowed on `/v1/companies/`) | None found. `jobs.smartrecruiters.com/Freshworks` is a JS SPA with no JSON-LD, and has no robots.txt or sitemap (404). Company row, no Source. |
| HCLTech (SUCCESSFACTORS unify) | `careers.hcltech.com/services/recruiting/v1/jobs` | `Disallow: /services/` | Same fallback as Standard Chartered: sitemap plus HTML `/job/...` detail pages (both allowed). Parsing untested. |
| Standard Chartered (SUCCESSFACTORS unify) | `jobs.standardchartered.com/services/recruiting/v1/jobs` | `Disallow: /services/` | Already decided in #22 (sitemap + HTML detail). Both allowed. |

New vs #22: Freshworks and HCLTech were not known to be blocked. HCLTech's "unify" JSON route was recorded as working in #17.

## Decisions (settled after the check)

1. **RippleHire** (Tredence, LTIMindtree, Mphasis): `/robots.txt` 302s to a SAML login (`/oauth2/authorization/<tenant>`, then `/auth/saml2/authenticate/...`, final 200 HTML), so there is no robots.txt to match. `/ripplehire/careers` also 302s without a session. **Decision: treat as unknown and hold these three Sources until the route is re-checked.** #22 has no rule for "robots.txt redirects to login"; this is that rule.
2. **Ashby and other 4xx on robots.txt:** `api.ashbyhq.com/robots.txt` returns 401, while the posting API works (`/posting-api/job-board/ashby` is 200). **Decision: any 4xx on robots.txt other than 404 counts as allowed (RFC 9309 "unavailable"), and the runtime logs a warning.** #22 defined only 404 (allowed), 5xx and timeout (`failed: network`); this extends it.

Neither rule is written into #22 yet.

## Results per host

All paths allowed unless noted. "no rules" = no matching Disallow.

### Workday (`POST /wday/cxs/<tenant>/<site>/jobs`, `GET .../job/<slug>`)

| Host | Site | Relevant robots rules | Verdict |
|---|---|---|---|
| citi.wd5.myworkdayjobs.com | `2` | Disallow `/2/`, `/Citi_Early_Careers_Events_Site/`, `/refreshFacet/` | allowed |
| comcast.wd115.myworkdayjobs.com | Comcast_Careers | Allow site, Disallow `/refreshFacet/` | allowed |
| barclays.wd3.myworkdayjobs.com | External_Career_Site_Barclays | Disallow `/Private/`, `/refreshFacet/` | allowed |
| athenahealth.wd1.myworkdayjobs.com | External | Disallow `/refreshFacet/` | allowed |
| verizon.wd12.myworkdayjobs.com | verizon-careers | Disallow `/verizon-careers/`, `/contractor_external_careers/`, `/frontier_career_site/`, `/refreshFacet/` | allowed by the letter (path starts `/wday/`). Note: Verizon disallows its own HTML career site. |
| wf.wd1.myworkdayjobs.com | WellsFargoJobs | Disallow `/WellsFargoJobsTargeted/`, `/refreshFacet/` | allowed. `wd1.myworkdaysite.com/robots.txt` returns 422; the adapter uses the `myworkdayjobs.com` host. |
| uniphore.wd503 / temenos.wd103 | Uniphore / Temenoscareers | Disallow `/refreshFacet/` | allowed (Temenos: zero India postings, included for completeness) |
| dxctechnology.wd1 | DXCJobs (also ASJobs) | Disallow `/refreshFacet/` | allowed |
| material.wd1 / nttglobaldatacenters.wd501 / quantiphi.wd1 / synechron.wd1 | per site | Disallow `/refreshFacet/` | allowed |
| hitachi.wd1 / kbr.wd5 | not in registry tables found | robots 200 fetched, tenant/site not verified | not evaluated |

### Oracle HCM (`/hcmRestApi/resources/latest/recruitingCEJobRequisitions[Details]`)

`efds.fa.em5` (Ford), `eofe.fa.us2` (BNY), `ejgk.fa.em2` (KPMG GKS), `fa-ertb-saasfaprod1.fa.ocs` (Photon), `fa-etvl-saasfaprod1.fa.ocs` (Zensar), `fa-etqo-saasfaprod1.fa.ocs` (Hexaware), all on `oraclecloud.com`: `/robots.txt` is 404 on each, so allowed under #22.

### Other kinds

| Source | Host | Rules | Verdict |
|---|---|---|---|
| Greenhouse | boards-api.greenhouse.io | Disallow `/embed/` | allowed |
| Lever | api.lever.co | Allow `/`, Crawl-delay 1 | allowed (honour the 1s delay; our global gap is 2-5s) |
| Ashby | api.ashbyhq.com | 401 | allowed (4xx rule, see Decisions #2) |
| PayPal (EIGHTFOLD) | paypal.eightfold.ai | `Disallow: /`, Allow `/api/pcsx`, `/careers` | allowed (`/api/pcsx` wins by length) |
| Zoho (ZOHO_RECRUIT) | careers.zohocorp.com | `Disallow: /`, Allow `/jobs/*`, `/jobs` | allowed (RSS `/jobs/Careers/rss`) |
| Rocketlane (KULA) | careers.kula.ai | Disallow `/api/`, `/*/portal` | allowed |
| Amazon (CUSTOM_JSON) | www.amazon.jobs | Disallow `/internal` paths only | allowed |
| Bank of America (CUSTOM_JSON) | careers.bankofamerica.com | Allow `/` | allowed (`/services/jobssearchservlet`) |
| Wipro, Birlasoft, Chargebee (SF classic) | careers.wipro.com, jobs.birlasoft.com, jobs.chargebee.com | Disallow `/services/` etc., identical file on all | allowed (`/search/`, `/job/...`, `/sitemap.xml`) |
| Kissflow, Ramco (CUSTOM_HTML) | careers.kissflow.com, www.ramco.com | tracking-param and system-page rules only; Ramco Disallow `/search*` | allowed |
| RippleHire x3 | *.ripplehire.com | login redirect | on hold (see Decisions #1) |

## Not covered

Hosts for Sources whose registry rows I could not enumerate from the tickets (Equal Experts, Sigmoid, Tiger Analytics, Persistent, Virtusa, PwC ACs, Presidio, Facilio, Tata Elxsi, Ideas2IT, TCS, Infosys, etc.) were not checked. Facilio and the Phenom/Ultipro hosts need the full registry list.

## Addendum: registry hosts from #12-#15 and #19

Registry names come from the resolution of #2 (branch `research/workday-endpoint`); hosts and routes from the findings of #12-#15 and #19. Same UA and matcher as above, fetched 2026-10-26.

### Disallowed

| Source | Route | Rule hit | Alternative |
|---|---|---|---|
| EPAM | `careers.epam.com/api/jobs/v2/search/careers-i18n` | `Disallow: /api/*` | None researched. Company row, no Source, unless a compliant HTML route is found. |

### Inconclusive (robots.txt not readable with our UA)

| Source | Host | Result | Under the settled rules |
|---|---|---|---|
| Tavant | `public.zwayam.com`, `careers.tavant.com` | Timeout / HTTP2 stream error on `/robots.txt`. Retest below. #19 recorded 404 and `Allow: /` (best evidence so far). | `failed: network`; recheck from the Actions runner |
| Coforge | `careers.coforge.com`, `bpscareers.coforge.com` | Timeout / HTTP2 stream error. Retest below. No earlier evidence. | `failed: network`; recheck from the Actions runner |
| McKinsey Digital | `gateway.mckinsey.com` | 403 Cloudflare challenge page | 4xx = allowed, but the 403 is a bot challenge, not a real "no robots.txt"; confirm in the first dry-run |
| Hashedin | `www.hashedin.com` | 403 | 4xx = allowed |
| Infosys | `career.infosys.com` | 403 | 4xx = allowed; Source needs Playwright anyway |
| TCS | `ibegin.tcsapps.com` | 302 to `/candidate/next` (no robots.txt file) | no robots.txt; Source needs Playwright anyway |
| Tech Mahindra | `careers.techmahindra.com` | 404 | allowed |

### Allowed

Accenture (`/api/accenture/elastic/findjobs`), Thoughtworks (`/rest/careers/jobs`), Publicis Sapient (`/bin/ps-redesign/careersJobsearch`), Globant (`/api/sap/job-requisition-v1`), Presidio (Ultipro `Allow: */JobBoard/`), PwC ACs (Phenom, both hosts; only `*/apply`, `*/jobcart` etc. disallowed), Tiger Analytics (Workable and in-house host), Virtusa (`/careers/job-search/widgets`), Cognizant (`/global-en/jobs/xml/`), Deloitte USI, EY GDS, Capgemini, IBM Consulting, GlobalLogic, Grid Dynamics, Nagarro, Tata Elxsi, Ideas2IT.

### Still not checked

Persistent Systems (backend unknown), Kanini (no ATS found), Sonata, Facilio (no route), NTT Data main site (Phenom, fragmented), Hexaware and Zensar (Oracle HCM, done above), Hitachi/KBR (not in the registry; only #5 test tenants).

### Retest of Tavant/Zwayam and Coforge (2026-10-26)

Four hosts (`public.zwayam.com`, `careers.tavant.com`, `careers.coforge.com`, `bpscareers.coforge.com`), `GET /robots.txt`, 5s apart:
- UA `job-pipeline-bot/1.0`: HTTP/1.1 timed out at 40s; HTTP/2 got `INTERNAL_ERROR` (stream not closed cleanly). Same on all four.
- curl's default UA: same HTTP/2 stream error on Zwayam, Tavant and Coforge. So our UA is not the cause.
- TCP and TLS to `careers.tavant.com` connect in under 30 ms: the host is reachable and drops the request after the handshake.
- Likeliest cause: a rate limit or IP block on the checking machine (#19 reached Tavant and Zwayam with plain `curl` earlier). Not confirmed.
- No attempt was made to get around it (no browser UA, no proxy).

Verdict: unresolved. Both Sources stay `failed: network` under #22. The first `--source` dry-run from the GitHub Actions runner shows whether robots.txt answers from that IP.
