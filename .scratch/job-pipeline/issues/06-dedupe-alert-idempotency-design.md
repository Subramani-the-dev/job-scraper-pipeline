Type: grilling
Status: open

## Question

Nail the exact dedupe and alert-idempotency algorithm beyond the gist already fixed in the map: what's the fallback chain for Posting identity when a Source gives no stable job id (Company + URL — but what if the URL itself contains a volatile query param or session token?); what happens if a company's URL for the same job changes between Runs (does the old row get orphaned, or is there a secondary match on title+location+company within a time window?); and what record proves "this Posting was already alerted" so that two overlapping or retried GitHub Actions runs can never double-send a Telegram message for the same Posting.
