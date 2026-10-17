Type: grilling
Status: open
Blocked by: 06

## Question

Design the concrete Prisma schema — models, fields, types, relations, indices, and enums — for the domain fixed in the map (Company, Source, Run, Posting, FilterConfig, and whatever the dedupe/alert-idempotency ticket (06) decided it needs for AlertLog / anomaly tracking). Nail down: the exact Posting-identity fields and their unique constraint, which fields are nullable (not every posting will have a parseable experience range), how Source stores per-ATS config (a typed union vs a loose JSON column), and indices needed for the dashboard's query patterns (filter by title/location/experience, list new-since-last-visit). Apply the global DB-query-pushdown rule throughout.
