Type: grilling
Status: open

## Question

Design the shared Adapter contract every per-ATS adapter (`workday.ts`, `greenhouse.ts`, `playwright-generic.ts`, ...) implements: its input (a Source's config), its output (a list of normalized Raw Postings or a typed error/anomaly result), how it reports a Run's status/count back to the pipeline, timeout/retry behavior for a flaky career site, and how the pipeline enforces the sequential-with-delay politeness rule across adapters sharing one run rather than each adapter rolling its own.
