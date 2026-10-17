Type: research
Status: claimed

## Question

Confirm the exact Workday CxS job-search endpoint shape used by career pages: the `/wday/cxs/<tenant>/<site>/jobs` request (method, headers, auth/cookies if any, pagination/offset params, request body shape) and the response JSON shape (field names for title, location, posting id, posted date, description/detail-fetch). Verify by inspecting at least two real Workday-hosted career sites (e.g. a company like Accenture or Capgemini's careers site) via the browser's network tab, not from memory. Note how the tenant and site slug are discoverable from a company's public careers URL, since that's what turns "company name" into "Source config" for every Workday-hosted company in the registry.
