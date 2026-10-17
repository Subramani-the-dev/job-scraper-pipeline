Type: task
Status: open

## Question

Provisioning, not a decision: sign up for Neon, create a Postgres project/database for this pipeline, and get the connection string. This needs doing (by the user — account creation isn't something to automate) before the schema ticket's migrations can actually be run against anything real. Resolution should record: the connection string's location (as a GitHub Actions secret and a Vercel env var — never pasted into this ticket in plaintext), and the Neon project/region chosen.
