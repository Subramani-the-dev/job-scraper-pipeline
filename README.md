# Job Posting Pipeline

Personal job-posting monitor: scrapes a registry of companies' career pages via per-ATS adapters, normalizes and dedupes postings into Postgres, filters and alerts (Telegram) only on new matches, and has a Next.js dashboard for manual saved/applied/ignored tracking.

This repo is currently in the planning phase. See [`.scratch/job-pipeline/map.md`](.scratch/job-pipeline/map.md) for the wayfinder map: the destination, the architecture decisions made so far, and the open tickets still being worked through before any code gets written.
