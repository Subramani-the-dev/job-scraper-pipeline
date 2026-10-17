Type: grilling
Status: open
Blocked by: 03

## Question

Design the GitHub Actions workflow for `server/`: the cron schedule (every 2 hours), the job steps (checkout, install, Prisma generate/migrate-deploy, run the pipeline script, which secrets it reads), how Playwright gets installed/cached for the custom-site adapters without blowing the run budget, how a single Run's sequential-with-delay pass across all Sources is invoked (one script iterating the registry, versus one job per Adapter type), and what happens on partial failure (one Source's adapter throwing shouldn't abort the whole Run for every other company).
